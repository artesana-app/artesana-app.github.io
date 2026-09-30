// Endereço antigo #meta: as redes agora ficam em #redes.
import * as router from '../router.js';

export function montar(section) {
  section.innerHTML = '';
  router.ir('#redes');
}
