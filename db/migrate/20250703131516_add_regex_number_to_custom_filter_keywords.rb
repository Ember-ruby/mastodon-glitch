class AddRegexNumberToCustomFilterKeywords < ActiveRecord::Migration[7.1]
  def change
    add_column :custom_filter_keywords, :regex, :boolean, default: false, null: false
  end
end
