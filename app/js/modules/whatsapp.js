import { h, header, toast, copiar, navegacao } from '../ui.js';
import * as store from '../store.js';
import * as analitica from '../analitica.js';
import { validar, numeroFormatado, versoesDoLink, SUGESTOES_MENSAGEM } from '../lib/whatsapp.js';
import { baseLinkCurto, semProtocolo } from '../site.js';
import { comDitado } from '../ditado.js';

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
    const links = versoesDoLink({ base: baseLinkCurto(), marca, ...dados });
    // link: o que vai no QR e nos rótulos. linkCurto: o que aparece e se copia pra bio.
    store.set('whatsapp', { ...dados, link: links.comMensagem || links.curto, linkCurto: links.curto, linkMarca: links.comMarca });
    const qrUrl = gerarQrDataUrl(links.comMensagem || links.curto);

    resultado.innerHTML = '';
    resultado.append(
      h('div', { class: 'card wa-id' },
        h('div', { class: 'wa-id-topo' },
          h('span', { class: 'wa-id-marca' }, marca || 'Sua marca'),
          h('span', { class: 'muted' }, numeroFormatado(dados))),
        h('div', { class: 'wa-rotulo' }, 'Link curto'),
        h('div', { class: 'wa-link' }, semProtocolo(links.curto)),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => copiar(links.curto, 'Link copiado! Cole na bio.') }, 'Copiar link'),
          h('a', { class: 'btn ghost', href: links.curto, target: '_blank', rel: 'noopener' }, 'Testar')),
        h('p', { class: 'muted', style: { margin: '10px 0 0' } }, 'É o link do próprio WhatsApp. Abre a conversa com você, sem mensagem pronta.'),
      ),
      links.comMensagem ? h('div', { class: 'card wa-mensagem' },
        h('div', { class: 'wa-rotulo', style: { marginTop: 0 } }, 'Link com mensagem pronta'),
        h('p', { class: 'wa-msg' }, links.mensagemEnviada),
        h('p', { class: 'muted', style: { margin: '8px 0 0' } }, 'A cliente já chega com esse texto escrito. O link fica mais comprido.'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn white', onClick: () => copiar(links.comMensagem, 'Link com mensagem copiado') }, 'Copiar link com mensagem'))) : null,
      h('div', { class: 'card wa-result' },
        h('div', { class: 'wa-rotulo' }, 'QR code pra embalagem e rótulo'),
        qrUrl ? h('img', { src: qrUrl, alt: `QR code do WhatsApp de ${marca || 'sua marca'}` }) : h('p', { class: 'muted' }, 'QR indisponível'),
        qrUrl ? h('a', { class: 'btn soft block', href: qrUrl, download: 'qr-whatsapp.png', onClick: () => analitica.evento('baixou', { tipo: 'QR do WhatsApp' }) }, 'Baixar QR') : null,
        h('p', { class: 'muted', style: { marginTop: '10px' } }, links.comMensagem ? 'O QR abre a conversa já com a mensagem pronta.' : 'O QR abre a conversa com você.'),
        h('details', { class: 'wa-direto' },
          h('summary', {}, 'Ver o link com o nome da marca'),
          h('p', { class: 'wa-msg' }, semProtocolo(links.comMarca)),
          h('p', { class: 'muted', style: { margin: '0 0 10px' } }, 'Passa por uma página do artesaná. antes de abrir o WhatsApp.'),
          h('button', { class: 'btn white sm', onClick: () => copiar(links.comMarca, 'Link copiado') }, 'Copiar')),
      ),
    );
    resultado.classList.remove('hidden');
    if (!silencioso) toast('Link gerado e salvo');
    return links.curto;
  };

  section.append(h('div', { class: 'screen' },
    header({ titulo: 'Link do WhatsApp', sub: 'Curto, pra bio e pra embalagem', voltar: '#home' }),
    h('div', { class: 'content' },
      h('div', { class: 'card' },
        h('div', { class: 'field' }, h('label', {}, 'Seu número'),
          h('div', { class: 'inline' }, h('span', { class: 'prefix' }, '+55'), ddd, numero), erro),
        h('div', { class: 'field' }, h('label', {}, 'Mensagem automática'), comDitado(msg), chips,
          h('div', { class: 'hint' }, 'Opcional. Vale pro link com mensagem e pro QR code.')),
        h('button', { class: 'btn peach block', onClick: () => gerar() }, 'Gerar link'),
      ),
      resultado,
      navegacao({ atual: 'whatsapp' }),
    ),
  ));
  if (salvo.ddd && salvo.numero) gerar(true);
}
