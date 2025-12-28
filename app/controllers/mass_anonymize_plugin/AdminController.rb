module ::MassAnonymizePlugin
  class AdminController < ::ApplicationController

    requires_plugin PLUGIN_NAME

    def eligible_for_mass_anonymize?(user)
      days = SiteSetting.manon_min_time_since_last_seen

      user.last_seen_at.present? &&
        user.last_seen_at < days.days.ago &&
        !user.admin? &&
        !user.moderator?
    end

    def index
      days = SiteSetting.manon_min_time_since_last_seen

      # Potentially heavy with many users.
      users = User.all.where("last_seen_at < ?", days.days.ago).where(admin: false, moderator: false)

      opts = { include_can_be_deleted: true, include_silence_reason: true }
      if params[:show_emails] == "true"
        StaffActionLogger.new(current_user).log_show_emails(users, context: request.path)
        opts[:emails_desired] = true
      end
      render_serialized(users, AdminUserListSerializer, opts)
    end

    def anonymize
      users_to_anonymize = params[:users]

      anonymized_ids = []

      users_to_anonymize.each do |id|
        user = User.find_by(id: id)
        next if user.blank?
        next unless eligible_for_mass_anonymize?(user)

        # user.set_user_field(:last_seen_at, nil)
        user.update(last_seen_at: nil)
        UserAnonymizer.new(user, current_user).make_anonymous

        anonymized_ids << user.id
      end

      render json: {
        anonymizedIds: anonymized_ids
      }
    end
  end
end
