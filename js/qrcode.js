import { deviceName } from './deviceName.js';
import { showElem } from './navigation.js';
import { createSecretKey, decrypt } from './crypto.js';
import { startCapture, stopCapture } from './sound.js';
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
  displayQR(`${deviceName.length}-${deviceName}${key}`);
  startCapture(async (encryptedName) => {
    const otherName = await decrypt(encryptedName);
    setOtherName(otherName);
    stopCapture();
    const msger = document.getElementById("msger");
    showElem(msger);
  })
}, false);