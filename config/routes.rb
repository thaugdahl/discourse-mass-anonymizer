# frozen_string_literal: true

MassAnonymizePlugin::Engine.routes.draw do
  scope "/mass-anonymize", format: :json, constraints: AdminConstraint.new do
    get "/admin" => "admin#index"
    post "/anonymize" => "admin#anonymize"
  end
end

Discourse::Application.routes.draw { mount ::MassAnonymizePlugin::Engine, at: "/" }
