import { deviceName } from './deviceName.js';
import { showElem } from './navigation.js';
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

qrContainer.addEventListener('visible', function () {
  displayQR(deviceName);
  startCapture((res) => {
    setOtherName(res);
    stopCapture();
    const msger = document.getElementById("msger");
    showElem(msger);
  })
}, false);