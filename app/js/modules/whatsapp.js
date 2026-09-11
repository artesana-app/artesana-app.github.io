import { h, header, toast, copiar } from '../ui.js';
import * as store from '../store.js';
import { validar, montarLink, numeroFormatado, SUGESTOES_MENSAGEM } from '../lib/whatsapp.js';

// QR em data URL (PNG) usando qrcode-generator (window.qrcode). px = lado em pixels.
export function gerarQrDataUrl(texto, px = 512, cor = '#2C1A1E') {
  if (typeof window === 'undefined' || typeof window.qrcode !== 'function') return null;
  const qr = window.qrcode(0, 'M');
  qr.addData(texto);
  qr.make();
  const n = qr.getModuleCount();
  const margem = 2;
  const cel = Math.floor(px / (n + margem * 2));
  const lado = cel * (n + margem * 2);
  const canvas = document.createElement('canvas');
  canvas.width = lado; canvas.height = lado;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, lado, lado);
  ctx.fillStyle = cor;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + margem) * cel, (r + margem) * cel, cel, cel);
  return canvas.toDataURL('image/png');
}

export function montar(section) {
  const salvo = store.get('whatsapp', {});
  section.innerHTML = '';

  const ddd = h('input', { class: 'input', inputmode: 'numeric', maxlength: '4', placeholder: '21', style: { maxWidth: '80px' } });
  const numero = h('input', { class: 'input', inputmode: 'numeric', maxlength: '11', placeholder: '99999-9999' });
  const msg = h('textarea', { class: 'textarea', placeholder: 'Mensagem automática (opcional)', style: { minHeight: '70px' } });
  ddd.value = salvo.ddd || ''; numero.value = salvo.numero || ''; msg.value = salvo.mensagem || '';
  const erro = h('div', { class: 'err-msg hidden' });
  const resultado = h('div', { class: 'card wa-result hidden' });

  const chips = h('div', { class: 'chips', style: { marginTop: '8px' } },
    ...SUGESTOES_MENSAGEM.map((s) => h('button', { type: 'button', class: 'chip', onClick: () => { msg.value = s; } }, s)));

  const gerar = (silencioso = false) => {
    const v = validar({ ddd: ddd.value, numero: numero.value });
    if (!v.ok) {
      if (!silencioso) { erro.textContent = v.erro; erro.classList.remove('hidden'); }
      resultado.classList.add('hidden');
      return null;
    }
    erro.classList.add('hidden');
    const dados = { ddd: v.ddd, numero: v.numero, mensagem: msg.value.trim() };
    const link = montarLink(dados);
    store.set('whatsapp', { ...dados, link });
    const qrUrl = gerarQrDataUrl(link);
    resultado.innerHTML = '';
    resultado.append(
      h('div', { class: 'muted' }, numeroFormatado(dados)),
      h('div', { class: 'link' }, link),
      qrUrl ? h('img', { src: qrUrl, alt: 'QR Code do WhatsApp' }) : h('p', { class: 'muted' }, 'QR indisponível'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: () => copiar(link, 'Link copiado! Cole na bio.') }, 'Copiar'),
        h('a', { class: 'btn ghost', href: link, target: '_blank', rel: 'noopener' }, 'Testar'),
        qrUrl ? h('a', { class: 'btn soft', href: qrUrl, download: 'qr-whatsapp.png' }, 'Baixar QR') : null,
      ),
      h('p', { class: 'muted', style: { marginTop: '10px' } }, 'Use na bio do Instagram, no rótulo (QR) e no end card dos reels.'),
    );
    resultado.classList.remove('hidden');
    if (!silencioso) toast('Link gerado e salvo');
    return link;
  };

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Link do WhatsApp', sub: 'Um link só, pra tudo', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Seu número'),
          h('div', { class: 'inline' }, h('span', { class: 'prefix' }, '+55'), ddd, numero), erro),
        h('div', { class: 'field' }, h('label', {}, 'Mensagem automática'), msg, chips,
          h('div', { class: 'hint' }, 'É o que a cliente já manda pronto ao tocar no link.')),
        h('button', { class: 'btn peach block', onClick: () => gerar() }, 'Gerar link'),
      ),
      resultado,
    ),
  ));
  if (salvo.link) gerar(true);
}
