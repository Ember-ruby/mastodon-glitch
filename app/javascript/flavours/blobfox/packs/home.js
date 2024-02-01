import 'packs/public-path';
import { loadLocale } from 'flavours/blobfox/locales';
import main from "flavours/blobfox/main";
import { loadPolyfills } from 'flavours/blobfox/polyfills';

loadPolyfills()
  .then(loadLocale)
  .then(main)
  .catch(e => {
    console.error(e);
  });
