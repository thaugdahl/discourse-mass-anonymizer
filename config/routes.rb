# frozen_string_literal: true

MassAnonymizePlugin::Engine.routes.draw do
  get "/examples" => "examples#index"
  # get '/admin/plugins/mass-anonymize' => 'admin/plugins#index', constraints: StaffConstraint.new
  # define routes here
end

# Discourse::Application.routes.draw { mount ::MassAnonymizePlugin::Engine, at: "mass-anonymize" }
