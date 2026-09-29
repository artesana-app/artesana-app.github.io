import { h, header, lista, grupo, toast, confirmar } from '../ui.js';
import * as store from '../store.js';
import * as router from '../router.js';

import { SITE } from '../site.js';

const VERSAO = SITE.versao;

export function montar(section) {
  const cfg = store.get('config', { notificacoes: false });
  section.innerHTML = '';
  const sw = h('label', { class: 'switch' },
    h('input', { type: 'checkbox', checked: !!cfg.notificacoes, onChange: (e) => { store.patch('config', { notificacoes: e.target.checked }); toast(e.target.checked ? 'Notificações ativadas' : 'Notificações desativadas'); } }),
    h('i'));
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Configurações', voltar: '#mais' }),
    h('div', { class: 'content' },
      grupo('Preferências', lista([
        { emoji: '🔔', titulo: 'Notificações', sub: 'Lembretes de datas e dicas', extra: sw, static: true },
        { emoji: '🌐', titulo: 'Idioma', sub: 'Português (Brasil)', static: true },
      ])),
      grupo('Sobre', lista([
        { emoji: '🍑', titulo: 'artesaná.', sub: `Versão ${VERSAO} · beta`, static: true },
        { emoji: '📄', titulo: 'Termos de uso', sub: 'Em breve', static: true },
      ])),
      grupo('Dados', lista([
        { emoji: '🗑️', titulo: 'Limpar dados', sub: 'Apaga tudo deste aparelho e volta pro login', onClick: async () => {
          if (await confirmar('Limpar dados?', 'Perfil, marca, WhatsApp e rótulos salvos serão apagados deste aparelho.', 'Apagar tudo')) {
            store.limparTudo();
            router.ir('#login');
          }
        } },
      ])),
    ),
  ));
}
