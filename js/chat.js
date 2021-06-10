import { deviceName } from './deviceName.js';
import { playMessage, startCapture } from './sound.js';

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

msgerForm.addEventListener("submit", event => {
  event.preventDefault();
  const msg = msgerInput.value;
  if (msg) {
    appendMessage(deviceName, "right", msg);
    playMessage(msg);
    msgerInput.value = "";
  }
});

msger.addEventListener('visible', function () {
  startCapture((msg) => appendMessage(otherName, "left", msg));
}, false);