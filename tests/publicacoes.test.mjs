import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const PASTA = new URL('../marketing/instagram/', import.meta.url);
const pubs = JSON.parse(readFileSync(new URL('publicacoes.json', PASTA), 'utf8'));
const serie = pubs.filter((p) => !p.arquivada);

test('a série tem seis publicações, numeradas na ordem de postar', () => {
  assert.deepEqual(serie.map((p) => p.id), [1, 2, 3, 4, 5, 6]);
});

test('toda publicação tem imagem no disco, texto alternativo e legenda', () => {
  for (const p of pubs) {
    assert.ok(p.imagens.length > 0, `${p.id}: sem imagem`);
    for (const im of p.imagens) {
      assert.ok(existsSync(new URL(im.arquivo, PASTA)), `${p.id}: falta ${im.arquivo}`);
      assert.ok(im.alt.trim().length > 40, `${p.id}: texto alternativo curto em ${im.arquivo}`);
    }
    assert.ok((p.legenda || '').trim() || (p.textos || []).length, `${p.id}: sem legenda nem textos`);
  }
});

test('legenda da série cabe no Instagram e leva ao link da bio', () => {
  for (const p of serie) {
    assert.ok(p.legenda.length <= 2200, `${p.id}: legenda com ${p.legenda.length} caracteres`);
    assert.match(p.legenda, /link está na bio|link da bio/i, `${p.id}: não cita o link da bio`);
    const tags = p.legenda.match(/#[\p{L}\d_]+/gu) || [];
    assert.ok(tags.length >= 5 && tags.length <= 10, `${p.id}: ${tags.length} hashtags`);
  }
});

test('nenhum texto promete conformidade com a Anvisa nem cita nome de pessoa real', () => {
  const tudo = JSON.stringify(pubs);
  assert.doesNotMatch(tudo, /Bibiana/i);
  assert.doesNotMatch(tudo, /aprovad[oa] pela Anvisa|dentro da lei|100% regular|em conformidade/i);
});
