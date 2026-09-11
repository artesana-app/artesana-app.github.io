import { h, header, lista, grupo, toast, copiar, modal } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as onboarding from '../onboarding.js';
import { INGREDIENTES } from '../data/ingredientes.js';
import { DATAS } from '../data/datas.js';
import { gerarInci, sugerirAlergenos, buscar } from '../lib/inci.js';
import { gradeA4, corTexto, PRESETS, CORES_FUNDO } from '../lib/rotulo.js';
import { gerarQrDataUrl } from './whatsapp.js';

const ESCALA = 3; // px por mm no preview

function rotuloPadrao() {
  const user = store.usuario();
  const o = store.get('onboarding', {});
  return { preset: 'red50', tipo: 'redondo', largura: 50, altura: 50, marca: user.marca || '', produto: o.tipoProduto || '', frase: '', peso: '', fundo: '#FFF5EF', usarInci: false, usarQr: false, data: '' };
}

// Renderiza um rótulo em um elemento com dimensões em `unidade` (px ou mm).
function desenharRotulo(r, escala, unidade, inciTexto, qrUrl) {
  const cor = corTexto(r.fundo);
  const w = r.largura * escala; const hh = r.altura * escala;
  const base = Math.min(w, hh) / (unidade === 'mm' ? 1 : ESCALA); // em mm
  const fs = (mm) => `${(mm * escala).toFixed(2)}${unidade}`;
  const el = h('div', { class: `rot ${r.tipo}`, style: { width: `${w}${unidade}`, height: `${hh}${unidade}`, background: r.fundo, color: cor } });
  if (r.tipo === 'tag') el.append(h('div', { class: 'furo' }));
  if (r.marca) el.append(h('div', { class: 'marca', style: { fontSize: fs(base * Math.min(0.11, 1.35 / Math.max(r.marca.length, 1))) } }, r.marca.replace(/\.$/, ''), h('b', {}, '.')));
  if (r.produto) el.append(h('div', { class: 'produto', style: { fontSize: fs(base * 0.075) } }, r.produto));
  if (r.frase) el.append(h('div', { class: 'frase', style: { fontSize: fs(base * 0.05) } }, r.frase));
  if (r.peso) el.append(h('div', { class: 'peso', style: { fontSize: fs(base * 0.05) } }, r.peso));
  if (r.usarInci && inciTexto) el.append(h('div', { class: 'inci', style: { fontSize: fs(Math.max(base * 0.03, 1.5)) } }, `Ingredientes: ${inciTexto}`));
  if (r.usarQr && qrUrl) el.append(h('div', { class: 'qr' }, h('img', { src: qrUrl, alt: 'QR', style: { width: fs(base * 0.17), height: fs(base * 0.17) } })));
  return el;
}

