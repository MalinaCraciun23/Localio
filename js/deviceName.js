export let deviceName = localStorage.getItem('deviceName');
if (!deviceName) {
  const parser = new UAParser();
  const ua = parser.getResult();

  if (ua.os && ua.os.name) {
    deviceName = ua.os.name.replace('Mac OS', 'Mac') + ' ';
  }

  if (ua.device.model) {
    deviceName += ua.device.model;
  } else {
    deviceName += ua.browser.name;
  }

  if (!deviceName)
    deviceName = 'Unknown Device';
}

export function setDeviceName(name) {
  deviceName = name;
  showDeviceName();
  localStorage.setItem('deviceName', deviceName);
}

export function showDeviceName() {
  const deviceNameElem = document.getElementById('device-name');
  if (deviceNameElem) {
    deviceNameElem.textContent = `You are known as ${deviceName}.`;
  }
}