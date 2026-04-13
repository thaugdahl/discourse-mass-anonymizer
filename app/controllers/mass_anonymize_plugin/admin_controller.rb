# frozen_string_literal: true
module ::MassAnonymizePlugin
  class AdminController < ::Admin::AdminController

    requires_plugin PLUGIN_NAME

    MAX_ANONYMIZE_BATCH = 500
    PER_PAGE = 100

    def eligible_for_mass_anonymize?(user)
      days = SiteSetting.manon_min_time_since_last_seen

      user.last_seen_at.present? &&
        user.last_seen_at < days.days.ago &&
        !user.admin? &&
        !user.moderator?
    end

    def index
      days = SiteSetting.manon_min_time_since_last_seen
      page = [(params[:page] || 1).to_i, 1].max

      base_scope =
        User.where("last_seen_at < ?", days.days.ago).where(admin: false, moderator: false)

      total = base_scope.count

      users =
        base_scope
          .order(:last_seen_at)
          .limit(PER_PAGE)
          .offset((page - 1) * PER_PAGE)

      opts = { include_can_be_deleted: true, include_silence_reason: true }
      if params[:show_emails] == "true"
        StaffActionLogger.new(current_user).log_show_emails(users, context: request.path)
        opts[:emails_desired] = true
      end

      render json: {
               users: serialize_data(users, AdminUserListSerializer, opts),
               total_count: total,
               page: page,
               per_page: PER_PAGE,
             }
    end

    def anonymize
      raw_ids = Array(params[:users])

      if raw_ids.length > MAX_ANONYMIZE_BATCH
        return render_json_error(
                 I18n.t("mass_anonymize.errors.batch_too_large", max: MAX_ANONYMIZE_BATCH),
                 status: 422,
               )
      end

      users_to_anonymize = raw_ids.filter_map { |id| Integer(id.to_s, 10) rescue nil }

      anonymized_ids = []

      users_to_anonymize.each do |id|
        user = User.find_by(id: id)
        next if user.blank?
        next unless eligible_for_mass_anonymize?(user)

        UserAnonymizer.new(user, current_user).make_anonymous
        user.update(last_seen_at: nil)

        anonymized_ids << user.id
      end

      render json: {
               anonymizedIds: anonymized_ids,
             }
    end
  end
end
