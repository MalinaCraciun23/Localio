import { deviceName } from './deviceName.js';
import { playMessage, startCapture } from './sound.js';
import { decrypt } from './crypto.js';

let otherName = '';

export function setOtherName(name) {
  otherName = name;
}

const msger = document.getElementById("msger");
const msgerForm = document.getElementById("msger-form");
const msgerInput = document.getElementById("msger-input");
const msgerChat = document.getElementById("msger-chat");

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

export function appendMessage(name, side, text) {
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

function getObjectUrl(b64, fileType) {
  const sliceSize = 1024;
  const byteCharacters = atob(b64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  if (byteArrays.length <= 0) {
    return '';
  }

  const blob = new Blob(byteArrays, { type: fileType });

  const url = window.URL.createObjectURL(blob);
  return url;
};

export function appendFile(name, side, fileName, fileType, b64) {
  const url = getObjectUrl(b64, fileType);
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">
          <a target="_blank" href=${url} rel="noopener noreferrer" download=${fileName}>${fileName}</a>
        </div>
      </div>
    </div>
  `;
  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

msgerForm.addEventListener("submit", event => {
  event.preventDefault();
  const msg = msgerInput.value;
  if (msg) {
    playMessage(msg).then(() => {
      appendMessage(deviceName, "right", msg);
      msgerInput.value = "";
    });
  }
});

msger.addEventListener('visible', function () {
  let chunks = [];
  let type;
  let chunksCount;
  let fileName;
  let fileType;
  startCapture(async (encryptedMessage) => {
    const msg = await decrypt(encryptedMessage);
    if (msg) {
      if (chunks.length === 0) {
        const msgArr = msg.split(':');
        type = msgArr.shift();
        if (type === 'm') {
          chunksCount = Number(msgArr.shift());
        } else if (type === 'f') {
          fileName = msgArr.shift();
          fileType = msgArr.shift();
          chunksCount = Number(msgArr.shift());
        }
        chunks.push(msgArr.join(':'));
      } else {
        chunks.push(msg);
      }

      if (chunks.length === chunksCount) {
        if (type === 'm') {
          appendMessage(otherName, "left", chunks.join(''));
        } else if (type === 'f') {
          appendFile(otherName, "left", fileName, fileType, chunks.join(''));
        }
        chunks = [];
      }
    }
  });
}, false);