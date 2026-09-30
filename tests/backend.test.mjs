import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  origemPermitida, navegadorDe, codigoVisitanteValido, resumirEventos, camposDoPerfil,
  interpretarRespostaTelegram, textoAvisoSuporte, basicAuthOk, csv, PLANOS_PAGOS,
} from '../backend/src/util.js';

test('origem: lista do wrangler e localhost', () => {
  const lista = 'https://artesana-mktdigital.com.br,https://bebezinbtc-droid.github.io';
  assert.ok(origemPermitida('https://artesana-mktdigital.com.br', lista));
  assert.ok(origemPermitida('http://localhost:8080', lista));
  assert.ok(origemPermitida('http://127.0.0.1:59822', ''));
  assert.ok(!origemPermitida('https://outro.com', lista));
  assert.ok(!origemPermitida('', lista));
});

test('navegador pelo user agent', () => {
  assert.equal(navegadorDe('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36'), 'Chrome');
  assert.equal(navegadorDe('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'), 'Safari');
  assert.equal(navegadorDe('Mozilla/5.0 Chrome/128.0 Safari/537.36 Edg/128.0'), 'Edge');
  assert.equal(navegadorDe(''), '');
});

test('código do visitante: hex de 8 a 64', () => {
  assert.ok(codigoVisitanteValido('a1b2c3d4e5f60718'));
  assert.ok(!codigoVisitanteValido('xyz'));
  assert.ok(!codigoVisitanteValido(123));
  assert.ok(!codigoVisitanteValido("'; DROP TABLE"));
});

test('resumirEventos: linhas e campos derivados', () => {
  const { linhas, campos, paginas } = resumirEventos([
    { t: 1700000000000, tipo: 'pagina', rota: 'home' },
    { t: 1700000001000, tipo: 'pagina', rota: 'conversa/nome' },
    { tipo: 'passo', passo: 'nichos' },
    { tipo: 'email', email: ' maria@exemplo.com ' },
    { tipo: 'entrada', redes: 'instagram' },
    { tipo: 'perfil_enviado' },
    { tipo: '' }, null, 'lixo',
  ], 1700000005000);
  assert.equal(linhas.length, 6);
  assert.equal(linhas[2].t, 1700000005000);
  assert.equal(paginas, 2);
  assert.deepEqual(campos, { ultima_rota: 'conversa/nome', passo: 'nichos', email: 'maria@exemplo.com', redes: 'instagram', perfil_enviado: 1 });
  assert.equal(JSON.parse(linhas[0].dados).rota, 'home');
  assert.ok(!('tipo' in JSON.parse(linhas[0].dados)));
});

test('resumirEventos: limita tamanho e ignora e-mail inválido', () => {
  const { campos, linhas } = resumirEventos([{ tipo: 'email', email: 'sem-arroba' }, { tipo: 'x'.repeat(100) }]);
  assert.ok(!campos.email);
  assert.equal(linhas[1].tipo.length, 40);
});

test('camposDoPerfil pega só o que interessa do user', () => {
  const c = camposDoPerfil({ user: { nome: ' Maria ', marca: 'Flor de Sal', email: 'm@x.com', faixaEtaria: '25 a 34', cidade: 'Joinville', senha: 'nao' }, onboarding: {} });
  assert.deepEqual(c, { nome: 'Maria', marca: 'Flor de Sal', email: 'm@x.com', faixa: '25 a 34', cidade_informada: 'Joinville' });
  assert.deepEqual(camposDoPerfil({}), { nome: null, marca: null, email: null, faixa: null, cidade_informada: null });
});

test('resposta do Telegram por reply ou /r', () => {
  assert.deepEqual(interpretarRespostaTelegram({ text: 'Oi Maria, o rótulo sai em PDF', reply_to_message: { text: '💬 #c12 · Maria\n\ncomo baixo?' } }), { conversa: 12, texto: 'Oi Maria, o rótulo sai em PDF' });
  assert.deepEqual(interpretarRespostaTelegram({ text: '/r 7 pode sim' }), { conversa: 7, texto: 'pode sim' });
  assert.deepEqual(interpretarRespostaTelegram({ text: '/r #c7 pode sim' }), { conversa: 7, texto: 'pode sim' });
  assert.equal(interpretarRespostaTelegram({ text: 'solta' }), null);
  assert.equal(interpretarRespostaTelegram({ text: '/abertas', reply_to_message: { text: '#c3' } }), null);
  assert.equal(interpretarRespostaTelegram({}), null);
});

test('aviso de suporte traz o #c e o histórico', () => {
  const t = textoAvisoSuporte({ conversa: 5, nome: 'Ana', marca: 'Velas da Ana', pergunta: 'Como faço o QR?', historico: ['eu: oi', 'app: olá'] });
  assert.match(t, /#c5/);
  assert.match(t, /Ana, marca Velas da Ana/);
  assert.match(t, /Como faço o QR\?/);
  assert.match(t, /eu: oi/);
  assert.match(textoAvisoSuporte({ conversa: 1 }), /pediu pra falar/);
});

test('basic auth', () => {
  const h = 'Basic ' + Buffer.from('artesana:segredo123').toString('base64');
  assert.ok(basicAuthOk(h, 'artesana', 'segredo123'));
  assert.ok(!basicAuthOk(h, 'artesana', 'outra'));
  assert.ok(!basicAuthOk('Bearer x', 'artesana', 'segredo123'));
  assert.ok(!basicAuthOk(h, '', ''));
  assert.ok(!basicAuthOk(null, 'a', 'b'));
});

test('csv escapa ; aspas e quebras', () => {
  const s = csv([{ a: 'x;y', b: 'diz "oi"', c: null }], ['a', 'b', 'c']);
  assert.equal(s, 'a;b;c\r\n"x;y";"diz ""oi""";');
});

test('planos pagos batem com o app', async () => {
  const { PLANOS } = await import('../app/js/lib/planos.js');
  for (const p of PLANOS.filter((x) => x.preco)) {
    assert.ok(PLANOS_PAGOS[p.id], `falta ${p.id} no backend`);
    assert.equal(PLANOS_PAGOS[p.id].valor, p.preco);
  }
});
