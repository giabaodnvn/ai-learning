class AddProfileFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :name, :string
    add_column :users, :jlpt_level, :string, default: "n5", null: false
    add_column :users, :streak_count, :integer, default: 0, null: false
    add_column :users, :last_studied_at, :datetime

    add_index :users, :jlpt_level
  end
end
