// Fotos e vídeos: estilos em galeria, editor de foto, roteiro de reel, locução e capa de vídeo, e o tutorial.
import { h, header, lista, grupo, toast, cartoes, navegacao } from '../ui.js';
import * as store from '../store.js';
import { FOTO_CELULAR } from '../data/tutoriais.js';
import { passos } from './tutorial.js';
import { ESTILOS } from './editor.js';

export function montar(section) {
  const render = () => {
    const f = store.get('fotos', {});
    section.innerHTML = '';
    const estilos = cartoes(ESTILOS.map((e) => ({ titulo: e.nome, sub: f.estilo === e.id ? 'Estilo atual' : '', on: f.estilo === e.id, capa: h('div', { class: 'capa-cor', style: { background: `linear-gradient(160deg, ${e.cor}, #FFF5EF)` } }), onClick: () => { store.patch('fotos', { estilo: e.id }); toast(`Estilo ${e.nome} escolhido`); render(); } })), 'tres');
    const tutorial = h('div', { class: 'hidden' }, passos(FOTO_CELULAR));

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Fotos e vídeos', sub: 'Do celular pro feed, com a cara da sua marca', voltar: '#home' }),
      h('div', { class: 'content' },
        grupo('Escolha o estilo da marca', estilos),
        grupo('Fotos', lista([
          { emoji: '🪄', titulo: 'Editar foto', sub: 'Corte, luz, estilo e a marca por cima', href: '#editor' },
          { emoji: '🖼️', titulo: 'Fotos coringas', sub: 'As oito fotos que resolvem meses de feed', href: '#criar/fotos-coringas' },
        ])),
        grupo('Vídeos', lista([
          { emoji: '🎬', titulo: 'Roteiro de reel', sub: 'Gancho, três cenas e final, prontos', href: '#criar/reels' },
          { emoji: '🎙️', titulo: 'Locução', sub: 'Grave sua voz pelo app', href: '#criar/locucao' },
          { emoji: '🎥', titulo: 'Capa e edição do vídeo', sub: 'Escolha a capa e monte com os cortes certos', href: '#criar/editar-video' },
        ])),
        grupo('Aprender', lista([
          { emoji: '📚', titulo: 'Tutorial: foto com celular', sub: '6 passos pra foto de produto que vende', onClick: () => tutorial.classList.toggle('hidden') },
        ]), tutorial),
        navegacao({ atual: 'fotos' }),
      ),
    ));
  };
  render();
}
