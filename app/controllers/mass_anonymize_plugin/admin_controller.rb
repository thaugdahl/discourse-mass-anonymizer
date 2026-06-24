# frozen_string_literal: true
module ::MassAnonymizePlugin
  class AdminController < ::Admin::AdminController
    requires_plugin PLUGIN_NAME

    # Bounded so one request can't tie up a web worker on synchronous anonymization.
    MAX_ANONYMIZE_BATCH = 20
    PER_PAGE = 100

    def index
      # Keyset pagination: stays correct as anonymizing shrinks the scope.
      scope = apply_cursor(eligible_users_scope).order(:last_seen_at, :id).limit(PER_PAGE + 1)

      users = scope.to_a
      has_more = users.size > PER_PAGE
      users = users.first(PER_PAGE)

      opts = { include_can_be_deleted: true, include_silence_reason: true }
      if params[:show_emails] == "true"
        StaffActionLogger.new(current_user).log_show_emails(users, context: request.path)
        opts[:emails_desired] = true
      end

      render json: {
               users: serialize_data(users, AdminUserListSerializer, opts),
               has_more: has_more,
             }
    end

    def anonymize
      raw_ids = Array(params[:users])

      if raw_ids.length > MAX_ANONYMIZE_BATCH
        return(
          render_json_error(
            I18n.t("mass_anonymize.errors.batch_too_large", max: MAX_ANONYMIZE_BATCH),
            status: 422,
          )
        )
      end

      ids =
        raw_ids.filter_map do |id|
          begin
            Integer(id.to_s, 10)
          rescue StandardError
            nil
          end
        end

      anonymized_ids = []

      User
        .where(id: ids)
        .includes(:primary_email)
        .each do |user|
          next unless eligible_for_mass_anonymize?(user)

          UserAnonymizer.new(user, current_user).make_anonymous
          anonymized_ids << user.id
        end

      render json: { anonymized_ids: anonymized_ids }
    end

    private

    # Pinned per request so the listing and per-user re-check share one cutoff.
    def anonymize_cutoff
      @anonymize_cutoff ||= SiteSetting.manon_min_time_since_last_seen.days.ago
    end

    def eligible_users_scope
      User
        .real
        .joins(:primary_email)
        .where(admin: false, moderator: false)
        .where("users.last_seen_at < ?", anonymize_cutoff)
        .where("user_emails.email NOT LIKE ?", "%#{UserAnonymizer::EMAIL_SUFFIX}")
    end

    def apply_cursor(scope)
      return scope if params[:last_seen_at].blank? || params[:last_id].blank?

      last_seen_at =
        begin
          Time.zone.parse(params[:last_seen_at])
        rescue StandardError
          nil
        end
      return scope if last_seen_at.nil?

      scope.where("(users.last_seen_at, users.id) > (?, ?)", last_seen_at, params[:last_id].to_i)
    end

    def eligible_for_mass_anonymize?(user)
      user.last_seen_at.present? && user.last_seen_at < anonymize_cutoff &&
        guardian.can_anonymize_user?(user)
    end
  end
end
