// Aba "Anvisa" da tela de rótulos: contra-rótulo com os dados que a norma exige.
import { h, toast, modal } from '../ui.js';
import { campo as campoVoz, area as areaVoz } from '../campos.js';
import * as store from '../store.js';
import { gerarInci } from '../lib/inci.js';
import { gradeA4 } from '../lib/rotulo.js';
import { numeroFormatado } from '../lib/whatsapp.js';
import { NORMA, CAMPOS, TAMANHOS, conferir, camposObrigatorios, composicaoEmPortugues, linhasDoRotulo } from '../lib/rotulo-anvisa.js';

const ESCALA = 4; // px por mm no preview
const FONTE_MAX = 2.6; // mm
const FONTE_MIN = 1.3; // mm

function dadosIniciais() {
  const salvo = store.get('rotulo_completo', {});
  const user = store.usuario();
  const rot = store.get('rotulos', {});
  const wa = store.get('whatsapp', {});
  const padrao = {
    produto: (rot.ultimoRotulo || {}).produto || store.get('onboarding', {}).tipoProduto || '',
    marca: user.marca || '',
    conteudo: (rot.ultimoRotulo || {}).peso || '',
    inci: gerarInci(rot.inci || []),
    composicaoPt: composicaoEmPortugues(rot.inci || []),
    atendimento: wa.ddd && wa.numero ? numeroFormatado(wa) : '',
    origem: 'Brasil',
    tamanho: 'c9050',
    artesanal: false,
  };
  const d = { ...padrao, ...salvo };
  for (const k of Object.keys(padrao)) if (d[k] === '' && padrao[k]) d[k] = padrao[k];
  return d;
}

// Monta o rótulo em `unidade` (px no preview, mm na impressão) com a fonte em mm informada.
function desenhar(d, fonteMm, escala, unidade) {
  const t = TAMANHOS.find((x) => x.id === d.tamanho) || TAMANHOS[1];
  const u = (mm) => `${(mm * escala).toFixed(2)}${unidade}`;
  const el = h('div', { class: 'rot-completo', style: { width: u(t.largura), height: u(t.altura), padding: u(2.5), fontSize: u(fonteMm) } });
  for (const l of linhasDoRotulo(d)) {
    const classe = l.titulo ? 'rc-marca' : l.subtitulo ? 'rc-produto' : l.destaque ? 'rc-destaque' : 'rc-linha';
    el.append(h('div', { class: classe }, l.rotulo ? h('b', {}, `${l.rotulo}: `) : null, l.texto));
  }
  return el;
}

// Maior fonte, entre FONTE_MAX e FONTE_MIN, em que o texto cabe na etiqueta.
function ajustarFonte(d, palco) {
  let fonte = FONTE_MAX;
  let el = null;
  for (; fonte >= FONTE_MIN - 0.001; fonte = +(fonte - 0.1).toFixed(2)) {
    el = desenhar(d, fonte, ESCALA, 'px');
    palco.innerHTML = '';
    palco.append(el);
    if (el.scrollHeight <= el.clientHeight + 1) return { fonte, el, cabe: true };
  }
  return { fonte: FONTE_MIN, el, cabe: false };
}

