// Identidade da marca: cada item tem um campo pra preencher ou enviar, e um botão Criar que monta no app.
import { h, header, toast, navegacao, modal } from '../ui.js';
import { campo } from '../campos.js';
import * as store from '../store.js';

const FORMATOS_OK = ['pdf', 'png', 'jpg', 'jpeg', 'svg'];
const ORIENTACAO = {
  psd: 'No Photoshop: Arquivo, Exportar, Exportar como, PNG (fundo transparente).',
  ai: 'No Illustrator: Arquivo, Exportar, Exportar para telas, PNG ou SVG.',
  cdr: 'No CorelDRAW: Arquivo, Publicar em PDF, ou Exportar, PNG com fundo transparente.',
  canva: 'No Canva: Compartilhar, Baixar, PNG, marque "fundo transparente" (plano Pro) ou PDF para impressão.',
};

export const ITENS = [
  { id: 'nome', emoji: '🏷️', titulo: 'Nome da marca', sub: 'Como está na etiqueta', campo: 'texto', placeholder: 'Ex.: Flor de Sal' },
  { id: 'paleta', emoji: '🎨', titulo: 'Paleta de cores', sub: '3 a 5 cores que são só suas', campo: 'texto', placeholder: 'Ex.: #FFB18B, #4A6348, #FFF5EF', criar: '#criar/paleta', arquivo: true },
  { id: 'logo', emoji: '💠', titulo: 'Logo', sub: 'PNG com fundo transparente ou SVG', campo: 'arquivo', criar: '#criar/logo' },
  { id: 'frase', emoji: '💬', titulo: 'Frase de impacto', sub: 'Uma linha que resume a marca', campo: 'texto', placeholder: 'Ex.: feito à mão, do jeito que a gente sabe fazer', criar: '#criar/frase' },
  { id: 'endcard', emoji: '🪧', titulo: 'End card para reels', sub: 'Contato e formas de compra no fim do vídeo', campo: 'arquivo', criar: '#criar/endcard' },
  { id: 'fotos', emoji: '🖼️', titulo: 'Fotos coringas', sub: 'Fotos de produto que você reaproveita', campo: 'arquivo', multiplo: true, criar: '#criar/fotos-coringas' },
];

export function identidade() {
  const id = store.get('identidade', {});
  return { itens: id.itens || {}, valores: id.valores || {}, arquivos: id.arquivos || [] };
}

export function salvarItem(item, valor, pronto = true) {
  const id = identidade();
  store.set('identidade', { ...id, itens: { ...id.itens, [item]: pronto }, valores: { ...id.valores, [item]: valor } });
}

function orientar(ext) {
  modal({ titulo: 'Esse formato precisa ser convertido', corpo: h('div', {}, h('p', {}, ORIENTACAO[ext] || 'Exporte como PNG, JPEG, SVG ou PDF e envie de novo.'), h('p', { class: 'muted' }, 'Aceitamos direto: PDF, PNG, JPEG e SVG.')), botoes: [{ texto: 'Entendi', classe: 'peach' }] });
}

