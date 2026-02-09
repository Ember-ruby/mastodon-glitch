# frozen_string_literal: true

class ActivityPub::SynchronizeFollowersService < BaseService
  include JsonLdHelper
  include Payloadable

  def call(account, partial_collection_url)
    @account = account

    items = collection_items(partial_collection_url)
    return if items.nil?

    # There could be unresolved accounts (hence the call to .compact) but this
    # should never happen in practice, since in almost all cases we keep an
    # Account record, and should we not do that, we should have sent a Delete.
    # In any case there is not much we can do if that occurs.
    @expected_followers = items.filter_map { |uri| ActivityPub::TagManager.instance.uri_to_resource(uri, Account) }

    remove_unexpected_local_followers!
    handle_unexpected_outgoing_follows!
  end

  private

  def remove_unexpected_local_followers!
    @account.followers.local.where.not(id: @expected_followers.map(&:id)).reorder(nil).find_each do |unexpected_follower|
      UnfollowService.new.call(unexpected_follower, @account)
    end
  end

  def handle_unexpected_outgoing_follows!
    @expected_followers.each do |expected_follower|
      next if expected_follower.following?(@account)

      if expected_follower.requested?(@account)
        # For some reason the follow request went through but we missed it
        expected_follower.follow_requests.find_by(target_account: @account)&.authorize!
      else
        # Since we were not aware of the follow from our side, we do not have an
        # ID for it that we can include in the Undo activity. For this reason,
        # the Undo may not work with software that relies exclusively on
        # matching activity IDs and not the actor and target
        follow = Follow.new(account: expected_follower, target_account: @account)
        ActivityPub::DeliveryWorker.perform_async(build_undo_follow_json(follow), follow.account_id, follow.target_account.inbox_url)
      end
    end
  end

  def build_undo_follow_json(follow)
    Oj.dump(serialize_payload(follow, ActivityPub::UndoFollowSerializer))
  end

  # Only returns true if the whole collection has been processed
  def process_collection!(collection_uri, max_pages: MAX_COLLECTION_PAGES)
    collection = fetch_collection_page(collection_uri, reference_uri: @account.uri)
    return false unless collection.is_a?(Hash)

    collection = fetch_collection_page(collection['first'], reference_uri: @account.uri) if collection['first'].present?

    while collection.is_a?(Hash)
      process_page!(as_array(collection_page_items(collection)))

      max_pages -= 1

      return true if collection['next'].blank? # We reached the end of the collection
      return false if max_pages <= 0 # We reached our pages limit

      collection = fetch_collection_page(collection['next'])
    end

    false
  end
end
