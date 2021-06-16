import { connectionType } from './connection.js';
import { deviceName } from './deviceName.js';
import { showElem } from './navigation.js';
import { createReceiver, createAnswer } from './webrtc.js';
import { playSound } from './sound.js';
import { setOtherName } from './chat.js'
import { setSecretKey, encrypt } from './crypto.js'

let worker = null;
let video = null;

function initWorker() {
  worker = new Worker("external/scannerWorker.js");
  worker.onmessage = (ev) => terminateWorker(ev, "");
}

async function handleSoundMessageOnline(id, message) {
  createReceiver(id, () => {
    const msger = document.getElementById("msger");
    showElem(msger);
    video.srcObject.getTracks().forEach(function (track) {
      if (track.readyState == 'live' && track.kind === 'video') {
        track.stop();
      }
    });
  });
  createAnswer(message);
}

async function handleSoundMessageOffline(id, result) {
  const resultArr = result.split('-');
  const messageLength = resultArr.shift();
  result = resultArr.join('-');
  const message = result.substring(0, messageLength);
  const secretKey = result.substring(messageLength);
  setOtherName(message);
  setSecretKey(secretKey);
  const encryptedName = await encrypt(deviceName);
  playSound(`${id}${encryptedName}`).then(() => {
    const msger = document.getElementById("msger");
    showElem(msger);
    video.srcObject.getTracks().forEach(function (track) {
      if (track.readyState == 'live' && track.kind === 'video') {
        track.stop();
      }
    });
  });
}

const terminateWorker = async (ev, prefix) => {
  if (ev.data != null) {
    const handleSoundMessage = connectionType === 'ONLINE' ? handleSoundMessageOnline : handleSoundMessageOffline;
    worker.terminate();
    let result = prefix + ev.data.data;
    let id = result.slice(0, 6);
    result = result.slice(6);
    await handleSoundMessage(id, result);
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

const qrScanner = document.getElementById("qrScanner");

qrScanner.addEventListener('visible', function () {
  startVideo();
}, false);