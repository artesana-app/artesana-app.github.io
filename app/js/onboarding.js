// Onboarding progressivo: cada módulo pede só o que precisa, uma vez.
import { h, modal, toast } from './ui.js';
import * as store from './store.js';
import { calcularProgresso } from './lib/progresso.js';

export const NICHOS = [
  { id: 'sabonetes', nome: 'Sabonetes e saboaria', emoji: '🧼' },
  { id: 'velas', nome: 'Velas e aromas', emoji: '🕯️' },
  { id: 'cosmeticos', nome: 'Cosméticos naturais', emoji: '🌿' },
  { id: 'alimentos', nome: 'Alimentos artesanais', emoji: '🍯' },
  { id: 'artesanato', nome: 'Artesanato em geral', emoji: '🧶' },
];

export const PERSONALIDADES = [
  { id: 'delicada', nome: 'Delicada', emoji: '🌸' },
  { id: 'rustica', nome: 'Rústica', emoji: '🪵' },
  { id: 'sofisticada', nome: 'Sofisticada', emoji: '✨' },
  { id: 'alegre', nome: 'Alegre', emoji: '🌞' },
];

export function progresso() {
  return calcularProgresso({ user: store.usuario(), onboarding: store.get('onboarding', {}), instagram: store.get('instagram', {}) });
}

function visto(modulo) {
  const o = store.get('onboarding', {});
  return !!(o.vistos && o.vistos[modulo]);
}
function marcarVisto(modulo) {
  const o = store.get('onboarding', {});
  store.set('onboarding', { ...o, vistos: { ...(o.vistos || {}), [modulo]: true } });
}

function chips(opcoes, valorInicial, onChange) {
  let valor = valorInicial || '';
  const box = h('div', { class: 'chips' });
  const render = () => {
    box.innerHTML = '';
    for (const o of opcoes) {
      box.append(h('button', { type: 'button', class: `chip ${valor === o.id ? 'on' : ''}`, onClick: () => { valor = o.id; onChange(valor); render(); } }, `${o.emoji || ''} ${o.nome}`.trim()));
    }
  };
  render();
  return box;
}

// 1º acesso: nome + tem marca?
export function primeiroAcesso(aoTerminar) {
  const user = store.usuario();
  if (user.nome) return false;
  const nome = h('input', { class: 'input', placeholder: 'Seu nome', autocomplete: 'given-name' });
  const marca = h('input', { class: 'input', placeholder: 'Nome da marca (se já tiver)' });
  modal({
    titulo: 'Que bom ter você aqui 💛',
    fechavel: false,
    corpo: h('div', {},
      h('p', { class: 'muted' }, 'Só duas coisinhas pra personalizar o app.'),
      h('div', { class: 'field' }, h('label', {}, 'Como você se chama?'), nome),
      h('div', { class: 'field' }, h('label', {}, 'Já tem uma marca?'), marca, h('div', { class: 'hint' }, 'Sem marca ainda? Deixa em branco, a gente ajuda a criar.')),
    ),
    botoes: [{ texto: 'Começar', classe: 'peach', onClick: () => {
      if (!nome.value.trim()) { toast('Conta seu nome pra gente 🙂'); return false; }
      store.patch('user', { nome: nome.value.trim(), marca: marca.value.trim() });
      if (aoTerminar) aoTerminar();
      return true;
    } }],
  });
  return true;
}

