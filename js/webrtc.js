import { deviceName } from './deviceName.js';
import { connectionMethod } from './connection.js';
import { buffToBase64, base64ToBuff } from './crypto.js'
import { displayQR } from './qrcode.js';
import { playSound } from './sound.js';

let ips = [];
getIPs(ip => ips.push(ip));

const offerTemplate = `v=0
o=- 1337 0 IN IP4 0.0.0.0
s=-
t=0 0
a=sendrecv
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=group:BUNDLE sdparta_0
a=ice-options:trickle
a=msid-semantic:WMS *
m=application 5400 DTLS/SCTP 5000
c=IN IP4 0.0.0.0
a=candidate:0 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:1 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:2 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:3 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:4 1 UDP 2122252543 0.0.0.0 5400 typ host
a=sendrecv
a=end-of-candidates
a=ice-pwd:52f0a329e7fd93662f50828f617b408d
a=ice-ufrag:bc105aa9
a=mid:sdparta_0
a=sctpmap:5000 webrtc-datachannel 256
a=setup:actpass
a=max-message-size:1073741823`;

const answerTemplate = `v=0
o=- 1338 0 IN IP4 0.0.0.0
s=-
t=0 0
a=sendrecv
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=group:BUNDLE sdparta_0
a=ice-options:trickle
a=msid-semantic:WMS *
m=application 5400 DTLS/SCTP 5000
c=IN IP4 0.0.0.0
a=candidate:0 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:1 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:2 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:3 1 UDP 2122252543 0.0.0.0 5400 typ host
a=candidate:4 1 UDP 2122252543 0.0.0.0 5400 typ host
a=sendrecv
a=end-of-candidates
a=ice-pwd:1aa0e1241c16687064c4fd31b8fc367a
a=ice-ufrag:c417de3e
a=mid:sdparta_0
a=sctpmap:5000 webrtc-datachannel 256
a=setup:active
a=max-message-size:1073741823`;

function minifySDP(sdp) {
  const res = parseSDP(sdp);
  let buff = [];

  const ip = ips[0];
  ip.split('.').forEach(field => buff.push(parseInt(field)));

  const port = res.media[0].candidates.find(candidate => candidate.ip === ip).port;
  const portBits = [parseInt(port & 0xFF00) >> 8, parseInt(port & 0x00FF)];
  buff.push(...portBits);

  if (typeof res.fingerprint === 'undefined') {
    const hashParts = res.media[0].fingerprint.hash.split(':').map(hashPart => parseInt(hashPart, 16));
    buff.push(...hashParts);
  } else {
    const hashParts = res.fingerprint.hash.split(':').map(hashPart => parseInt(hashPart, 16));
    buff.push(...hashParts);
  }

  const credentials = `${res.media[0].iceUfrag} ${res.media[0].icePwd}`;
  const credenitalsBits = credentials.split('').map(char => char.charCodeAt(0));
  buff.push(...credenitalsBits);

  return buffToBase64(new Uint8Array(buff));
}

function expandSDP(minifiedSDP) {
  const sdpBuff = Array.from(base64ToBuff(minifiedSDP));
  const ip = sdpBuff.slice(0, 4).map(field => String(field)).join('.');
  const port = String(sdpBuff[4] * 256 + sdpBuff[5]);
  const hash = sdpBuff.slice(6, 38).map(hashPart => {
    if (hashPart == 0) {
      return '00';
    } else if (hashPart < 16) {
      return '0' + hashPart.toString(16).toUpperCase();
    } else {
      return hashPart.toString(16).toUpperCase();
    }
  }).join(':');
  const credentials = sdpBuff.slice(38).map(char => String.fromCharCode(char)).join('');
  const [iceUfrag, icePwd] = credentials.split(' ');

  return { ip, port, hash, iceUfrag, icePwd };
}

function constructOffer(offerSDP) {
  const offer = parseSDP(offerTemplate);

  offer.media[0].iceUfrag = offerSDP.iceUfrag;
  offer.media[0].icePwd = offerSDP.icePwd;
  offer.media[0].connection.ip = offerSDP.ip;
  offer.media[0].port = offerSDP.port;
  if (typeof offer.fingerprint === 'undefined') {
    offer.media[0].fingerprint.hash = offerSDP.hash;
  } else {
    offer.fingerprint.hash = offerSDP.hash;
  }
  if (typeof offer.candidates === 'undefined') {
    for (let i = 0; i < offer.media[0].candidates.length; i++) {
      offer.media[0].candidates[i].ip = offerSDP.ip;
      offer.media[0].candidates[i].port = offerSDP.port;
    }
  } else {
    for (let i = 0; i < offer.candidates.length; i++) {
      offer.candidates[i].ip = offerSDP.ip;
      offer.candidates[i].port = offerSDP.port;
    }
  }
  return `{"type":"offer","sdp": ${JSON.stringify(writeSDP(offer))}}`;
}

