import { h, header, saudacao, inicial } from '../ui.js';
import * as store from '../store.js';

const MODULOS = [
  { emoji: '🎨', titulo: 'Identidade Visual', href: '#identidade' },
  { emoji: '📱', titulo: 'Conteúdo Social', href: '#social' },
  { emoji: '🏷️', titulo: 'Rótulos & Etiquetas', href: '#rotulos' },
  { emoji: '📸', titulo: 'Fotos & Vídeos', href: '#fotos' },
  { emoji: '💬', titulo: 'Feedback', href: '#feedback' },
  { emoji: '🔍', titulo: 'Verificação INPI', href: '#inpi' },
];

export function montar(section) {
  const user = store.usuario();
  section.innerHTML = '';
  const grid = h('div', { class: 'home-grid' },
    ...MODULOS.map((m) => h('a', { class: 'mod-card', href: m.href }, h('span', { class: 'emoji' }, m.emoji), h('b', {}, m.titulo))),
  );
  section.append(
    h('div', { class: 'screen' },
      header({ titulo: `${saudacao()}, ${user.nome || 'artesã'}!`, sub: user.marca || 'sua marca', avatar: inicial(user.marca || user.nome) }),
      h('div', { class: 'content' }, grid),
    ),
  );
}
