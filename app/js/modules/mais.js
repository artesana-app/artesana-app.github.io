import { h, header, lista, grupo, copiar, inicial, navegacao } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as onboarding from '../onboarding.js';
import { SITE, diasDeBeta } from '../site.js';
import { PLANOS } from '../lib/planos.js';

export function montar(section) {
  const user = store.usuario();
  const wa = store.get('whatsapp', {});
  const p = onboarding.progresso();
  const plano = PLANOS.find((x) => x.id === store.get('plano', 'semente')) || PLANOS[0];
  const redes = user.redes || {};
  const quais = redes.instagram && redes.facebook ? 'Instagram e Facebook' : redes.facebook ? 'Facebook' : redes.instagram ? 'Instagram' : 'Nenhuma ainda';
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: user.marca || user.nome || 'Sua marca', sub: SITE.beta ? `Beta: tudo liberado por mais ${diasDeBeta()} dias` : `Plano ${plano.emoji} ${plano.nome}`, avatar: inicial(user.nome) }),
    h('div', { class: 'content duas-colunas' },
      h('div', { class: 'coluna' },
        grupo('Sua conta', lista([
          { emoji: '👤', titulo: 'Meu perfil', sub: 'Tudo que o app usa pra personalizar', href: '#perfil', badge: `${p.feitas}/${p.total}`, badgeClasse: p.completo ? 'ok' : 'soft' },
          { emoji: '📱', titulo: 'Suas redes', sub: quais, href: '#redes' },
          { emoji: '💎', titulo: 'Planos', sub: SITE.beta ? 'Tudo liberado durante o teste' : 'Semente, Florescer e Prosperar', href: '#planos', badge: SITE.beta ? 'beta' : plano.nome, badgeClasse: SITE.beta ? 'ok' : 'gold' },
          { emoji: '⚙️', titulo: 'Configurações', sub: 'Notificações, dados', href: '#config' },
        ])),
        grupo('Contato', lista([
          wa.linkCurto || wa.link
            ? { emoji: '📲', titulo: 'Link do WhatsApp', sub: (wa.linkCurto || wa.link).replace(/^https?:\/\//, ''), extra: h('button', { class: 'btn soft sm', onClick: (e) => { e.stopPropagation(); copiar(wa.linkCurto || wa.link, 'Link copiado!'); } }, 'Copiar'), href: '#whatsapp' }
            : { emoji: '📲', titulo: 'Criar link do WhatsApp', sub: 'Com QR code pro rótulo', href: '#whatsapp', badge: 'Criar' },
        ]))),
      h('div', { class: 'coluna' },
        grupo('Ferramentas', lista([
          { emoji: '🎨', titulo: 'Identidade', sub: 'Logo, frase, paleta, end card', href: '#identidade' },
          { emoji: '📌', titulo: 'Referências', sub: 'Pinterest filtrado pra você', href: '#referencias' },
          { emoji: '🔍', titulo: 'Registrar a marca', sub: 'INPI, passo a passo', href: '#inpi' },
          { emoji: '📘', titulo: 'Criar página no Facebook', sub: 'Passo a passo no celular e no computador', href: '#tutorial-meta' },
        ])),
        grupo('Ajuda', lista([
          { emoji: '💬', titulo: 'Chat de ajuda', sub: 'Respostas na hora, ou uma atendente', href: '#suporte' },
          { emoji: '⭐', titulo: 'Avaliar o app', sub: 'Beta: sua opinião decide o que vem', href: '#feedback', badge: 'beta' },
        ])),
        h('button', { class: 'btn white block', style: { marginTop: '8px' }, onClick: () => { store.patch('user', { logado: false }); router.ir('#login'); } }, 'Sair da conta'),
        navegacao({ atual: 'mais', voltar: 'home', seguir: '' })),
    ),
  ));
}