const cores = (texto) => (String(texto || '').match(/#[0-9a-f]{6}\b/gi) || []).map((c) => c.toUpperCase());

export function montar(section) {
  const render = () => {
    const user = store.usuario();
    const id = identidade();
    const valores = { ...id.valores, nome: user.marca || id.valores.nome || '' };
    const arquivosDe = (item) => id.arquivos.filter((a) => a.item === item);
    const pronto = (it) => it.id === 'nome' ? !!user.marca : !!id.itens[it.id] || !!(valores[it.id] && String(valores[it.id]).trim()) || arquivosDe(it.id).length > 0;
    const prontos = ITENS.filter(pronto).length;
    section.innerHTML = '';

    const linhas = ITENS.map((it) => {
      const ok = pronto(it);
      const arquivos = arquivosDe(it.id);
      let entrada = null;
      if (it.campo === 'texto') {
        const c = campo({ valor: it.id === 'paleta' && Array.isArray(valores.paleta) ? valores.paleta.join(', ') : valores[it.id] || '', placeholder: it.placeholder, 'aria-label': it.titulo });
        let timer = null;
        c.input.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            const v = c.input.value.trim();
            if (it.id === 'nome') store.patch('user', { marca: v });
            else if (it.id === 'paleta') salvarItem('paleta', cores(v).length ? cores(v) : v, !!v);
            else salvarItem(it.id, v, !!v);
            const marca = linha.querySelector('.mark');
            const feito = it.id === 'nome' ? !!v : !!v || arquivos.length > 0;
            marca.classList.toggle('ok', feito); marca.textContent = feito ? '✓' : '';
            if (it.id === 'paleta') { amostras.innerHTML = ''; amostras.append(...cores(v).map((x) => h('i', { style: { background: x } }))); }
          }, 300);
        });
        entrada = c.el;
      }
      const amostras = h('span', { class: 'amostras' }, ...(Array.isArray(valores.paleta) && it.id === 'paleta' ? valores.paleta.map((x) => h('i', { style: { background: x } })) : []));
      let arquivo = null;
      if (it.arquivo || it.campo === 'arquivo') {
        const input = h('input', { type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.svg,.psd,.cdr,.ai', multiple: !!it.multiplo, class: 'hidden', onChange: (e) => {
          const files = [...(e.target.files || [])];
          if (!files.length) return;
          const novos = [];
          for (const f of files) {
            const ext = (f.name.split('.').pop() || '').toLowerCase();
            if (!FORMATOS_OK.includes(ext)) { orientar(ext); continue; }
            novos.push({ item: it.id, nome: f.name, tipo: f.type, tamanho: f.size, data: new Date().toISOString() });
          }
          e.target.value = '';
          if (!novos.length) return;
          const atual = identidade();
          store.set('identidade', { ...atual, itens: { ...atual.itens, [it.id]: true }, arquivos: [...atual.arquivos, ...novos] });
          toast(novos.length === 1 ? `${novos[0].nome} registrado` : `${novos.length} arquivos registrados`);
          render();
        } });
        arquivo = h('label', { class: 'campo-arquivo' }, input, h('span', {}, arquivos.length ? arquivos.map((a) => a.nome).join(', ') : (it.multiplo ? 'Toque pra enviar as fotos' : 'Toque pra enviar o arquivo')), h('b', {}, arquivos.length ? 'Trocar' : 'Enviar'));
      }
      const linha = h('li', { class: 'ident-item' },
        h('div', { class: `check ${ok ? 'ok' : ''}` },
          h('span', { class: `mark ${ok ? 'ok' : ''}` }, ok ? '✓' : ''),
          h('div', { class: 'txt' }, h('b', {}, `${it.emoji} ${it.titulo}`), h('span', {}, it.sub), amostras),
          it.criar ? h('a', { class: 'btn soft sm', href: it.criar }, 'Criar') : null),
        h('div', { class: 'ident-campos' }, entrada, arquivo));
      return linha;
    });

    section.append(h('div', { class: 'screen' },
      header({ titulo: 'Identidade', sub: user.marca ? `Marca ${user.marca}` : 'Comece pelo nome da marca', peach: true, voltar: '#home', extra: h('div', { style: { marginTop: '12px' } },
        h('div', { class: 'progress-label' }, h('span', {}, `${prontos} de ${ITENS.length} prontos`), h('span', {}, prontos === ITENS.length ? '🎉' : '')),
        h('div', { class: 'progress dark' }, h('i', { style: { width: `${(prontos / ITENS.length) * 100}%` } }))) }),
      h('div', { class: 'content' },
        h('p', { class: 'muted', style: { margin: '0 4px 10px' } }, 'Preencha ou envie o que você já tem. O que faltar, toque em Criar: o app monta a partir da sua história.'),
        h('ul', { class: 'list ident-lista' }, ...linhas),
        h('div', { class: 'card' },
          h('p', {}, h('b', {}, 'Arquivos aceitos: '), 'PDF, PNG, JPEG e SVG.'),
          h('p', { class: 'muted' }, 'PSD, CDR, AI e Canva precisam ser exportados antes. ', h('button', { class: 'btn ghost sm', type: 'button', onClick: () => orientar('canva') }, 'Fiz no Canva, e agora?'))),
        navegacao({ atual: 'identidade' }),
      ),
    ));
  };
  render();
}
