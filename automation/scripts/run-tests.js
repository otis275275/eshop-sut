const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const result = spawnSync('npx.cmd', ['playwright', 'test', ...args], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
});

require('./stamp-report');
process.exit(result.status ?? 1);
