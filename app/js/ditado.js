// Botão de falar em vez de digitar. Usa o reconhecimento de voz do próprio navegador
// (SpeechRecognition): Chrome no Android e no computador, Safari no iPhone. Onde não existe, o
// campo fica como está e o teclado do celular continua tendo o microfone dele.
import { h, toast } from './ui.js';
import { juntarDitado, mensagemErroDitado } from './lib/ditado.js';

const Reconhecedor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const temDitado = () => Boolean(Reconhecedor);

const ROTULO = 'Falar em vez de digitar';
const OUVINDO = 'Ouvindo. Toque de novo pra parar';
let pararAtivo = null; // só um ditado por vez na tela

function icone() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path fill="currentColor" d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4zm6-4a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93V22h2v-3.07A8 8 0 0 0 20 11h-2z"/>';
  return svg;
}

// comDitado(campo) -> o campo dentro de um envelope com o botão do microfone.
// Quem chama continua ouvindo 'input' no campo: o ditado dispara esse evento a cada trecho.
export function comDitado(campo) {
  if (!Reconhecedor) return campo;
  const multi = campo.tagName === 'TEXTAREA';
  const btn = h('button', { type: 'button', class: 'mic', 'aria-label': ROTULO, title: ROTULO }, icone());
  const wrap = h('div', { class: `ditado ${multi ? 'multi' : ''}` }, campo, btn);
  let rec = null;
  let base = '';

  const terminar = () => {
    rec = null;
    if (pararAtivo === parar) pararAtivo = null;
    btn.classList.remove('on');
    btn.setAttribute('aria-label', ROTULO); btn.title = ROTULO;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const parar = () => { const r = rec; if (r) { rec = null; try { r.stop(); } catch { /* já parou */ } } };

  btn.addEventListener('click', () => {
    if (rec) { parar(); return; }
    if (pararAtivo) pararAtivo();
    rec = new Reconhecedor();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = multi;
    rec.maxAlternatives = 1;
    base = campo.value;
    rec.onresult = (e) => {
      let falado = '';
      for (const r of e.results) falado += `${r[0].transcript} `;
      campo.value = juntarDitado(base, falado);
      campo.scrollTop = campo.scrollHeight;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = (e) => { const m = mensagemErroDitado(e.error); if (m) toast(m, 3500); };
    rec.onend = terminar;
    pararAtivo = parar;
    btn.classList.add('on');
    btn.setAttribute('aria-label', OUVINDO); btn.title = OUVINDO;
    try { rec.start(); } catch { terminar(); }
  });
  return wrap;
}

// Linha de dica pra mostrar uma vez por tela, só onde o ditado existe.
export function dicaDitado() {
  return Reconhecedor ? h('p', { class: 'dica-ditado' }, icone(), ' Pode falar em vez de digitar: toque no microfone do campo.') : null;
}
