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
  # Code which should run after Rails has finished booting
end
