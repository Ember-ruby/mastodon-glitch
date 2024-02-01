import { createRoot } from 'react-dom/client';

import { setupBrowserNotifications } from 'flavours/blobfox/actions/notifications';
import Mastodon from 'flavours/blobfox/containers/mastodon';
import { me } from 'flavours/blobfox/initial_state';
import * as perf from 'flavours/blobfox/performance';
import ready from 'flavours/blobfox/ready';
import { store } from 'flavours/blobfox/store';

/**
 * @returns {Promise<void>}
 */
function main() {
  perf.start('main()');

  return ready(async () => {
    const mountNode = document.getElementById('mastodon');
    const props = JSON.parse(mountNode.getAttribute('data-props'));

    const root = createRoot(mountNode);
    root.render(<Mastodon {...props} />);
    store.dispatch(setupBrowserNotifications());

    if (process.env.NODE_ENV === 'production' && me && 'serviceWorker' in navigator) {
      const { Workbox } = await import('workbox-window');
      const wb = new Workbox('/sw.js');
      /** @type {ServiceWorkerRegistration} */
      let registration;

      try {
        registration = await wb.register();
      } catch (err) {
        console.error(err);
      }

      if (registration && 'Notification' in window && Notification.permission === 'granted') {
        const registerPushNotifications = await import('flavours/blobfox/actions/push_notifications');

        store.dispatch(registerPushNotifications.register());
      }
    }

    perf.stop('main()');
  });
}

export default main;
