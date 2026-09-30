import { h, header, lista, grupo, toast, copiar, modal, cartoes, navegacao } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import { INGREDIENTES } from '../data/ingredientes.js';
import { DATAS } from '../data/datas.js';
import { gerarInci, sugerirAlergenos, buscar } from '../lib/inci.js';
import { gradeA4, corTexto, PRESETS, CORES_FUNDO, sugestoesA4 } from '../lib/rotulo.js';
import { nichoPrincipal } from '../lib/perfil.js';
import { gerarQrDataUrl } from './whatsapp.js';
import { abaAnvisa } from './rotulo-completo.js';
import { identidade } from './identidade.js';

const ESCALA = 4; // px por mm no preview

// modelos prontos (Canva): escolhe um e ajusta
const MODELOS = [
  { id: 'minimal', nome: 'Minimal', fundo: '#FFFFFF', frase: '', preset: 'red50', tipo: 'redondo' },
  { id: 'botanico', nome: 'Botânico', fundo: '#DCE6D9', frase: 'feito com ingredientes naturais', preset: 'red50', tipo: 'redondo' },
  { id: 'rustico', nome: 'Rústico', fundo: '#F1E6D6', frase: 'feito à mão, em pequenos lotes', preset: 'ret7040', tipo: 'retangular' },
  { id: 'sofisticado', nome: 'Sofisticado', fundo: '#2C1A1E', frase: 'edição limitada', preset: 'ret9050', tipo: 'retangular' },
  { id: 'alegre', nome: 'Alegre', fundo: '#FFB18B', frase: 'pra alegrar o seu dia', preset: 'red60', tipo: 'redondo' },
  { id: 'presente', nome: 'Presente', fundo: '#FFF5EF', frase: 'de: ____  para: ____', preset: 'tag5080', tipo: 'tag' },
];
const CORES = [...CORES_FUNDO, { id: 'linho', nome: 'Linho', hex: '#F1E6D6' }, { id: 'kraft', nome: 'Kraft', hex: '#D9B99B' }, { id: 'tinta', nome: 'Tinta', hex: '#2C1A1E' }];

// mockup por segmento: onde o rótulo fica no produto
const MOCKUPS = [
  { id: 'barra', nome: 'Sabonete', nichos: ['sabonetes'] }, { id: 'pote', nome: 'Pote de vela', nichos: ['velas'] }, { id: 'frasco', nome: 'Frasco', nichos: ['cosmeticos'] },
  { id: 'vidro', nome: 'Pote de vidro', nichos: ['alimentos'] }, { id: 'caixa', nome: 'Caixa com tag', nichos: ['artesanato'] }, { id: 'nenhum', nome: 'Só o rótulo', nichos: [] },
];

function rotuloPadrao() {
  const user = store.usuario();
  const o = store.get('onboarding', {});
  const id = identidade();
  return { preset: 'red50', tipo: 'redondo', largura: 50, altura: 50, marca: user.marca || '', produto: o.tipoProduto || '', frase: typeof id.valores.frase === 'string' ? id.valores.frase : '', peso: '', fundo: '#FFF5EF', usarInci: false, usarQr: false, data: '', mockup: '' };
}

// Renderiza um rótulo em um elemento com dimensões em `unidade` (px ou mm).
function desenharRotulo(r, escala, unidade, inciTexto, qrUrl) {
  const cor = corTexto(r.fundo);
  const w = r.largura * escala; const hh = r.altura * escala;
  const base = Math.min(r.largura, r.altura); // em mm
  const fs = (mm) => `${(mm * escala).toFixed(2)}${unidade}`;
  const pad = fs(base * (r.tipo === 'redondo' ? 0.13 : 0.07));
  const el = h('div', { class: `rot ${r.tipo}`, style: { width: `${w}${unidade}`, height: `${hh}${unidade}`, padding: pad, background: r.fundo, color: cor } });
  if (r.tipo === 'tag') el.append(h('div', { class: 'furo' }));
  if (r.marca) el.append(h('div', { class: 'marca', style: { fontSize: fs(base * Math.min(0.11, 1.35 / Math.max(r.marca.length, 1))) } }, r.marca.replace(/\.$/, ''), h('b', {}, '.')));
  if (r.produto) el.append(h('div', { class: 'produto', style: { fontSize: fs(base * 0.075) } }, r.produto));
  if (r.frase) el.append(h('div', { class: 'frase', style: { fontSize: fs(base * 0.05) } }, r.frase));
  if (r.peso) el.append(h('div', { class: 'peso', style: { fontSize: fs(base * 0.05) } }, r.peso));
  if (r.usarInci && inciTexto) el.append(h('div', { class: 'inci', style: { fontSize: fs(Math.max(base * 0.03, 1.5)) } }, `Ingredientes: ${inciTexto}`));
  if (r.usarQr && qrUrl) el.append(h('div', { class: 'qr' }, h('img', { src: qrUrl, alt: 'QR', style: { width: fs(base * 0.17), height: fs(base * 0.17) } })));
  return el;
}

