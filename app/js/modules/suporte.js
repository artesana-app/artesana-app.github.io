// Ajuda dentro do app: chat com respostas prontas. Quando não sabe, oferece falar com uma atendente;
// a conversa segue aqui mesmo, e a resposta da equipe chega nesta tela (via backend). Sem backend, avisa.
import { h, header, navegacao } from '../ui.js';
import { area } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as analitica from '../analitica.js';
import { responder, linkNaPergunta, FALLBACK } from '../lib/suporte.js';
import { SITE } from '../site.js';

const SUGESTOES = ['Como faço o rótulo?', 'Não tenho Instagram', 'Como funciona o link do WhatsApp?', 'Quanto custa depois do beta?', 'Como instalo no celular?'];

export function montar(section, param) {
  const conversa = store.get('suporte', []);
  const user = store.usuario();
  section.innerHTML = '';
  const lista = h('div', { class: 'chat' });
  const entrada = area({ placeholder: 'Escreva ou fale a sua dúvida', rows: '2' });
  let aguardando = false;

  const salvar = () => store.set('suporte', conversa.slice(-60));
  const desenhar = () => {
    lista.innerHTML = '';
    if (!conversa.length) {
      lista.append(h('div', { class: 'balao app' }, `Oi${user.nome ? `, ${user.nome.split(' ')[0]}` : ''}! Sou a ajuda do artesaná. Pergunte o que quiser sobre o app. Se eu não souber, chamo uma atendente e a resposta aparece aqui.`));
      lista.append(h('div', { class: 'chips', style: { marginTop: '6px' } }, ...SUGESTOES.map((s) => h('button', { type: 'button', class: 'chip', onClick: () => perguntar(s) }, s))));
    }
    for (const m of conversa) {
      const b = h('div', { class: `balao ${m.de}` }, m.texto);
      if (m.link) b.append(h('a', { class: 'btn soft sm', href: m.link, style: { marginTop: '8px' }, target: /^https?:/.test(m.link) ? '_blank' : null, rel: 'noopener' }, m.rotulo || 'Abrir'));
      if (m.atendente) b.append(h('button', { type: 'button', class: 'btn peach sm', style: { marginTop: '8px' }, onClick: () => chamarAtendente(m.pergunta) }, 'Falar com uma atendente'));
      lista.append(b);
    }
    lista.scrollTop = lista.scrollHeight;
  };

  const dizer = (de, texto, extra = {}) => { conversa.push({ de, texto, t: Date.now(), ...extra }); salvar(); desenhar(); };

  async function chamarAtendente(pergunta) {
    if (aguardando) return;
    aguardando = true;
    const r = await analitica.enviar('/v1/suporte', { pergunta, nome: user.nome || '', marca: user.marca || '', conversa: conversa.slice(-6).map((m) => `${m.de}: ${m.texto}`) });
    aguardando = false;
    if (r.ok) dizer('app', 'Mandei pra equipe. A resposta aparece aqui na conversa; deixe o app aberto ou volte mais tarde nesta tela.', { ticket: r.ticket });
    else if (r.semBackend) dizer('app', 'O atendimento humano ainda não está ligado nesta versão de teste. Por enquanto, use o botão Beta pra mandar a dúvida como feedback: a equipe lê tudo.', { link: '#feedback', rotulo: 'Mandar como feedback' });
    else dizer('app', 'Não consegui mandar agora. Confira a internet e tente de novo.');
  }

  function perguntar(texto) {
    const t = String(texto || '').trim();
    if (!t) return;
    dizer('eu', t);
    analitica.evento('suporte_pergunta', { texto: t.slice(0, 120) });
    const link = linkNaPergunta(t);
    const r = responder(t);
    setTimeout(() => {
      if (r && r.atendente) dizer('app', r.resposta, { atendente: true, pergunta: t });
      else if (r) dizer('app', r.resposta, { link: r.link || (link ? (link.startsWith('http') ? link : `https://${link}`) : ''), rotulo: r.rotulo || (link ? 'Abrir o link que você mandou' : '') });
      else dizer('app', FALLBACK, { atendente: true, pergunta: t, link: link ? (link.startsWith('http') ? link : `https://${link}`) : '', rotulo: link ? 'Abrir o link que você mandou' : '' });
    }, 350);
    entrada.input.value = '';
  }

  // respostas da equipe que chegaram (quando há backend)
  async function buscarRespostas() {
    if (!SITE.backend) return;
    const r = await analitica.buscar(`/v1/suporte?visitante=${encodeURIComponent(analitica.visitante())}`);
    if (!r.ok || !Array.isArray(r.mensagens)) return;
    const vistos = new Set(conversa.filter((m) => m.id).map((m) => m.id));
    let novo = false;
    for (const m of r.mensagens) if (!vistos.has(m.id)) { conversa.push({ de: 'equipe', texto: m.texto, t: m.t, id: m.id }); novo = true; }
    if (novo) { salvar(); desenhar(); }
  }

  entrada.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); perguntar(entrada.input.value); } });

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Ajuda', sub: 'Respostas na hora. Se precisar, uma pessoa da equipe responde aqui.', voltar: '#home' }),
    h('div', { class: 'content chat-tela' },
      lista,
      h('div', { class: 'chat-entrada' }, entrada.el, h('button', { class: 'btn peach', type: 'button', onClick: () => perguntar(entrada.input.value) }, 'Enviar')),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn white sm', type: 'button', onClick: () => { conversa.length = 0; salvar(); desenhar(); } }, 'Limpar conversa'),
        h('a', { class: 'btn ghost sm', href: '#feedback' }, 'Avaliar o app')),
      navegacao({ atual: 'suporte', voltar: 'home', seguir: '' }),
    ),
  ));
  desenhar();
  buscarRespostas();
  if (param === 'atendente') chamarAtendente('');
}
