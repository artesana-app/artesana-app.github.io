import test from 'node:test';
import assert from 'node:assert/strict';
import { camposFaltando, resumoPerfil, CAMPOS_OBRIGATORIOS } from '../app/js/lib/perfil.js';

const COMPLETO = {
  user: { nome: 'Maria', marca: 'Flor de Sal', email: 'maria@exemplo.com' },
  onboarding: { nicho: 'sabonetes', historia: 'Comecei em casa.', personalidade: 'delicada', publicoAlvo: 'mulheres 30+', tipoProduto: 'Sabonete de lavanda' },
  instagram: { arroba: '@flordesal', perfisReferencia: ['@a', '@b'] },
  whatsapp: { ddd: '11', numero: '900000000', linkCurto: 'https://artesana-mktdigital.com.br/w/?flor-de-sal-11900000000' },
};

test('perfil vazio lista todos os obrigatórios, na ordem da tela', () => {
  const f = camposFaltando({});
  assert.deepEqual(f.map((c) => c.id), CAMPOS_OBRIGATORIOS.map((c) => c.id));
  assert.deepEqual(f.map((c) => c.id), ['nome', 'marca', 'nicho', 'historia', 'personalidade', 'publicoAlvo', 'arroba']);
});

test('perfil completo não falta nada', () => {
  assert.deepEqual(camposFaltando(COMPLETO), []);
});

test('campo só com espaço conta como vazio', () => {
  const f = camposFaltando({ ...COMPLETO, user: { nome: '   ', marca: 'Flor de Sal' } });
  assert.deepEqual(f.map((c) => c.id), ['nome']);
  assert.equal(f[0].rotulo, 'Seu nome');
});

test('resumo traz marca, contato e rótulos legíveis', () => {
  const r = resumoPerfil(COMPLETO);
  assert.match(r, /Flor de Sal/);
  assert.match(r, /Maria/);
  assert.match(r, /Sabonetes e saboaria/);
  assert.match(r, /Delicada/);
  assert.match(r, /@flordesal/);
  assert.match(r, /\(11\) 90000-0000/);
  assert.match(r, /artesana-mktdigital\.com\.br\/w\/\?flor-de-sal-11900000000/);
  assert.ok(!r.includes('undefined'));
});

test('resumo de perfil parcial não quebra e omite o que não tem', () => {
  const r = resumoPerfil({ user: { nome: 'Ana' } });
  assert.match(r, /Ana/);
  assert.ok(!r.includes('undefined'));
  assert.ok(!r.includes('WhatsApp'));
});
