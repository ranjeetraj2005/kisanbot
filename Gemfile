source "https://rubygems.org"
ruby "~> 3.0.0"

gem "rails"
gem "active_model_serializers"
gem "bunny"
gem "delayed_job_active_record"
gem "delayed_job"
gem "devise"
gem "discard"
gem "google-cloud-storage", "~> 1.11"
gem "jwt"
gem "kaminari"
gem "mutations"
gem "pg"
gem "rabbitmq_http_api_client"
gem "rack-attack"
gem "rack-cors"
gem "rails_12factor"
gem "redis", "~> 4.0"
gem "request_store"
gem "rollbar"
gem "scenic"
gem "secure_headers"
gem "tzinfo" # For validation of user selected timezone names
gem "valid_url"
gem "thwait"

group :development, :test do
  gem "codecov", require: false
  gem "climate_control"
  gem "database_cleaner"
  gem "factory_bot_rails"
  gem "faker"
  gem "hashdiff"
  gem "pry-rails"
  gem "pry"
  gem "rspec-rails"
  gem "rspec"
  gem "rspec_junit_formatter"
  gem "simplecov"
  gem "smarf_doc", git: "https://github.com/RickCarlino/smarf_doc.git"
end

group :production do
  gem "passenger"
end
