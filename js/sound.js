import { encrypt } from './crypto.js';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

let context = null;
let recorder = null;

let ggwave = null;
let parameters = null;
let instance = null;

let mediaStream;

let callback = () => { };

function convertTypedArray(src, type) {
  const buffer = new ArrayBuffer(src.byteLength);
  new src.constructor(buffer).set(src);
  return new type(buffer);
}

const sendBtn = document.getElementById('msger-send-btn');
const msgerInput = document.getElementById('msger-input');
const fileInput = document.getElementById('fileInput');

function disableSend() {
  sendBtn.disabled = true;
  msgerInput.disabled = true;
  fileInput.disabled = true;
}

function enableSend() {
  sendBtn.disabled = false;
  msgerInput.disabled = false;
  fileInput.disabled = false;
}

ggwave_factory().then(function (obj) {
  ggwave = obj;
});

function init() {
  if (!context) {
    context = new AudioContext({ sampleRate: 48000 });

    parameters = ggwave.getDefaultParameters();
    parameters.sampleRateInp = context.sampleRate;
    parameters.sampleRateOut = context.sampleRate;
    instance = ggwave.init(parameters);
  }
}

export function startCapture(cb) {
  if (cb) callback = cb;

  init();


  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false
    }
  }).then(function (e) {
    mediaStream = context.createMediaStreamSource(e);

    const bufferSize = 16 * 1024;
    const numberOfInputChannels = 1;
    const numberOfOutputChannels = 1;

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
      const source = e.inputBuffer;
      const res = ggwave.decode(instance, convertTypedArray(new Float32Array(source.getChannelData(0)), Int8Array));
      if (res) {
        callback(res);
      }
    }

    mediaStream.connect(recorder);
    recorder.connect(context.destination);
  }).catch(function (e) {
    console.error(e);
  });
}

export function stopCapture() {
  if (recorder) {
    recorder.disconnect(context.destination);
    mediaStream.mediaStream.getTracks().forEach(function (track) {
      if (track.readyState == 'live' && track.kind === 'audio') {
        track.stop();
      }
    });
    mediaStream.disconnect(recorder);
    recorder = null;
    callback = () => { };
  }
}

export function playSound(str) {
  return new Promise((resolve, reject) => {
    if (!str) reject();
    disableSend()
    const capturing = !!recorder;
    const cb = callback;
    if (capturing) stopCapture();

    init();

    // generate audio waveform
    const waveform = ggwave.encode(instance, str, ggwave.TxProtocolId.GGWAVE_TX_PROTOCOL_AUDIBLE_FAST, 10)

    // play audio
    const buf = convertTypedArray(waveform, Float32Array);
    const buffer = context.createBuffer(1, buf.length, context.sampleRate);
    buffer.getChannelData(0).set(buf);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    source.onended = function () {
      if (capturing) startCapture(cb);
      enableSend();
      resolve();
    };
  });
}

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

export async function playMessage(msg) {
  const chunks = chunkSubstr(msg, 50);
  const firstChunk = chunks.shift();
  const encryptedFirstChunk = await encrypt(`m:${chunks.length + 1}:${firstChunk}`);
  await playSound(encryptedFirstChunk);
  for (const chunk of chunks) {
    await sleep(3150);
    const encryptedChunk = await encrypt(chunk);
    await playSound(encryptedChunk);
  }
}

export async function playFile(fileName, fileType, b64File) {
  const chunks = chunkSubstr(b64File, 50);
  const encryptedFileInfo = await encrypt(`f:${fileName}:${fileType}:${chunks.length}`);
  await playSound(encryptedFileInfo);
  for (const chunk of chunks) {
    await sleep(3150);
    const encryptedChunk = await encrypt(chunk);
    await playSound(encryptedChunk);
  }
}