function abaCriar(section, render) {
  const salvo = store.get('rotulos', {});
  const r = { ...rotuloPadrao(), ...(salvo.ultimoRotulo || {}) };
  const inciTexto = gerarInci(salvo.inci || []);
  const wa = store.get('whatsapp', {});
  const qrUrl = wa.link ? gerarQrDataUrl(wa.link, 256) : null;

  const preview = h('div', { class: 'rot-preview-wrap' });
  const grade = h('div', { class: 'muted' });
  const atualizar = () => {
    store.patch('rotulos', { ultimoRotulo: r });
    preview.innerHTML = '';
    preview.append(desenharRotulo(r, ESCALA, 'px', inciTexto, qrUrl));
    const g = gradeA4({ largura: r.largura, altura: r.altura });
    grade.textContent = g.total ? `Cabem ${g.total} por folha A4 (${g.colunas} × ${g.linhas})` : 'Esse tamanho não cabe numa folha A4';
    preview.append(grade);
  };

  const campo = (label, chave, opts = {}) => {
    const input = h('input', { class: 'input', placeholder: opts.placeholder || '', inputmode: opts.num ? 'numeric' : undefined });
    input.value = r[chave] ?? '';
    input.addEventListener('input', () => { r[chave] = opts.num ? Number(input.value) || 0 : input.value; atualizar(); });
    return h('div', { class: 'field' }, h('label', {}, label), input);
  };

  const selPreset = h('select', { class: 'select' }, ...PRESETS.map((p) => h('option', { value: p.id }, p.nome)), h('option', { value: 'custom' }, 'Medida personalizada'));
  selPreset.value = r.preset || 'custom';
  const medidas = h('div', { class: `rot-grid ${selPreset.value === 'custom' ? '' : 'hidden'}` }, campo('Largura (mm)', 'largura', { num: true }), campo('Altura (mm)', 'altura', { num: true }));
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

  const cores = h('div', { class: 'chips' }, ...CORES_FUNDO.map((c) => h('button', { type: 'button', class: `chip ${r.fundo === c.hex ? 'on' : ''}`, onClick: (e) => { r.fundo = c.hex; cores.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on'); atualizar(); } }, h('span', { class: 'sw', style: { background: c.hex } }), c.nome)));

  const datas = h('select', { class: 'select' }, h('option', { value: '' }, 'Nenhuma'), ...DATAS.map((d) => h('option', { value: d.id }, `${d.emoji} ${d.nome}`)));
  datas.value = r.data || '';
  datas.addEventListener('change', () => { r.data = datas.value; const d = DATAS.find((x) => x.id === r.data); if (d && !r.frase) { r.frase = `Feliz ${d.nome}!`; section.querySelector('#rot-frase input').value = r.frase; } atualizar(); });

  const toggle = (label, chave, sub) => {
    const cb = h('input', { type: 'checkbox', checked: !!r[chave], onChange: (e) => { r[chave] = e.target.checked; atualizar(); } });
    return h('div', { class: 'check', style: { padding: '8px 0' } }, h('div', { class: 'txt' }, h('b', {}, label), h('span', {}, sub)), h('label', { class: 'switch' }, cb, h('i')));
  };

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

  const form = h('div', {},
    preview,
    h('div', { class: 'card' },
      h('div', { class: 'field' }, h('label', {}, 'Modelo'), selPreset),
      h('div', { class: 'field' }, h('label', {}, 'Formato'), selTipo),
      medidas,
      campo('Nome da marca', 'marca', { placeholder: 'Sua marca' }),
      campo('Produto', 'produto', { placeholder: 'Ex: Sabonete de lavanda' }),
      h('div', { id: 'rot-frase' }, campo('Frase curta', 'frase', { placeholder: 'Ex: feito à mão com amor' })),
      campo('Peso / volume', 'peso', { placeholder: 'Ex: 90 g' }),
      h('div', { class: 'field' }, h('label', {}, 'Data comemorativa'), datas),
      h('div', { class: 'field' }, h('label', {}, 'Cor de fundo'), cores),
      toggle('Incluir lista INCI', 'usarInci', inciTexto ? `${inciTexto.slice(0, 60)}…` : 'Monte a lista na aba INCI'),
      toggle('Incluir QR do WhatsApp', 'usarQr', wa.link ? wa.link.replace('https://', '') : 'Crie seu link em Mais → WhatsApp'),
      h('button', { class: 'btn peach block', style: { marginTop: '8px' }, onClick: exportar }, 'Exportar PDF · pronto pra gráfica'),
    ),
  );
  atualizar();
  return form;
}

function abaInci(section, render) {
  const salvo = store.get('rotulos', {});
  let selecionados = [...(salvo.inci || [])];
  let comAlergenos = !!salvo.inciAlergenos;

  const busca = h('input', { class: 'input', placeholder: 'Busque: óleo de coco, lavanda, argila...' });
  const sugestoes = h('div', { class: 'suggest hidden' });
  const listaSel = h('ul', { class: 'sel-list list' });
  const saida = h('textarea', { class: 'textarea', readonly: true, style: { minHeight: '80px', fontSize: '13px' } });
  const outro = h('input', { class: 'input', placeholder: 'Outro ingrediente (nome INCI)' });

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
  const adicionar = (it) => { if (!selecionados.some((s) => s.inci === it.inci && s.pt === it.pt)) selecionados.push(it); busca.value = ''; sugestoes.classList.add('hidden'); atualizar(); };

  busca.addEventListener('input', () => {
    const r = buscar(busca.value, INGREDIENTES);
    sugestoes.innerHTML = '';
    if (!r.length) { sugestoes.classList.add('hidden'); return; }
    r.forEach((it) => sugestoes.append(h('button', { type: 'button', onClick: () => adicionar(it) }, it.pt, h('i', {}, it.inci))));
    sugestoes.classList.remove('hidden');
  });

  atualizar();
  return h('div', {},
    h('div', { class: 'card' },
      h('p', { class: 'muted' }, 'Adicione os ingredientes e ordene do maior pro menor na fórmula. A lista sai no formato INCI, o padrão da rotulagem cosmética.'),
      h('div', { class: 'field' }, h('label', {}, 'Ingrediente'), busca), sugestoes,
      h('div', { class: 'inline', style: { marginBottom: '12px' } }, outro, h('button', { class: 'btn sm', onClick: () => { const v = outro.value.trim(); if (!v) return; adicionar({ pt: v, inci: v }); outro.value = ''; } }, 'Add')),
      listaSel.children.length || selecionados.length ? listaSel : h('p', { class: 'muted center' }, 'Nenhum ingrediente ainda'),
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
      { emoji: '📐', titulo: 'Tamanhos em folha A4', sub: 'O app calcula quantos cabem ao escolher o modelo', static: true },
      { emoji: '🏠', titulo: 'Imprimir em casa', sub: 'Papel adesivo brilhante A4 (jato de tinta ou laser)', static: true },
      { emoji: '🖨️', titulo: 'Mandar pra gráfica', sub: 'Couchê adesivo 90g, PDF vetorial, sem sangria necessária', static: true },
      { emoji: '🎀', titulo: 'Tag de presente', sub: 'Papel kraft 180g ou couchê fosco 250g, furo de 4 mm, barbante ou fita', static: true },
    ]),
    h('div', { class: 'card' }, h('h3', {}, 'Dica'), h('p', { class: 'muted' }, 'Rótulo redondo de 50 mm serve pra tampa de pote de 100-250 g. Retangular 70×40 mm fica bom em sabonete em barra embalado em papel.')),
  );
}

export function montar(section, param) {
  let aba = param || 'criar';
  const render = (nova) => {
    if (nova) aba = nova;
    section.innerHTML = '';
    const tabs = h('div', { class: 'tabs' },
      ...[['criar', 'Criar'], ['inci', 'INCI'], ['datas', 'Datas'], ['embalagem', 'Papel']].map(([id, nome]) => h('button', { class: aba === id ? 'on' : '', onClick: () => render(id) }, nome)));
    const corpo = aba === 'inci' ? abaInci(section, render) : aba === 'datas' ? abaDatas() : aba === 'embalagem' ? abaEmbalagem() : abaCriar(section, render);
    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Rótulos & Etiquetas', sub: 'Redondo, retangular e tag · PDF pra gráfica' }),
      h('div', { class: 'content' }, tabs, corpo),
    ));
  };
  render();
  onboarding.pedirTipoProduto(() => render());
}
