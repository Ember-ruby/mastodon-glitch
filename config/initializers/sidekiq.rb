# frozen_string_literal: true

require_relative '../../lib/mastodon/sidekiq_middleware'
require_relative '../../lib/mastodon/worker_batch_middleware'

Sidekiq.configure_server do |config|
  config.redis = REDIS_SIDEKIQ_PARAMS

  config.server_middleware do |chain|
    chain.add Mastodon::SidekiqMiddleware
    chain.add SidekiqUniqueJobs::Middleware::Server
  end

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
    chain.add Mastodon::WorkerBatchMiddleware
  end

  config.on(:startup) do
    if SelfDestructHelper.self_destruct?
      Sidekiq.schedule = {
        'self_destruct_scheduler' => {
          'interval' => ['1m'],
          'class' => 'Scheduler::SelfDestructScheduler',
          'queue' => 'scheduler',
        },
      }
      SidekiqScheduler::Scheduler.instance.reload_schedule!
    end
  end

  SidekiqUniqueJobs::Server.configure(config)
end

Sidekiq.configure_client do |config|
  config.redis = REDIS_SIDEKIQ_PARAMS

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
    chain.add Mastodon::WorkerBatchMiddleware
  end
end

Sidekiq.logger.level = ::Logger.const_get(ENV.fetch('RAILS_LOG_LEVEL', 'info').upcase.to_s)

SidekiqUniqueJobs.configure do |config|
  config.enabled         = !Rails.env.test?
  config.reaper          = :ruby
  config.reaper_count    = 1000
  config.reaper_interval = 600
  config.reaper_timeout  = 150
  config.lock_ttl        = 50.days.to_i
end
