// Ferramentas que criam coisas a partir do perfil: paleta, logo, frase, end card, legendas, calendário,
// análises, agenda, métricas, roteiro de reel, locução e capa de vídeo. Rota #criar/<ferramenta>.
import { h, header, toast, copiar, baixar, chips, navegacao, cartoes } from '../ui.js';
import { campo, area } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import { NICHOS, PERSONALIDADES, nichosDe, nichoPrincipal } from '../lib/perfil.js';
import { VOZ, frasesDeImpacto, legendas, biosInstagram, calendarioMes, analisePublico, roteiroReel, remixLogo } from '../lib/geradores.js';
import { gerarQrDataUrl } from './whatsapp.js';
import { identidade, salvarItem } from './identidade.js';
import { semProtocolo } from '../site.js';

const SEQ = {
  identidade: ['paleta', 'logo', 'frase', 'endcard', 'fotos-coringas'],
  social: ['legendas', 'calendario', 'analise-instagram', 'perfis-referencia', 'analise-publico', 'agendar', 'metricas'],
  fotos: ['reels', 'locucao', 'editar-video'],
};
const TITULOS = {
  paleta: 'Paleta de cores', logo: 'Logo', frase: 'Frase de impacto', endcard: 'End card para reels', 'fotos-coringas': 'Fotos coringas',
  legendas: 'Legendas', calendario: 'Calendário do mês', 'analise-instagram': 'Análise do perfil', 'perfis-referencia': 'Perfis de referência',
  'analise-publico': 'Análise de público', agendar: 'Agenda de publicações', metricas: 'Métricas', reels: 'Roteiro de reel', locucao: 'Locução', 'editar-video': 'Capa e edição do vídeo',
};

const PALETAS = {
  delicada: [['#FFD9C4', '#F3C9C4', '#FFF5EF', '#6B5A5D'], ['#E8D5E0', '#F7EDF0', '#C9B8B3', '#4A3F44']],
  rustica: [['#C9A27E', '#8B5E3C', '#F1E6D6', '#3E2A1E'], ['#B9CBB0', '#7A6A53', '#EFE7DA', '#2E3A2B']],
  sofisticada: [['#2C1A1E', '#CC9828', '#FFF5EF', '#6B5A5D'], ['#1F2A24', '#C9B79C', '#F5F1EA', '#8C8C8C']],
  alegre: [['#FFB18B', '#FFD166', '#8FA68E', '#2C1A1E'], ['#F58529', '#F3C9C4', '#DCE6D9', '#2C1A1E']],
};
const PALETAS_MARCA = [['#FFF5EF', '#FFB18B', '#4A6348', '#2C1A1E'], ['#DCE6D9', '#4A6348', '#CC9828', '#2C1A1E']];

const ctx = () => ({ user: store.usuario(), o: store.get('onboarding', {}), ig: store.get('instagram', {}), wa: store.get('whatsapp', {}), id: identidade() });