// O produto desenhado em volta do rótulo, pra ver como fica na vida real.
function mockup(tipo, rotulo) {
  if (!tipo || tipo === 'nenhum') return rotulo;
  const m = h('div', { class: `mock mock-${tipo}` });
  if (tipo === 'barra') m.append(h('div', { class: 'mock-corpo' }, h('div', { class: 'mock-faixa' }, rotulo)));
  else if (tipo === 'pote') m.append(h('div', { class: 'mock-tampa' }), h('div', { class: 'mock-corpo' }, rotulo));
  else if (tipo === 'frasco') m.append(h('div', { class: 'mock-bico' }), h('div', { class: 'mock-gargalo' }), h('div', { class: 'mock-corpo' }, rotulo));
  else if (tipo === 'vidro') m.append(h('div', { class: 'mock-tampa' }), h('div', { class: 'mock-corpo' }, rotulo));
  else if (tipo === 'caixa') m.append(h('div', { class: 'mock-corpo' }, h('div', { class: 'mock-laco' })), h('div', { class: 'mock-pendurado' }, rotulo));
  return m;
}

function abaCriar(section, render) {
  const salvo = store.get('rotulos', {});
  const r = { ...rotuloPadrao(), ...(salvo.ultimoRotulo || {}) };
  if (!r.mockup) { const n = nichoPrincipal(store.get('onboarding', {})); r.mockup = (MOCKUPS.find((m) => m.nichos.includes(n)) || MOCKUPS[0]).id; }
  const inciTexto = gerarInci(salvo.inci || []);
  const wa = store.get('whatsapp', {});
  const qrUrl = wa.link ? gerarQrDataUrl(wa.link, 256) : null;

  const preview = h('div', { class: 'rot-palco' });
  const grade = h('div', { class: 'muted center' });
  const sugestoes = h('div', { class: 'chips', style: { justifyContent: 'center', marginTop: '8px' } });
  const atualizar = () => {
    store.patch('rotulos', { ultimoRotulo: r });
    preview.innerHTML = '';
    preview.append(mockup(r.mockup, desenharRotulo(r, ESCALA, 'px', inciTexto, qrUrl)));
    const g = gradeA4({ largura: r.largura, altura: r.altura });
    grade.textContent = g.total ? `${r.largura} × ${r.altura} mm: cabem ${g.total} por folha A4 (${g.colunas} × ${g.linhas})` : 'Esse tamanho não cabe numa folha A4';
    sugestoes.innerHTML = '';
    for (const s of sugestoesA4({ largura: r.largura, altura: r.altura, tipo: r.tipo })) {
      sugestoes.append(h('button', { type: 'button', class: 'chip', onClick: () => { r.preset = 'custom'; r.largura = s.largura; r.altura = s.altura; selPreset.value = 'custom'; medidas.classList.remove('hidden'); medidas.querySelectorAll('input')[0].value = r.largura; medidas.querySelectorAll('input')[1].value = r.altura; atualizar(); } }, `${s.largura} × ${s.altura} mm: cabem ${s.total} (+${s.ganho})`));
    }
  };

  const campoTexto = (label, chave, opts = {}) => {
    const c = opts.num ? { el: h('input', { class: 'input', inputmode: 'numeric', placeholder: opts.placeholder || '' }), input: null } : campo({ placeholder: opts.placeholder || '' });
    const input = c.input || c.el;
    input.value = r[chave] ?? '';
    input.addEventListener('input', () => { r[chave] = opts.num ? Number(input.value) || 0 : input.value; atualizar(); });
    return h('div', { class: 'field' }, h('label', {}, label), c.el);
  };

  const selPreset = h('select', { class: 'select' }, ...PRESETS.map((p) => h('option', { value: p.id }, p.nome)), h('option', { value: 'custom' }, 'Medida personalizada'));
  selPreset.value = r.preset || 'custom';
  const medidas = h('div', { class: `rot-grid ${selPreset.value === 'custom' ? '' : 'hidden'}` }, campoTexto('Largura (mm)', 'largura', { num: true }), campoTexto('Altura (mm)', 'altura', { num: true }));
  const selTipo = h('select', { class: 'select' }, h('option', { value: 'redondo' }, 'Redondo'), h('option', { value: 'retangular' }, 'Retangular'), h('option', { value: 'tag' }, 'Tag de presente'));
  selTipo.value = r.tipo;
  selPreset.addEventListener('change', () => {
    const p = PRESETS.find((x) => x.id === selPreset.value);
    r.preset = selPreset.value;
    if (p) { r.tipo = p.tipo; r.largura = p.largura; r.altura = p.altura; selTipo.value = p.tipo; medidas.classList.add('hidden'); }
    else medidas.classList.remove('hidden');
    medidas.querySelectorAll('input')[0].value = r.largura; medidas.querySelectorAll('input')[1].value = r.altura;
    atualizar();
  });
  selTipo.addEventListener('change', () => { r.tipo = selTipo.value; if (r.tipo === 'redondo') { r.altura = r.largura; } atualizar(); });

  const cores = h('div', { class: 'chips' }, ...CORES.map((c) => h('button', { type: 'button', class: `chip ${r.fundo === c.hex ? 'on' : ''}`, onClick: (e) => { r.fundo = c.hex; cores.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on'); atualizar(); } }, h('span', { class: 'sw', style: { background: c.hex } }), c.nome)));
  const mocks = h('div', { class: 'chips' }, ...MOCKUPS.map((m) => h('button', { type: 'button', class: `chip ${r.mockup === m.id ? 'on' : ''}`, onClick: (e) => { r.mockup = m.id; mocks.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on'); atualizar(); } }, m.nome)));

  const datas = h('select', { class: 'select' }, h('option', { value: '' }, 'Nenhuma'), ...DATAS.map((d) => h('option', { value: d.id }, `${d.emoji} ${d.nome}`)));
  datas.value = r.data || '';
  datas.addEventListener('change', () => { r.data = datas.value; const d = DATAS.find((x) => x.id === r.data); if (d && !r.frase) { r.frase = `Feliz ${d.nome}!`; const inp = section.querySelector('#rot-frase input'); if (inp) inp.value = r.frase; } atualizar(); });

  const toggle = (label, chave, sub) => {
    const cb = h('input', { type: 'checkbox', checked: !!r[chave], onChange: (e) => { r[chave] = e.target.checked; atualizar(); } });
    return h('div', { class: 'check', style: { padding: '8px 0' } }, h('div', { class: 'txt' }, h('b', {}, label), h('span', {}, sub)), h('label', { class: 'switch' }, cb, h('i')));
  };

  const modelos = cartoes(MODELOS.map((m) => ({ titulo: m.nome, capa: h('div', { class: 'capa-rotulo', style: { background: m.fundo, color: corTexto(m.fundo) } }, h('span', { class: `mini ${m.tipo}` }, r.marca ? r.marca.replace(/\.$/, '') : 'marca', h('b', {}, '.'))), onClick: () => {
    const p = PRESETS.find((x) => x.id === m.preset);
    Object.assign(r, { fundo: m.fundo, frase: m.frase, preset: m.preset, tipo: m.tipo, largura: p.largura, altura: p.altura });
    selPreset.value = m.preset; selTipo.value = m.tipo; medidas.classList.add('hidden');
    cores.querySelectorAll('.chip').forEach((x, i) => x.classList.toggle('on', CORES[i].hex === m.fundo));
    const inp = section.querySelector('#rot-frase input'); if (inp) inp.value = m.frase;
    atualizar(); toast(`Modelo ${m.nome}`);
  } })), 'tres');

  const exportar = () => {
    const g = gradeA4({ largura: r.largura, altura: r.altura });
    if (!g.total) { toast('Esse tamanho não cabe numa folha A4'); return; }
    const folha = document.getElementById('folha-a4');
    folha.innerHTML = '';
    for (const pos of g.posicoes) {
      const el = desenharRotulo(r, 1, 'mm', inciTexto, qrUrl);
      el.style.left = `${pos.x}mm`; el.style.top = `${pos.y}mm`;
      folha.append(el);
    }
    modal({
      titulo: 'Exportar PDF',
      corpo: h('div', {}, h('p', {}, `Vai abrir a janela de impressão com ${g.total} rótulos numa folha A4.`), h('p', { class: 'muted' }, 'Escolha "Salvar como PDF" no destino. Sai vetorial, pronto pra gráfica ou pra imprimir em casa em adesivo A4.'), h('p', { class: 'muted' }, 'Casa: papel adesivo brilhante A4. Gráfica: couchê adesivo 90g.')),
      botoes: [{ texto: 'Cancelar', classe: 'white' }, { texto: 'Abrir impressão', classe: 'peach', onClick: () => { requestAnimationFrame(() => setTimeout(() => window.print(), 150)); } }],
    });
  };

  const form = h('div', { class: 'rot-layout' },
    h('div', { class: 'rot-lado' },
      h('div', { class: 'rot-preview-wrap' }, preview, grade, sugestoes),
      h('div', { class: 'field' }, h('label', {}, 'Ver no produto'), mocks)),
    h('div', { class: 'rot-form' },
      grupo('Comece por um modelo', modelos),
      h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Tamanho'), selPreset),
        h('div', { class: 'field' }, h('label', {}, 'Formato'), selTipo),
        medidas,
        campoTexto('Nome da marca', 'marca', { placeholder: 'Sua marca' }),
        campoTexto('Produto', 'produto', { placeholder: 'Ex: Sabonete de lavanda' }),
        h('div', { id: 'rot-frase' }, campoTexto('Frase curta', 'frase', { placeholder: 'Ex: feito à mão com amor' })),
        campoTexto('Peso / volume', 'peso', { placeholder: 'Ex: 90 g' }),
        h('div', { class: 'field' }, h('label', {}, 'Data comemorativa'), datas),
        h('div', { class: 'field' }, h('label', {}, 'Cor de fundo'), cores),
        toggle('Incluir lista INCI', 'usarInci', inciTexto ? `${inciTexto.slice(0, 60)}…` : 'Monte a lista na aba INCI'),
        toggle('Incluir QR do WhatsApp', 'usarQr', wa.link ? (wa.linkCurto || wa.link).replace(/^https?:\/\//, '') : 'Crie seu link em WhatsApp'),
        h('button', { class: 'btn peach block', style: { marginTop: '8px' }, onClick: exportar }, 'Exportar PDF, pronto pra gráfica'),
      )),
  );
  atualizar();
  return form;
}

function abaInci(section, render) {
  const salvo = store.get('rotulos', {});
  let selecionados = [...(salvo.inci || [])];
  let comAlergenos = !!salvo.inciAlergenos;

  const busca = campo({ placeholder: 'Busque: óleo de coco, lavanda, argila...' });
  const sugestoes = h('div', { class: 'suggest hidden' });
  const listaSel = h('ul', { class: 'sel-list list' });
  const saida = h('textarea', { class: 'textarea', readonly: true, style: { minHeight: '80px', fontSize: '13px' } });
  const outro = campo({ placeholder: 'Outro ingrediente (nome INCI)' });

  const salvar = () => { store.patch('rotulos', { inci: selecionados, inciAlergenos: comAlergenos }); };
  const atualizar = () => {
    salvar();
    listaSel.innerHTML = '';
    selecionados.forEach((it, i) => {
      listaSel.append(h('li', {},
        h('span', { class: 'n' }, i + 1),
        h('span', { class: 'txt' }, it.pt, h('i', {}, it.inci)),
        h('button', { type: 'button', 'aria-label': 'subir', disabled: i === 0, onClick: () => { [selecionados[i - 1], selecionados[i]] = [selecionados[i], selecionados[i - 1]]; atualizar(); } }, '↑'),
        h('button', { type: 'button', 'aria-label': 'descer', disabled: i === selecionados.length - 1, onClick: () => { [selecionados[i + 1], selecionados[i]] = [selecionados[i], selecionados[i + 1]]; atualizar(); } }, '↓'),
        h('button', { type: 'button', 'aria-label': 'remover', onClick: () => { selecionados.splice(i, 1); atualizar(); } }, '✕'),
      ));
    });
    const extras = comAlergenos ? sugerirAlergenos(selecionados).map((a) => ({ inci: a })) : [];
    saida.value = gerarInci([...selecionados, ...extras]);
  };
  const adicionar = (it) => { if (!selecionados.some((s) => s.inci === it.inci && s.pt === it.pt)) selecionados.push(it); busca.input.value = ''; sugestoes.classList.add('hidden'); atualizar(); };

  busca.input.addEventListener('input', () => {
    const r = buscar(busca.input.value, INGREDIENTES);
    sugestoes.innerHTML = '';
    if (!r.length) { sugestoes.classList.add('hidden'); return; }
    r.forEach((it) => sugestoes.append(h('button', { type: 'button', onClick: () => adicionar(it) }, it.pt, h('i', {}, it.inci))));
    sugestoes.classList.remove('hidden');
  });

  atualizar();
  return h('div', {},
    h('div', { class: 'card' },
      h('p', { class: 'muted' }, 'Adicione os ingredientes e ordene do maior pro menor na fórmula. A lista sai no formato INCI, o padrão da rotulagem cosmética.'),
      h('div', { class: 'field' }, h('label', {}, 'Ingrediente'), busca.el), sugestoes,
      h('div', { class: 'inline', style: { marginBottom: '12px' } }, outro.el, h('button', { class: 'btn sm', onClick: () => { const v = outro.input.value.trim(); if (!v) return; adicionar({ pt: v, inci: v }); outro.input.value = ''; } }, 'Add')),
      selecionados.length ? listaSel : h('p', { class: 'muted center' }, 'Nenhum ingrediente ainda'),
      listaSel,
      h('div', { class: 'check', style: { padding: '8px 0' } }, h('div', { class: 'txt' }, h('b', {}, 'Listar alergênicos dos óleos essenciais'), h('span', {}, 'Linalool, Limonene etc. após o óleo')), h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: comAlergenos, onChange: (e) => { comAlergenos = e.target.checked; atualizar(); } }), h('i'))),
      h('div', { class: 'field' }, h('label', {}, 'Lista INCI'), saida),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: () => copiar(saida.value, 'Lista INCI copiada') }, 'Copiar'),
        h('button', { class: 'btn peach', onClick: () => { salvar(); toast('Lista salva no rótulo'); render('criar'); } }, 'Usar no rótulo'),
      ),
    ),
  );
}

function abaDatas() {
  return h('div', {}, ...DATAS.map((d) => h('div', { class: 'card' }, h('h3', {}, `${d.emoji} ${d.nome}`), h('div', { class: 'muted' }, d.dia ? `${String(d.dia).padStart(2, '0')}/${String(d.mes).padStart(2, '0')}` : `mês ${d.mes}`), h('p', { style: { marginTop: '6px' } }, d.gancho))));
}

function abaEmbalagem() {
  return h('div', {},
    lista([
      { emoji: '📐', titulo: 'Tamanhos em folha A4', sub: 'O app calcula quantos cabem e sugere tamanhos menores', static: true },
      { emoji: '🏠', titulo: 'Imprimir em casa', sub: 'Papel adesivo brilhante A4 (jato de tinta ou laser)', static: true },
      { emoji: '🖨️', titulo: 'Mandar pra gráfica', sub: 'Couchê adesivo 90g, PDF vetorial, sem sangria necessária', static: true },
      { emoji: '🎀', titulo: 'Tag de presente', sub: 'Papel kraft 180g ou couchê fosco 250g, furo de 4 mm, barbante ou fita', static: true },
    ]),
    h('div', { class: 'card' }, h('h3', {}, 'Dica'), h('p', { class: 'muted' }, 'Rótulo redondo de 50 mm serve pra tampa de pote de 100 a 250 g. Retangular 70 × 40 mm fica bom em sabonete em barra embalado em papel.')),
  );
}

export function montar(section, param) {
  let aba = param || 'criar';
  const ABAS = ['criar', 'inci', 'anvisa', 'datas', 'embalagem'];
  const render = (nova) => {
    if (nova) aba = nova;
    section.innerHTML = '';
    const tabs = h('div', { class: 'tabs' },
      ...[['criar', 'Criar'], ['inci', 'INCI'], ['anvisa', 'Anvisa'], ['datas', 'Datas'], ['embalagem', 'Papel']].map(([id, nome]) => h('button', { class: aba === id ? 'on' : '', onClick: () => render(id) }, nome)));
    const corpo = aba === 'anvisa' ? abaAnvisa() : aba === 'inci' ? abaInci(section, render) : aba === 'datas' ? abaDatas() : aba === 'embalagem' ? abaEmbalagem() : abaCriar(section, render);
    const i = ABAS.indexOf(aba);
    section.append(h('div', { class: 'screen larga' },
      header({ titulo: 'Rótulos e etiquetas', sub: 'Redondo, retangular e tag · PDF pra gráfica', voltar: '#home' }),
      h('div', { class: 'content' }, tabs, corpo,
        i < ABAS.length - 1
          ? navegacao({ atual: 'rotulos', voltar: i > 0 ? `rotulos/${ABAS[i - 1]}` : 'identidade', seguir: `rotulos/${ABAS[i + 1]}`, textoSeguir: `Seguir: ${['Criar', 'INCI', 'Anvisa', 'Datas', 'Papel'][i + 1]}`, aoSeguir: () => render(ABAS[i + 1]) })
          : navegacao({ atual: 'rotulos', voltar: `rotulos/${ABAS[i - 1]}` })),
    ));
    window.scrollTo(0, 0);
  };
  render();
}
