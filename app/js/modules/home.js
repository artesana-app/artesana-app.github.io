// Início: o que precisa de você hoje, atalhos redondos e as ferramentas.
import { h, header, saudacao, inicial, copiar, avisoBeta, navegacao } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as onboarding from '../onboarding.js';
import { proximas } from '../data/datas.js';
import { semProtocolo } from '../site.js';

const FERRAMENTAS = [
  { emoji: '🎨', titulo: 'Identidade', sub: 'Logo, frase, paleta e end card', href: '#identidade' },
  { emoji: '🏷️', titulo: 'Rótulos', sub: 'Etiqueta, INCI e Anvisa', href: '#rotulos' },
  { emoji: '📱', titulo: 'Social', sub: 'Legendas, calendário e análise', href: '#social' },
  { emoji: '📸', titulo: 'Fotos', sub: 'Editor e tutoriais', href: '#fotos' },
  { emoji: '📌', titulo: 'Referências', sub: 'Pinterest filtrado pra você', href: '#referencias' },
  { emoji: '💬', titulo: 'Ajuda', sub: 'Chat com respostas na hora', href: '#suporte' },
];

const ATALHOS = [
  { ico: 'W', nome: 'WhatsApp', href: '#whatsapp' },
  { ico: 'R', nome: 'Rótulo', href: '#rotulos' },
  { ico: 'F', nome: 'Foto', href: '#editor' },
  { ico: 'L', nome: 'Legenda', href: '#criar/legendas' },
];

export function montar(section) {
  const user = store.usuario();
  if (!user.nome) { router.ir('#conversa/nome'); return; }
  const p = onboarding.progresso();
  const d = onboarding.dica(p);
  const wa = store.get('whatsapp', {});
  const datas = proximas(2);
  section.innerHTML = '';

  const continuar = p.completo ? null : h('a', { class: 'card continuar', href: d.rota || '#conversa/nome' },
    h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('b', {}, `Sua marca está ${p.feitas} de ${p.total}`), h('p', { class: 'muted', style: { margin: 0 } }, d.texto)),
      h('span', { class: 'btn peach sm' }, 'Continuar')),
    h('div', { class: 'progress dark', style: { marginTop: '10px' } }, h('i', { style: { width: `${(p.feitas / p.total) * 100}%` } })));

  const atalhos = h('div', { class: 'atalhos' }, ...ATALHOS.map((a) => h('a', { class: 'atalho', href: a.href }, h('i', {}, a.ico), h('small', {}, a.nome))));

  const cardWa = wa.linkCurto || wa.link
    ? h('div', { class: 'card moss' }, h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('b', {}, 'Seu link do WhatsApp'), h('div', { class: 'wa-curto' }, semProtocolo(wa.linkCurto || wa.link))),
      h('button', { class: 'btn soft sm', onClick: () => copiar(wa.linkCurto || wa.link, 'Link copiado! Cole na bio.') }, 'Copiar')))
    : h('a', { class: 'card moss', href: '#whatsapp', style: { display: 'block', textDecoration: 'none' } }, h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('b', {}, 'Crie seu link do WhatsApp'), h('div', { style: { fontSize: '13px', opacity: 0.9 } }, 'Curto, pra bio e pra embalagem')),
      h('span', { class: 'badge' }, 'Criar')));

  const cardDatas = h('div', { class: 'card' },
    h('h3', {}, 'Próximas datas pra vender'),
    ...datas.map((x) => h('p', { style: { margin: '6px 0 0', fontSize: '13.5px' } }, h('b', {}, `${x.emoji} ${x.nome} · ${x.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`), h('span', { class: 'muted' }, ` ${x.gancho}`))),
    h('a', { class: 'btn ghost sm', href: '#criar/calendario', style: { marginTop: '10px' } }, 'Ver o calendário do mês'));

  const grade = h('div', { class: 'home-grid' }, ...FERRAMENTAS.map((m) => h('a', { class: 'mod-card', href: m.href }, h('span', { class: 'emoji' }, m.emoji), h('b', {}, m.titulo), h('span', { class: 'muted' }, m.sub))));

  section.append(h('div', { class: 'screen' },
    header({ titulo: `${saudacao()}, ${user.nome.split(' ')[0]}`, sub: user.marca || 'sua marca ainda sem nome', avatar: inicial(user.nome) }),
    h('div', { class: 'content' },
      avisoBeta(),
      h('div', { class: 'home-duas' },
        h('div', {}, continuar, atalhos, cardWa),
        h('div', {}, cardDatas, grade)),
      navegacao({ atual: 'home', voltar: '' }),
    ),
  ));
}
