// Referências: busca no Pinterest filtrada pelo que a pessoa produz e pela personalidade da marca,
// e uma lista do que ela salvou. O Pinterest abre na aba dele (não há API pública de busca pra sites).
import { h, header, toast, copiar, navegacao, chips } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';
import * as analitica from '../analitica.js';
import { NICHOS, PERSONALIDADES, nichosDe } from '../lib/perfil.js';

const TEMAS = [
  { id: 'rotulo', nome: 'Rótulo e embalagem', termos: 'rótulo artesanal embalagem' },
  { id: 'foto', nome: 'Foto de produto', termos: 'foto de produto artesanal' },
  { id: 'feed', nome: 'Feed do Instagram', termos: 'feed instagram artesanal' },
  { id: 'logo', nome: 'Logo', termos: 'logo minimalista' },
  { id: 'kit', nome: 'Kit de presente', termos: 'kit presente artesanal' },
  { id: 'feira', nome: 'Barraca de feira', termos: 'barraca feira artesanato' },
];
const PALAVRA_NICHO = { sabonetes: 'sabonete artesanal', velas: 'vela artesanal', cosmeticos: 'cosmético natural', alimentos: 'doce artesanal', artesanato: 'artesanato' };
const PALAVRA_PERSONALIDADE = { delicada: 'delicado', rustica: 'rústico', sofisticada: 'minimalista elegante', alegre: 'colorido' };

export function termosDeBusca({ onboarding = {}, tema, extra = '' }) {
  const nicho = nichosDe(onboarding)[0];
  const partes = [(TEMAS.find((t) => t.id === tema) || TEMAS[0]).termos, PALAVRA_NICHO[nicho] || onboarding.nichoOutro || '', PALAVRA_PERSONALIDADE[onboarding.personalidade] || '', extra];
  return partes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function montar(section) {
  const o = store.get('onboarding', {});
  const salvos = store.get('referencias', []);
  let tema = 'rotulo';
  const extra = campo({ placeholder: 'Acrescente uma palavra: lavanda, kraft, natal...' });
  const termos = h('p', { class: 'termos' });
  const atualizar = () => { termos.textContent = termosDeBusca({ onboarding: o, tema, extra: extra.input.value }); };
  extra.input.addEventListener('input', atualizar);
  const abrir = () => { const q = termosDeBusca({ onboarding: o, tema, extra: extra.input.value }); analitica.evento('busca', { termos: q.slice(0, 120) }); window.open(`https://br.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`, '_blank', 'noopener'); };

  const link = campo({ placeholder: 'Cole o link do pin ou da pasta que você gostou', type: 'url' });
  const nota = campo({ placeholder: 'Por que gostou? (opcional)' });
  const lista = h('div', {});
  const desenhar = () => {
    lista.innerHTML = '';
    if (!salvos.length) { lista.append(h('p', { class: 'muted center' }, 'Nada salvo ainda. Abra o Pinterest, escolha e cole o link aqui.')); return; }
    lista.append(h('ul', { class: 'list' }, ...salvos.map((r) => h('li', {}, h('div', { class: 'item static' },
      h('span', { class: 'emoji' }, '📌'),
      h('span', { class: 'txt' }, h('b', {}, r.nota || r.url.replace(/^https?:\/\/(www\.|br\.)?/, '').slice(0, 60)), h('span', {}, r.url.replace(/^https?:\/\//, '').slice(0, 70))),
      h('a', { class: 'btn white sm', href: r.url, target: '_blank', rel: 'noopener' }, 'Abrir'),
      h('button', { class: 'btn white sm', type: 'button', 'aria-label': 'remover', onClick: () => { salvos.splice(salvos.indexOf(r), 1); store.set('referencias', salvos); desenhar(); } }, '✕'))))));
  };
  desenhar(); atualizar();

  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Referências', sub: 'Ideias do Pinterest, filtradas pra sua marca', voltar: '#home' }),
    h('div', { class: 'content duas-colunas' },
      h('div', { class: 'coluna' },
        h('div', { class: 'card' },
          h('div', { class: 'field' }, h('label', {}, 'O que você quer ver'), chips({ opcoes: TEMAS, valor: tema, aoMudar: (v) => { tema = v; atualizar(); } })),
          h('div', { class: 'field' }, h('label', {}, 'Mais alguma palavra'), extra.el),
          h('p', { class: 'muted' }, 'Busca montada com o que você produz e a personalidade da marca:'), termos,
          h('button', { class: 'btn peach block', type: 'button', onClick: abrir }, 'Abrir no Pinterest'),
          h('button', { class: 'btn white block', type: 'button', style: { marginTop: '8px' }, onClick: () => copiar(termos.textContent, 'Busca copiada') }, 'Copiar a busca')),
        h('p', { class: 'muted' }, 'Ligar a sua conta do Pinterest pra ver os pins aqui dentro chega junto com o login.')),
      h('div', { class: 'coluna' },
        h('div', { class: 'card' },
          h('h3', {}, 'Salvar o que você gostou'),
          h('div', { class: 'field', style: { marginTop: '8px' } }, link.el),
          h('div', { class: 'field' }, nota.el),
          h('button', { class: 'btn block', type: 'button', onClick: () => { const u = link.input.value.trim(); if (!/^https?:\/\//.test(u)) { toast('Cole um link completo, começando com https'); return; } salvos.unshift({ url: u, nota: nota.input.value.trim(), t: Date.now() }); store.set('referencias', salvos); link.input.value = ''; nota.input.value = ''; desenhar(); toast('Salvo'); } }, 'Salvar')),
        lista,
        navegacao({ atual: 'referencias' })),
    ),
  ));
}