// ---------- desenho do logo em canvas (mesmas fontes da página, com download em PNG) ----------
const ESTILOS_LOGO = ['suave', 'forte', 'assinatura'];
function coresDoLogo(id, o) {
  const paleta = Array.isArray(id.valores.paleta) && id.valores.paleta.length >= 3 ? id.valores.paleta : (PALETAS[o.personalidade] || PALETAS_MARCA)[0];
  return { fundo: paleta[2] || '#FFF5EF', texto: paleta[3] || '#2C1A1E', destaque: paleta[1] || '#FFB18B' };
}
function desenharLogo(cv, { marca, tagline, estilo, cores, transparente = false }) {
  const c = cv.getContext('2d');
  const W = cv.width; const H = cv.height; const u = W / 600;
  c.clearRect(0, 0, W, H);
  if (!transparente) { c.fillStyle = cores.fundo; c.fillRect(0, 0, W, H); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const nome = marca || 'sua marca';
  const ajustar = (fonte, max) => { c.font = fonte; let tam = parseFloat(fonte); while (c.measureText(nome).width > max && tam > 10) { tam -= 2; c.font = fonte.replace(/\d+px/, `${tam}px`); } };
  if (estilo === 'suave') {
    ajustar(`400 ${88 * u}px Fraunces, serif`, W * 0.82);
    c.fillStyle = cores.texto; c.fillText(nome, W / 2, H * 0.46);
    const larg = c.measureText(nome).width;
    c.fillStyle = cores.destaque; c.beginPath(); c.arc(W / 2 + larg / 2 + 14 * u, H * 0.46 + 24 * u, 8 * u, 0, Math.PI * 2); c.fill();
    c.font = `500 ${18 * u}px Poppins, sans-serif`; c.fillStyle = cores.texto; c.globalAlpha = 0.75; c.fillText(tagline.toLowerCase(), W / 2, H * 0.68); c.globalAlpha = 1;
  } else if (estilo === 'forte') {
    c.fillStyle = cores.destaque; c.beginPath(); c.arc(W / 2, H * 0.24, 14 * u, 0, Math.PI * 2); c.fill();
    ajustar(`700 ${52 * u}px Poppins, sans-serif`, W * 0.8);
    c.fillStyle = cores.texto; c.letterSpacing = `${10 * u}px`; c.fillText(nome.toUpperCase(), W / 2 + 5 * u, H * 0.5); c.letterSpacing = '0px';
    c.strokeStyle = cores.destaque; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(W * 0.3, H * 0.66); c.lineTo(W * 0.7, H * 0.66); c.stroke();
    c.font = `400 ${16 * u}px Poppins, sans-serif`; c.letterSpacing = `${4 * u}px`; c.fillText(tagline.toUpperCase(), W / 2 + 2 * u, H * 0.78); c.letterSpacing = '0px';
  } else {
    ajustar(`italic 300 ${92 * u}px Fraunces, serif`, W * 0.84);
    c.fillStyle = cores.texto; c.fillText(nome, W / 2, H * 0.44);
    const larg = Math.min(c.measureText(nome).width, W * 0.84);
    c.strokeStyle = cores.destaque; c.lineWidth = 5 * u; c.lineCap = 'round'; c.beginPath();
    c.moveTo(W / 2 - larg / 2, H * 0.62); c.bezierCurveTo(W / 2 - larg / 4, H * 0.58, W / 2 + larg / 4, H * 0.66, W / 2 + larg / 2, H * 0.6); c.stroke();
    c.font = `400 ${18 * u}px Poppins, sans-serif`; c.fillStyle = cores.texto; c.globalAlpha = 0.8; c.fillText(tagline, W / 2, H * 0.78); c.globalAlpha = 1;
  }
}

// ---------- ferramentas ----------
const FERRAMENTAS = {
  paleta(k) {
    const base = [...(PALETAS[k.o.personalidade] || []), ...PALETAS_MARCA, ...Object.values(PALETAS).flat().filter((p) => !(PALETAS[k.o.personalidade] || []).includes(p)).slice(0, 2)];
    const atual = Array.isArray(k.id.valores.paleta) ? k.id.valores.paleta.join(',') : '';
    const lista = h('div', { class: 'paletas' }, ...base.map((p) => h('button', { type: 'button', class: `paleta ${p.join(',') === atual ? 'on' : ''}`, onClick: () => { salvarItem('paleta', p); toast('Paleta salva'); router.ir('#criar/paleta'); } },
      h('span', { class: 'amostras grandes' }, ...p.map((x) => h('i', { style: { background: x } }))), h('small', {}, p.join(' · ')))));
    const propria = campo({ valor: atual ? k.id.valores.paleta.join(', ') : '', placeholder: 'Ou cole as suas: #FFB18B, #4A6348, #FFF5EF' });
    return { nos: [
      h('p', { class: 'muted' }, 'Quatro cores bastam: uma clara pro fundo, uma de destaque, uma pro texto e uma de apoio. Escolha uma paleta ou cole a sua.'),
      lista,
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Minha paleta'), propria.el)),
    ], salvar: () => { const c = (propria.input.value.match(/#[0-9a-f]{6}\b/gi) || []).map((x) => x.toUpperCase()); if (c.length >= 2) salvarItem('paleta', c); return true; } };
  },

  logo(k) {
    const marca = k.user.marca || 'Sua marca';
    const nicho = NICHOS.find((n) => n.id === nichoPrincipal(k.o));
    const tagline = k.o.nichoOutro || (nicho ? nicho.nome.replace(' em geral', '') : 'feito à mão');
    const cores = coresDoLogo(k.id, k.o);
    const paletas = [cores, { fundo: '#FFF5EF', texto: '#2C1A1E', destaque: '#FFB18B' }, { fundo: '#4A6348', texto: '#FFF5EF', destaque: '#FFB18B' }];
    const opcoes = ESTILOS_LOGO.map((estilo, i) => ({ estilo, cores: paletas[i] }));
    const salvo = k.id.valores.logo && typeof k.id.valores.logo === 'object' ? k.id.valores.logo : null;
    let escolhido = salvo ? { estilo: salvo.estilo, cores: salvo.cores } : null;
    const grade = h('div', { class: 'logos' });
    const desenharTodos = () => {
      grade.innerHTML = '';
      opcoes.forEach((op, i) => {
        const cv = h('canvas', { width: 600, height: 300, class: 'logo-cv' });
        desenharLogo(cv, { marca, tagline, ...op });
        const on = escolhido && escolhido.estilo === op.estilo && JSON.stringify(escolhido.cores) === JSON.stringify(op.cores);
        grade.append(h('div', { class: `logo-opcao ${on ? 'on' : ''}` }, h('b', {}, i < 3 ? `Opção ${i + 1}` : 'Remix'), cv,
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn peach sm', type: 'button', onClick: () => { escolhido = op; salvarItem('logo', { estilo: op.estilo, cores: op.cores, marca }); toast('Logo escolhido'); desenharTodos(); } }, on ? 'Escolhido' : 'Usar este'),
            h('button', { class: 'btn white sm', type: 'button', onClick: () => baixarLogo(op, false) }, 'PNG'),
            h('button', { class: 'btn white sm', type: 'button', onClick: () => baixarLogo(op, true) }, 'PNG sem fundo'))));
      });
    };
    const baixarLogo = (op, transparente) => {
      const cv = h('canvas', { width: 2400, height: 1200 });
      desenharLogo(cv, { marca, tagline, ...op, transparente });
      cv.toBlob((b) => baixar(b, `logo-${marca.toLowerCase().replace(/\s+/g, '-')}${transparente ? '-sem-fundo' : ''}.png`), 'image/png');
    };
    const remix = campo({ placeholder: 'Ex.: quero a tipografia da 1 com as cores da 3' });
    const aplicarRemix = () => {
      const r = remixLogo(remix.input.value);
      if (!r.tipografia && !r.cores) { toast('Diga de qual opção quer a tipografia e de qual quer as cores'); return; }
      const t = opcoes[(r.tipografia || 1) - 1] || opcoes[0]; const c = opcoes[(r.cores || 1) - 1] || opcoes[0];
      opcoes[3] = { estilo: t.estilo, cores: c.cores };
      desenharTodos();
      toast('Remix montado, é a quarta opção');
    };
    document.fonts.ready.then(desenharTodos);
    desenharTodos();
    return { nos: [
      h('p', { class: 'muted' }, 'Três logos feitos com o nome da sua marca, a paleta e a personalidade que você escolheu. Baixe em PNG, com ou sem fundo.'),
      grade,
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Caixa de remix'), remix.el, h('div', { class: 'hint' }, 'Fale ou escreva: "a fonte da 2 com as cores da 1".')), h('button', { class: 'btn block', type: 'button', onClick: aplicarRemix }, 'Montar o remix')),
    ] };
  },

  frase(k) {
    const frases = frasesDeImpacto({ marca: k.user.marca, onboarding: k.o });
    const atual = typeof k.id.valores.frase === 'string' ? k.id.valores.frase : '';
    const propria = area({ valor: atual, placeholder: 'Ou escreva a sua, falando ou digitando', rows: '2' });
    const lista = h('div', { class: 'frases' }, ...frases.map((f) => h('button', { type: 'button', class: `frase-opcao ${f === atual ? 'on' : ''}`, onClick: () => { propria.input.value = f; salvarItem('frase', f); toast('Frase escolhida'); router.ir('#criar/frase'); } }, h('span', { class: 'aspas' }, '“'), f)));
    return { nos: [
      h('p', { class: 'muted' }, 'Seis frases saídas da sua história e da personalidade da marca. Toque numa pra escolher, ou escreva a sua.'),
      lista,
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Minha frase'), propria.el),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn white', type: 'button', onClick: () => copiar(propria.input.value, 'Frase copiada') }, 'Copiar'),
          h('button', { class: 'btn ghost', type: 'button', onClick: () => { const f = propria.input.value.trim(); if (!f) return; salvarItem('frase', f); const r = store.get('rotulos', {}); store.set('rotulos', { ...r, ultimoRotulo: { ...(r.ultimoRotulo || {}), frase: f } }); toast('Frase salva e usada no rótulo'); } }, 'Usar no rótulo'))),
    ], salvar: () => { const f = propria.input.value.trim(); if (f) salvarItem('frase', f); return true; } };
  },

  endcard(k) {
    const marca = k.user.marca || 'Sua marca';
    const cores = coresDoLogo(k.id, k.o);
    const salvo = k.id.valores.endcard && typeof k.id.valores.endcard === 'object' ? k.id.valores.endcard : {};
    let formas = salvo.formas || ['PIX', 'Entrega'];
    const frase = typeof k.id.valores.frase === 'string' ? k.id.valores.frase : '';
    const link = k.wa.linkCurto || k.wa.link || '';
    const qr = link ? gerarQrDataUrl(k.wa.link || link, 360, cores.texto) : null;
    const cv = h('canvas', { width: 1080, height: 1920, class: 'endcard-cv' });
    const desenhar = () => {
      const c = cv.getContext('2d');
      c.fillStyle = cores.fundo; c.fillRect(0, 0, 1080, 1920);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = cores.texto;
      c.font = '400 110px Fraunces, serif'; let tam = 110; while (c.measureText(marca).width > 900 && tam > 40) { tam -= 4; c.font = `400 ${tam}px Fraunces, serif`; }
      c.fillText(marca, 540, 420);
      c.fillStyle = cores.destaque; c.beginPath(); c.arc(540 + Math.min(c.measureText(marca).width, 900) / 2 + 22, 452, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = cores.texto;
      if (frase) { c.font = 'italic 300 44px Fraunces, serif'; c.fillText(frase.length > 48 ? frase.slice(0, 46) + '…' : frase, 540, 560); }
      let y = 700;
      if (k.ig.arroba) { c.font = '500 52px Poppins, sans-serif'; c.fillText(k.ig.arroba, 540, y); y += 90; }
      if (link) { c.font = '400 44px Poppins, sans-serif'; c.fillText(semProtocolo(link), 540, y); y += 60; }
      if (qr) { const img = new Image(); img.onload = () => { c.fillStyle = '#fff'; c.fillRect(360, y + 40, 360, 360); c.drawImage(img, 372, y + 52, 336, 336); desenharFormas(y + 470); }; img.src = qr; } else desenharFormas(y + 60);
      function desenharFormas(y0) {
        c.font = '500 36px Poppins, sans-serif'; c.textAlign = 'center';
        const larguras = formas.map((f) => c.measureText(f).width + 60);
        const total = larguras.reduce((a, b) => a + b, 0) + (formas.length - 1) * 20;
        let x = 540 - total / 2;
        formas.forEach((f, i) => { c.fillStyle = cores.destaque; c.beginPath(); c.roundRect(x, y0, larguras[i], 70, 35); c.fill(); c.fillStyle = cores.texto; c.fillText(f, x + larguras[i] / 2, y0 + 35); x += larguras[i] + 20; });
        c.font = '400 30px Poppins, sans-serif'; c.fillStyle = cores.texto; c.globalAlpha = 0.7; c.fillText('feito à mão, com carinho', 540, 1720); c.globalAlpha = 1;
      }
    };
    document.fonts.ready.then(desenhar); desenhar();
    const opcoesFormas = ['PIX', 'Cartão', 'Entrega', 'Retirada', 'Correios', 'Encomenda'].map((f) => ({ id: f, nome: f }));
    return { nos: [
      h('p', { class: 'muted' }, 'O cartão que fecha o reel: marca, @, link do WhatsApp com QR e como comprar. Sai em 1080 × 1920, pra colar nos últimos 3 segundos.'),
      h('div', { class: 'endcard-palco' }, cv),
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Formas de compra'), chips({ opcoes: opcoesFormas, valor: formas, multi: true, aoMudar: (v) => { formas = v; desenhar(); } })),
        link ? null : h('p', { class: 'muted' }, 'Crie o link do WhatsApp pra ele entrar com o QR. ', h('a', { href: '#whatsapp' }, 'Criar agora')),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn peach', type: 'button', onClick: () => cv.toBlob((b) => { baixar(b, 'end-card.png'); salvarItem('endcard', { formas }); }, 'image/png') }, 'Baixar PNG'),
          h('button', { class: 'btn white', type: 'button', onClick: () => { salvarItem('endcard', { formas }); toast('End card salvo'); } }, 'Salvar'))),
    ], salvar: () => { salvarItem('endcard', { formas }); return true; } };
  },

  'fotos-coringas'(k) {
    const v = VOZ[nichoPrincipal(k.o)] || VOZ.artesanato;
    const ideias = [
      `O ${v.faz} sozinho, fundo limpo, luz de janela (a foto de catálogo)`, `Nas suas mãos, mostrando o tamanho`, `De cima, com os ingredientes ou materiais em volta`,
      `Embalado, com o rótulo virado pra frente`, `Em uso: ${v.gesto} com o ${v.faz} no lugar dele`, `Kit de presente montado, com tag`, `Você produzindo, sem olhar pra câmera`, `Detalhe bem de perto: textura, cor, acabamento`,
    ];
    const salvo = k.id.valores.fotos && typeof k.id.valores.fotos === 'object' ? k.id.valores.fotos : {};
    const marcados = { ...salvo };
    const lista = h('ul', { class: 'list' }, ...ideias.map((t, i) => h('li', {}, h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked: !!marcados[i], onChange: (e) => { marcados[i] = e.target.checked; salvarItem('fotos', marcados, Object.values(marcados).filter(Boolean).length >= 3); } }),
      h('div', { class: 'txt' }, h('b', {}, `${i + 1}. ${t}`))))));
    return { nos: [
      h('p', { class: 'muted' }, 'Oito fotos que resolvem feed, catálogo e rótulo por meses. Marque as que você já tem; as outras viram a sua lista de hoje.'),
      lista,
      h('div', { class: 'card' }, h('p', {}, 'Pra tirar bem: ', h('a', { href: '#fotos' }, 'tutorial de foto com celular'), '. Pra ajustar depois: ', h('a', { href: '#editor' }, 'editor de foto'), '.')),
    ] };
  },

  legendas(k) {
    let tipo = 'post';
    const tema = campo({ placeholder: 'Tema de hoje (opcional): lançamento, bastidor, promoção...' });
    const produto = campo({ valor: k.o.tipoProduto || '', placeholder: 'Produto' });
    const saida = h('div', { class: 'legendas' });
    const gerar = () => {
      saida.innerHTML = '';
      legendas({ tipo, marca: k.user.marca, onboarding: k.o, produto: produto.input.value, tema: tema.input.value }).forEach((t, i) => saida.append(h('div', { class: 'card' }, h('b', {}, `Opção ${i + 1}`), h('pre', { class: 'perfil-resumo' }, t), h('div', { class: 'btn-row' }, h('button', { class: 'btn white sm', type: 'button', onClick: () => copiar(t, 'Legenda copiada') }, 'Copiar'), h('button', { class: 'btn ghost sm', type: 'button', onClick: () => { const ag = store.get('agenda', []); ag.push({ id: Date.now(), data: new Date().toISOString().slice(0, 10), hora: '19:00', tipo, tema: tema.input.value || produto.input.value, texto: t, feito: false }); store.set('agenda', ag); toast('Salva na agenda'); } }, 'Salvar na agenda'))));
    };
    const abas = h('div', { class: 'tabs' }, ...['post', 'story', 'reel', 'carrossel'].map((t) => h('button', { type: 'button', class: t === tipo ? 'on' : '', onClick: (e) => { tipo = t; [...abas.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); gerar(); } }, t[0].toUpperCase() + t.slice(1))));
    gerar();
    return { nos: [abas, h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Produto'), produto.el), h('div', { class: 'field' }, h('label', {}, 'Tema'), tema.el), h('button', { class: 'btn block', type: 'button', onClick: gerar }, 'Gerar de novo')), saida] };
  },

  calendario(k) {
    const hoje = new Date();
    let ano = hoje.getFullYear(); let mes = hoje.getMonth() + 1;
    const corpo = h('div', {});
    const titulo = h('h3', {});
    const desenhar = () => {
      const c = calendarioMes({ ano, mes, onboarding: k.o });
      titulo.textContent = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      corpo.innerHTML = '';
      c.avisos.forEach((a) => corpo.append(h('p', { class: 'banner', style: { fontSize: '13.5px' } }, a)));
      corpo.append(h('ul', { class: 'list' }, ...c.dias.map((d) => h('li', {}, h('div', { class: 'item static' },
        h('span', { class: 'dia' }, String(d.dia).padStart(2, '0')),
        h('span', { class: 'txt' }, h('b', {}, d.tipo[0].toUpperCase() + d.tipo.slice(1)), h('span', {}, d.tema)),
        h('button', { class: 'btn white sm', type: 'button', onClick: () => { const ag = store.get('agenda', []); ag.push({ id: Date.now(), data: `${ano}-${String(mes).padStart(2, '0')}-${String(d.dia).padStart(2, '0')}`, hora: '19:00', tipo: d.tipo, tema: d.tema, texto: '', feito: false }); store.set('agenda', ag); toast('Na agenda'); } }, 'Agendar'))))));
      const texto = c.dias.map((d) => `${String(d.dia).padStart(2, '0')}/${String(mes).padStart(2, '0')} ${d.tipo}: ${d.tema}`).join('\n');
      corpo.append(h('div', { class: 'btn-row' }, h('button', { class: 'btn white', type: 'button', onClick: () => copiar(texto, 'Mês copiado') }, 'Copiar o mês'), h('button', { class: 'btn ghost', type: 'button', onClick: () => baixarIcs(c.dias.map((d) => ({ data: `${ano}${String(mes).padStart(2, '0')}${String(d.dia).padStart(2, '0')}`, titulo: `${d.tipo}: ${d.tema}` })), `calendario-${ano}-${mes}.ics`) }, 'Baixar pro celular (.ics)')));
    };
    desenhar();
    return { nos: [
      h('div', { class: 'row', style: { marginBottom: '10px', alignItems: 'center', gap: '10px' } }, h('button', { class: 'btn white sm', type: 'button', onClick: () => { mes--; if (mes < 1) { mes = 12; ano--; } desenhar(); } }, '‹'), titulo, h('button', { class: 'btn white sm', type: 'button', onClick: () => { mes++; if (mes > 12) { mes = 1; ano++; } desenhar(); } }, '›')),
      h('p', { class: 'muted' }, 'Três a quatro publicações por semana, mais as datas do mês. Toque em Agendar pra levar pra sua agenda.'),
      corpo,
    ] };
  },

  'analise-instagram'(k) {
    const bios = biosInstagram({ marca: k.user.marca, onboarding: k.o, cidade: k.user.cidade, link: k.wa.linkCurto || '' });
    const itens = [['foto', 'Foto de perfil é o logo ou o produto, sem fundo bagunçado'], ['nome', 'Nome do perfil tem a marca e o que faz (ex.: Flor de Sal · saboaria)'], ['bio', 'Bio diz o que vende, de onde é e como comprar'], ['link', 'Link do WhatsApp na bio'], ['destaques', 'Destaques: produtos, como comprar, bastidores, clientes'], ['fixado', 'Uma publicação fixada com o catálogo ou o mais vendido'], ['frequencia', 'Pelo menos 3 publicações por semana'], ['stories', 'Stories quase todo dia, mesmo que simples'], ['respostas', 'Responde comentários e mensagens no mesmo dia']];
    const salvo = store.get('analise_ig', {});
    const marcados = { ...salvo };
    const pontos = h('b', {});
    const contar = () => { pontos.textContent = `${Object.values(marcados).filter(Boolean).length} de ${itens.length}`; };
    contar();
    return { nos: [
      h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { class: 'grow' }, h('h3', {}, k.ig.arroba || 'Seu perfil'), h('span', { class: 'muted' }, 'Marque o que já está certo')), pontos),
        h('ul', { class: 'list', style: { marginTop: '10px' } }, ...itens.map(([id, t]) => h('li', {}, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!marcados[id], onChange: (e) => { marcados[id] = e.target.checked; store.set('analise_ig', marcados); contar(); } }), h('div', { class: 'txt' }, h('b', {}, t))))))),
      h('div', { class: 'card' }, h('h3', {}, 'Bio pronta pra colar'), ...bios.map((b) => h('div', { class: 'guia-bio' }, h('pre', {}, b), h('button', { class: 'btn white sm', type: 'button', onClick: () => copiar(b, 'Bio copiada') }, 'Copiar')))),
    ] };
  },

  'perfis-referencia'(k) {
    const refs = [...(k.ig.perfisReferencia || []), '', '', ''].slice(0, 3);
    const campos = refs.map((v, i) => campo({ valor: v, placeholder: `@perfil ${i + 1}`, autocapitalize: 'none' }));
    const salvar = () => { const lista = campos.map((c) => c.input.value.trim().replace(/^@+/, '')).filter(Boolean).map((x) => `@${x}`); store.patch('instagram', { perfisReferencia: lista }); return true; };
    const lista = h('div', {}, ...campos.map((c, i) => h('div', { class: 'inline', style: { marginBottom: '8px' } }, c.el, h('button', { class: 'btn white sm', type: 'button', onClick: () => { const u = c.input.value.trim().replace(/^@+/, ''); if (u) window.open(`https://www.instagram.com/${u}/`, '_blank', 'noopener'); } }, 'Abrir'))));
    const observar = ['Que tipo de foto abre o feed deles: produto, pessoa ou ambiente?', 'Quantas cores se repetem? Anote as duas principais.', 'Como escrevem a legenda: curta e direta, ou contando história?', 'Que formato mais tem: carrossel, reel ou foto única?', 'O que eles fazem que você não faria? Isso também define o seu estilo.'];
    return { nos: [
      h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Três perfis que você admira. Não é pra copiar: é pra descobrir o que você gosta e o que não gosta.'), lista, h('button', { class: 'btn block', type: 'button', onClick: () => { salvar(); toast('Referências salvas'); } }, 'Salvar')),
      h('div', { class: 'card' }, h('h3', {}, 'O que observar em cada um'), h('ol', { class: 'steps list' }, ...observar.map((t) => h('li', {}, h('div', {}, h('b', {}, t)))))),
      h('p', { class: 'muted' }, 'Quer mais inspiração filtrada pelo seu produto? ', h('a', { href: '#referencias' }, 'Abra as Referências')),
    ], salvar };
  },

  'analise-publico'(k) {
    const publico = campo({ valor: k.o.publicoAlvo || '', placeholder: 'Pra quem você vende? Ex.: mulheres de 30 a 50 que gostam do natural' });
    const saida = h('div', {});
    const desenhar = () => {
      const a = analisePublico({ onboarding: { ...k.o, publicoAlvo: publico.input.value } });
      saida.innerHTML = '';
      saida.append(
        h('div', { class: 'card' }, h('h3', {}, 'Tom de voz'), h('p', {}, a.tom)),
        h('div', { class: 'card' }, h('h3', {}, 'Melhores horários pra publicar'), h('p', {}, a.horarios.join(' e '))),
        h('div', { class: 'card' }, h('h3', {}, 'O que incomoda o seu público'), h('ul', { class: 'lista-simples' }, ...a.dores.map((d) => h('li', {}, d)))),
        h('div', { class: 'card' }, h('h3', {}, 'O que ele quer'), h('ul', { class: 'lista-simples' }, ...a.desejos.map((d) => h('li', {}, d)))),
        h('div', { class: 'card' }, h('h3', {}, 'Chamadas que funcionam'), h('ul', { class: 'lista-simples' }, ...a.chamadas.map((d) => h('li', {}, d)))));
    };
    publico.input.addEventListener('change', () => { store.patch('onboarding', { publicoAlvo: publico.input.value.trim() }); desenhar(); });
    desenhar();
    return { nos: [h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Pra quem você vende'), publico.el)), saida] };
  },

  agendar(k) {
    const data = h('input', { class: 'input', type: 'date', value: new Date().toISOString().slice(0, 10) });
    const hora = h('input', { class: 'input', type: 'time', value: '19:00' });
    let tipo = 'post';
    const tema = area({ placeholder: 'Tema ou legenda (fale ou escreva)', rows: '3' });
    const lista = h('div', {});
    const desenhar = () => {
      const ag = store.get('agenda', []).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
      lista.innerHTML = '';
      if (!ag.length) { lista.append(h('p', { class: 'muted center' }, 'Nada agendado ainda.')); return; }
      lista.append(h('ul', { class: 'list' }, ...ag.map((it) => h('li', {}, h('div', { class: `item static ${it.feito ? 'feito' : ''}` },
        h('input', { type: 'checkbox', checked: !!it.feito, 'aria-label': 'publicado', onChange: (e) => { it.feito = e.target.checked; store.set('agenda', ag); desenhar(); } }),
        h('span', { class: 'txt' }, h('b', {}, `${it.data.split('-').reverse().join('/')} ${it.hora} · ${it.tipo}`), h('span', {}, it.tema || (it.texto || '').slice(0, 80))),
        it.texto ? h('button', { class: 'btn white sm', type: 'button', onClick: () => copiar(it.texto, 'Legenda copiada') }, 'Legenda') : null,
        h('button', { class: 'btn white sm', type: 'button', 'aria-label': 'remover', onClick: () => { store.set('agenda', ag.filter((x) => x.id !== it.id)); desenhar(); } }, '✕'))))));
      lista.append(h('div', { class: 'btn-row' }, h('button', { class: 'btn ghost', type: 'button', onClick: () => baixarIcs(ag.map((it) => ({ data: it.data.replace(/-/g, ''), hora: it.hora.replace(':', ''), titulo: `${it.tipo}: ${it.tema || 'publicação'}` })), 'agenda-artesana.ics') }, 'Baixar pro calendário do celular (.ics)')));
    };
    desenhar();
    return { nos: [
      h('div', { class: 'card' },
        h('div', { class: 'rot-grid' }, h('div', { class: 'field' }, h('label', {}, 'Data'), data), h('div', { class: 'field' }, h('label', {}, 'Hora'), hora)),
        h('div', { class: 'field' }, h('label', {}, 'Formato'), chips({ opcoes: ['post', 'story', 'reel', 'carrossel'].map((t) => ({ id: t, nome: t })), valor: tipo, aoMudar: (v) => { tipo = v; } })),
        h('div', { class: 'field' }, h('label', {}, 'Tema ou legenda'), tema.el),
        h('button', { class: 'btn peach block', type: 'button', onClick: () => { if (!tema.input.value.trim()) { toast('Diga o tema'); return; } const ag = store.get('agenda', []); ag.push({ id: Date.now(), data: data.value, hora: hora.value, tipo, tema: tema.input.value.trim().slice(0, 80), texto: tema.input.value.trim(), feito: false }); store.set('agenda', ag); tema.input.value = ''; toast('Agendado'); desenhar(); } }, 'Agendar')),
      h('p', { class: 'muted' }, 'O app lembra você. Publicar sozinho, direto no Instagram, depende da conexão com a Meta, que chega junto com o login.'),
      lista,
    ] };
  },

  metricas(k) {
    const semana = h('input', { class: 'input', type: 'date', value: new Date().toISOString().slice(0, 10) });
    const seg = h('input', { class: 'input', type: 'number', inputmode: 'numeric', placeholder: 'Seguidores' });
    const alc = h('input', { class: 'input', type: 'number', inputmode: 'numeric', placeholder: 'Contas alcançadas' });
    const inter = h('input', { class: 'input', type: 'number', inputmode: 'numeric', placeholder: 'Interações' });
    const tabela = h('div', {});
    const desenhar = () => {
      const m = store.get('metricas', []).sort((a, b) => a.semana.localeCompare(b.semana));
      tabela.innerHTML = '';
      if (!m.length) { tabela.append(h('p', { class: 'muted center' }, 'Anote a primeira semana pra começar a comparar.')); return; }
      const linhas = m.map((x, i) => { const ant = m[i - 1]; const d = (a, b) => (ant ? (a - b > 0 ? `+${a - b}` : `${a - b}`) : ''); return h('tr', {}, h('td', {}, x.semana.split('-').reverse().slice(0, 2).join('/')), h('td', {}, x.seguidores, h('small', {}, d(x.seguidores, ant && ant.seguidores))), h('td', {}, x.alcance, h('small', {}, d(x.alcance, ant && ant.alcance))), h('td', {}, x.interacoes, h('small', {}, d(x.interacoes, ant && ant.interacoes)))); });
      tabela.append(h('table', { class: 'tabela' }, h('thead', {}, h('tr', {}, h('th', {}, 'Semana'), h('th', {}, 'Seguidores'), h('th', {}, 'Alcance'), h('th', {}, 'Interações'))), h('tbody', {}, ...linhas)));
    };
    desenhar();
    return { nos: [
      h('p', { class: 'muted' }, 'Uma vez por semana, copie os três números do painel do Instagram (Perfil, Painel profissional). O app mostra a evolução.'),
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Semana'), semana), h('div', { class: 'rot-grid' }, h('div', { class: 'field' }, h('label', {}, 'Seguidores'), seg), h('div', { class: 'field' }, h('label', {}, 'Alcance'), alc)), h('div', { class: 'field' }, h('label', {}, 'Interações'), inter),
        h('button', { class: 'btn peach block', type: 'button', onClick: () => { if (!seg.value && !alc.value) { toast('Preencha pelo menos seguidores ou alcance'); return; } const m = store.get('metricas', []); m.push({ semana: semana.value, seguidores: Number(seg.value) || 0, alcance: Number(alc.value) || 0, interacoes: Number(inter.value) || 0 }); store.set('metricas', m); toast('Semana anotada'); desenhar(); } }, 'Anotar')),
      tabela,
    ] };
  },

  reels(k) {
    const r = roteiroReel({ marca: k.user.marca, onboarding: k.o });
    const texto = [`Gancho: ${r.gancho}`, ...r.cenas.map((c) => `${c.seg}s: ${c.acao} (texto na tela: ${c.texto})`), `Final: ${r.cta}`, `Música: ${r.musica}`].join('\n');
    return { nos: [
      h('div', { class: 'card' }, h('h3', {}, 'Gancho (primeiros 3 segundos)'), h('p', {}, r.gancho)),
      h('ol', { class: 'steps list' }, ...r.cenas.map((c) => h('li', {}, h('div', {}, h('b', {}, `${c.seg} segundos`), h('span', {}, c.acao), h('span', {}, `Texto na tela: ${c.texto}`))))),
      h('div', { class: 'card' }, h('h3', {}, 'Final'), h('p', {}, r.cta), h('p', { class: 'muted' }, r.musica), h('div', { class: 'btn-row' }, h('button', { class: 'btn white', type: 'button', onClick: () => copiar(texto, 'Roteiro copiado') }, 'Copiar roteiro'), h('a', { class: 'btn ghost', href: '#criar/endcard' }, 'Fazer o end card'))),
      h('div', { class: 'card' }, h('h3', {}, 'Montar o vídeo'), h('p', {}, 'Grave as três cenas com o celular na vertical. Monte no próprio Instagram (Reels, Editar) ou no CapCut: cole os cortes na ordem, o end card por último, e escolha a música na hora de publicar.'), h('p', { class: 'muted' }, 'Editar o vídeo inteiro dentro do app está no nosso plano: um banco de modelos prontos pra você só trocar as cenas.')),
    ] };
  },

  locucao(k) {
    const r = roteiroReel({ marca: k.user.marca, onboarding: k.o });
    const roteiro = area({ valor: `${r.gancho} ${r.cenas.map((c) => c.texto).join('. ')}. ${k.user.marca ? `É da ${k.user.marca}.` : ''}`, rows: '4' });
    const status = h('p', { class: 'muted' }, 'Toque em Gravar e fale o roteiro. Sai um arquivo de áudio pra colocar no vídeo.');
        const player = h('audio', { controls: true, class: 'hidden', style: { width: '100%', marginTop: '10px' } });
    let rec = null; let pedacos = []; let blob = null;
    const btnGravar = h('button', { class: 'btn peach', type: 'button' }, 'Gravar');
    const btnBaixar = h('button', { class: 'btn white', type: 'button', disabled: true, onClick: () => blob && baixar(blob, `locucao.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`) }, 'Baixar áudio');
    btnGravar.addEventListener('click', async () => {
      if (rec && rec.state === 'recording') { rec.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Este navegador não grava áudio. Use o Chrome.'); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        rec = new MediaRecorder(stream); pedacos = [];
        rec.ondataavailable = (e) => pedacos.push(e.data);
        rec.onstop = () => { blob = new Blob(pedacos, { type: rec.mimeType || 'audio/webm' }); player.src = URL.createObjectURL(blob); player.classList.remove('hidden'); btnBaixar.disabled = false; btnGravar.textContent = 'Gravar de novo'; btnGravar.classList.remove('gravando'); status.textContent = 'Pronto. Ouça e, se gostou, baixe.'; stream.getTracks().forEach((t) => t.stop()); };
        rec.start(); btnGravar.textContent = 'Parar'; btnGravar.classList.add('gravando'); status.textContent = 'Gravando... fale perto do celular.';
      } catch { toast('Libere o microfone pro site nas configurações do navegador.', 3500); }
    });
    return { nos: [
      h('div', { class: 'card' }, h('div', { class: 'field' }, h('label', {}, 'Roteiro'), roteiro.el), status, h('div', { class: 'btn-row' }, btnGravar, btnBaixar), player),
      h('p', { class: 'muted' }, 'Voz de IA humanizada chega no plano Prosperar. Por enquanto, a sua voz é a melhor: ninguém conta a sua história como você.'),
    ] };
  },

  'editar-video'(k) {
    const video = h('video', { class: 'hidden', playsinline: true, muted: true, style: { width: '100%', borderRadius: '12px' } });
    const barra = h('input', { type: 'range', min: '0', max: '100', value: '0', class: 'hidden', style: { width: '100%' } });
    const btnCapa = h('button', { class: 'btn peach', type: 'button', disabled: true, onClick: () => { const cv = h('canvas', { width: video.videoWidth, height: video.videoHeight }); cv.getContext('2d').drawImage(video, 0, 0); cv.toBlob((b) => baixar(b, 'capa-do-reel.jpg'), 'image/jpeg', 0.92); } }, 'Baixar esta capa');
    const arquivo = h('input', { type: 'file', accept: 'video/*', class: 'hidden', onChange: (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; video.src = URL.createObjectURL(f); video.classList.remove('hidden'); barra.classList.remove('hidden'); video.onloadedmetadata = () => { btnCapa.disabled = false; barra.max = String(Math.floor(video.duration * 10)); }; } });
    barra.addEventListener('input', () => { video.currentTime = Number(barra.value) / 10; });
    const passos = ['Grave na vertical, com luz de janela, e deixe 2 segundos de sobra no começo e no fim.', 'Corte no próprio Instagram (Reels, Editar) ou no CapCut. Cortes de 2 a 4 segundos mantêm a atenção.', 'Escolha a capa aqui: é ela que aparece no perfil. Prefira o produto pronto, bem iluminado.', 'Texto na tela curto e alto, na parte central: as bordas somem no perfil.', 'End card nos últimos 3 segundos, com o @ e o WhatsApp.', 'Música: escolha na biblioteca do Instagram na hora de publicar, pra entrar nas tendências.'];
    return { nos: [
      h('div', { class: 'card' }, h('h3', {}, 'Escolher a capa'), h('p', { class: 'muted' }, 'Envie o vídeo, arraste até o quadro bonito e baixe a capa.'), h('label', { class: 'campo-arquivo' }, arquivo, h('span', {}, 'Toque pra enviar o vídeo'), h('b', {}, 'Enviar')), video, barra, h('div', { class: 'btn-row' }, btnCapa, h('a', { class: 'btn white', href: '#editor' }, 'Ajustar a capa no editor'))),
      h('ol', { class: 'steps list' }, ...passos.map((t) => h('li', {}, h('div', {}, h('b', {}, t))))),
    ] };
  },
};