// Identidade Visual: nicho, história, público, personalidade (3 passos num modal só)
export function pedirDadosMarca(aoTerminar, forcar = false) {
  const o = store.get('onboarding', {});
  const falta = !o.nicho || !o.historia || !o.personalidade || !o.publicoAlvo;
  if (!forcar && (!falta || visto('identidade'))) return false;
  marcarVisto('identidade');

  const dados = { nicho: o.nicho || '', historia: o.historia || '', publicoAlvo: o.publicoAlvo || '', personalidade: o.personalidade || '' };
  let passo = 0;
  const corpo = h('div', {});
  const titulo = h('h2', {}, '');
  const btnRow = h('div', { class: 'btn-row' });
  const m = modal({ corpo: h('div', {}, titulo, corpo, btnRow), fechavel: true });

  const historia = h('textarea', { class: 'textarea', placeholder: 'Ex: Comecei fazendo sabonetes pra minha família e as amigas pediram pra vender...' });
  const publico = h('input', { class: 'input', placeholder: 'Ex: mulheres 25-45 que valorizam o natural' });
  historia.value = dados.historia; publico.value = dados.publicoAlvo;

  const passos = [
    () => { titulo.textContent = 'O que você produz?'; corpo.innerHTML = ''; corpo.append(h('p', { class: 'muted' }, 'Passo 1 de 3'), chips(NICHOS, dados.nicho, (v) => { dados.nicho = v; })); },
    () => { titulo.textContent = 'A história da sua marca'; corpo.innerHTML = ''; corpo.append(
      h('p', { class: 'muted' }, 'Passo 2 de 3 · vira frase de impacto e legendas'),
      h('div', { class: 'field' }, h('label', {}, 'Como tudo começou?'), historia),
      h('div', { class: 'field' }, h('label', {}, 'Pra quem você vende?'), publico),
    ); },
    () => { titulo.textContent = 'Qual a personalidade da marca?'; corpo.innerHTML = ''; corpo.append(h('p', { class: 'muted' }, 'Passo 3 de 3'), chips(PERSONALIDADES, dados.personalidade, (v) => { dados.personalidade = v; })); },
  ];
  const render = () => {
    passos[passo]();
    btnRow.innerHTML = '';
    if (passo > 0) btnRow.append(h('button', { class: 'btn white', onClick: () => { passo--; render(); } }, 'Voltar'));
    btnRow.append(h('button', { class: 'btn peach', onClick: () => {
      if (passo === 1) { dados.historia = historia.value.trim(); dados.publicoAlvo = publico.value.trim(); }
      if (passo < passos.length - 1) { passo++; render(); return; }
      store.patch('onboarding', dados);
      m.fechar();
      toast('Perfil da marca salvo ✨');
      if (aoTerminar) aoTerminar();
    } }, passo < passos.length - 1 ? 'Próximo' : 'Salvar'));
  };
  render();
  return true;
}

// Conteúdo Social: @ + 3 perfis de referência
export function pedirInstagram(aoTerminar, forcar = false) {
  const i = store.get('instagram', {});
  if (!forcar && (i.arroba || visto('social'))) return false;
  marcarVisto('social');
  const arroba = h('input', { class: 'input', placeholder: '@suamarca' });
  const refs = [0, 1, 2].map((n) => h('input', { class: 'input', placeholder: `@perfil de inspiração ${n + 1}` }));
  arroba.value = i.arroba || '';
  (i.perfisReferencia || []).forEach((v, n) => { if (refs[n]) refs[n].value = v; });
  modal({
    titulo: 'Seu Instagram',
    corpo: h('div', {},
      h('p', { class: 'muted' }, 'Com o seu @ e 3 perfis que te inspiram a gente monta seu estilo.'),
      h('div', { class: 'field' }, h('label', {}, 'Seu @'), arroba),
      h('div', { class: 'field' }, h('label', {}, '3 perfis de referência'), ...refs),
    ),
    botoes: [
      { texto: 'Depois', classe: 'white' },
      { texto: 'Salvar', classe: 'peach', onClick: () => {
        store.set('instagram', { arroba: arroba.value.trim().replace(/^@?/, '@').replace(/^@$/, ''), perfisReferencia: refs.map((r) => r.value.trim()).filter(Boolean) });
        toast('Instagram salvo');
        if (aoTerminar) aoTerminar();
      } },
    ],
  });
  return true;
}

// Rótulos: tipo de produto + ingredientes (não conta no progresso)
export function pedirTipoProduto(aoTerminar, forcar = false) {
  const o = store.get('onboarding', {});
  if (!forcar && (o.tipoProduto || visto('rotulos'))) return false;
  marcarVisto('rotulos');
  const tipo = h('input', { class: 'input', placeholder: 'Ex: sabonete de lavanda, vela de soja...' });
  const ingr = h('textarea', { class: 'textarea', placeholder: 'Ex: óleo de oliva, óleo de coco, lavanda' });
  tipo.value = o.tipoProduto || ''; ingr.value = o.ingredientes || '';
  modal({
    titulo: 'Seu produto principal',
    corpo: h('div', {},
      h('p', { class: 'muted' }, 'Ajuda a sugerir tamanho de rótulo e a lista INCI.'),
      h('div', { class: 'field' }, h('label', {}, 'Que produto é?'), tipo),
      h('div', { class: 'field' }, h('label', {}, 'Principais ingredientes'), ingr),
    ),
    botoes: [
      { texto: 'Depois', classe: 'white' },
      { texto: 'Salvar', classe: 'peach', onClick: () => { store.patch('onboarding', { tipoProduto: tipo.value.trim(), ingredientes: ingr.value.trim() }); if (aoTerminar) aoTerminar(); } },
    ],
  });
  return true;
}

export function dica(p = progresso()) {
  if (p.completo) return { emoji: '🎉', texto: 'Perfil completo! Agora todas as sugestões são personalizadas pra sua marca.' };
  return { emoji: '💡', texto: p.proxima.dica, rota: p.proxima.rota };
}
