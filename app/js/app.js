import * as router from './router.js';
import * as login from './modules/login.js';
import * as home from './modules/home.js';
import * as social from './modules/social.js';
import * as rotulos from './modules/rotulos.js';
import * as fotos from './modules/fotos.js';
import * as mais from './modules/mais.js';
import * as identidade from './modules/identidade.js';
import * as feedback from './modules/feedback.js';
import * as inpi from './modules/inpi.js';
import * as perfil from './modules/perfil.js';
import * as planos from './modules/planos.js';
import * as config from './modules/config.js';
import * as whatsapp from './modules/whatsapp.js';
import * as meta from './modules/meta.js';
import * as tutorial from './modules/tutorial.js';
import * as detalhe from './modules/detalhe.js';

export const VERSAO = '1.1.0';

router.iniciar({
  login: login.montar,
  home: home.montar,
  social: social.montar,
  rotulos: rotulos.montar,
  fotos: fotos.montar,
  mais: mais.montar,
  identidade: identidade.montar,
  feedback: feedback.montar,
  inpi: inpi.montar,
  perfil: perfil.montar,
  planos: planos.montar,
  config: config.montar,
  whatsapp: whatsapp.montar,
  meta: meta.montar,
  'tutorial-meta': tutorial.montar,
  detalhe: detalhe.montar,
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((e) => console.warn('SW não registrado', e));
  });
}
