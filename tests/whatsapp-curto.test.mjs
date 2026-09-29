import test from 'node:test';
import assert from 'node:assert/strict';
import { slugMarca, montarLinkCurto, lerLinkCurto, destinoLinkCurto, SUGESTOES_MENSAGEM } from '../app/js/lib/whatsapp.js';

const BASE = 'https://artesana-mktdigital.com.br/w/';

test('slug tira acento, espaço e símbolo', () => {
  assert.equal(slugMarca('Flor de Sal'), 'flor-de-sal');
  assert.equal(slugMarca('  Ateliê da Maria & Cia.  '), 'atelie-da-maria-cia');
  assert.equal(slugMarca(''), '');
  assert.equal(slugMarca(undefined), '');
});

test('slug tem no máximo 24 caracteres e não termina em hífen', () => {
  const s = slugMarca('Saboaria Artesanal Encantos da Serra Gaúcha');
  assert.ok(s.length <= 24, s);
  assert.ok(!s.endsWith('-'), s);
});

test('link curto leva marca e número, sem porcentagem', () => {
  const link = montarLinkCurto({ base: BASE, marca: 'Flor de Sal', ddd: '11', numero: '90000-0000' });
  assert.equal(link, 'https://artesana-mktdigital.com.br/w/?flor-de-sal-11900000000');
  assert.ok(!link.includes('%'));
});

test('link curto sem marca leva só o número', () => {
  assert.equal(montarLinkCurto({ base: BASE, marca: '', ddd: '21', numero: '33334444' }), 'https://artesana-mktdigital.com.br/w/?2133334444');
});

test('link curto guarda a mensagem pronta pelo índice', () => {
  const link = montarLinkCurto({ base: BASE, marca: 'Flor de Sal', ddd: '11', numero: '900000000', mensagem: SUGESTOES_MENSAGEM[1] });
  assert.equal(link, 'https://artesana-mktdigital.com.br/w/?flor-de-sal-11900000000-m2');
});

test('mensagem própria vai codificada no fim', () => {
  const link = montarLinkCurto({ base: BASE, marca: 'Flor de Sal', ddd: '11', numero: '900000000', mensagem: 'Quero o kit de Natal' });
  assert.equal(link, 'https://artesana-mktdigital.com.br/w/?flor-de-sal-11900000000&t=Quero%20o%20kit%20de%20Natal');
});

test('ler devolve marca legível, ddd, número e mensagem', () => {
  assert.deepEqual(lerLinkCurto('?flor-de-sal-11900000000-m2'), {
    slug: 'flor-de-sal', marca: 'Flor de Sal', ddd: '11', numero: '900000000', sugestao: 2, texto: '',
  });
  assert.deepEqual(lerLinkCurto('?2133334444'), { slug: '', marca: '', ddd: '21', numero: '33334444', sugestao: 0, texto: '' });
  assert.equal(lerLinkCurto('?flor-de-sal-11900000000&t=Quero%20o%20kit').texto, 'Quero o kit');
});

test('ler recusa link quebrado', () => {
  assert.equal(lerLinkCurto(''), null);
  assert.equal(lerLinkCurto('?flor-de-sal'), null);
  assert.equal(lerLinkCurto('?flor-de-sal-123'), null);
  assert.equal(lerLinkCurto('?<script>-11900000000'), null);
});

test('destino identifica a marca na mensagem', () => {
  const url = destinoLinkCurto(lerLinkCurto('?flor-de-sal-11900000000-m1'));
  assert.ok(url.startsWith('https://wa.me/5511900000000?text='));
  const msg = decodeURIComponent(url.split('?text=')[1]);
  assert.match(msg, /Flor de Sal/);
  assert.ok(msg.includes(SUGESTOES_MENSAGEM[0]));
});

test('destino sem marca e sem mensagem é o link direto', () => {
  assert.equal(destinoLinkCurto(lerLinkCurto('?2133334444')), 'https://wa.me/552133334444');
});

test('ida e volta preserva os dados', () => {
  const dados = lerLinkCurto(new URL(montarLinkCurto({ base: BASE, marca: 'Ateliê Luz', ddd: '51', numero: '987654321' })).search);
  assert.equal(dados.ddd, '51');
  assert.equal(dados.numero, '987654321');
  assert.equal(dados.slug, 'atelie-luz');
});
