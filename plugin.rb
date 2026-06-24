# frozen_string_literal: true

# name: discourse-mass-anonymizer
# about: Anonymize inactive users in bulk based on their last seen date.
# version: 0.0.1
# authors: Tor Andre Haugdahl <thaugdahl@gmail.com>
# required_version: 2.7.0

enabled_site_setting :mass_anonymizer_enabled

module ::MassAnonymizePlugin
  PLUGIN_NAME = "discourse-mass-anonymizer"
end

require_relative "lib/mass_anonymize_plugin/engine"

after_initialize do
  # Code which should run after Rails has finished booting
  add_admin_route "mass_anonymize.title", "discourse-mass-anonymizer", use_new_show_route: true
end
