# frozen_string_literal: true

module Admin::Settings::DiscoveryHelper
  def discovery_warning_hint_text
    authorized_fetch_overridden? ? t('admin.settings.security.authorized_fetch_overridden_hint') : nil
  end

  def discovery_hint_text
    t('admin.settings.security.authorized_fetch_hint')
  end

  def discovery_recommended_value
    authorized_fetch_overridden? ? :overridden : nil
  end

  def public_feed_auth?
    Setting.timeline_preview
  end

  def public_timelines_recommended_value
    public_feed_auth? ? :overridden : nil
  end

  def public_timelines_warning_hint_text
    public_feed_auth? ? t('admin.settings.security.public_timelines_warning_hint') : nil
  end
end
