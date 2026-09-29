const fs = require('node:fs');
const path = require('node:path');

// A single process also works in restricted development environments on Windows.
const directory = path.resolve(__dirname, '../tests');
for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.test.cjs')).sort()) {
  require(path.join(directory, file));
}
