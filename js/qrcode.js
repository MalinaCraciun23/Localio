import { deviceName } from './deviceName.js';
import { showElem } from './navigation.js';
import { createSecretKey, decrypt } from './crypto.js';
import { startCapture, stopCapture } from './sound.js';
import { generateId } from './crypto.js';
import { setOtherName } from './chat.js'

function displayQR(val) {
  const QRGen = qrcodegen.QrCode;
  const qrCode = document.getElementById("qrcode");
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

const qrContainer = document.getElementById("qrcodeContainer");

qrContainer.addEventListener('visible', async function () {
  const key = await createSecretKey();
  const id = generateId(6);
  displayQR(`${id}${deviceName.length}-${deviceName}${key}`);
  startCapture(async (msg) => {
    const receivedId = msg.slice(0, 6);
    if (id === receivedId) {
      const encryptedName = msg.slice(6);
      const otherName = await decrypt(encryptedName);
      setOtherName(otherName);
      stopCapture();
      const msger = document.getElementById("msger");
      showElem(msger);
    }
  })
}, false);