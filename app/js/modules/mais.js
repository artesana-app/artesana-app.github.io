import { h, header, lista, grupo, copiar, inicial } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as onboarding from '../onboarding.js';

const PLANOS = { semente: '🌱 Semente', florescer: '🌸 Florescer', prosperar: '🌳 Prosperar' };

export function montar(section) {
  const user = store.usuario();
  const wa = store.get('whatsapp', {});
  const meta = store.get('meta', {});
  const p = onboarding.progresso();
  const plano = store.get('plano', 'semente');
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: user.marca || user.nome || 'Sua marca', sub: `Plano ${PLANOS[plano] || PLANOS.semente}`, avatar: inicial(user.marca || user.nome) }),
    h('div', { class: 'content' },
      grupo('Ferramentas', lista([
        { emoji: '🎨', titulo: 'Identidade Visual', sub: 'Checklist, upload e geradores', href: '#identidade' },
        { emoji: '💬', titulo: 'Feedback', sub: 'Conte o que falta', href: '#feedback' },
        { emoji: '🔍', titulo: 'Verificação INPI', sub: 'Registre sua marca', href: '#inpi' },
      ])),
      grupo('Contato', lista([
        wa.link
          ? { emoji: '📲', titulo: 'Link do WhatsApp', sub: wa.link.replace('https://', ''), extra: h('button', { class: 'btn soft sm', onClick: (e) => { e.stopPropagation(); copiar(wa.link, 'Link copiado!'); } }, 'Copiar'), href: '#whatsapp' }
          : { emoji: '📲', titulo: 'Criar link do WhatsApp', sub: 'Com QR code pro rótulo', href: '#whatsapp', badge: 'Criar' },
      ])),
      grupo('Sua conta', lista([
        { emoji: '👤', titulo: 'Meu Perfil', sub: 'Dados da marca e onboarding', href: '#perfil', badge: `${p.feitas}/${p.total}`, badgeClasse: p.completo ? 'ok' : 'soft' },
        { emoji: '🏢', titulo: 'Meta Business', sub: meta.conectado ? 'Página conectada' : 'Não conectado', href: '#meta', badge: meta.conectado ? 'Conectado' : 'Conectar', badgeClasse: meta.conectado ? 'ok' : 'off' },
        { emoji: '💎', titulo: 'Planos', sub: 'Semente · Florescer · Prosperar', href: '#planos', badge: 'Evoluir', badgeClasse: 'gold' },
        { emoji: '⚙️', titulo: 'Configurações', sub: 'Notificações, dados', href: '#config' },
      ])),
      h('a', { class: 'card peach', href: '#tutorial-meta', style: { display: 'block', textDecoration: 'none' } },
        h('div', { class: 'row' }, h('span', { style: { fontSize: '28px' } }, '📘'), h('div', { class: 'grow' }, h('b', {}, 'Tutorial: criar página no Facebook'), h('div', { style: { fontSize: '13px' } }, 'Passo a passo no celular e no computador')), h('span', { class: 'chev' }, '›'))),
      h('button', { class: 'btn white block', style: { marginTop: '8px' }, onClick: () => { store.patch('user', { logado: false }); router.ir('#login'); } }, 'Sair da conta'),
    ),
  ));
}
