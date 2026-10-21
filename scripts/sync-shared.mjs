import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcFile = path.join(rootDir, 'shared', 'cuemate-core.js');
const destFile = path.join(rootDir, 'miniapp', 'shared', 'cuemate-core.js');

const content = fs.readFileSync(srcFile, 'utf8');

// Convert ES module exports to CommonJS compatible with WeChat Mini Program require()
const exportedNames = [];
const cjsBody = content
  .replace(/^export const (\w+)/gm, (_, name) => {
    exportedNames.push(name);
    return `const ${name}`;
  })
  .replace(/^export function (\w+)/gm, (_, name) => {
    exportedNames.push(name);
    return `function ${name}`;
  });

const cjsFooter = `\nmodule.exports = {\n  ${exportedNames.join(',\n  ')},\n};\n`;

fs.mkdirSync(path.dirname(destFile), { recursive: true });
fs.writeFileSync(destFile, `// AUTO-GENERATED FROM /shared/cuemate-core.js — DO NOT EDIT DIRECTLY\n${cjsBody}${cjsFooter}`, 'utf8');
console.log('Synced shared/cuemate-core.js -> miniapp/shared/cuemate-core.js');
