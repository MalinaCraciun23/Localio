import { deviceName } from './deviceName.js';
import { connectionType, connectionMethod } from './connection.js';
import './qrcode.js';
import './qrscanner.js';
import './chat.js';
import './upload.js'

/* Install Button */

window.addEventListener('beforeinstallprompt', e => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return e.preventDefault();
  } else {
    const installButton = document.querySelector('#install')
    installButton.hidden = false;
    installButton.onclick = _ => e.prompt();
    return e.preventDefault();
  }
});