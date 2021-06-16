
import { connectionType } from './connection.js';
import { deviceName } from './deviceName.js';
import { appendFile } from './chat.js';
import { sendRTCFile } from './webrtc.js';
import { playFile } from './sound.js';

function getB64File(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (!file) {
      reject();
      return;
    }

    reader.onload = readerEvent => {
      resolve(btoa(unescape(readerEvent.target.result)));
    };

    reader.readAsBinaryString(file);
  });
};


const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async e => {
  const handleSendFile = connectionType === 'ONLINE' ? sendRTCFile : playFile;
  const file = e.target.files && e.target.files[0];
  if (file) {
    const fileType = file.type || 'file';
    const fileName = file.name;
    const b64File = await getB64File(file);
    await handleSendFile(fileName, fileType, b64File);
    appendFile(deviceName, "right", fileName, fileType, b64File);
    fileInput.value = '';
  }

  return false;
});