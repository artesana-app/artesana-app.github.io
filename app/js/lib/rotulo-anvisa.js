// Dados obrigatórios de rotulagem de cosméticos, produtos de higiene pessoal e perfumes.
// Fonte: RDC nº 907/2024 da Anvisa, art. 13 (dados da rotulagem) e art. 20, parágrafo único
// (composição também em português, nos termos da RDC nº 898/2024). Lógica pura, sem DOM.
export const NORMA = {
  nome: 'RDC nº 907/2024',
  artigo: 'art. 13',
  composicaoPt: 'RDC nº 898/2024',
  conferidoEm: '29/09/2026',
};

// Na ordem em que aparecem no formulário.
export const CAMPOS = [
  { id: 'produto', rotulo: 'Nome do produto', obrigatorio: true, exemplo: 'Sabonete de lavanda' },
  { id: 'marca', rotulo: 'Marca', obrigatorio: true, exemplo: 'Flor de Sal' },
  { id: 'grupo', rotulo: 'Grupo ou tipo do produto', obrigatorio: false, nota: 'quando não está no nome', exemplo: 'Sabonete em barra' },
  { id: 'conteudo', rotulo: 'Conteúdo', obrigatorio: true, exemplo: '90 g' },
  { id: 'lote', rotulo: 'Lote', obrigatorio: true, exemplo: 'L0126' },
  { id: 'fabricacao', rotulo: 'Data de fabricação', obrigatorio: false, nota: 'não é exigida pela norma atual', exemplo: '09/2026' },
  { id: 'validade', rotulo: 'Prazo de validade', obrigatorio: true, exemplo: '09/2027' },
  { id: 'inci', rotulo: 'Ingredientes (INCI)', obrigatorio: true, multi: true, exemplo: 'Sodium Olivate, Aqua, Glycerin' },
  { id: 'composicaoPt', rotulo: 'Composição em português', obrigatorio: true, multi: true, exemplo: 'oliva saponificada, água, glicerina' },
  { id: 'titular', rotulo: 'Nome ou razão social do titular', obrigatorio: true, exemplo: 'Flor de Sal Cosméticos Ltda' },
  { id: 'cnpj', rotulo: 'CNPJ ou CPF do titular', obrigatorio: true, exemplo: '00.000.000/0001-00 ou 000.000.000-00', nota: 'A Anvisa pede CNPJ (o MEI dá um na hora, de graça). Sem CNPJ ainda, use o CPF: o rótulo sai como produto artesanal.' },
  { id: 'afe', rotulo: 'Número da AFE', obrigatorio: true, soComCnpj: true, nota: 'Autorização de Funcionamento de Empresa. Só existe com CNPJ.', exemplo: '2.00000.0' },
  { id: 'processo', rotulo: 'Número do processo de regularização', obrigatorio: true, soComCnpj: true, nota: 'Só existe com CNPJ.', exemplo: '25351.000000/2026-00' },
  { id: 'atendimento', rotulo: 'Atendimento ao consumidor', obrigatorio: true, nota: 'telefone, e-mail, site ou outro meio', exemplo: '(11) 90000-0000' },
  { id: 'origem', rotulo: 'País de origem', obrigatorio: true, exemplo: 'Brasil' },
  { id: 'modoUso', rotulo: 'Modo de uso', obrigatorio: false, nota: 'se for o caso', multi: true, exemplo: 'Aplicar sobre a pele úmida e enxaguar.' },
  { id: 'advertencias', rotulo: 'Advertências e restrições de uso', obrigatorio: false, nota: 'se for o caso', multi: true, exemplo: 'Uso externo. Manter fora do alcance de crianças.' },
];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

// 'cnpj' (14 dígitos), 'cpf' (11 dígitos) ou '' (vazio ou incompleto). Só olha os números.
export function tipoDocumento(valor) {
  const n = texto(valor).replace(/\D/g, '');
  if (n.length === 14) return 'cnpj';
  if (n.length === 11) return 'cpf';
  return '';
}

// Com CPF não existe AFE nem processo na Anvisa: esses dois saem da lista de obrigatórios.
export function camposObrigatorios(dados = {}) {
  const cpf = tipoDocumento((dados || {}).cnpj) === 'cpf';
  return CAMPOS.filter((c) => c.obrigatorio && !(cpf && c.soComCnpj));
}

export function conferir(dados = {}) {
  const obrig = camposObrigatorios(dados);
  const faltando = obrig.filter((c) => !texto(dados[c.id]));
  return { faltando, obrigatorios: obrig.length, preenchidos: obrig.length - faltando.length, completo: faltando.length === 0, documento: tipoDocumento((dados || {}).cnpj) };
}

export function composicaoEmPortugues(itens = []) {
  const vistos = new Set();
  const saida = [];
  for (const it of itens) {
    const pt = texto(it?.pt).toLowerCase();
    if (!pt || vistos.has(pt)) continue;
    vistos.add(pt);
    saida.push(pt);
  }
  return saida.join(', ');
}

// Linhas do rótulo na ordem de leitura. Campo vazio não gera linha.
export function linhasDoRotulo(dados = {}) {
  const d = dados || {};
  const linhas = [];
  const por = (rotulo, valor, extra = {}) => { if (texto(valor)) linhas.push({ rotulo, texto: texto(valor), ...extra }); };
  por('', d.marca, { titulo: true });
  por('', d.produto, { subtitulo: true });
  por('', d.grupo);
  if (d.artesanal) linhas.push({ rotulo: '', texto: 'PRODUTO ARTESANAL', destaque: true });
  por('Conteúdo', d.conteudo);
  por('Modo de uso', d.modoUso);
  por('Advertências', d.advertencias);
  por('Ingredientes', d.inci);
  por('Composição', d.composicaoPt);
  por('Lote', d.lote);
  por('Fabricação', d.fabricacao);
  por('Validade', d.validade);
  por('Fabricado por', d.titular);
  por(tipoDocumento(d.cnpj) === 'cpf' ? 'CPF' : 'CNPJ', d.cnpj);
  por('AFE', d.afe);
  por('Processo', d.processo);
  por('Atendimento', d.atendimento);
  por('Origem', d.origem);
  return linhas;
}

export const TAMANHOS = [
  { id: 'c7040', nome: '70 × 40 mm', largura: 70, altura: 40 },
  { id: 'c9050', nome: '90 × 50 mm', largura: 90, altura: 50 },
  { id: 'c9565', nome: '95 × 65 mm', largura: 95, altura: 65 },
];
