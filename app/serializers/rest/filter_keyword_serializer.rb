# frozen_string_literal: true

class REST::FilterKeywordSerializer < ActiveModel::Serializer
  attributes :id, :keyword, :whole_word, :regex

  def id
    object.id.to_s
  end
end
