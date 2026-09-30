// Editor de foto: corte, luz, estilo da marca e a marca por cima, tudo no navegador. Sai em JPG pronto pra publicar.
import { h, header, toast, baixar, chips, navegacao } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import { identidade } from './identidade.js';

export const ESTILOS = [
  { id: 'natural', nome: 'Natural', cor: '#F1E6D6', filtro: { brilho: 1.03, contraste: 1.0, saturacao: 0.95, sepia: 0.04 } },
  { id: 'botanico', nome: 'Botânico', cor: '#B9CBB0', filtro: { brilho: 1.0, contraste: 1.02, saturacao: 1.05, sepia: 0.08, matiz: 4 } },
  { id: 'rustico', nome: 'Rústico', cor: '#C9A27E', filtro: { brilho: 0.98, contraste: 1.06, saturacao: 0.9, sepia: 0.22 } },
  { id: 'blush', nome: 'Blush', cor: '#F3C9C4', filtro: { brilho: 1.06, contraste: 0.98, saturacao: 1.08, sepia: 0.06, matiz: -6 } },
  { id: 'estudio', nome: 'Estúdio', cor: '#E8E8E8', filtro: { brilho: 1.08, contraste: 1.1, saturacao: 0.9, sepia: 0 } },
  { id: 'eco', nome: 'Eco', cor: '#8FA68E', filtro: { brilho: 1.0, contraste: 1.0, saturacao: 0.8, sepia: 0.12, matiz: 8 } },
];
const CORTES = [{ id: '4:5', nome: 'Feed 4:5', r: 4 / 5 }, { id: '1:1', nome: 'Quadrado', r: 1 }, { id: '9:16', nome: 'Story 9:16', r: 9 / 16 }, { id: 'orig', nome: 'Original', r: 0 }];

