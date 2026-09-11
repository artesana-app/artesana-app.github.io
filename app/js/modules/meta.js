import { h, header, toast } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';

export function montar(section) {
  const render = () => {
    const meta = store.get('meta', {});
    const user = store.usuario();
    section.innerHTML = '';
    const conteudo = h('div', { class: 'content' });

    if (meta.conectado) {
      conteudo.append(h('div', { class: 'card' },
        h('div', { class: 'row' }, h('span', { style: { fontSize: '32px' } }, '✅'), h('div', { class: 'grow' }, h('h3', {}, 'Meta Business conectado'), h('div', { class: 'muted' }, 'Sua página está pronta pro agendamento (em breve).'))),
        h('button', { class: 'btn white block', style: { marginTop: '12px' }, onClick: () => { store.set('meta', { conectado: false, temPagina: false }); toast('Desconectado'); render(); } }, 'Desconectar'),
      ));
    } else {
      const loginEmail = !user.loginTipo || user.loginTipo === 'email';
      conteudo.append(
        h('div', { class: 'card' },
          h('h3', {}, 'Você já tem uma Página no Facebook?'),
          h('p', { class: 'muted' }, loginEmail ? 'Conectar pelo Facebook facilita, mas dá pra seguir por aqui.' : 'É a página que liga o Instagram ao agendamento.'),
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn', onClick: () => { store.set('meta', { conectado: true, temPagina: true }); toast('Página conectada ✅'); render(); } }, 'Sim, conectar'),
            h('button', { class: 'btn ghost', onClick: () => { semPagina.classList.remove('hidden'); } }, 'Ainda não'),
          ),
        ),
      );
      const semPagina = h('div', { class: 'card hidden' },
        h('h3', {}, 'Sem problema, a gente cria'),
        h('p', { class: 'muted' }, 'Escolha: o app cria a página pra você ou você segue o tutorial.'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn peach', onClick: (e) => {
            const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Criando página...';
            setTimeout(() => { store.set('meta', { conectado: true, temPagina: true }); toast('Página criada e conectada! 🎉'); render(); }, 2000);
          } }, 'Criar automaticamente'),
          h('button', { class: 'btn white', onClick: () => router.ir('#tutorial-meta') }, 'Tutorial passo a passo'),
        ),
      );
      conteudo.append(semPagina);
    }
    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Meta Business', sub: 'Facebook + Instagram num lugar só', voltar: '#mais' }),
      conteudo,
    ));
  };
  render();
}
