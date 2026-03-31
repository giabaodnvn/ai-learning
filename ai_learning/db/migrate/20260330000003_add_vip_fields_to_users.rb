class AddVipFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :vip_level,      :integer,  default: 0,    null: false  # 0=free 1=basic 2=pro 3=premium
    add_column :users, :balance,        :decimal,  precision: 10, scale: 2, default: "0.0", null: false
    add_column :users, :vip_expires_at, :datetime
    add_column :users, :blocked,        :boolean,  default: false, null: false

    add_index :users, :vip_level
    add_index :users, :blocked
  end
end
