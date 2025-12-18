# frozen_string_literal: true

MassAnonymizePlugin::Engine.routes.draw do
  get "/examples" => "examples#index"
  # define routes here
end

Discourse::Application.routes.draw { mount ::MassAnonymizePlugin::Engine, at: "mass-anonymize" }
