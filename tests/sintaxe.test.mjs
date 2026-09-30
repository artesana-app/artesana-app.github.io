// Todo arquivo do app precisa ser um módulo ES válido no navegador. `node --check` num .js sem "type" pode
// aceitar o que o Chromium recusa, então cada arquivo é copiado pra .mjs antes de conferir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, copyFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

function listar(dir) {
  return readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : p.endsWith('.js') ? [p] : []; });
}

const arquivos = listar('app/js').filter((p) => !p.includes('vendor'));
const tmp = mkdtempSync(join(tmpdir(), 'artesana-sintaxe-'));

test('há módulos pra conferir', () => { assert.ok(arquivos.length > 20); });

for (const arq of arquivos) {
  test(`sintaxe ES de ${arq.replace(/\\/g, '/')}`, () => {
    const copia = join(tmp, arq.replace(/[\\/]/g, '__') + '.mjs');
    copyFileSync(arq, copia);
    const r = spawnSync(process.execPath, ['--check', copia], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr.split('\n').slice(0, 6).join('\n'));
  });
}
