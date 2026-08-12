# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?

# ── SAFETY GUARD ─────────────────────────────────────────────────────────────
# In this project DATABASE_URL is hardcoded to *_development for every
# environment, so a stray db:test:* (or maintain_test_schema! below) would
# WIPE the development database. Abort hard unless we are really pointed at a
# dedicated *_test database.
#
# Run the suite with an explicit test database, e.g.:
#   DATABASE_URL="mysql2://root:password@db/ai_learning_test" RAILS_ENV=test bundle exec rspec
_test_db = ActiveRecord::Base.connection_db_config.database.to_s
unless _test_db.match?(/_test\z/)
  abort(<<~MSG)
    ABORT: refusing to run tests — connected to "#{_test_db}", which is not a *_test database.
    This would destroy non-test data. Re-run with a test database, e.g.:
      DATABASE_URL="mysql2://root:password@db/ai_learning_test" RAILS_ENV=test bundle exec rspec
  MSG
end
# ─────────────────────────────────────────────────────────────────────────────

require 'rspec/rails'
# Add additional requires below this line. Rails is not loaded until this point!

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# Enabled: eleven request specs each carried a `require_relative` walking up
# three directories to spec/support plus an `include`. The boot cost the stock
# comment warns about is a couple of files here.
Rails.root.glob('spec/support/**/*.rb').sort_by(&:to_s).each { |f| require f }

# Ensures that the test database schema matches the current schema file.
# If there are pending migrations it will invoke `db:test:prepare` to
# recreate the test database by loading the schema.
# If you are not using ActiveRecord, you can remove these lines.
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end
RSpec.configure do |config|
  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_paths = [
    Rails.root.join('spec/fixtures')
  ]

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # You can uncomment this line to turn off ActiveRecord support entirely.
  # config.use_active_record = false

  # RSpec Rails uses metadata to mix in different behaviours to your tests,
  # for example enabling you to call `get` and `post` in request specs. e.g.:
  #
  #     RSpec.describe UsersController, type: :request do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://rspec.info/features/8-0/rspec-rails
  #
  # You can also infer these behaviours automatically by location, e.g.
  # /spec/models would pull in the same behaviour as `type: :model` but this
  # behaviour is considered legacy and will be removed in a future version.
  #
  # To enable this behaviour uncomment the line below.
  # config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.include ActiveSupport::Testing::TimeHelpers
  config.include RequestAuth, type: :request
  config.include AdminAuth,   type: :request
  config.filter_rails_from_backtrace!
  # arbitrary gems may also be filtered via:
  # config.filter_gems_from_backtrace("gem name")
end
