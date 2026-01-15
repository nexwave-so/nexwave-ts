#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'src', 'index.ts');

const proc = spawn('bun', ['run', serverPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});
