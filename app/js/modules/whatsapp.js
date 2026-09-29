import { h, header, toast, copiar } from '../ui.js';
import * as store from '../store.js';
import { validar, numeroFormatado, montarLinkCurto, lerLinkCurto, destinoLinkCurto, SUGESTOES_MENSAGEM } from '../lib/whatsapp.js';
import { baseLinkCurto, semProtocolo } from '../site.js';

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
  const marca = (store.usuario().marca || '').trim();
  section.innerHTML = '';

  const ddd = h('input', { class: 'input', inputmode: 'numeric', maxlength: '4', placeholder: '21', 'aria-label': 'DDD', style: { maxWidth: '80px' } });
  const numero = h('input', { class: 'input', inputmode: 'numeric', maxlength: '11', placeholder: '99999-9999', 'aria-label': 'Número' });
  const msg = h('textarea', { class: 'textarea', placeholder: 'Mensagem que a cliente já manda pronta (opcional)', style: { minHeight: '70px' } });
  ddd.value = salvo.ddd || ''; numero.value = salvo.numero || ''; msg.value = salvo.mensagem || '';
  const erro = h('div', { class: 'err-msg hidden' });
  const resultado = h('div', { class: 'hidden' });

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
    const linkCurto = montarLinkCurto({ base: baseLinkCurto(), marca, ...dados });
    const lido = lerLinkCurto(new URL(linkCurto).search);
    const link = destinoLinkCurto(lido); // para onde o link curto leva: wa.me com a mensagem identificada
    const enviada = decodeURIComponent((link.split('?text=')[1] || ''));
    store.set('whatsapp', { ...dados, link, linkCurto });
    const qrUrl = gerarQrDataUrl(link);

    resultado.innerHTML = '';
    resultado.append(
      h('div', { class: 'card wa-id' },
        h('div', { class: 'wa-id-topo' },
          h('span', { class: 'wa-id-marca' }, marca || 'Sua marca'),
          h('span', { class: 'muted' }, numeroFormatado(dados))),
        marca ? null : h('p', { class: 'muted' }, 'Seu link ainda está sem nome. ', h('a', { href: '#perfil' }, 'Informe a marca no perfil'), ' pra ele sair identificado.'),
        h('div', { class: 'wa-rotulo' }, 'Link curto'),
        h('div', { class: 'wa-link' }, semProtocolo(linkCurto)),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => copiar(linkCurto, 'Link copiado! Cole na bio.') }, 'Copiar link'),
          h('a', { class: 'btn ghost', href: linkCurto, target: '_blank', rel: 'noopener' }, 'Testar')),
        enviada ? h('div', {}, h('div', { class: 'wa-rotulo' }, 'O que a cliente envia'), h('p', { class: 'wa-msg' }, enviada)) : null,
      ),
      h('div', { class: 'card wa-result' },
        h('div', { class: 'wa-rotulo' }, 'QR code pra embalagem e rótulo'),
        qrUrl ? h('img', { src: qrUrl, alt: `QR code do WhatsApp de ${marca || 'sua marca'}` }) : h('p', { class: 'muted' }, 'QR indisponível'),
        qrUrl ? h('a', { class: 'btn soft block', href: qrUrl, download: 'qr-whatsapp.png' }, 'Baixar QR') : null,
        h('p', { class: 'muted', style: { marginTop: '10px' } }, 'O QR abre o WhatsApp direto, então continua valendo em rótulo impresso.'),
        h('details', { class: 'wa-direto' },
          h('summary', {}, 'Ver o link direto do WhatsApp'),
          h('p', { class: 'wa-msg' }, semProtocolo(link)),
          h('button', { class: 'btn white sm', onClick: () => copiar(link, 'Link direto copiado') }, 'Copiar link direto')),
      ),
    );
    resultado.classList.remove('hidden');
    if (!silencioso) toast('Link gerado e salvo');
    return linkCurto;
  };

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Link do WhatsApp', sub: 'Curto e com o nome da sua marca', voltar: '#mais' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Seu número'),
          h('div', { class: 'inline' }, h('span', { class: 'prefix' }, '+55'), ddd, numero), erro),
        h('div', { class: 'field' }, h('label', {}, 'Mensagem automática'), msg, chips,
          h('div', { class: 'hint' }, 'Com uma das mensagens prontas o link fica mais curto.')),
        h('button', { class: 'btn peach block', onClick: () => gerar() }, 'Gerar link'),
      ),
      resultado,
    ),
  ));
  if (salvo.ddd && salvo.numero) gerar(true);
}
