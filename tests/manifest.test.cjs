const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
test('extension is restricted to ChatGPT with no additional API permissions', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://chatgpt.com/*', 'https://chat.openai.com/*']);
  for (const field of ['permissions', 'optional_permissions', 'host_permissions', 'background', 'externally_connectable']) assert.equal(manifest[field], undefined);
});
test('all manifest assets exist and matching helpers load before content script', () => {
  const content = manifest.content_scripts[0];
  assert.deepEqual(content.js, ['core.js', 'content.js']);
  for (const asset of [...content.js, ...content.css]) assert.ok(fs.statSync(path.join(root, asset)).isFile());
});