export function abaAnvisa() {
  const d = dadosIniciais();
  let timer = null;
  const salvar = () => { clearTimeout(timer); timer = setTimeout(() => store.set('rotulo_completo', d), 300); };

  const palco = h('div', { class: 'rc-palco' });
  const aviso = h('p', { class: 'muted rc-aviso' });
  const lista = h('ul', { class: 'rc-lista' });
  const contagem = h('b', {});
  const barra = h('i', {});
  let ajuste = { fonte: FONTE_MAX, cabe: true };

  const atualizar = () => {
    salvar();
    ajuste = ajustarFonte(d, palco);
    const t = TAMANHOS.find((x) => x.id === d.tamanho) || TAMANHOS[1];
    const g = gradeA4({ largura: t.largura, altura: t.altura });
    aviso.textContent = ajuste.cabe
      ? `Cabem ${g.total} etiquetas por folha A4. Letra de ${ajuste.fonte.toFixed(1).replace('.', ',')} mm.`
      : 'O texto não cabe nesse tamanho. Escolha uma etiqueta maior ou encurte algum campo.';
    aviso.classList.toggle('erro', !ajuste.cabe);
    const r = conferir(d);
    contagem.textContent = `${r.preenchidos} de ${r.obrigatorios} dados obrigatórios`;
    barra.style.width = `${(r.preenchidos / r.obrigatorios) * 100}%`;
    lista.innerHTML = '';
    for (const c of camposObrigatorios(d)) {
      const ok = !r.faltando.some((f) => f.id === c.id);
      lista.append(h('li', { class: ok ? 'ok' : '' }, h('span', { class: 'marca' }, ok ? '✓' : ''), c.rotulo));
    }
    const cpf = r.documento === 'cpf';
    for (const el of corpo.querySelectorAll('[data-so-com-cnpj]')) el.classList.toggle('dispensado', cpf);
    const nota = corpo.querySelector('#rc-nota-documento');
    if (nota) nota.textContent = cpf
      ? 'Com CPF o rótulo sai como produto artesanal, sem AFE e processo. Pra atender a norma da Anvisa é preciso CNPJ: o MEI dá um na hora, de graça.'
      : (CAMPOS.find((c) => c.id === 'cnpj').nota);
  };

  const campo = (c) => {
    const cv = c.multi
      ? areaVoz({ valor: d[c.id] || '', id: `rc-${c.id}`, rows: '3', placeholder: `Ex: ${c.exemplo}` })
      : campoVoz({ valor: d[c.id] || '', id: `rc-${c.id}`, placeholder: `Ex: ${c.exemplo}` });
    cv.input.addEventListener('input', () => { d[c.id] = cv.input.value; atualizar(); });
    return h('div', { class: 'field', 'data-so-com-cnpj': c.soComCnpj ? '1' : null },
      h('label', { for: `rc-${c.id}` }, c.rotulo, c.obrigatorio ? h('span', { class: 'obrig' }, ' *') : null),
      cv.el, c.nota ? h('div', { class: 'hint', id: c.id === 'cnpj' ? 'rc-nota-documento' : null }, c.nota) : null);
  };

  const tamanho = h('select', { class: 'select', id: 'rc-tamanho' }, ...TAMANHOS.map((t) => h('option', { value: t.id }, t.nome)));
  tamanho.value = d.tamanho;
  tamanho.addEventListener('change', () => { d.tamanho = tamanho.value; atualizar(); });

  const artesanal = h('input', { type: 'checkbox', checked: !!d.artesanal, onChange: (e) => { d.artesanal = e.target.checked; atualizar(); } });

  const exportar = () => {
    if (!ajuste.cabe) { toast('O texto não cabe nesse tamanho de etiqueta'); return; }
    const t = TAMANHOS.find((x) => x.id === d.tamanho) || TAMANHOS[1];
    const g = gradeA4({ largura: t.largura, altura: t.altura });
    const folha = document.getElementById('folha-a4');
    folha.innerHTML = '';
    for (const pos of g.posicoes) {
      const el = desenhar(d, ajuste.fonte, 1, 'mm');
      el.style.position = 'absolute'; el.style.left = `${pos.x}mm`; el.style.top = `${pos.y}mm`;
      folha.append(el);
    }
    const r = conferir(d);
    modal({
      titulo: 'Exportar PDF',
      corpo: h('div', {},
        h('p', {}, `Vai abrir a janela de impressão com ${g.total} etiquetas numa folha A4.`),
        r.completo ? null : h('p', { class: 'rc-aviso erro' }, `Atenção: ${r.faltando.length === 1 ? 'falta 1 dado obrigatório' : `faltam ${r.faltando.length} dados obrigatórios`} (${r.faltando.map((c) => c.rotulo.toLowerCase()).join(', ')}).`),
        h('p', { class: 'muted' }, 'Na janela de impressão, escolha "Salvar como PDF".')),
      botoes: [{ texto: 'Cancelar', classe: 'white' }, { texto: 'Abrir impressão', classe: 'peach', onClick: () => { requestAnimationFrame(() => setTimeout(() => window.print(), 150)); } }],
    });
  };

  const grupo = (titulo, ids) => h('div', { class: 'card' }, h('h3', { style: { marginBottom: '10px' } }, titulo), ...CAMPOS.filter((c) => ids.includes(c.id)).map(campo));

  const corpo = h('div', { class: 'rot-layout' },
    h('div', { class: 'rot-lado' }, h('div', { class: 'rot-preview-wrap' }, palco, aviso)),
    h('div', { class: 'rot-form' },
    h('div', { class: 'card' },
      h('h3', {}, 'Os dados que a Anvisa exige no rótulo'),
      h('p', { class: 'muted', style: { marginTop: '6px' } }, `Campos da ${NORMA.nome}, ${NORMA.artigo}, com a composição também em português (${NORMA.composicaoPt}). Conferido em ${NORMA.conferidoEm}.`),
      h('div', { class: 'progress-label', style: { marginTop: '12px' } }, contagem),
      h('div', { class: 'progress dark' }, barra),
      lista),
    h('div', { class: 'card' },
      h('div', { class: 'field' }, h('label', { for: 'rc-tamanho' }, 'Tamanho da etiqueta'), tamanho),
      h('div', { class: 'check', style: { padding: '4px 0' } },
        h('div', { class: 'txt' }, h('b', {}, 'Mostrar "Produto artesanal"'), h('span', {}, 'A regra própria do artesanal ainda não foi publicada pela Anvisa')),
        h('label', { class: 'switch' }, artesanal, h('i')))),
    grupo('Produto', ['produto', 'marca', 'grupo', 'conteudo']),
    grupo('Lote e validade', ['lote', 'fabricacao', 'validade']),
    grupo('Composição', ['inci', 'composicaoPt']),
    grupo('Quem fabrica', ['titular', 'cnpj', 'afe', 'processo', 'atendimento', 'origem']),
    grupo('Uso', ['modoUso', 'advertencias']),
    h('div', { class: 'card' },
      h('button', { class: 'btn peach block', type: 'button', onClick: exportar }, 'Exportar PDF com os dados da Anvisa'),
      h('p', { class: 'muted', style: { marginTop: '10px' } }, 'O app organiza o rótulo com os campos da norma. A regularização do produto e da empresa na Anvisa é um passo seu, e o conteúdo informado é de sua responsabilidade.'))),
  );
  // o preview precisa estar no documento pra medir se o texto cabe
  requestAnimationFrame(atualizar);
  return corpo;
}
