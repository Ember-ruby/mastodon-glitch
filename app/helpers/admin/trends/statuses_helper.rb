# frozen_string_literal: true

# frozen_string_literal: true

module Admin::Trends::StatusesHelper
  def one_line_preview(status)
    text = if status.local?
             status.text.split("\n").first
           else
             Nokogiri::HTML(status.text).css('html > body > *').first&.text
           end

    return '' if text.blank?

    prerender_custom_emojis(h(text), status.emojis)
  end
  
  def multi_line_preview(status)
    text = if status.local?
             status.text.split("\n")
           else
             Nokogiri::HTML(status.text).css('html > body > *').text
           end

    return '' if text.blank?

    prerender_custom_emojis(h(text), status.emojis)
  end
end
