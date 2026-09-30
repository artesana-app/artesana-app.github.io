import test from 'node:test';
import assert from 'node:assert/strict';
import { frasesDeImpacto, legendas, biosInstagram, calendarioMes, analisePublico, roteiroReel, remixLogo } from '../app/js/lib/geradores.js';

const ONB = { nichos: ['sabonetes'], tipoProduto: 'sabonete de cacau', personalidade: 'rustica', publicoAlvo: 'mulheres 30+', historia: 'Tudo começou na cozinha de casa, como um hobby.' };

test('seis frases de impacto, sem repetir, com a marca e a âncora da história', () => {
  const f = frasesDeImpacto({ marca: 'Flor de Sal', onboarding: ONB });
  assert.equal(f.length, 6);
  assert.equal(new Set(f).size, 6);
  assert.ok(f.some((x) => x.includes('Flor de Sal')));
  assert.ok(f.some((x) => x.includes('da cozinha de casa')));
  assert.ok(f.every((x) => x.length < 90));
});

test('frases funcionam com perfil vazio', () => {
  const f = frasesDeImpacto({});
  assert.equal(f.length, 6);
  assert.ok(!f.join(' ').includes('undefined'));
});

test('três legendas por tipo, com hashtags do nicho', () => {
  for (const tipo of ['post', 'story', 'reel', 'carrossel']) {
    const l = legendas({ tipo, marca: 'Flor de Sal', onboarding: ONB });
    assert.equal(l.length, 3, tipo);
    assert.ok(l.every((x) => x.includes('#saboariaartesanal')), tipo);
    assert.ok(l.some((x) => x.includes('sabonete de cacau')), tipo);
  }
});

test('bios cabem em 150 caracteres', () => {
  const b = biosInstagram({ marca: 'Flor de Sal', onboarding: ONB, cidade: 'Blumenau', link: 'https://wa.me/5547999999999' });
  assert.equal(b.length, 2);
  for (const x of b) assert.ok(x.length <= 150, x);
  assert.ok(b[0].includes('Blumenau'));
  assert.ok(b[1].includes('wa.me/5547999999999'));
});

test('calendário de dezembro tem o Natal e o ritmo da semana', () => {
  const c = calendarioMes({ ano: 2026, mes: 12, onboarding: ONB });
  assert.ok(c.dias.some((d) => d.dia === 25 && d.data && /Natal/.test(d.tema)));
  assert.ok(c.dias.length >= 12 && c.dias.length <= 20);
  assert.ok(c.dias.every((d) => ['post', 'story', 'reel', 'carrossel'].includes(d.tipo)));
  const abril = calendarioMes({ ano: 2026, mes: 4, onboarding: ONB });
  assert.ok(abril.avisos.some((a) => /Páscoa/.test(a)));
});

test('análise de público lê idade e personalidade', () => {
  const a = analisePublico({ onboarding: ONB });
  assert.match(a.tom, /direto/);
  assert.equal(a.horarios.length, 2);
  assert.equal(a.dores.length, 3);
  const jovem = analisePublico({ onboarding: { ...ONB, publicoAlvo: 'meninas de 18 a 24 anos' } });
  assert.ok(jovem.horarios.some((h) => h.includes('20h')));
});

test('roteiro de reel tem gancho, três cenas e chamada', () => {
  const r = roteiroReel({ marca: 'Flor de Sal', onboarding: ONB });
  assert.match(r.gancho, /sabonete de cacau/);
  assert.equal(r.cenas.length, 3);
  assert.match(r.cta, /WhatsApp/);
});

test('remix do logo entende o pedido em português', () => {
  assert.deepEqual(remixLogo('quero a tipografia da 1 com as cores da 3'), { tipografia: 1, cores: 3 });
  assert.deepEqual(remixLogo('a fonte da segunda e o símbolo da primeira'), { tipografia: 2, simbolo: 1 });
  assert.deepEqual(remixLogo('cor da 2'), { cores: 2 });
  assert.deepEqual(remixLogo('sei lá'), {});
});