export function montar(section) {
  const user = store.usuario();
  const f = store.get('fotos', {});
  const id = identidade();
  const estado = { estilo: f.estilo || 'natural', corte: '4:5', brilho: 1, contraste: 1, saturacao: 1, calor: 0, marca: true, frase: false, posicao: 'baixo' };
  const frase = typeof id.valores.frase === 'string' ? id.valores.frase : '';
  let img = null;

  const cv = h('canvas', { class: 'editor-cv', width: 1080, height: 1350 });
  const vazio = h('label', { class: 'editor-vazio' }, h('input', { type: 'file', accept: 'image/*', class: 'hidden', onChange: (e) => carregar(e.target.files && e.target.files[0]) }), h('span', { class: 'big' }, '📸'), h('b', {}, 'Toque pra escolher a foto'), h('small', {}, 'Da galeria ou tire agora'));
  const textoFrase = campo({ valor: frase, placeholder: 'Frase por cima da foto (opcional)' });
  textoFrase.input.addEventListener('input', desenhar);

  function carregar(file) {
    if (!file) return;
    const i = new Image();
    i.onload = () => { img = i; vazio.classList.add('hidden'); cv.classList.remove('hidden'); desenhar(); };
    i.src = URL.createObjectURL(file);
  }

  function desenhar() {
    if (!img) return;
    const corte = CORTES.find((c) => c.id === estado.corte);
    const razao = corte.r || img.width / img.height;
    const W = 1080; const H = Math.round(W / razao);
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const e = ESTILOS.find((x) => x.id === estado.estilo).filtro;
    c.filter = `brightness(${(e.brilho * estado.brilho).toFixed(3)}) contrast(${(e.contraste * estado.contraste).toFixed(3)}) saturate(${(e.saturacao * estado.saturacao).toFixed(3)}) sepia(${Math.min(1, e.sepia + Math.max(0, estado.calor) * 0.25).toFixed(3)}) hue-rotate(${(e.matiz || 0) + estado.calor * -6}deg)`;
    // corte centralizado cobrindo a tela
    const esc = Math.max(W / img.width, H / img.height);
    const dw = img.width * esc; const dh = img.height * esc;
    c.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    c.filter = 'none';
    if (estado.frase && textoFrase.input.value.trim()) {
      const t = textoFrase.input.value.trim();
      c.font = 'italic 300 56px Fraunces, serif'; c.fillStyle = '#FFF5EF'; c.textAlign = 'left'; c.shadowColor = 'rgba(44,26,30,0.55)'; c.shadowBlur = 24;
      const linhas = quebrar(c, t, W - 240);
      const y0 = estado.posicao === 'cima' ? 180 : H - 200 - (linhas.length - 1) * 66;
      linhas.forEach((l, i) => c.fillText(l, 120, y0 + i * 66));
      c.shadowBlur = 0;
    }
    if (estado.marca && user.marca) {
      c.font = '400 40px Poppins, sans-serif'; c.fillStyle = '#FFF5EF'; c.textAlign = 'right'; c.shadowColor = 'rgba(44,26,30,0.6)'; c.shadowBlur = 16;
      c.fillText(user.marca.replace(/\.$/, ''), W - 120 - 18, H - 96);
      c.fillStyle = '#FFB18B'; c.font = '700 40px Poppins, sans-serif'; c.fillText('.', W - 120, H - 96);
      c.shadowBlur = 0;
    }
  }
  function quebrar(c, texto, max) {
    const palavras = texto.split(' '); const linhas = []; let atual = '';
    for (const p of palavras) { const t = atual ? `${atual} ${p}` : p; if (c.measureText(t).width > max && atual) { linhas.push(atual); atual = p; } else atual = t; }
    if (atual) linhas.push(atual);
    return linhas.slice(0, 4);
  }

  const controle = (rotulo, chave, min, max, passo) => {
    const r = h('input', { type: 'range', min, max, step: passo, value: estado[chave], onInput: (e) => { estado[chave] = Number(e.target.value); desenhar(); } });
    return h('div', { class: 'field' }, h('label', {}, rotulo), r);
  };

  const estilos = h('div', { class: 'styles' }, ...ESTILOS.map((s) => h('button', { type: 'button', class: `style ${estado.estilo === s.id ? 'on' : ''}`, onClick: (e) => { estado.estilo = s.id; store.patch('fotos', { estilo: s.id }); [...estilos.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); desenhar(); } }, h('div', { class: 'sw', style: { background: s.cor } }), s.nome)));

  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Editor de foto', sub: 'Corte, luz, estilo e a sua marca por cima', voltar: '#fotos' }),
    h('div', { class: 'content editor' },
      h('div', { class: 'editor-palco' }, vazio, cv.classList.add('hidden') || cv),
      h('div', { class: 'editor-painel' },
        h('div', { class: 'card' },
          h('div', { class: 'field' }, h('label', {}, 'Corte'), chips({ opcoes: CORTES, valor: estado.corte, aoMudar: (v) => { estado.corte = v; desenhar(); } })),
          h('div', { class: 'field' }, h('label', {}, 'Estilo da marca'), estilos),
          controle('Brilho', 'brilho', 0.7, 1.3, 0.01), controle('Contraste', 'contraste', 0.7, 1.3, 0.01), controle('Cor', 'saturacao', 0.4, 1.5, 0.01), controle('Calor', 'calor', -1, 1, 0.05)),
        h('div', { class: 'card' },
          h('label', { class: 'check', style: { padding: '6px 0' } }, h('input', { type: 'checkbox', checked: estado.marca, onChange: (e) => { estado.marca = e.target.checked; desenhar(); } }), h('div', { class: 'txt' }, h('b', {}, 'Marca no canto'), h('span', {}, user.marca || 'Defina o nome da marca no perfil'))),
          h('label', { class: 'check', style: { padding: '6px 0' } }, h('input', { type: 'checkbox', checked: estado.frase, onChange: (e) => { estado.frase = e.target.checked; desenhar(); } }), h('div', { class: 'txt' }, h('b', {}, 'Frase por cima'))),
          h('div', { class: 'field' }, textoFrase.el),
          h('div', { class: 'field' }, h('label', {}, 'Posição da frase'), chips({ opcoes: [{ id: 'baixo', nome: 'Embaixo' }, { id: 'cima', nome: 'Em cima' }], valor: estado.posicao, aoMudar: (v) => { estado.posicao = v; desenhar(); } })),
          h('div', { class: 'btn-row' },
            h('label', { class: 'btn white' }, h('input', { type: 'file', accept: 'image/*', class: 'hidden', onChange: (e) => carregar(e.target.files && e.target.files[0]) }), 'Outra foto'),
            h('button', { class: 'btn peach', type: 'button', onClick: () => { if (!img) { toast('Escolha uma foto primeiro'); return; } cv.toBlob((b) => baixar(b, `foto-${(user.marca || 'artesana').toLowerCase().replace(/\s+/g, '-')}.jpg`), 'image/jpeg', 0.92); } }, 'Baixar JPG'))),
        h('p', { class: 'muted' }, 'Tirar o fundo da foto com IA entra no plano Florescer. Enquanto isso, fundo limpo na hora da foto resolve: cartolina, linho ou tábua de madeira.')),
      navegacao({ atual: 'fotos', voltar: 'fotos' }),
    ),
  ));
}