function constructAnswer(answerSDP) {
  const answer = parseSDP(answerTemplate);

  answer.media[0].iceUfrag = answerSDP.iceUfrag;
  answer.media[0].icePwd = answerSDP.icePwd;
  answer.media[0].connection.ip = answerSDP.ip;
  answer.media[0].port = answerSDP.port;
  if (typeof answer.fingerprint === 'undefined') {
    answer.media[0].fingerprint.hash = answerSDP.hash;
  } else {
    answer.fingerprint.hash = answerSDP.hash;
  }
  if (typeof answer.candidates === 'undefined') {
    for (let i = 0; i < answer.media[0].candidates.length; i++) {
      answer.media[0].candidates[i].ip = answerSDP.ip;
      answer.media[0].candidates[i].port = answerSDP.port;
    }
  } else {
    for (let i = 0; i < answer.candidates.length; i++) {
      answer.candidates[i].ip = answerSDP.ip;
      answer.candidates[i].port = answerSDP.port;
    }
  }
  return `{"type":"answer","sdp": ${JSON.stringify(writeSDP(answer))}}`;
}

function mungeOffer(sdp) {
  const parsed = parseSDP(sdp);
  const template = parseSDP(offerTemplate);
  parsed.name = template.name;
  parsed.origin.username = template.origin.username;
  parsed.origin.sessionId = template.origin.sessionId;
  parsed.origin.sessionVersion = template.origin.sessionVersion;
  parsed.groups[0].mids = template.groups[0].mids;
  parsed.media[0].mid = template.media[0].mid;
  parsed.media[0].connection.ip = ips[0];
  return writeSDP(parsed);
}

function mungeAnswer(sdp) {
  const parsed = parseSDP(sdp);
  const template = parseSDP(answerTemplate);
  parsed.name = template.name;
  parsed.origin.username = template.origin.username;
  parsed.origin.sessionId = template.origin.sessionId;
  parsed.origin.sessionVersion = template.origin.sessionVersion;
  parsed.media[0].mid = template.media[0].mid;
  parsed.media[0].connection.ip = ips[0];
  return writeSDP(parsed);
}

let senderConnection;
let senderChannel;

export function createSender(id, cb) {
  senderConnection = new RTCPeerConnection();
  senderConnection.onicecandidate = e => {
    if (e.candidate) return;
    const compressedSDP = minifySDP(senderConnection.localDescription.sdp);
    displayQR(`${id}${compressedSDP}`);
  }

  senderChannel = senderConnection.createDataChannel('senderChannel');
  senderChannel.onopen = cb;

  senderConnection.createOffer().then(offer => {
    offer.sdp = mungeOffer(offer.sdp);
    senderConnection.setLocalDescription(offer);
  })
}

let receiverConnection;
let receiverChannel;

export function createReceiver(id, cb) {
  receiverConnection = new RTCPeerConnection();
  receiverConnection.onicecandidate = async e => {
    if (e.candidate) return;
    const compressedSDP = minifySDP(receiverConnection.localDescription.sdp);
    playSound(`${id}${compressedSDP}`);
  }

  receiverConnection.ondatachannel = e => {
    receiverChannel = e.channel;
    receiverChannel.onopen = cb;
  }
}

export function createAnswer(compressedOfferSDP) {
  const offerSDP = expandSDP(compressedOfferSDP);
  const offer = constructOffer(offerSDP);
  const offerDesc = new RTCSessionDescription(JSON.parse(offer));

  receiverConnection.setRemoteDescription(offerDesc,
    function () {
      receiverConnection.createAnswer(
        answer => {
          answer.sdp = mungeAnswer(answer.sdp);
          receiverConnection.setLocalDescription(answer);
        },
        () => { console.warn('Failed to create offer') },
        {},
      );
    },
    (e) => { console.warn('Failed to set remote description', e) },
  );
}

export function setAnswer(compressedAnswerSDP) {

  const answerSDP = expandSDP(compressedAnswerSDP);
  const answer = constructAnswer(answerSDP);
  const answerDesc = new RTCSessionDescription(JSON.parse(answer));
  senderConnection.setRemoteDescription(answerDesc);
}

export function sendRTCName(name) {
  switch (connectionMethod) {
    case 'SHOW CODE':
      senderChannel.send(`name:${name}`);
      break;
    case 'SCAN CODE':
      receiverChannel.send(`name:${name}`);
      break;
  }
}

export function sendRTCMessage(msg) {
  switch (connectionMethod) {
    case 'SHOW CODE':
      senderChannel.send(`m:${msg}`);
      break;
    case 'SCAN CODE':
      receiverChannel.send(`m:${msg}`);
      break;
  }
}

export function sendRTCFile(fileName, fileType, b64) {
  switch (connectionMethod) {
    case 'SHOW CODE':
      senderChannel.send(`f:${fileName}:${fileType}:${b64}`);
      break;
    case 'SCAN CODE':
      receiverChannel.send(`f:${fileName}:${fileType}:${b64}`);
      break;
  }
}

export function handleRTCMessage(cb) {
  switch (connectionMethod) {
    case 'SHOW CODE':
      senderChannel.onmessage = e => cb(e.data);
      break;
    case 'SCAN CODE':
      receiverChannel.onmessage = e => cb(e.data);
      break;
  }
}