const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openMenu } = require('../extension/core.js');

// Node has EventTarget but no DOM PointerEvent/MouseEvent constructors.
class InputEvent extends Event {
  constructor(type, options) {
    super(type, options);
    for (const key of ['button', 'buttons', 'pointerId', 'pointerType', 'isPrimary']) this[key] = options[key];
  }
}
function trigger() {
  const target = new EventTarget();
  target.ownerDocument = { defaultView: { PointerEvent: InputEvent, MouseEvent: InputEvent } };
  target.click = () => target.dispatchEvent(new Event('click', { bubbles: true }));
  return target;
}
test('opens menus that listen on primary pointerdown, which click alone misses', () => {
  const target = trigger();
  let open = false;
  target.addEventListener('pointerdown', (event) => {
    if (event.button === 0 && event.pointerType === 'mouse' && event.isPrimary) open = !open;
  });
  target.click();
  assert.equal(open, false);
  openMenu(target);
  assert.equal(open, true);
});
test('also opens click-based menus once and emits the ordered input sequence', () => {
  const target = trigger();
  const seen = [];
  let clicks = 0;
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
    target.addEventListener(type, (event) => seen.push([event.type, event.buttons]));
  }
  target.addEventListener('click', () => clicks++);
  openMenu(target);
  assert.equal(clicks, 1);
  assert.deepEqual(seen, [
    ['pointerdown', 1], ['mousedown', 1], ['pointerup', 0], ['mouseup', 0], ['click', undefined]
  ]);
});
