const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { planet } = require('./planets.cjs');
const { asciiName } = require('./ascii-name.cjs');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');

// Replace literally: Markdown and source code may include dollar signs.
function insert(source, marker, value) {
  if (!source.includes(marker)) throw new Error(`Missing build marker: ${marker}`);
  return source.replace(marker, () => value);
}

function renderSite() {
  const assets = {};
  for (const kind of ['terrestrial', 'moon', 'rust', 'ringed', 'blue']) {
    const html = planet(kind, { columns: 52, rows: 32 });
    const lines = html.replace(/^<pre[^>]*>/, '').replace(/<\/pre>$/, '').split('\n');
    assets[kind] = [];
    lines.forEach((line, y) => {
      let x = 0;
      for (const match of line.matchAll(/<span style="color:([^"]+)">([^<])<\/span>|( )/g)) {
        if (match[1]) assets[kind].push({ x, y, color: match[1], char: match[2] });
        x++;
      }
    });
  }
  const renderer = insert(read('journey-renderer.js'), '/* ORIGINAL_ROCKET */', read('rocket.js'));
  const replacements = [
    ['/* JOURNEY_CSS */', ['journey.css', 'journey-flight.css', 'journey-discoveries.css', 'journey-content.css'].map(read).join('\n')],
    ['{{ASCII_NAME}}', asciiName],
    ['/* JOURNEY_MODEL */', read('journey-model.js')],
    ['/* JOURNEY_ASSETS */', 'let reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const PLANET_ASSETS=' + JSON.stringify(assets) + ';'],
    ['/* JOURNEY_RENDERER */', renderer],
    ['/* JOURNEY_DISCOVERIES */', read('journey-discoveries.js')],
    ['/* JOURNEY_NAVIGATION */', read('journey-navigation.js')],
    ['/* JOURNEY_APP */', read('journey.js')]
  ];
  let html = read('journey.html');
  for (const [marker, value] of replacements) html = insert(html, marker, value);
  if (/\/\* (?:JOURNEY_[A-Z_]+|ORIGINAL_ROCKET) \*\/|\{\{(?:ASCII_NAME|ENGINEERING_NOTES)\}\}/.test(html)) {
    throw new Error('The site contains an unresolved build marker.');
  }
  // Parse scripts together to catch both syntax errors and conflicting globals.
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  new vm.Script(scripts.join('\n'), { filename: 'portfolio.js' });
  return html;
}

function build() {
  const html = renderSite();
  const output = path.join(root, 'dist');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'index.html'), html);
  for (const file of ['favicon.svg', 'robots.txt']) {
    fs.copyFileSync(path.join(root, 'public', file), path.join(output, file));
  }
  console.log(`Built dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB).`);
}

if (require.main === module) build();
module.exports = { renderSite, build };
