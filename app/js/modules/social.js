import { h, header, lista, grupo, toast } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as onboarding from '../onboarding.js';
import { proximas } from '../data/datas.js';
import { SITE } from '../site.js';

export function montar(section) {
  const render = () => {
    const ig = store.get('instagram', {});
    const meta = store.get('meta', {});
    section.innerHTML = '';
    const badgeMeta = h('span', { class: `badge ${meta.conectado ? 'ok' : 'off'}`, style: { marginTop: '10px', display: 'inline-block' } }, meta.conectado ? '✅ Meta Business conectado' : 'Meta Business não conectado');

    const banner = ig.arroba ? null : h('div', { class: 'banner' },
      h('span', { style: { fontSize: '26px' } }, '📸'),
      h('div', { class: 'txt' }, h('b', {}, 'Qual o seu @?'), 'Com ele a gente analisa seu perfil e sugere bio, destaques e frequência.'),
      h('button', { class: 'btn sm', onClick: () => onboarding.pedirInstagram(render, true) }, 'Informar'));

    const datas = proximas(3);
    const cardDatas = h('div', { class: 'card' },
      h('h3', {}, '📅 Próximas datas pra vender'),
      h('ul', {}, ...datas.map((d) => h('li', { style: { fontSize: '13.5px', padding: '4px 0' } }, h('b', {}, `${d.emoji} ${d.nome} · ${d.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`), h('div', { class: 'muted' }, d.gancho)))),
    );

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Conteúdo Social', sub: ig.arroba ? `Instagram ${ig.arroba}` : 'Post, story, reel e carrossel', extra: badgeMeta }),
      h('div', { class: 'content' },
        banner,
        grupo('Criar', lista([
          { emoji: '🗓️', titulo: 'Calendário Editorial', sub: 'Sugestão mensal automatizada', href: '#detalhe/calendario' },
          { emoji: '✍️', titulo: 'Gerador de Legendas', sub: 'Post, story, reel, carrossel, na voz da marca', href: '#detalhe/legendas' },
          { emoji: '🎬', titulo: 'Editor de Reels', sub: 'Sua voz, voz IA ou só música', href: '#detalhe/reels' },
        ])),
        grupo('Analisar', lista([
          { emoji: '🔎', titulo: 'Análise de Perfil Instagram', sub: ig.arroba ? `Bio, destaques e frequência pra ${ig.arroba}` : 'Informe seu @ primeiro', href: '#detalhe/analise-instagram' },
          { emoji: '🌟', titulo: 'Perfis de Referência', sub: (ig.perfisReferencia || []).length ? ig.perfisReferencia.join(', ') : '3 perfis que te inspiram', href: '#detalhe/perfis-referencia' },
          { emoji: '🎯', titulo: 'Análise de Público', sub: 'Conexão marca + público-alvo', href: '#detalhe/analise-publico' },
        ])),
        grupo('Agendar', lista([
          { emoji: '⏰', titulo: 'Agendar Publicação', sub: 'Via Meta Business', onClick: () => { if (!meta.conectado) { toast('Conecte o Meta Business primeiro'); router.ir('#meta'); } else router.ir('#detalhe/agendar'); } },
          { emoji: '📊', titulo: 'Métricas', sub: 'Alcance, engajamento, melhores horários', badge: SITE.beta ? null : 'PRO', badgeClasse: 'gold', onClick: () => router.ir(SITE.beta ? '#detalhe/metricas' : '#planos') },
        ])),
        cardDatas,
      ),
    ));
  };
  render();
  onboarding.pedirInstagram(render);
}
