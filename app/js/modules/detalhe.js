// Endereços antigos #detalhe/<id> ("em breve"): agora cada função existe. Leva pra tela certa.
import * as router from '../router.js';

const DESTINO = {
  calendario: '#criar/calendario', legendas: '#criar/legendas', reels: '#criar/reels', 'analise-instagram': '#criar/analise-instagram',
  'perfis-referencia': '#criar/perfis-referencia', 'analise-publico': '#criar/analise-publico', agendar: '#criar/agendar', metricas: '#criar/metricas',
  'editar-foto': '#editor', estilos: '#fotos', 'editar-video': '#criar/editar-video', locucao: '#criar/locucao',
  'logo-ia': '#criar/logo', 'frase-ia': '#criar/frase', endcard: '#criar/endcard', 'fotos-coringas': '#criar/fotos-coringas',
  feedback: '#feedback', inpi: '#inpi',
};

export function montar(section, param) {
  section.innerHTML = '';
  router.ir(DESTINO[param] || '#home');
}
