module ::MassAnonymizePlugin
  class AdminController < ::ApplicationController

    requires_plugin PLUGIN_NAME

    # before_action :ensure_logged_in
    # before_action :ensure_admin


    def index
      days = SiteSetting.manon_min_time_since_last_seen
      users = User.all.where("last_seen_at < ?", days.days.ago)


      puts users
      array_of_hashes =
        users.pluck(:username, :last_seen_at).map do |username, last_seen_at|
          { "username" => username, "last_seen_at" => last_seen_at }
        end

      render json: {
        users: array_of_hashes
      }
    end

    def doofus
      render json: {
        lul: "haha"
      }
    end

  end
end
