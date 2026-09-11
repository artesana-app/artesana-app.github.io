import { h, header, saudacao, inicial, copiar } from '../ui.js';
import * as store from '../store.js';
import * as onboarding from '../onboarding.js';

const MODULOS = [
  { emoji: '🎨', titulo: 'Identidade Visual', href: '#identidade', pendente: (p) => !p.etapas[1].ok || !p.etapas[2].ok },
  { emoji: '📱', titulo: 'Conteúdo Social', href: '#social', pendente: (p) => !p.etapas[4].ok },
  { emoji: '🏷️', titulo: 'Rótulos & Etiquetas', href: '#rotulos', pendente: () => !store.get('rotulos', {}).ultimoRotulo },
  { emoji: '📸', titulo: 'Fotos & Vídeos', href: '#fotos', pendente: () => false },
  { emoji: '💬', titulo: 'Feedback', href: '#feedback', pendente: () => false },
  { emoji: '🔍', titulo: 'Verificação INPI', href: '#inpi', pendente: () => false },
];

const PLANOS = { semente: '🌱 Semente', florescer: '🌸 Florescer', prosperar: '🌳 Prosperar' };

export function montar(section) {
  const render = () => {
    const user = store.usuario();
    const p = onboarding.progresso();
    const d = onboarding.dica(p);
    const wa = store.get('whatsapp', {});
    const plano = store.get('plano', 'semente');
    section.innerHTML = '';

    const barra = h('div', { style: { marginTop: '14px' } },
      h('div', { class: 'progress-label' }, h('span', {}, `Perfil da marca: ${p.feitas} de ${p.total}`), h('span', {}, p.completo ? '✓ completo' : '')),
      h('div', { class: 'progress' }, h('i', { style: { width: `${(p.feitas / p.total) * 100}%` } })),
      p.completo ? null : h('div', { style: { fontSize: '12px', opacity: 0.8, marginTop: '6px' } }, 'Complete pra desbloquear sugestões personalizadas'),
    );

    const grid = h('div', { class: 'home-grid' },
      ...MODULOS.map((m) => h('a', { class: 'mod-card', href: m.href },
        h('span', { class: 'emoji' }, m.emoji), h('b', {}, m.titulo), m.pendente(p) ? h('span', { class: 'dot', title: 'ação pendente' }) : null)),
    );

    const cardDica = h('a', { class: 'card gold tip', href: d.rota || '#perfil', style: { display: 'flex', textDecoration: 'none', color: 'inherit' } },
      h('span', { class: 'emoji' }, d.emoji), h('div', {}, h('b', {}, 'Dica de hoje'), h('p', { class: 'muted', style: { margin: 0 } }, d.texto)));

    const cardWa = wa.link
      ? h('div', { class: 'card moss' }, h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', {}, 'Seu link do WhatsApp'), h('div', { style: { fontSize: '13px', wordBreak: 'break-all', opacity: 0.9 } }, wa.link.replace('https://', ''))),
        h('button', { class: 'btn soft sm', onClick: () => copiar(wa.link, 'Link copiado!') }, 'Copiar')))
      : h('a', { class: 'card moss', href: '#whatsapp', style: { display: 'block', textDecoration: 'none' } }, h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', {}, 'Crie seu link do WhatsApp'), h('div', { style: { fontSize: '13px', opacity: 0.9 } }, 'Pra bio, rótulo e end card')),
        h('span', { class: 'badge' }, 'Criar')));

    const cardPlano = h('div', { class: 'card gold-border' }, h('div', { class: 'row' },
      h('div', { class: 'grow' }, h('b', {}, `Plano ${PLANOS[plano] || PLANOS.semente}`), h('div', { class: 'muted' }, plano === 'semente' ? 'Grátis · funcionalidades limitadas' : 'Obrigada por apoiar 💛')),
      h('a', { class: 'btn ghost sm', href: '#planos' }, 'Evoluir')));

    section.append(h('div', { class: 'screen' },
      header({ titulo: `${saudacao()}, ${user.nome || 'artesã'}!`, sub: user.marca || 'sua marca ainda sem nome', avatar: inicial(user.marca || user.nome), extra: barra }),
      h('div', { class: 'content' }, cardDica, grid, cardWa, cardPlano),
    ));
  };
  render();
  onboarding.primeiroAcesso(render);
}
