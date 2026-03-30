class AddLatestWeeklyReportToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :latest_weekly_report, :text
    add_column :users, :weekly_report_generated_at, :datetime
  end
end
