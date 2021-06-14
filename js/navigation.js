const homeButton = document.querySelector('#home')
homeButton.onclick = _ => location.reload();

let currentElem = document.getElementById('connect-form');

export function showElem(elem) {
  currentElem.classList.add('hidden');
  currentElem.addEventListener('transitionend', () => {
    currentElem.hidden = true;
    elem.hidden = false;
    elem.offsetHeight;
    elem.classList.remove('hidden');
    const event = new Event('visible');
    elem.dispatchEvent(event);
    currentElem = elem;
  });
}
