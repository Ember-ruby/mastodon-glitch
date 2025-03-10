# frozen_string_literal: true

class Api::V1::Timelines::TagController < Api::V1::Timelines::BaseController
  before_action -> { authorize_if_got_token! :read, :'read:statuses' }
  before_action :require_user!, if: :require_auth?
  before_action :load_tag

  PERMITTED_PARAMS = %i(local limit only_media).freeze

  def show
    cache_if_unauthenticated!
    @statuses = load_statuses
    render json: @statuses, each_serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new(@statuses, current_user&.account_id)
  end

  private

  def require_auth?
    if truthy_param?(:local) and !truthy_param?(:remote)
      !Setting.timeline_preview_local
    elsif truthy_param?(:remote) and !truthy_param?(:local)
      !Setting.timeline_preview_remote
    elsif truthy_param?(:remote) and truthy_param?(:local)
      !Setting.timeline_preview
    else
      !Setting.timeline_preview
    end
  end

  def load_tag
    @tag = Tag.find_normalized(params[:id])
  end

  def load_statuses
    cached_tagged_statuses
  end

  def cached_tagged_statuses
    @tag.nil? ? [] : cache_collection(tag_timeline_statuses, Status)
  end

  def tag_timeline_statuses
    tag_feed.get(
      limit_param(DEFAULT_STATUSES_LIMIT),
      params[:max_id],
      params[:since_id],
      params[:min_id]
    )
  end

  def tag_feed
    TagFeed.new(
      @tag,
      current_account,
      any: params[:any],
      all: params[:all],
      none: params[:none],
      local: truthy_param?(:local),
      remote: truthy_param?(:remote),
      only_media: truthy_param?(:only_media)
    )
  end

  def next_path
    api_v1_timelines_tag_url params[:id], next_path_params
  end

  def prev_path
    api_v1_timelines_tag_url params[:id], prev_path_params
  end
end
