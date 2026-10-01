// Perfil completo num formulário só: pra quem quer ver tudo que precisa preencher de uma vez.
import { h, header, toast, modal, copiar, chips, navegacao } from '../ui.js';
import { campo, area } from '../campos.js';
import { dicaDitado } from '../ditado.js';
import * as store from '../store.js';
import * as router from '../router.js';
import { calcularProgresso } from '../lib/progresso.js';
import { NICHOS, PERSONALIDADES, FAIXAS_ETARIAS, CAMPOS_OBRIGATORIOS, camposFaltando, resumoPerfil, nichosDe } from '../lib/perfil.js';
import { numeroFormatado } from '../lib/whatsapp.js';
import { semProtocolo } from '../site.js';
import { enviarPerfil } from '../onboarding.js';

const OBRIGATORIO = new Set(CAMPOS_OBRIGATORIOS.map((c) => c.id));

export function montar(section) {
  const estado = { user: { ...store.usuario() }, onboarding: { ...store.get('onboarding', {}) }, instagram: { ...store.get('instagram', {}) } };
  estado.onboarding.nichos = nichosDe(estado.onboarding);
  const refs = [...(estado.instagram.perfisReferencia || []), '', '', ''].slice(0, 3);
  const wa = store.get('whatsapp', {});
  const campos = {};
  let tentouEnviar = false;
  let timer = null;

  const arroba = (v) => { const t = String(v || '').trim().replace(/^@+/, ''); return t ? `@${t}` : ''; };
  const salvar = () => {
    const { nome = '', marca = '', email = '', faixaEtaria = '', cidade = '' } = estado.user;
    store.patch('user', { nome: nome.trim(), marca: marca.trim(), email: email.trim(), faixaEtaria, cidade: cidade.trim() });
    const o = estado.onboarding;
    store.patch('onboarding', { nichos: o.nichos || [], nicho: (o.nichos || [])[0] || '', nichoOutro: (o.nichoOutro || '').trim(), personalidade: o.personalidade || '', historia: (o.historia || '').trim(), publicoAlvo: (o.publicoAlvo || '').trim(), tipoProduto: (o.tipoProduto || '').trim() });
    const a = arroba(estado.instagram.arroba);
    store.set('instagram', { ...store.get('instagram', {}), arroba: a, semConta: a ? false : !!estado.instagram.semConta, perfisReferencia: refs.map(arroba).filter(Boolean) });
  };
  const mudou = () => { clearTimeout(timer); timer = setTimeout(salvar, 400); atualizar(); };

  const barra = h('i', {});
  const contagem = h('b', {});
  const etapas = h('ul', { class: 'etapas' });
  const situacao = h('p', { class: 'perfil-situacao' });
  const ir = (id) => { const c = campos[id]; if (!c) return; c.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (c.foco) setTimeout(() => c.foco.focus({ preventScroll: true }), 250); };
  function atualizar() {
    const p = calcularProgresso(estado);
    const falta = camposFaltando(estado);
    const ids = new Set(falta.map((c) => c.id));
    barra.style.width = `${(p.feitas / p.total) * 100}%`;
    contagem.textContent = `${p.feitas} de ${p.total} etapas`;
    etapas.innerHTML = '';
    for (const e of p.etapas) etapas.append(h('li', {}, h('a', { class: e.ok ? 'ok' : '', href: e.rota }, h('span', { class: 'marca' }, e.ok ? '✓' : ''), h('span', {}, e.nome), e.ok ? null : h('span', { class: 'badge' }, 'preencher'))));
    situacao.textContent = falta.length ? `${falta.length === 1 ? 'Falta 1 item' : `Faltam ${falta.length} itens`}: ${falta.map((c) => c.rotulo.toLowerCase()).join(', ')}.` : 'Tudo preenchido. Pode enviar.';
    situacao.classList.toggle('ok', !falta.length);
    for (const [id, c] of Object.entries(campos)) c.wrap.classList.toggle('falta', tentouEnviar && ids.has(id));
  }

  const rotulo = (id, texto) => h('label', { for: `pf-${id}` }, texto, OBRIGATORIO.has(id) ? h('span', { class: 'obrig', title: 'obrigatório' }, ' *') : null);
  const aviso = () => h('div', { class: 'falta-msg' }, 'Falta preencher');
  function campoTexto(onde, id, texto, opts = {}) {
    const c = opts.multi
      ? area({ valor: estado[onde][id] || '', id: `pf-${id}`, placeholder: opts.placeholder || '', rows: '4' })
      : campo({ valor: estado[onde][id] || '', id: `pf-${id}`, placeholder: opts.placeholder || '', type: opts.tipo || 'text', autocomplete: opts.auto || 'off', autocapitalize: opts.caixa || 'sentences' });
    c.input.addEventListener('input', () => { estado[onde][id] = c.input.value; mudou(); });
    if (opts.aoSair) c.input.addEventListener('blur', () => { c.input.value = opts.aoSair(c.input.value); estado[onde][id] = c.input.value; mudou(); });
    const wrap = h('div', { class: 'field' }, rotulo(id, texto), c.el, opts.dica ? h('div', { class: 'hint' }, opts.dica) : null, opts.extra || null, aviso());
    campos[id] = { wrap, foco: c.input };
    return wrap;
  }
  function campoOpcoes(onde, id, texto, opcoes, multi = false) {
    const box = chips({ opcoes, valor: estado[onde][id], multi, aoMudar: (v) => { estado[onde][id] = v; mudou(); } });
    const wrap = h('div', { class: 'field', id: `pf-${id}` }, rotulo(id, texto), box, aviso());
    campos[id] = { wrap, foco: null };
    return wrap;
  }

  const camposRefs = h('div', { class: 'field' }, h('label', {}, 'Três perfis que te inspiram'),
    ...refs.map((v, n) => {
      const c = campo({ valor: v, placeholder: `@perfil ${n + 1}`, autocapitalize: 'none', 'aria-label': `Perfil de referência ${n + 1}`, style: { marginBottom: '8px' } });
      c.input.addEventListener('input', () => { refs[n] = c.input.value; mudou(); });
      c.input.addEventListener('blur', () => { c.input.value = arroba(c.input.value); refs[n] = c.input.value; });
      return c.el;
    }),
    h('div', { class: 'hint' }, 'Opcional. Ajuda a montar o estilo do seu conteúdo.'));

  const cartaoWhats = h('a', { class: 'perfil-whats', href: '#whatsapp' },
    h('div', {}, h('b', {}, 'Link do WhatsApp'), h('span', {}, wa.ddd && wa.numero ? `${numeroFormatado(wa)} · ${semProtocolo(wa.linkCurto || wa.link)}` : 'Ainda não criado')),
    h('span', { class: 'badge' }, wa.ddd && wa.numero ? 'Editar' : 'Criar'));

  const semInsta = h('button', { type: 'button', class: 'btn ghost sm', style: { marginTop: '8px' }, onClick: () => { estado.instagram.semConta = true; salvar(); router.ir('#ajuda-instagram'); } }, 'Ainda não tenho. Me ajuda?');

  async function enviar() {
    clearTimeout(timer); salvar(); tentouEnviar = true; atualizar();
    const falta = camposFaltando(estado);
    if (falta.length) { toast(falta.length === 1 ? 'Falta 1 item pra completar' : `Faltam ${falta.length} itens pra completar`); ir(falta[0].id); return; }
    const r = await enviarPerfil();
    const resumo = resumoPerfil({ user: store.usuario(), onboarding: store.get('onboarding', {}), instagram: store.get('instagram', {}), whatsapp: store.get('whatsapp', {}) });
    modal({
      titulo: r.enviado ? 'Perfil enviado' : 'Perfil salvo',
      corpo: h('div', {}, h('p', {}, r.enviado ? 'A equipe recebeu o seu perfil. O app já está personalizado pra sua marca.' : 'Seu perfil está salvo neste aparelho e já personaliza o app.'), h('pre', { class: 'perfil-resumo' }, resumo)),
      botoes: [
        { texto: 'Copiar resumo', classe: 'white', onClick: () => { copiar(resumo, 'Resumo copiado'); return false; } },
        { texto: 'Seguir pra Identidade', classe: 'peach', onClick: () => router.ir('#identidade') },
      ],
    });
  }

  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Meu perfil', sub: 'Tudo que o app usa pra personalizar sua marca', voltar: '#mais' }),
    h('div', { class: 'content duas-colunas' },
      h('div', { class: 'coluna' },
        h('div', { class: 'card' },
          h('div', { class: 'progress-label' }, contagem, h('a', { href: '#conversa/nome', class: 'muted' }, 'preencher em conversa')),
          h('div', { class: 'progress dark' }, barra), etapas),
        h('div', { class: 'group-title' }, 'Sobre você'),
        h('div', { class: 'card' },
          dicaDitado(),
          campoTexto('user', 'nome', 'Seu nome', { placeholder: 'Como você se chama', auto: 'given-name', caixa: 'words' }),
          campoTexto('user', 'email', 'E-mail de contato', { placeholder: 'voce@exemplo.com', tipo: 'email', auto: 'email', caixa: 'none' }),
          campoTexto('user', 'telefone', 'Seu WhatsApp ou telefone', { placeholder: '(47) 99999-9999', tipo: 'tel', auto: 'tel-national', caixa: 'none' }),
          campoOpcoes('user', 'novidades', 'Quer receber novidades do artesaná.?', [{ id: 'sim', nome: 'Sim, por e-mail ou WhatsApp' }, { id: 'nao', nome: 'Agora não' }]),
          campoOpcoes('user', 'faixaEtaria', 'Quantos anos você tem?', FAIXAS_ETARIAS.map((f) => ({ id: f, nome: f }))),
          campoTexto('user', 'cidade', 'De onde você é?', { placeholder: 'Cidade e estado', caixa: 'words' }))),
      h('div', { class: 'coluna' },
        h('div', { class: 'group-title' }, 'Sua marca'),
        h('div', { class: 'card' },
          campoTexto('user', 'marca', 'Nome da marca', { placeholder: 'Ex: Flor de Sal', caixa: 'words' }),
          campoOpcoes('onboarding', 'nichos', 'O que você produz', NICHOS, true),
          campoTexto('onboarding', 'nichoOutro', 'Outro produto', { placeholder: 'Se não estiver na lista: bordado, cerâmica, doces...' }),
          campoTexto('onboarding', 'tipoProduto', 'Produto principal', { placeholder: 'Ex: sabonete de lavanda' }),
          campoTexto('onboarding', 'historia', 'História da marca', { multi: true, placeholder: 'Como tudo começou? Vira frase de impacto e legendas.' }),
          campoOpcoes('onboarding', 'personalidade', 'Personalidade da marca', PERSONALIDADES),
          campoTexto('onboarding', 'publicoAlvo', 'Pra quem você vende', { placeholder: 'Ex: mulheres que valorizam o natural' })),
        h('div', { class: 'group-title' }, 'Contato e redes'),
        h('div', { class: 'card' },
          cartaoWhats,
          campoTexto('instagram', 'arroba', '@ do Instagram', { placeholder: '@suamarca', caixa: 'none', aoSair: arroba, extra: semInsta, dica: 'Opcional. Sem conta ainda? Peça ajuda.' }),
          camposRefs),
        h('div', { class: 'card perfil-enviar' },
          situacao,
          h('button', { class: 'btn peach block', type: 'button', onClick: enviar }, 'Enviar perfil'),
          h('p', { class: 'muted' }, 'O que você digita é salvo sozinho neste aparelho. Os itens com * são os que completam o perfil.')),
        navegacao({ atual: 'perfil' }))),
  ));
  atualizar();
}
