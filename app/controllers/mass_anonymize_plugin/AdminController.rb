module ::MassAnonymizePlugin
  class AdminController < ::ApplicationController

    requires_plugin PLUGIN_NAME

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
  end
end
