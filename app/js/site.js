// Dados do site. Troque aqui quando mudar domínio ou contato.
export const SITE = {
  dominio: 'artesana-mktdigital.com.br',
  instagram: 'artesana.app',
  versao: '1.4.0',
  // Teste beta: tudo liberado, sem trava de plano. Troque pra false quando os planos entrarem em vigor.
  beta: true,
  // WhatsApp da equipe artesaná. que recebe os perfis enviados, no formato { ddd: '51', numero: '999999999' }.
  // Enquanto estiver vazio, quem envia o perfil escolhe o contato na hora.
  whatsappEquipe: null,
};

// Endereço da página que abre os links curtos (pasta /w/ ao lado de /app/).
export function baseLinkCurto() {
  return new URL('../w/', location.href.split('#')[0]).href;
}

export const semProtocolo = (url) => String(url ?? '').replace(/^https?:\/\//, '');
