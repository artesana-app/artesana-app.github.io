import { h, header, toast, modal, copiar } from '../ui.js';
import * as store from '../store.js';
import { calcularProgresso } from '../lib/progresso.js';
import { NICHOS, PERSONALIDADES, CAMPOS_OBRIGATORIOS, camposFaltando, resumoPerfil } from '../lib/perfil.js';
import { numeroFormatado, montarLink } from '../lib/whatsapp.js';
import { SITE, semProtocolo } from '../site.js';

const OBRIGATORIO = new Set(CAMPOS_OBRIGATORIOS.map((c) => c.id));
// etapa do progresso -> primeiro campo que a completa
const CAMPO_DA_ETAPA = { 'nome-marca': ['nome', 'marca'], nicho: ['nicho'], historia: ['historia'], 'personalidade-publico': ['personalidade', 'publicoAlvo'], instagram: ['arroba'] };

export function montar(section) {
  const estado = {
    user: { ...store.usuario() },
    onboarding: { ...store.get('onboarding', {}) },
    instagram: { ...store.get('instagram', {}) },
  };
  const refs = [...(estado.instagram.perfisReferencia || []), '', '', ''].slice(0, 3);
  const wa = store.get('whatsapp', {});
  const campos = {}; // id -> { wrap, foco }
  let tentouEnviar = false;
  let timer = null;

  const arroba = (v) => { const t = String(v || '').trim().replace(/^@+/, ''); return t ? `@${t}` : ''; };
  const salvar = () => {
    const { nome = '', marca = '', email = '' } = estado.user;
    store.patch('user', { nome: nome.trim(), marca: marca.trim(), email: email.trim() });
    const { nicho = '', historia = '', personalidade = '', publicoAlvo = '', tipoProduto = '' } = estado.onboarding;
    store.patch('onboarding', { nicho, personalidade, historia: historia.trim(), publicoAlvo: publicoAlvo.trim(), tipoProduto: tipoProduto.trim() });
    store.set('instagram', { arroba: arroba(estado.instagram.arroba), perfisReferencia: refs.map(arroba).filter(Boolean) });
  };
  const mudou = () => {
    clearTimeout(timer);
    timer = setTimeout(salvar, 400);
    atualizar();
  };

  // ---- progresso e situação
  const barra = h('i', {});
  const contagem = h('b', {});
  const etapas = h('ul', { class: 'etapas' });
  const situacao = h('p', { class: 'perfil-situacao' });
  const ir = (id) => {
    const c = campos[id];
    if (!c) return;
    c.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (c.foco) setTimeout(() => c.foco.focus({ preventScroll: true }), 250);
  };
  function atualizar() {
    const p = calcularProgresso(estado);
    const falta = camposFaltando(estado);
    const ids = new Set(falta.map((c) => c.id));
    barra.style.width = `${(p.feitas / p.total) * 100}%`;
    contagem.textContent = `${p.feitas} de ${p.total} etapas`;
    etapas.innerHTML = '';
    for (const e of p.etapas) {
      const alvo = (CAMPO_DA_ETAPA[e.id] || []).find((id) => ids.has(id)) || (CAMPO_DA_ETAPA[e.id] || [])[0];
      etapas.append(h('li', {}, h('button', { type: 'button', class: e.ok ? 'ok' : '', onClick: () => ir(alvo) },
        h('span', { class: 'marca' }, e.ok ? '✓' : ''), h('span', {}, e.nome), e.ok ? null : h('span', { class: 'badge' }, 'preencher'))));
    }
    situacao.textContent = falta.length
      ? `${falta.length === 1 ? 'Falta 1 item' : `Faltam ${falta.length} itens`}: ${falta.map((c) => c.rotulo.toLowerCase()).join(', ')}.`
      : 'Tudo preenchido. Pode enviar.';
    situacao.classList.toggle('ok', !falta.length);
    for (const [id, c] of Object.entries(campos)) c.wrap.classList.toggle('falta', tentouEnviar && ids.has(id));
  }

  // ---- campos
  const rotulo = (id, texto) => h('label', { for: `pf-${id}` }, texto, OBRIGATORIO.has(id) ? h('span', { class: 'obrig', title: 'obrigatório' }, ' *') : null);
  const aviso = () => h('div', { class: 'falta-msg' }, 'Falta preencher');

  function campoTexto(onde, id, texto, opts = {}) {
    const input = opts.multi
      ? h('textarea', { class: 'textarea', id: `pf-${id}`, placeholder: opts.placeholder || '', rows: '4' })
      : h('input', { class: 'input', id: `pf-${id}`, placeholder: opts.placeholder || '', type: opts.tipo || 'text', autocomplete: opts.auto || 'off', autocapitalize: opts.caixa || 'sentences' });
    input.value = estado[onde][id] || '';
    input.addEventListener('input', () => { estado[onde][id] = input.value; mudou(); });
    if (opts.aoSair) input.addEventListener('blur', () => { input.value = opts.aoSair(input.value); estado[onde][id] = input.value; mudou(); });
    const wrap = h('div', { class: 'field' }, rotulo(id, texto), input, opts.dica ? h('div', { class: 'hint' }, opts.dica) : null, aviso());
    campos[id] = { wrap, foco: input };
    return wrap;
  }

  function campoOpcoes(onde, id, texto, opcoes) {
    const box = h('div', { class: 'chips', role: 'group', 'aria-label': texto });
    const desenhar = () => {
      box.innerHTML = '';
      for (const o of opcoes) {
        const on = estado[onde][id] === o.id;
        box.append(h('button', { type: 'button', class: `chip ${on ? 'on' : ''}`, 'aria-pressed': String(on), onClick: () => { estado[onde][id] = o.id; desenhar(); mudou(); } }, `${o.emoji} ${o.nome}`));
      }
    };
    desenhar();
    const wrap = h('div', { class: 'field', id: `pf-${id}` }, rotulo(id, texto), box, aviso());
    campos[id] = { wrap, foco: null };
    return wrap;
  }

  const camposRefs = h('div', { class: 'field' }, h('label', {}, 'Três perfis que te inspiram'),
    ...refs.map((v, n) => {
      const input = h('input', { class: 'input', placeholder: `@perfil ${n + 1}`, autocapitalize: 'none', autocomplete: 'off', 'aria-label': `Perfil de referência ${n + 1}`, style: { marginBottom: '8px' } });
      input.value = v;
      input.addEventListener('input', () => { refs[n] = input.value; mudou(); });
      input.addEventListener('blur', () => { input.value = arroba(input.value); refs[n] = input.value; });
      return input;
    }),
    h('div', { class: 'hint' }, 'Opcional. Ajuda a montar o estilo do seu conteúdo.'));

  const cartaoWhats = h('a', { class: 'perfil-whats', href: '#whatsapp' },
    h('div', {}, h('b', {}, 'Link do WhatsApp'),
      h('span', {}, wa.ddd && wa.numero ? `${numeroFormatado(wa)} · ${semProtocolo(wa.linkCurto || wa.link)}` : 'Ainda não criado')),
    h('span', { class: 'badge' }, wa.ddd && wa.numero ? 'Editar' : 'Criar'));

  // ---- envio
  function enviar() {
    clearTimeout(timer);
    salvar();
    tentouEnviar = true;
    atualizar();
    const falta = camposFaltando(estado);
    if (falta.length) {
      toast(falta.length === 1 ? 'Falta 1 item pra completar' : `Faltam ${falta.length} itens pra completar`);
      ir(falta[0].id);
      return;
    }
    store.set('perfil_enviado', { data: new Date().toISOString() });
    const resumo = resumoPerfil({ user: store.usuario(), onboarding: store.get('onboarding', {}), instagram: store.get('instagram', {}), whatsapp: store.get('whatsapp', {}) });
    const destino = SITE.whatsappEquipe
      ? montarLink({ ...SITE.whatsappEquipe, mensagem: resumo })
      : `https://wa.me/?text=${encodeURIComponent(resumo)}`;
    modal({
      titulo: 'Perfil completo',
      corpo: h('div', {},
        h('p', {}, 'Seu perfil está salvo neste aparelho e já personaliza o app.'),
        h('pre', { class: 'perfil-resumo' }, resumo)),
      botoes: [
        { texto: 'Copiar resumo', classe: 'white', onClick: () => { copiar(resumo, 'Resumo copiado'); return false; } },
        { texto: 'Enviar pelo WhatsApp', classe: 'peach', onClick: () => { window.open(destino, '_blank', 'noopener'); } },
      ],
    });
  }

  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Meu Perfil', sub: 'Dados que personalizam o app', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('div', { class: 'progress-label' }, contagem, h('span', { class: 'muted' }, 'toque no item pra ir até ele')),
        h('div', { class: 'progress dark' }, barra),
        etapas),
      h('div', { class: 'group-title' }, 'Sobre você'),
      h('div', { class: 'card' },
        campoTexto('user', 'nome', 'Seu nome', { placeholder: 'Como você se chama', auto: 'given-name', caixa: 'words' }),
        campoTexto('user', 'email', 'E-mail de contato', { placeholder: 'voce@exemplo.com', tipo: 'email', auto: 'email', caixa: 'none' })),
      h('div', { class: 'group-title' }, 'Sua marca'),
      h('div', { class: 'card' },
        campoTexto('user', 'marca', 'Nome da marca', { placeholder: 'Ex: Flor de Sal', caixa: 'words' }),
        campoOpcoes('onboarding', 'nicho', 'O que você produz', NICHOS),
        campoTexto('onboarding', 'tipoProduto', 'Produto principal', { placeholder: 'Ex: sabonete de lavanda' }),
        campoTexto('onboarding', 'historia', 'História da marca', { multi: true, placeholder: 'Como tudo começou? Vira frase de impacto e legendas.' }),
        campoOpcoes('onboarding', 'personalidade', 'Personalidade da marca', PERSONALIDADES),
        campoTexto('onboarding', 'publicoAlvo', 'Pra quem você vende', { placeholder: 'Ex: mulheres que valorizam o natural' })),
      h('div', { class: 'group-title' }, 'Contato e redes'),
      h('div', { class: 'card' },
        cartaoWhats,
        campoTexto('instagram', 'arroba', '@ do Instagram', { placeholder: '@suamarca', caixa: 'none', aoSair: arroba }),
        camposRefs),
      h('div', { class: 'card perfil-enviar' },
        situacao,
        h('button', { class: 'btn peach block', type: 'button', onClick: enviar }, 'Enviar perfil completo'),
        h('p', { class: 'muted' }, 'O que você digita é salvo sozinho neste aparelho. Os itens com * são os que completam o perfil.')),
    ),
  ));
  atualizar();
}
