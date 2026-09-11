import { h, header, lista, grupo, toast } from '../ui.js';
import * as store from '../store.js';
import { FOTO_CELULAR } from '../data/tutoriais.js';
import { passos } from './tutorial.js';

const ESTILOS = [
  { id: 'natural', nome: 'Natural', cor: '#F1E6D6' },
  { id: 'botanico', nome: 'Botânico', cor: '#B9CBB0' },
  { id: 'rustico', nome: 'Rústico', cor: '#C9A27E' },
  { id: 'blush', nome: 'Blush', cor: '#F3C9C4' },
  { id: 'estudio', nome: 'Estúdio', cor: '#E8E8E8' },
  { id: 'eco', nome: 'Eco', cor: '#8FA68E' },
];
const PRESETS = [
  { id: 'verde-musgo', nome: 'Verde Musgo', cor: '#4A6348' },
  { id: 'pessego-suave', nome: 'Pêssego Suave', cor: '#FFB18B' },
  { id: 'golden-moss', nome: 'Golden Moss', cor: '#CC9828' },
  { id: 'terra-viva', nome: 'Terra Viva', cor: '#DE9060' },
];

export function montar(section) {
  const render = () => {
    const f = store.get('fotos', {});
    section.innerHTML = '';
    const estilos = h('div', { class: 'styles' }, ...ESTILOS.map((e) => h('button', { type: 'button', class: `style ${f.estilo === e.id ? 'on' : ''}`, onClick: () => { store.patch('fotos', { estilo: e.id }); toast(`Estilo ${e.nome} escolhido`); render(); } }, h('div', { class: 'sw', style: { background: e.cor } }), e.nome)));
    const presets = h('div', { class: 'chips' }, ...PRESETS.map((p) => h('button', { type: 'button', class: `chip ${f.preset === p.id ? 'on' : ''}`, onClick: () => { store.patch('fotos', { preset: p.id }); render(); } }, h('span', { class: 'sw', style: { background: p.cor } }), p.nome)));
    const tutorial = h('div', { class: 'hidden' }, passos(FOTO_CELULAR));

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Fotos & Vídeos Pro', sub: 'Do celular pro feed com cara de estúdio' }),
      h('div', { class: 'content' },
        grupo('Escolha o estilo antes de editar', estilos),
        grupo('Fotos', lista([
          { emoji: '🪄', titulo: 'Editar Foto com IA', sub: 'Remove fundo, aplica identidade visual', href: '#detalhe/editar-foto' },
          { emoji: '🎨', titulo: 'Sobre os estilos', sub: f.estilo ? `Atual: ${ESTILOS.find((e) => e.id === f.estilo)?.nome}` : 'Natural, Botânico, Rústico, Blush, Estúdio, Eco', href: '#detalhe/estilos' },
        ])),
        grupo('Vídeos', lista([
          { emoji: '🎥', titulo: 'Editar Vídeo', sub: 'Trilha, texto e identidade visual', href: '#detalhe/editar-video' },
          { emoji: '🎙️', titulo: 'Locução', sub: '🗣️ Sua voz · 🤖 Voz IA humanizada · 🎵 Só trilha', href: '#detalhe/locucao' },
        ])),
        grupo('Predefinições da marca', presets),
        grupo('Aprender', lista([
          { emoji: '📚', titulo: 'Tutorial: foto com celular', sub: '6 passos pra foto de produto que vende', onClick: () => tutorial.classList.toggle('hidden') },
        ]), tutorial),
      ),
    ));
  };
  render();
}
