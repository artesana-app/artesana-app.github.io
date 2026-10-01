import test from 'node:test';
import assert from 'node:assert/strict';
import { NORMA, CAMPOS, conferir, composicaoEmPortugues, linhasDoRotulo } from '../app/js/lib/rotulo-anvisa.js';

const COMPLETO = {
  produto: 'Sabonete de lavanda', marca: 'Flor de Sal', grupo: 'Sabonete em barra', conteudo: '90 g',
  lote: 'L0126', validade: '12/2027', inci: 'Sodium Olivate, Aqua, Glycerin', composicaoPt: 'Oliva saponificada, água, glicerina',
  titular: 'Flor de Sal Cosméticos Ltda', cnpj: '11.222.333/0001-81', afe: '2.12345.6', processo: '25351.123456/2026-11',
  atendimento: '(11) 90000-0000', origem: 'Brasil', modoUso: 'Aplicar sobre a pele úmida e enxaguar.', advertencias: 'Uso externo.',
};

test('norma citada é a RDC 907/2024, artigo 13, com a composição em português da RDC 898/2024', () => {
  assert.match(NORMA.nome, /907\/2024/);
  assert.match(NORMA.artigo, /13/);
  assert.match(NORMA.composicaoPt, /898\/2024/);
});

test('campos obrigatórios são os do artigo 13', () => {
  const obrig = CAMPOS.filter((c) => c.obrigatorio).map((c) => c.id);
  assert.deepEqual(obrig, ['produto', 'marca', 'conteudo', 'lote', 'validade', 'inci', 'composicaoPt', 'titular', 'cnpj', 'afe', 'processo', 'atendimento', 'origem']);
  const opcionais = CAMPOS.filter((c) => !c.obrigatorio).map((c) => c.id);
  assert.deepEqual(opcionais, ['grupo', 'fabricacao', 'modoUso', 'advertencias']);
});

test('rótulo vazio falta tudo que é obrigatório', () => {
  const r = conferir({});
  assert.equal(r.completo, false);
  assert.equal(r.faltando.length, 13);
  assert.equal(r.obrigatorios, 13);
  assert.equal(r.preenchidos, 0);
});

test('rótulo completo não falta nada, e opcional vazio não conta como falta', () => {
  assert.equal(conferir(COMPLETO).completo, true);
  const semOpcionais = { ...COMPLETO, grupo: '', modoUso: '', advertencias: '' };
  assert.equal(conferir(semOpcionais).completo, true);
  assert.deepEqual(conferir(semOpcionais).faltando, []);
});

test('campo só com espaço conta como vazio', () => {
  const r = conferir({ ...COMPLETO, lote: '   ', cnpj: '' });
  assert.deepEqual(r.faltando.map((c) => c.id), ['lote', 'cnpj']);
  assert.equal(r.preenchidos, 11);
});

test('composição em português vem dos nomes dos ingredientes, sem repetir', () => {
  const itens = [{ pt: 'Óleo de oliva', inci: 'Olea Europaea Fruit Oil' }, { pt: 'Água', inci: 'Aqua' }, { pt: 'Água destilada', inci: 'Aqua' }, { pt: 'Óleo de oliva', inci: 'x' }];
  assert.equal(composicaoEmPortugues(itens), 'óleo de oliva, água, água destilada');
  assert.equal(composicaoEmPortugues([]), '');
});

test('linhas saem na ordem de leitura e pulam o que está vazio', () => {
  const linhas = linhasDoRotulo({ ...COMPLETO, grupo: '', advertencias: '' });
  const rotulos = linhas.map((l) => l.rotulo);
  assert.deepEqual(rotulos, ['', '', 'Conteúdo', 'Modo de uso', 'Ingredientes', 'Composição', 'Lote', 'Validade', 'Fabricado por', 'CNPJ', 'AFE', 'Processo', 'Atendimento', 'Origem']);
  assert.equal(linhas[0].texto, 'Flor de Sal');
  assert.equal(linhas[1].texto, 'Sabonete de lavanda');
  assert.ok(linhas.every((l) => l.texto && !l.texto.includes('undefined')));
});

test('expressão de produto artesanal é opcional e vem em destaque', () => {
  assert.ok(!linhasDoRotulo(COMPLETO).some((l) => /artesanal/i.test(l.texto)));
  const com = linhasDoRotulo({ ...COMPLETO, artesanal: true });
  assert.ok(com.some((l) => l.texto === 'PRODUTO ARTESANAL' && l.destaque));
});

test('data de fabricação aparece quando informada', () => {
  const l = linhasDoRotulo({ ...COMPLETO, fabricacao: '09/2026' }).find((x) => x.rotulo === 'Fabricação');
  assert.equal(l.texto, '09/2026');
});

test('CPF no lugar do CNPJ: aceito, e AFE/processo deixam de ser obrigatórios', async () => {
  const { tipoDocumento, camposObrigatorios, conferir, linhasDoRotulo } = await import('../app/js/lib/rotulo-anvisa.js');
  assert.equal(tipoDocumento('11.222.333/0001-81'), 'cnpj');
  assert.equal(tipoDocumento('123.456.789-09'), 'cpf');
  assert.equal(tipoDocumento('12345678909'), 'cpf');
  assert.equal(tipoDocumento('123'), '');
  assert.equal(tipoDocumento(''), '');
  const comCpf = { produto: 'Sabonete', marca: 'Flor de Sal', conteudo: '90 g', lote: 'L1', validade: '09/2027', inci: 'Aqua', composicaoPt: 'água',
    titular: 'Maria da Silva', cnpj: '123.456.789-09', afe: '', processo: '', atendimento: '(11) 90000-0000', origem: 'Brasil' };
  const r = conferir(comCpf);
  assert.equal(r.documento, 'cpf');
  assert.ok(r.completo, JSON.stringify(r.faltando.map((c) => c.id)));
  assert.equal(r.obrigatorios, 11);
  assert.ok(!camposObrigatorios(comCpf).some((c) => c.id === 'afe' || c.id === 'processo'));
  // com CNPJ, AFE e processo continuam obrigatórios
  const r2 = conferir({ ...comCpf, cnpj: '11.222.333/0001-81' });
  assert.deepEqual(r2.faltando.map((c) => c.id), ['afe', 'processo']);
  assert.equal(r2.obrigatorios, 13);
  // o rótulo escreve CPF, não CNPJ
  const linhas = linhasDoRotulo(comCpf);
  assert.ok(linhas.some((l) => l.rotulo === 'CPF' && l.texto === '123.456.789-09'));
  assert.ok(!linhas.some((l) => l.rotulo === 'CNPJ'));
});
