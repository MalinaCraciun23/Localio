import { deviceName } from './deviceName.js';
import { showElem } from './navigation.js';
import { playSound } from './sound.js';
import { setOtherName } from './chat.js'
import { setSecretKey, encrypt } from './crypto.js'

let worker = null;
let video = null;

function initWorker() {
  worker = new Worker("external/scannerWorker.js");
  worker.onmessage = (ev) => terminateWorker(ev, "");
}

const terminateWorker = async (ev, prefix) => {
  if (ev.data != null) {
    worker.terminate();
    const result = ev.data;
    let message = prefix + result.data;
    let id = message.slice(0, 6);
    message = message.slice(6);
    const messageArr = message.split('-');
    const nameLength = messageArr.shift();
    message = messageArr.join('-');
    const name = message.substring(0, nameLength);
    setOtherName(name);
    const secretKey = message.substring(nameLength);
    setSecretKey(secretKey);
    const encryptedName = await encrypt(deviceName);
    playSound(`${id}${encryptedName}`).then(() => {
      const msger = document.getElementById("msger");
      showElem(msger)
      video.srcObject.getTracks().forEach(function (track) {
        if (track.readyState == 'live' && track.kind === 'video') {
          track.stop();
        }
      });
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