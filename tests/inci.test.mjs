import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarInci, sugerirAlergenos, buscar } from '../app/js/lib/inci.js';
import { INGREDIENTES } from '../app/js/data/ingredientes.js';

test('gera na ordem dada, sem duplicar nem vazios', () => {
  assert.equal(
    gerarInci([{ inci: 'Sodium Olivate' }, { inci: 'Aqua' }, { inci: 'Aqua' }, { inci: ' ' }, { inci: ' Glycerin ' }]),
    'Sodium Olivate, Aqua, Glycerin',
  );
});

test('lista vazia gera string vazia', () => {
  assert.equal(gerarInci([]), '');
});

test('tabela tem >= 90 itens com pt unicos e inci preenchido', () => {
  assert.ok(INGREDIENTES.length >= 90, `só ${INGREDIENTES.length} itens`);
  assert.equal(new Set(INGREDIENTES.map((i) => i.pt.toLowerCase())).size, INGREDIENTES.length);
  assert.ok(INGREDIENTES.every((i) => i.inci && i.inci.trim() && i.funcao));
});

test('alergenos da lavanda incluem linalool e nao repetem', () => {
  const lav = INGREDIENTES.find((i) => /lavanda/i.test(i.pt));
  const lim = INGREDIENTES.find((i) => /limão siciliano/i.test(i.pt));
  const a = sugerirAlergenos([lav, lim]);
  assert.ok(a.includes('Linalool'));
  assert.ok(a.includes('Limonene'));
  assert.equal(new Set(a).size, a.length);
});

test('item sem alergenos nao gera nada', () => {
  assert.deepEqual(sugerirAlergenos([{ inci: 'Aqua' }]), []);
});

test('buscar ignora acento e caixa e limita', () => {
  const r = buscar('OLEO DE COCO', INGREDIENTES);
  assert.ok(r.length >= 1);
  assert.match(r[0].pt, /coco/i);
  assert.ok(buscar('', INGREDIENTES).length === 0);
  assert.ok(buscar('a', INGREDIENTES, 5).length <= 5);
});
