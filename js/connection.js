import { showElem } from './navigation.js';

function disableOnline() {
  const onlineButton = document.getElementById('online-button');
  if (onlineButton) {
    onlineButton.disabled = true;
  }

  const onlineTooltip = document.getElementById('online-tooltip');
  if (onlineTooltip) {
    onlineTooltip.classList.add('tooltip-warning');
    onlineTooltip.setAttribute('aria-label', "You can't use this option without internet.");
  }
}

function enableOnline() {
  const onlineButton = document.getElementById('online-button');
  if (onlineButton) {
    onlineButton.disabled = false;
  }

  const onlineTooltip = document.getElementById('online-tooltip');
  if (onlineTooltip) {
    onlineTooltip.classList.remove('tooltip-warning');
    onlineTooltip.setAttribute('aria-label', "Send data to another device over the network.");
  }
}

window.addEventListener('offline', () => disableOnline(), false);
window.addEventListener('online', () => enableOnline(), false);
if (!navigator.onLine) disableOnline();

export let connectionType = null;
const connectForm = document.getElementById('connect-form');
if (connectForm)
  connectForm.addEventListener('submit', e => handleConnectionType(e));

function handleConnectionType(e) {
  e.preventDefault();
  connectionType = e.submitter.innerText;
  const qrForm = document.getElementById('qr-form');
  if (connectionType && qrForm) {
    showElem(qrForm);
  }
}

export let connectionMethod = null;
const qrForm = document.getElementById('qr-form');
if (qrForm)
  qrForm.addEventListener('submit', e => handleQRSubmit(e));

function handleQRSubmit(e) {
  e.preventDefault();
  connectionMethod = e.submitter.innerText;

  switch (connectionMethod) {
    case 'SHOW CODE':
      const qrContainer = document.getElementById("qrcodeContainer");
      showElem(qrContainer);
      break;
    case 'SCAN CODE':
      const qrScanner = document.getElementById("qrScanner");
      showElem(qrScanner);
      break;
  }
}