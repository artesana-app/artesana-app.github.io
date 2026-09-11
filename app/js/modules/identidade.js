import { h, header, lista, grupo, toast, modal } from '../ui.js';
import * as store from '../store.js';
import * as onboarding from '../onboarding.js';

const ITENS = [
  { id: 'nome', emoji: '🏷️', titulo: 'Nome da marca', sub: 'Definido no perfil', rota: '#perfil' },
  { id: 'paleta', emoji: '🎨', titulo: 'Paleta de cores', sub: '3 a 5 cores que são só suas', upload: true, rota: '#detalhe/logo-ia' },
  { id: 'logo', emoji: '💠', titulo: 'Logo', sub: 'PNG com fundo transparente ou SVG', upload: true, rota: '#detalhe/logo-ia' },
  { id: 'frase', emoji: '💬', titulo: 'Frase de impacto', sub: 'Uma linha que resume a marca', rota: '#detalhe/frase-ia' },
  { id: 'endcard', emoji: '🪧', titulo: 'End card para reels', sub: 'Contato + formas de compra', rota: '#detalhe/endcard' },
  { id: 'fotos', emoji: '🖼️', titulo: 'Fotos coringas', sub: 'Fotos de produto reutilizáveis', upload: true, rota: '#detalhe/fotos-coringas' },
];

const FORMATOS_OK = ['pdf', 'png', 'jpg', 'jpeg', 'svg'];
const ORIENTACAO = {
  psd: 'No Photoshop: Arquivo → Exportar → Exportar como → PNG (fundo transparente).',
  ai: 'No Illustrator: Arquivo → Exportar → Exportar para telas → PNG ou SVG.',
  cdr: 'No CorelDRAW: Arquivo → Publicar em PDF, ou Exportar → PNG com fundo transparente.',
  canva: 'No Canva: Compartilhar → Baixar → PNG, marque "fundo transparente" (plano Pro) ou PDF para impressão.',
};

function orientar(ext) {
  modal({
    titulo: 'Esse formato precisa ser convertido',
    corpo: h('div', {},
      h('p', {}, ORIENTACAO[ext] || 'Exporte como PNG, JPEG, SVG ou PDF e envie de novo.'),
      h('p', { class: 'muted' }, 'Aceitamos direto: PDF, PNG, JPEG e SVG.'),
      h('p', { class: 'muted' }, ORIENTACAO.canva),
    ),
    botoes: [{ texto: 'Entendi', classe: 'peach' }],
  });
}

export function montar(section) {
  const render = () => {
    const user = store.usuario();
    const o = store.get('onboarding', {});
    const id = store.get('identidade', { itens: {}, arquivos: [] });
    const wa = store.get('whatsapp', {});
    const itens = { ...id.itens, nome: !!user.marca };
    const prontos = ITENS.filter((i) => itens[i.id]).length;
    section.innerHTML = '';

    const banner = o.historia ? null : h('div', { class: 'banner' },
      h('span', { style: { fontSize: '26px' } }, '📖'),
      h('div', { class: 'txt' }, h('b', {}, 'Conte a história da sua marca'), 'É dela que saem logo, frase de impacto e legendas.'),
      h('button', { class: 'btn sm', onClick: () => onboarding.pedirDadosMarca(render, true) }, 'Contar'));

    const checklist = h('ul', { class: 'list' }, ...ITENS.map((it) => {
      const ok = !!itens[it.id];
      const arquivos = (id.arquivos || []).filter((a) => a.item === it.id);
      const input = it.upload ? h('input', { type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.svg,.psd,.cdr,.ai', class: 'hidden', onChange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!FORMATOS_OK.includes(ext)) { orientar(ext); e.target.value = ''; return; }
        const novo = { item: it.id, nome: f.name, tipo: f.type, tamanho: f.size, data: new Date().toISOString() };
        store.set('identidade', { ...id, itens: { ...id.itens, [it.id]: true }, arquivos: [...(id.arquivos || []), novo] });
        toast(`${f.name} registrado`);
        render();
      } }) : null;
      return h('li', {},
        h('div', { class: `check ${ok ? 'ok' : ''}` },
          h('button', { type: 'button', class: 'mark', 'aria-label': ok ? 'Marcar como pendente' : 'Marcar como pronto', onClick: () => {
            if (it.id === 'nome') { toast('Defina o nome da marca no perfil'); return; }
            store.set('identidade', { ...id, itens: { ...id.itens, [it.id]: !ok } });
            render();
          } }, ok ? '✓' : ''),
          h('div', { class: 'txt' }, h('b', {}, `${it.emoji} ${it.titulo}`), h('span', {}, arquivos.length ? arquivos.map((a) => a.nome).join(', ') : it.sub)),
          it.upload
            ? h('button', { class: 'btn white sm', onClick: () => input.click() }, ok ? 'Trocar' : 'Enviar')
            : ok ? null : h('a', { class: 'btn soft sm', href: it.rota }, 'Criar'),
          input,
        ),
      );
    }));

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Identidade Visual', sub: user.marca ? `Marca ${user.marca}` : 'Comece pelo nome da marca', peach: true, extra: h('div', { style: { marginTop: '12px' } },
        h('div', { class: 'progress-label' }, h('span', {}, `${prontos} de ${ITENS.length} prontos`), h('span', {}, prontos === ITENS.length ? '🎉' : '')),
        h('div', { class: 'progress dark' }, h('i', { style: { width: `${(prontos / ITENS.length) * 100}%` } }))) }),
      h('div', { class: 'content' },
        banner,
        grupo('Sua identidade', checklist,
          h('p', { class: 'muted', style: { padding: '0 4px' } }, prontos < ITENS.length
            ? 'Podemos sugerir uma identidade completa com base na sua história (em breve, com IA).'
            : 'Identidade completa! Quer que a gente sugira uma versão nova? Em breve.')),
        grupo('Criar com IA', lista([
          { emoji: '💠', titulo: 'Gerador de Logo', sub: '3 opções exclusivas + caixa de remix', href: '#detalhe/logo-ia' },
          { emoji: '💬', titulo: 'Frase de Impacto', sub: 'Baseada na história da marca', href: '#detalhe/frase-ia' },
          { emoji: '🪧', titulo: 'End Card para Reels', sub: wa.link ? `Com seu WhatsApp ${wa.link.replace('https://', '')}` : 'Crie seu link do WhatsApp primeiro', href: wa.link ? '#detalhe/endcard' : '#whatsapp' },
          { emoji: '🖼️', titulo: 'Fotos Coringas', sub: 'Sugestões de fotos de produto', href: '#detalhe/fotos-coringas' },
        ])),
        grupo('Arquivos aceitos', h('div', { class: 'card' },
          h('p', {}, h('b', {}, 'Direto: '), 'PDF, PNG, JPEG, SVG.'),
          h('p', {}, h('b', {}, 'Precisa converter: '), 'PSD, CDR, AI e Canva. Toque em Enviar com um desses e a gente mostra como exportar.'),
          h('button', { class: 'btn ghost sm', onClick: () => orientar('canva') }, 'Fiz no Canva, e agora?'))),
      ),
    ));
  };
  render();
  onboarding.pedirDadosMarca(render);
}
