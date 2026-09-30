// Avaliação do beta: vai pra equipe pelo backend. Sem backend, fica guardada no aparelho e a pessoa pode copiar.
import { h, header, toast, copiar, navegacao, modal } from '../ui.js';
import { area } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as analitica from '../analitica.js';
import { NOTAS, validarFeedback, montarFeedback } from '../lib/feedback.js';
import { SITE, diasDeBeta } from '../site.js';

function aparelho() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'celular Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone ou iPad';
  return 'computador';
}

export function montar(section) {
  const rascunho = store.get('feedback_rascunho', {});
  const estado = { nota: rascunho.nota || 0, gostou: rascunho.gostou || '', dificil: rascunho.dificil || '', sugestao: rascunho.sugestao || '' };
  const guardar = () => store.set('feedback_rascunho', estado);
  const dias = diasDeBeta();

  const notas = h('div', { class: 'notas', role: 'group', 'aria-label': 'Nota de 1 a 5' });
  const desenharNotas = () => {
    notas.innerHTML = '';
    for (const n of NOTAS) {
      const on = estado.nota === n.valor;
      notas.append(h('button', { type: 'button', class: `nota ${on ? 'on' : ''}`, 'aria-pressed': String(on), 'aria-label': `${n.valor}, ${n.rotulo}`,
        onClick: () => { estado.nota = n.valor; guardar(); desenharNotas(); erro.classList.add('hidden'); } },
        h('span', { class: 'nota-emoji' }, n.emoji), h('span', {}, n.rotulo)));
    }
  };
  const campo = (chave, rotulo, dica) => {
    const c = area({ valor: estado[chave], id: `fb-${chave}`, rows: '3', placeholder: dica });
    c.input.addEventListener('input', () => { estado[chave] = c.input.value; guardar(); erro.classList.add('hidden'); });
    return h('div', { class: 'field' }, h('label', { for: `fb-${chave}` }, rotulo), c.el);
  };
  const erro = h('div', { class: 'err-msg hidden', role: 'alert' });
  const enviados = store.get('feedback_enviados', []);

  const enviar = async () => {
    const v = validarFeedback(estado);
    if (!v.ok) { erro.textContent = v.erro; erro.classList.remove('hidden'); return; }
    const user = store.usuario();
    const texto = montarFeedback({ ...estado, nome: user.nome, marca: user.marca, versao: SITE.versao, aparelho: aparelho() });
    const r = await analitica.enviar('/v1/feedback', { texto, nota: estado.nota, dados: estado, nome: user.nome || '', marca: user.marca || '', email: user.email || '' });
    enviados.push({ data: new Date().toISOString(), nota: estado.nota, enviado: !!r.ok });
    store.set('feedback_enviados', enviados);
    analitica.evento('feedback', { nota: estado.nota });
    store.remove('feedback_rascunho');
    modal({
      titulo: r.ok ? 'Obrigada!' : 'Avaliação guardada',
      corpo: h('div', {},
        h('p', {}, r.ok ? 'Sua avaliação chegou na equipe. É assim que a gente decide o que vem depois.' : 'A equipe ainda não recebe avaliações direto por aqui nesta versão. Copie o texto e mande pelo Instagram @artesana.app, ou deixe guardado que a gente busca na próxima atualização.'),
        r.ok ? null : h('pre', { class: 'perfil-resumo' }, texto)),
      botoes: [
        r.ok ? null : { texto: 'Copiar', classe: 'white', onClick: () => { copiar(texto, 'Copiado'); return false; } },
        { texto: 'Voltar ao início', classe: 'peach', onClick: () => router.ir('#home') },
      ].filter(Boolean),
    });
  };

  desenharNotas();
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Avaliar o app', sub: dias > 0 ? `Beta: faltam ${dias} ${dias === 1 ? 'dia' : 'dias'} pra fechar esta rodada` : 'Sua opinião decide o que vem depois', voltar: '#home' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('p', {}, 'O app está em versão beta: tudo liberado enquanto a gente ajusta com o que você contar aqui. Leva dois minutos.'),
        h('div', { class: 'field' }, h('label', {}, 'Que nota você dá pro app hoje?'), notas),
        campo('gostou', 'O que mais gostou?', 'Ex.: o rótulo em PDF ficou pronto rápido'),
        campo('dificil', 'O que foi difícil ou não funcionou?', 'Ex.: não achei onde mudar o tamanho'),
        campo('sugestao', 'O que faria você usar todo dia?', 'Ex.: lembrete das datas comemorativas'),
        erro,
        h('button', { class: 'btn peach block', type: 'button', onClick: enviar }, 'Enviar avaliação'),
        enviados.length ? h('p', { class: 'muted', style: { marginTop: '10px' } }, `Você já mandou ${enviados.length} ${enviados.length === 1 ? 'avaliação' : 'avaliações'}. Pode mandar outra sempre que quiser.`) : null),
      navegacao({ atual: 'feedback', voltar: 'home', seguir: '' }),
    ),
  ));
}
