/* Device Name */
import { deviceName, setDeviceName, showDeviceName } from './deviceName.js';

let otherName = '';

showDeviceName();

const changeNameButton = document.getElementById('change-name');
const editNameDialog = document.getElementById('editNameDialog');

changeNameButton.addEventListener('click', function () {
  const editNameDialog = document.getElementById('editNameDialog');
  editNameDialog.setAttribute('show', 1);
  const autoFocus = editNameDialog.querySelector('[autofocus]');
  if (autoFocus) {
    autoFocus.textContent = '';
    autoFocus.focus();
  }
});

editNameDialog.querySelectorAll('[close]').forEach(el =>
  el.addEventListener('click', e => {
    editNameDialog.removeAttribute('show');
    document.activeElement.blur();
    window.blur();
  })
);

const editNameForm = editNameDialog.querySelector('form');
editNameForm.addEventListener('submit', e => {
  e.preventDefault();
  const textInput = editNameDialog.querySelector('#textInput');
  setDeviceName(textInput.innerText);
});

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

/* Home Button */

const homeButton = document.querySelector('#home')
homeButton.onclick = _ => location.reload();

/* How Connect */

window.addEventListener('offline', e => disableOnline(), false);
window.addEventListener('online', e => enableOnline(), false);
if (!navigator.onLine) disableOnline();

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

function hideAndShow(toHide, toShow) {
  toHide.classList.add('hidden');
  window.setTimeout(function () {
    toHide.hidden = true;
    toShow.hidden = false;
    toShow.offsetHeight;
    toShow.classList.remove('hidden');
  }, 1000);
}

let connectionType = null;
const connectForm = document.getElementById('connect-form');
if (connectForm)
  connectForm.addEventListener('submit', e => handleConnectionType(e));

function handleConnectionType(e) {
  e.preventDefault();
  connectionType = e.submitter.innerText;
  const qrForm = document.getElementById('qr-form');
  if (connectionType && qrForm) {
    hideAndShow(connectForm, qrForm);
  }
}

const qrForm = document.getElementById('qr-form');
if (qrForm)
  qrForm.addEventListener('submit', e => handleQRSubmit(e));

function handleQRSubmit(e) {
  e.preventDefault();
  const action = e.submitter.innerText;

  switch (action) {
    case 'SHOW CODE':
      showQRCode();
      break;
    case 'SCAN CODE':
      showQRScanner();
      break;
  }
}

/* show QR */

const qrContainer = document.getElementById("qrcodeContainer");

function showQRCode() {
  displayQR(deviceName);
  hideAndShow(qrForm, qrContainer);
  ggwave_factory().then(function (obj) {
    ggwave = obj;
    startCapture();
  });
}

const QRGen = qrcodegen.QrCode;
const qrCode = document.getElementById("qrcode");

function displayQR(val) {
  const encodeFunc = val instanceof Uint8Array
    ? QRGen.encodeBinary
    : QRGen.encodeText;
  const qr = encodeFunc(val, QRGen.Ecc.MEDIUM);
  const code = qr.toSvgString(1);
  const viewBox = (/ viewBox="([^"]*)"/.exec(code))[1];
  const pathD = (/ d="([^"]*)"/.exec(code))[1];
  qrCode.setAttribute("viewBox", viewBox);
  qrCode.querySelector("path").setAttribute("d", pathD);
}


/* scan QR */

const qrScanner = document.getElementById("qrScanner");

function showQRScanner() {
  startVideo();
  hideAndShow(qrForm, qrScanner);
}
let worker = null;

function initWorker() {
  worker = new Worker("js/scannerWorker.js");
  worker.onmessage = (ev) => terminateWorker(ev, "");
}

const terminateWorker = (ev, prefix) => {
  if (ev.data != null) {
    worker.terminate();
    const result = ev.data;
    otherName = prefix + result.data;
    ggwave_factory().then(function (obj) {
      ggwave = obj;
      init();

      // generate audio waveform
      var waveform = ggwave.encode(instance, deviceName, ggwave.TxProtocolId.GGWAVE_TX_PROTOCOL_AUDIBLE_FAST, 10)

      // play audio
      var buf = convertTypedArray(waveform, Float32Array);
      var buffer = context.createBuffer(1, buf.length, context.sampleRate);
      buffer.getChannelData(0).set(buf);
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
      source.onended = function () {
        hideAndShow(qrScanner, msger);
        startCapture();
      };
    });
  }
};

