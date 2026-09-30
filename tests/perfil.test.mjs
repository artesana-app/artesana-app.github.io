import test from 'node:test';
import assert from 'node:assert/strict';
import { camposFaltando, resumoPerfil, CAMPOS_OBRIGATORIOS, nichosDe, nichosLegiveis, nichoPrincipal } from '../app/js/lib/perfil.js';

const COMPLETO = {
  user: { nome: 'Maria', marca: 'Flor de Sal', email: 'maria@exemplo.com', faixaEtaria: '35 a 44' },
  onboarding: { nichos: ['sabonetes', 'velas'], nichoOutro: 'bordado', historia: 'Comecei em casa.', personalidade: 'delicada', publicoAlvo: 'mulheres 30+', tipoProduto: 'Sabonete de lavanda' },
  instagram: { arroba: '@flordesal', perfisReferencia: ['@a', '@b'] },
  whatsapp: { ddd: '11', numero: '900000000', linkCurto: 'https://wa.me/5511900000000' },
};

test('perfil vazio lista todos os obrigatórios, na ordem da conversa, e o @ não é obrigatório', () => {
  const f = camposFaltando({});
  assert.deepEqual(f.map((c) => c.id), CAMPOS_OBRIGATORIOS.map((c) => c.id));
  assert.deepEqual(f.map((c) => c.id), ['nome', 'marca', 'nicho', 'historia', 'personalidade', 'publicoAlvo']);
});

test('perfil completo não falta nada', () => {
  assert.deepEqual(camposFaltando(COMPLETO), []);
});

test('campo só com espaço conta como vazio', () => {
  const f = camposFaltando({ ...COMPLETO, user: { nome: '   ', marca: 'Flor de Sal' } });
  assert.deepEqual(f.map((c) => c.id), ['nome']);
  assert.equal(f[0].rotulo, 'Seu nome');
});

test('nichos: vários, o formato antigo e o campo "outro"', () => {
  assert.deepEqual(nichosDe({ nichos: ['velas', 'sabonetes'] }), ['velas', 'sabonetes']);
  assert.deepEqual(nichosDe({ nicho: 'cosmeticos' }), ['cosmeticos']);
  assert.deepEqual(nichosDe({ nichos: ['xxx'] }), []);
  assert.equal(nichoPrincipal(COMPLETO.onboarding), 'sabonetes');
  assert.deepEqual(nichosLegiveis(COMPLETO.onboarding), ['Sabonetes e saboaria', 'Velas e aromas', 'bordado']);
  assert.deepEqual(camposFaltando({ user: { nome: 'a', marca: 'b' }, onboarding: { nichoOutro: 'macramê', historia: 'x', personalidade: 'alegre', publicoAlvo: 'y' } }), []);
});

test('resumo é bonito de ler: um emoji por item, marca, nichos, contato e link curto', () => {
  const r = resumoPerfil(COMPLETO);
  assert.match(r, /^✨ Perfil da marca Flor de Sal/);
  assert.match(r, /👩 Responsável: Maria/);
  assert.match(r, /🧼 O que faz: Sabonetes e saboaria, Velas e aromas, bordado/);
  assert.match(r, /🌸 Personalidade: Delicada/);
  assert.match(r, /📸 Instagram: @flordesal/);
  assert.match(r, /💬 WhatsApp: \(11\) 90000-0000/);
  assert.match(r, /🔗 Link: wa\.me\/5511900000000/);
  assert.match(r, /🎂 Faixa etária: 35 a 44/);
  assert.ok(!r.includes('undefined'));
});

test('resumo de perfil parcial omite o que não tem e avisa quem pediu ajuda com o Instagram', () => {
  const r = resumoPerfil({ user: { nome: 'Ana' }, instagram: { semConta: true } });
  assert.match(r, /Ana/);
  assert.match(r, /ainda não tem, pediu ajuda/);
  assert.ok(!r.includes('undefined'));
  assert.ok(!r.includes('WhatsApp'));
});
