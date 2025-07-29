# frozen_string_literal: true

class ActivityPub::FetchAllRepliesService < ActivityPub::FetchRepliesService
  include JsonLdHelper

  # Limit of replies to fetch per status
  MAX_REPLIES = (ENV['FETCH_REPLIES_MAX_SINGLE'] || 500).to_i

  def call(status_uri, collection_or_uri, max_pages: 1, batch_id: nil, request_id: nil)
    @status_uri = status_uri

    super
  end

  private

  def filter_replies(items)
    # Find all statuses that we *shouldn't* update the replies for, and use that as a filter.
    # We don't assume that we have the statuses before they're created,
    # hence the negative filter -
    # "keep all these uris except the ones we already have"
    # instead of
    # "keep all these uris that match some conditions on existing Status objects"
    #
    # Typically we assume the number of replies we *shouldn't* fetch is smaller than the
    # replies we *should* fetch, so we also minimize the number of uris we should load here.
    uris = items.map { |item| value_or_id(item) }
    dont_update = Status.where(uri: uris).shouldnt_fetch_replies.pluck(:uri)

    # touch all statuses that already exist and that we're about to update
    Status.where(uri: uris).should_fetch_replies.touch_all(:fetched_replies_at)

    # Reject all statuses that we already have in the db
    uris = uris.reject { |uri| dont_update.include?(uri) }.take(MAX_REPLIES)

    Rails.logger.debug { "FetchAllRepliesService - #{@collection_or_uri}: Fetching filtered statuses: #{uris}" }
    uris
  end
end
