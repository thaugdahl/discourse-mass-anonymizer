# frozen_string_literal: true

# name: mass-anonymize
# about: TODO
# meta_topic_id: TODO
# version: 0.0.1
# authors: Tor Andre Haugdahl <thaugdahl@gmail.com>
# url: TODO
# required_version: 2.7.0

enabled_site_setting :plugin_name_enabled

module ::MassAnonymizePlugin
  PLUGIN_NAME = "mass-anonymize"
end

require_relative "lib/my_plugin_module/engine"


after_initialize do

  enabled_site_setting :manon_min_time_since_last_seen
  # Code which should run after Rails has finished booting
  add_admin_route 'mass_anonymize.title', 'mass-anonymize'

 Discourse::Application.routes.append do
    mount ::MassAnonymizePlugin::Engine, at: "/mass-anonymize/"

    get "/mass-anonymize/admin" => "mass_anonymize_plugin/admin#index", :constraints => StaffConstraint.new
    post "/mass-anonymize/anonymize" => "mass_anonymize_plugin/admin#anonymize", :constraints => StaffConstraint.new
  end
end
