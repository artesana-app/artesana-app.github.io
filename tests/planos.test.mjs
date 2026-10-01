import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANOS, planoPorId, precoFormatado, precoTotal, precoAVista, descontoAVista, economiaAnual, limiteRotulos, exportacoesNoMes, podeExportar, liberado } from '../app/js/lib/planos.js';

test('preços: parcela primeiro, total depois, à vista com desconto', () => {
  const p = planoPorId('prosperar');
  assert.equal(precoFormatado(p), '12x de R$ 26,00');
  assert.equal(precoTotal(p), 'R$ 312,00 por ano');
  assert.equal(precoAVista(p), 'R$ 279,00');
  assert.equal(descontoAVista(p), 11);
  const f = planoPorId('florescer');
  assert.equal(precoFormatado(f), 'R$ 52,90 por mês');
  assert.equal(precoTotal(f), '');
  assert.equal(precoAVista(f), '');
  assert.equal(precoFormatado(planoPorId('semente')), 'Grátis');
});

test('anual sai mais barato que doze meses do mensal', () => {
  assert.ok(economiaAnual() > 300);
  assert.equal(economiaAnual(), Math.round((52.9 * 12 - 312) * 100) / 100);
});

test('limite de rótulos por plano', () => {
  assert.equal(limiteRotulos('semente'), 3);
  assert.equal(limiteRotulos('florescer'), 15);
  assert.equal(limiteRotulos('prosperar'), Infinity);
  assert.equal(limiteRotulos('inexistente'), 3);
});

test('exportações contam só no mês atual', () => {
  const agora = new Date(2026, 10, 15);
  const lista = [new Date(2026, 10, 1).getTime(), new Date(2026, 10, 14).getTime(), new Date(2026, 9, 30).getTime(), new Date(2026, 11, 1).getTime()];
  assert.equal(exportacoesNoMes(lista, agora), 2);
  assert.equal(exportacoesNoMes([], agora), 0);
  assert.equal(exportacoesNoMes('lixo', agora), 0);
});

test('podeExportar: beta libera; depois vale o limite', () => {
  const agora = new Date(2026, 10, 15);
  const tres = [1, 2, 3].map((d) => new Date(2026, 10, d).getTime());
  assert.ok(podeExportar({ beta: true, plano: 'semente', exportadas: tres, agora }).pode);
  const s = podeExportar({ beta: false, plano: 'semente', exportadas: tres, agora });
  assert.ok(!s.pode); assert.equal(s.restantes, 0); assert.equal(s.usadas, 3);
  assert.ok(podeExportar({ beta: false, plano: 'semente', exportadas: tres.slice(0, 2), agora }).pode);
  assert.ok(podeExportar({ beta: false, plano: 'florescer', exportadas: tres, agora }).pode);
  assert.ok(podeExportar({ beta: false, plano: 'prosperar', exportadas: new Array(500).fill(agora.getTime()), agora }).pode);
});

test('liberado: rótulo ilimitado só no Prosperar', () => {
  assert.ok(!liberado('rotulo_ilimitado', { beta: false, plano: 'florescer' }));
  assert.ok(liberado('rotulo_ilimitado', { beta: false, plano: 'prosperar' }));
  assert.ok(liberado('anvisa', { beta: false, plano: 'florescer' }));
  assert.ok(!liberado('anvisa', { beta: false, plano: 'semente' }));
  assert.ok(liberado('anvisa', { beta: true, plano: 'semente' }));
});

test('todo plano tem itens e limite de rótulos definidos', () => {
  for (const p of PLANOS) { assert.ok(p.itens.length >= 3); assert.ok(p.rotulosPorMes > 0); }
});