function baixarIcs(eventos, nome) {
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//artesana//app//PT'];
  eventos.forEach((e, i) => {
    linhas.push('BEGIN:VEVENT', `UID:${Date.now()}-${i}@artesana`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`);
    if (e.hora) linhas.push(`DTSTART:${e.data}T${e.hora}00`); else linhas.push(`DTSTART;VALUE=DATE:${e.data}`);
    linhas.push(`SUMMARY:${e.titulo.replace(/\n/g, ' ')}`, 'END:VEVENT');
  });
  linhas.push('END:VCALENDAR');
  baixar(new Blob([linhas.join('\r\n')], { type: 'text/calendar' }), nome);
}

export function montar(section, param) {
  const nome = FERRAMENTAS[param] ? param : '';
  section.innerHTML = '';
  if (!nome) { section.append(h('div', { class: 'screen' }, header({ titulo: 'Ferramenta', voltar: '#home', peach: true }), h('div', { class: 'content' }, h('div', { class: 'card' }, 'Ferramenta não encontrada.')))); return; }
  const modulo = Object.keys(SEQ).find((m) => SEQ[m].includes(nome));
  const seq = SEQ[modulo];
  const i = seq.indexOf(nome);
  const k = ctx();
  const { nos, salvar } = FERRAMENTAS[nome](k);
  const proximo = i < seq.length - 1 ? `criar/${seq[i + 1]}` : modulo;
  const anterior = i > 0 ? `criar/${seq[i - 1]}` : modulo;
  section.append(h('div', { class: 'screen' },
    header({ titulo: TITULOS[nome], sub: `${router.NOME_DA_ROTA[modulo] || modulo} · ${i + 1} de ${seq.length}`, voltar: `#${modulo}`, peach: true }),
    h('div', { class: 'content' },
      ...nos,
      navegacao({ atual: modulo, voltar: anterior, seguir: proximo, textoSeguir: i < seq.length - 1 ? `Salvar e seguir: ${TITULOS[seq[i + 1]]}` : `Salvar e voltar`, aoSeguir: () => { if (salvar && salvar() === false) return; router.ir(`#${proximo}`); } }),
    ),
  ));
}
