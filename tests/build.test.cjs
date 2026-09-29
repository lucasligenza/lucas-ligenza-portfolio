const test = require('node:test');
const assert = require('node:assert/strict');
const { renderSite } = require('../scripts/build.cjs');

test('production build is deterministic, self-contained, and contains the complete journey', () => {
  const html = renderSite();
  assert.equal(html, renderSite());
  for (const id of ['departure', 'about', 'projects', 'beyond-work', 'contact']) {
    assert.match(html, new RegExp(`<section id="${id}"`));
  }
  assert.match(html, /function drawOriginalRocket\(t\)/);
  assert.match(html, /ASCII Galaxy Portfolio/);
  assert.match(html, /Pause ambience/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel="stylesheet"/);
  assert.doesNotMatch(html, /\/\* JOURNEY_|\/\* ORIGINAL_ROCKET|\{\{ASCII_NAME|\{\{ENGINEERING_NOTES/);
});

test('production output does not contain local preview tooling or unpublished source', () => {
  const html = renderSite();
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1|\.superpowers|BRAINSTORM|WebSocket|C:\\Users\\/);
  assert.doesNotMatch(html, /ASCII OS|Ligenza_Lucas_Resume|status: draft|YYYY-MM-DD/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/lucasligenza\//);
});
