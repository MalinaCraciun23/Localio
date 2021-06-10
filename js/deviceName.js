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

function setDeviceName(name) {
  deviceName = name;
  showDeviceName();
  localStorage.setItem('deviceName', deviceName);
}

function showDeviceName() {
  const deviceNameElem = document.getElementById('device-name');
  if (deviceNameElem) {
    deviceNameElem.textContent = `You are known as ${deviceName}.`;
  }
}

showDeviceName();

const changeNameButton = document.getElementById('change-name');
const editNameDialog = document.getElementById('editNameDialog');

changeNameButton.addEventListener('click', function () {
  const editNameDialog = document.getElementById('editNameDialog');
  editNameDialog.setAttribute('show', 1);
  const autoFocus = editNameDialog.querySelector('[autofocus]');
  if (autoFocus) {
    autoFocus.textContent = '';
    autoFocus.focus();
  }
});

editNameDialog.querySelectorAll('[close]').forEach(el =>
  el.addEventListener('click', e => {
    editNameDialog.removeAttribute('show');
    document.activeElement.blur();
    window.blur();
  })
);

const editNameForm = editNameDialog.querySelector('form');
editNameForm.addEventListener('submit', e => {
  e.preventDefault();
  const textInput = editNameDialog.querySelector('#textInput');
  setDeviceName(textInput.innerText);
});