const CANVAS_SIZE = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight / 3
};
const focusBoxWidth = 200;
const focusBoxHeight = 200;

const container = document.getElementById("canvas");


let ctx = container.getContext('2d');

let video = null;
let oldTime = 0;

function tick(time) {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    container.width = Math.min(CANVAS_SIZE.WIDTH, video.videoWidth);
    container.height = Math.min(CANVAS_SIZE.HEIGHT, video.videoHeight);

    const sx = (container.width - focusBoxWidth) / 2;
    const sy = (container.height - focusBoxHeight) / 2;

    ctx.drawImage(video, 0, 0);
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, 0, container.width, container.height);
    ctx.drawImage(video, sx, sy, focusBoxWidth, focusBoxHeight, sx, sy, focusBoxWidth, focusBoxHeight);

    if (time - oldTime > 600) {
      oldTime = time;
      let imageData = ctx.getImageData(sx, sy, focusBoxWidth, focusBoxHeight);
      worker.postMessage({ data: imageData.data, width: imageData.width, height: imageData.height });
    }
  }
  requestAnimationFrame(tick);
}

function startVideo() {
  video = document.createElement("video");

  initWorker();
  navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } }).then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.play();
    requestAnimationFrame(tick);
  });
}

/* chat functions */

const msger = document.getElementById("msger");
const msgerForm = document.getElementById("msger-form");
const msgerInput = document.getElementById("msger-input");
const msgerChat = document.getElementById("msger-chat");

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function appendMessage(name, side, text) {
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

/* Audio functions */

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

var context = null;
var recorder = null;

// the ggwave module instance
var ggwave = null;
var parameters = null;
var instance = null;

var mediaStream;

// helper function
function convertTypedArray(src, type) {
  var buffer = new ArrayBuffer(src.byteLength);
  var baseView = new src.constructor(buffer).set(src);
  return new type(buffer);
}

function init() {
  if (!context) {
    context = new AudioContext({ sampleRate: 48000 });

    parameters = ggwave.getDefaultParameters();
    parameters.sampleRateInp = context.sampleRate;
    parameters.sampleRateOut = context.sampleRate;
    instance = ggwave.init(parameters);
  }
}

function startCapture() {
  init();

  let constraints = {
    audio: {
      // not sure if these are necessary to have
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).then(function (e) {
    mediaStream = context.createMediaStreamSource(e);

    var bufferSize = 16 * 1024;
    var numberOfInputChannels = 1;
    var numberOfOutputChannels = 1;

    if (context.createScriptProcessor) {
      recorder = context.createScriptProcessor(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels);
    } else {
      recorder = context.createJavaScriptNode(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels);
    }

    recorder.onaudioprocess = function (e) {
      var source = e.inputBuffer;
      var res = ggwave.decode(instance, convertTypedArray(new Float32Array(source.getChannelData(0)), Int8Array));
      if (res) {
        if (!otherName) {
          otherName = res;
          hideAndShow(qrContainer, msger);
        } else {
          appendMessage(otherName, "left", res);
        }
      }
    }

    mediaStream.connect(recorder);
    recorder.connect(context.destination);
  }).catch(function (e) {
    console.error(e);
  });
}

function stopCapture() {
  if (recorder) {
    recorder.disconnect(context.destination);
    mediaStream.disconnect(recorder);
    recorder = null;
  }
}

function onSend() {
  init();

  // generate audio waveform
  var waveform = ggwave.encode(instance, txData.value, ggwave.TxProtocolId.GGWAVE_TX_PROTOCOL_AUDIBLE_FAST, 10)

  // play audio
  var buf = convertTypedArray(waveform, Float32Array);
  var buffer = context.createBuffer(1, buf.length, context.sampleRate);
  buffer.getChannelData(0).set(buf);
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}

msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  stopCapture();

  const msgText = msgerInput.value;
  if (!msgText) return;


  appendMessage(deviceName, "right", msgText);
  msgerInput.value = "";

  init();

  // generate audio waveform
  var waveform = ggwave.encode(instance, msgText, ggwave.TxProtocolId.GGWAVE_TX_PROTOCOL_AUDIBLE_FAST, 10)

  // play audio
  var buf = convertTypedArray(waveform, Float32Array);
  var buffer = context.createBuffer(1, buf.length, context.sampleRate);
  buffer.getChannelData(0).set(buf);
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
  source.onended = function () {
    startCapture();
  };
});