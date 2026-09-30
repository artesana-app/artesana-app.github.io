// Social: legendas, calendário, análises, agenda e métricas. Mostra o que faz sentido pras redes que a pessoa usa.
import { h, header, lista, grupo, navegacao } from '../ui.js';
import * as store from '../store.js';
import { proximas } from '../data/datas.js';

export function montar(section) {
  const user = store.usuario();
  const ig = store.get('instagram', {});
  const redes = user.redes || {};
  const temInsta = redes.instagram !== false;
  section.innerHTML = '';

  const quais = redes.instagram && redes.facebook ? 'Instagram e Facebook' : redes.facebook ? 'Facebook' : redes.instagram ? 'Instagram' : 'suas redes';
  const badge = h('a', { class: 'badge soft', href: '#redes', style: { marginTop: '10px', display: 'inline-block', textDecoration: 'none' } }, `${quais} · trocar`);

  const banner = ig.arroba || !temInsta ? null : h('div', { class: 'banner' },
    h('span', { style: { fontSize: '26px' } }, '📸'),
    h('div', { class: 'txt' }, h('b', {}, 'Qual é o seu @?'), 'Com ele a gente monta a bio e a análise do perfil. Sem conta ainda? A gente ajuda a criar.'),
    h('a', { class: 'btn sm', href: '#conversa/arroba' }, 'Informar'));

  const datas = proximas(3);
  const cardDatas = h('div', { class: 'card' },
    h('h3', {}, 'Próximas datas pra vender'),
    h('ul', {}, ...datas.map((d) => h('li', { style: { fontSize: '13.5px', padding: '4px 0' } }, h('b', {}, `${d.emoji} ${d.nome} · ${d.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`), h('div', { class: 'muted' }, d.gancho)))));

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Social', sub: ig.arroba ? `Instagram ${ig.arroba}` : 'Post, story, reel e carrossel', extra: badge, voltar: '#home' }),
    h('div', { class: 'content duas-colunas' },
      h('div', { class: 'coluna' },
        banner,
        grupo('Criar', lista([
          { emoji: '✍️', titulo: 'Legendas', sub: 'Post, story, reel e carrossel, na voz da marca', href: '#criar/legendas' },
          { emoji: '🗓️', titulo: 'Calendário do mês', sub: 'O que postar em cada dia, com as datas', href: '#criar/calendario' },
          { emoji: '🎬', titulo: 'Roteiro de reel', sub: 'Gancho, cenas e final', href: '#criar/reels' },
        ])),
        grupo('Analisar', lista([
          { emoji: '🔎', titulo: 'Análise do perfil', sub: temInsta ? (ig.arroba ? `Bio, destaques e frequência pra ${ig.arroba}` : 'Bio pronta e checklist do perfil') : 'Checklist da sua página', href: '#criar/analise-instagram' },
          { emoji: '🌟', titulo: 'Perfis de referência', sub: (ig.perfisReferencia || []).length ? ig.perfisReferencia.join(', ') : '3 perfis que te inspiram', href: '#criar/perfis-referencia' },
          { emoji: '🎯', titulo: 'Análise de público', sub: 'Tom, horários, dores e desejos', href: '#criar/analise-publico' },
        ]))),
      h('div', { class: 'coluna' },
        grupo('Organizar', lista([
          { emoji: '⏰', titulo: 'Agenda de publicações', sub: `${store.get('agenda', []).filter((a) => !a.feito).length} pendentes`, href: '#criar/agendar' },
          { emoji: '📊', titulo: 'Métricas', sub: 'Seguidores, alcance e interações por semana', href: '#criar/metricas' },
          { emoji: '📌', titulo: 'Referências', sub: 'Pinterest filtrado pelo seu produto', href: '#referencias' },
        ])),
        cardDatas,
        navegacao({ atual: 'social' })),
    ),
  ));
}
