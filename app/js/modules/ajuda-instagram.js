// Como criar a conta do Instagram pelo celular, passo a passo, com a bio já escrita pra marca.
import { h, header, copiar, toast, navegacao } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import { biosInstagram } from '../lib/geradores.js';

// Cada passo: o que a pessoa vê na tela do celular e onde toca. `tela` desenha um celular com os botões citados.
const PASSOS = [
  { titulo: 'Baixe o Instagram', texto: 'Na Play Store (Android) ou na App Store (iPhone), procure Instagram e toque em Instalar. É grátis.', tela: { topo: 'Play Store', itens: ['Instagram', 'Instalar'], destaque: 1 } },
  { titulo: 'Toque em "Criar nova conta"', texto: 'Abra o app. Embaixo do botão Entrar tem o link Criar nova conta. Escolha cadastrar com o número do celular ou com e-mail.', tela: { topo: 'Instagram', itens: ['Entrar', 'Criar nova conta'], destaque: 1 } },
  { titulo: 'Confirme o código', texto: 'O Instagram manda um código de 6 números por SMS ou e-mail. Digite e toque em Avançar.', tela: { topo: 'Código de confirmação', itens: ['_ _ _ _ _ _', 'Avançar'], destaque: 1 } },
  { titulo: 'Escolha o nome de usuário', texto: 'É o seu @. Use o nome da marca, tudo junto e sem acento. Se estiver ocupado, acrescente a cidade ou o que você faz: @flordesal.blumenau, @flordesal.saboaria.', tela: { topo: 'Nome de usuário', itens: ['flordesal', 'Avançar'], destaque: 0 } },
  { titulo: 'Coloque a foto de perfil', texto: 'Use o logo ou uma foto do produto bem iluminada. Em Editar perfil, toque na foto e escolha da galeria. Se ainda não tem logo, o app cria um pra você em Identidade.', tela: { topo: 'Editar perfil', itens: ['Alterar foto', 'Nome', 'Nome de usuário'], destaque: 0 } },
  { titulo: 'Mude pra conta profissional', texto: 'No perfil, toque nas três linhas (canto superior direito), depois em Configurações e privacidade, Tipo de conta e ferramentas, Mudar para conta profissional. Escolha Empresa e a categoria Loja de varejo ou Marca.', tela: { topo: 'Tipo de conta', itens: ['Mudar para conta profissional', 'Empresa', 'Continuar'], destaque: 0 } },
  { titulo: 'Escreva a bio', texto: 'Em Editar perfil, toque em Bio e cole uma das opções abaixo. Cabem 150 caracteres.', tela: { topo: 'Editar perfil', itens: ['Bio', 'Links'], destaque: 0 }, bio: true },
  { titulo: 'Coloque o link do WhatsApp', texto: 'Ainda em Editar perfil, toque em Links, Adicionar link externo, e cole o seu link curto wa.me. É por ele que a cliente chega.', tela: { topo: 'Links', itens: ['Adicionar link externo', 'wa.me/55...'], destaque: 0 }, link: true },
  { titulo: 'Faça as três primeiras publicações', texto: 'Uma foto do produto com a frase da marca, uma foto sua fazendo, e uma do produto embalado com o preço nos comentários. O app monta as legendas em Social.', tela: { topo: 'Nova publicação', itens: ['Galeria', 'Avançar', 'Compartilhar'], destaque: 2 } },
];

function celular(t) {
  return h('div', { class: 'fone-guia', 'aria-hidden': 'true' },
    h('div', { class: 'fone-topo' }, t.topo),
    ...t.itens.map((it, i) => h('div', { class: `fone-item ${i === t.destaque ? 'toque' : ''}` }, it, i === t.destaque ? h('span', { class: 'dedo' }, '👆') : null)));
}

export function montar(section) {
  const user = store.usuario();
  const o = store.get('onboarding', {});
  const wa = store.get('whatsapp', {});
  const bios = biosInstagram({ marca: user.marca, onboarding: o, cidade: user.cidade, link: wa.linkCurto || '' });
  const arroba = campo({ valor: store.get('instagram', {}).arroba || '', placeholder: '@suamarca', autocapitalize: 'none' });

  const passos = PASSOS.map((p, i) => h('li', { class: 'guia-passo' },
    h('div', { class: 'guia-texto' },
      h('b', {}, `${i + 1}. ${p.titulo}`),
      h('p', {}, p.texto),
      p.bio ? h('div', { class: 'guia-bios' }, ...bios.map((b) => h('div', { class: 'guia-bio' }, h('pre', {}, b), h('button', { class: 'btn white sm', type: 'button', onClick: () => copiar(b, 'Bio copiada') }, 'Copiar')))) : null,
      p.link ? (wa.linkCurto
        ? h('div', { class: 'btn-row' }, h('button', { class: 'btn white sm', type: 'button', onClick: () => copiar(wa.linkCurto, 'Link copiado') }, `Copiar ${wa.linkCurto.replace(/^https?:\/\//, '')}`))
        : h('a', { class: 'btn ghost sm', href: '#whatsapp' }, 'Criar meu link do WhatsApp primeiro')) : null),
    celular(p.tela)));

  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Criar a conta do Instagram', sub: 'Nove passos, pelo celular, uns 15 minutos', voltar: '#conversa/arroba', peach: true }),
    h('div', { class: 'content' },
      h('ol', { class: 'guia' }, ...passos),
      h('div', { class: 'card' },
        h('h3', {}, 'Já criei a conta'),
        h('div', { class: 'field', style: { marginTop: '8px' } }, h('label', {}, 'Qual ficou o seu @?'), arroba.el),
        h('button', { class: 'btn peach block', type: 'button', onClick: () => {
          const v = arroba.input.value.trim().replace(/^@+/, '');
          if (!v) { toast('Digite o @ que você criou'); return; }
          store.patch('instagram', { arroba: `@${v}`, semConta: false });
          toast('Instagram salvo'); router.ir('#conversa/whatsapp');
        } }, 'Salvar e seguir')),
      navegacao({ atual: 'perfil', voltar: 'conversa/arroba', seguir: 'conversa/whatsapp', textoSeguir: 'Fazer isso depois' }),
    ),
  ));
}
