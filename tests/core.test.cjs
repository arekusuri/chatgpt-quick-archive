const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isArchiveLabel, isMenuLabel, conversationKey } = require('../extension/core.js');
test('only exact archive actions are accepted', () => {
  for (const value of ['Archive', 'Archive chat', ' Archive  conversation ']) assert.equal(isArchiveLabel(value), true);
  for (const value of ['Delete', 'Delete conversation', 'Unarchive', 'Archive all chats', 'Do not archive', '', 'Move to archive and delete']) assert.equal(isArchiveLabel(value), false);
});
test('only known conversation menu labels are accepted', () => {
  assert.equal(isMenuLabel('Open conversation options'), true);
  for (const value of ['Delete', 'Settings', 'Share', 'Archive']) assert.equal(isMenuLabel(value), false);
});
test('conversation links must be on this origin and have a full conversation path', () => {
  const origin = 'https://chatgpt.com';
  assert.equal(conversationKey('/c/abc-123', origin), 'abc-123');
  assert.equal(conversationKey('/g/g-project/c/abc-123?x=1', origin), 'abc-123');
  for (const path of ['/c/', '/c/abc/more', '/settings', '/share/abc', 'https://evil.example/c/abc', 'javascript:alert(1)']) assert.equal(conversationKey(path, origin), null);
});
