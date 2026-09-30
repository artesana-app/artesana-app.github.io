import * as router from './router.js';
import * as login from './modules/login.js';
import * as conversa from './modules/conversa.js';
import * as home from './modules/home.js';
import * as social from './modules/social.js';
import * as rotulos from './modules/rotulos.js';
import * as fotos from './modules/fotos.js';
import * as editor from './modules/editor.js';
import * as mais from './modules/mais.js';
import * as identidade from './modules/identidade.js';
import * as criar from './modules/criar.js';
import * as feedback from './modules/feedback.js';
import * as suporte from './modules/suporte.js';
import * as inpi from './modules/inpi.js';
import * as perfil from './modules/perfil.js';
import * as ajudaInstagram from './modules/ajuda-instagram.js';
import * as planos from './modules/planos.js';
import * as config from './modules/config.js';
import * as whatsapp from './modules/whatsapp.js';
import * as redes from './modules/redes.js';
import * as referencias from './modules/referencias.js';
import * as meta from './modules/meta.js';
import * as tutorial from './modules/tutorial.js';
import * as detalhe from './modules/detalhe.js';
import { SITE } from './site.js';

export const VERSAO = SITE.versao;

router.iniciar({
  login: login.montar,
  conversa: conversa.montar,
  home: home.montar,
  social: social.montar,
  rotulos: rotulos.montar,
  fotos: fotos.montar,
  editor: editor.montar,
  mais: mais.montar,
  identidade: identidade.montar,
  criar: criar.montar,
  feedback: feedback.montar,
  suporte: suporte.montar,
  inpi: inpi.montar,
  perfil: perfil.montar,
  'ajuda-instagram': ajudaInstagram.montar,
  planos: planos.montar,
  config: config.montar,
  whatsapp: whatsapp.montar,
  redes: redes.montar,
  referencias: referencias.montar,
  meta: meta.montar,
  'tutorial-meta': tutorial.montar,
  detalhe: detalhe.montar,
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((e) => console.warn('SW não registrado', e));
  });
}
