import { h, header, toast, copiar } from '../ui.js';
import * as store from '../store.js';
import { NOTAS, validarFeedback, montarFeedback } from '../lib/feedback.js';
import { montarLink } from '../lib/whatsapp.js';
import { SITE } from '../site.js';
import { comDitado } from '../ditado.js';

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
    const ta = h('textarea', { class: 'textarea', id: `fb-${chave}`, rows: '3', placeholder: dica });
    ta.value = estado[chave];
    ta.addEventListener('input', () => { estado[chave] = ta.value; guardar(); erro.classList.add('hidden'); });
    return h('div', { class: 'field' }, h('label', { for: `fb-${chave}` }, rotulo), comDitado(ta));
  };

  const erro = h('div', { class: 'err-msg hidden', role: 'alert' });
  const enviados = store.get('feedback_enviados', []);

  const preparar = () => {
    const v = validarFeedback(estado);
    if (!v.ok) { erro.textContent = v.erro; erro.classList.remove('hidden'); erro.scrollIntoView({ behavior: 'smooth', block: 'center' }); return null; }
    const user = store.usuario();
    return montarFeedback({ ...estado, nome: user.nome, marca: user.marca, versao: SITE.versao, aparelho: aparelho() });
  };
  const registrar = () => {
    store.set('feedback_enviados', [...enviados, { data: new Date().toISOString(), nota: estado.nota }].slice(-20));
    store.remove('feedback_rascunho');
  };

  desenharNotas();
  section.innerHTML = '';
  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Feedback', sub: 'Sua opinião molda o app', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('p', {}, 'Você está usando a versão de teste. Conte como foi: leva dois minutos e ajuda a decidir o que vem primeiro.'),
        h('div', { class: 'field', style: { marginTop: '14px' } }, h('label', {}, 'Que nota você dá pro app?'), notas),
        campo('gostou', 'O que você mais gostou?', 'Ex: fazer o rótulo foi rápido'),
        campo('dificil', 'O que foi difícil ou confuso?', 'Ex: não achei onde trocar a cor'),
        campo('sugestao', 'O que você gostaria que o app fizesse?', 'Ex: mais modelos de etiqueta'),
        erro,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn white', type: 'button', onClick: () => { const t = preparar(); if (t) { copiar(t, 'Feedback copiado'); registrar(); } } }, 'Copiar'),
          h('button', { class: 'btn peach', type: 'button', onClick: () => {
            const t = preparar();
            if (!t) return;
            const destino = SITE.whatsappEquipe ? montarLink({ ...SITE.whatsappEquipe, mensagem: t }) : `https://wa.me/?text=${encodeURIComponent(t)}`;
            registrar();
            window.open(destino, '_blank', 'noopener');
            toast('Abrindo o WhatsApp');
          } }, 'Enviar pelo WhatsApp')),
        h('p', { class: 'muted', style: { marginTop: '10px' } }, SITE.whatsappEquipe
          ? 'O feedback vai direto pra equipe do artesaná.'
          : 'O WhatsApp abre com o texto pronto. Escolha a conversa de quem te convidou pra testar.'),
      ),
      enviados.length ? h('p', { class: 'muted center' }, enviados.length === 1 ? 'Você já enviou 1 feedback. Pode enviar outro quando quiser.' : `Você já enviou ${enviados.length} feedbacks. Pode enviar outro quando quiser.`) : null,
    ),
  ));
}
