// Ajuda dentro do app: respostas prontas pras dúvidas mais comuns, tolerando erro de digitação.
// Lógica pura, sem DOM. Quando nada encaixa, quem chama oferece falar com uma atendente.

const PARADAS = new Set(('a o os as um uma uns umas de do da dos das em no na nos nas por pra para pro com sem que e ou se eu meu minha meus minhas'
  + ' me mim voce voces vc vcs ele ela isso isto aqui ai ja tem ter esta estao esse essa este nao sim como faco fazer faz quero queria preciso posso pode consigo'
  + ' onde qual quais quando porque pq oi ola bom boa dia tarde noite obrigada obrigado gente app aplicativo artesana ainda tambem tbm muito mais').split(' '));

export function normalizar(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9@\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function palavras(s) {
  return normalizar(s).split(' ').filter((p) => p && !PARADAS.has(p));
}

// distância de edição, pra aceitar "rotlo", "etiketa", "watsap"
export function distancia(a, b) {
  if (a === b) return 0;
  const m = a.length; const n = b.length;
  if (!m) return n; if (!n) return m;
  let ant = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    ant = cur;
  }
  return ant[n];
}

function parecidas(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5)))) return true;
  const tol = Math.max(a.length, b.length) >= 7 ? 2 : Math.max(a.length, b.length) >= 4 ? 1 : 0;
  return tol > 0 && distancia(a, b) <= tol;
}

// id, gatilhos (palavras ou frases), resposta, e pra onde levar
export const INTENCOES = [
  { id: 'saudacao', gatilhos: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'oii'], resposta: 'Oi! Eu sou a ajuda do artesaná. Pergunte sobre rótulo, INCI, link do WhatsApp, Instagram, fotos, planos ou o que mais precisar.', link: '', rotulo: '' },
  { id: 'rotulo', gatilhos: ['rotulo', 'etiqueta', 'tag', 'adesivo', 'imprimir', 'pdf', 'grafica', 'folha a4', 'redondo', 'retangular'], resposta: 'O rótulo é feito em Rótulos: escolha o modelo, preencha marca, produto e frase, e toque em Exportar PDF. Sai a folha A4 montada pra imprimir em casa (papel adesivo) ou na gráfica (couchê adesivo 90 g).', link: '#rotulos', rotulo: 'Abrir Rótulos' },
  { id: 'inci', gatilhos: ['inci', 'ingredientes', 'lista de ingredientes', 'composicao', 'formula'], resposta: 'A lista INCI fica na aba INCI, dentro de Rótulos. Busque cada ingrediente em português, ordene do maior pro menor na fórmula e toque em Usar no rótulo.', link: '#rotulos/inci', rotulo: 'Abrir a aba INCI' },
  { id: 'anvisa', gatilhos: ['anvisa', 'lote', 'validade', 'registro do produto', 'regularizar', 'norma', 'rdc'], resposta: 'A aba Anvisa monta o rótulo completo com os campos que a norma pede (lote, validade, composição em português, dados de quem fabrica). O app organiza o rótulo; a regularização do produto continua sendo um passo seu.', link: '#rotulos/anvisa', rotulo: 'Abrir a aba Anvisa' },
  { id: 'tamanho', gatilhos: ['tamanho', 'medida', 'cabem', 'quantos por folha', 'menor', 'diminuir'], resposta: 'Em Rótulos, o app mostra quantos cabem por folha A4 e sugere tamanhos menores pra render mais. Você também pode digitar a medida em milímetros.', link: '#rotulos', rotulo: 'Abrir Rótulos' },
  { id: 'whatsapp', gatilhos: ['whatsapp', 'whats', 'zap', 'wa.me', 'link curto', 'qr', 'qr code', 'numero'], resposta: 'Em Link do WhatsApp você digita seu número e o app cria o link curto wa.me pra bio, o link com mensagem pronta e o QR code pra embalagem.', link: '#whatsapp', rotulo: 'Criar o link' },
  { id: 'instagram-conta', gatilhos: ['criar conta', 'criar instagram', 'nao tenho instagram', 'sem instagram', 'como abrir conta', 'perfil comercial', 'conta comercial'], resposta: 'Tem um passo a passo com fotos de como criar a conta do Instagram pelo celular, deixar comercial e montar a bio.', link: '#ajuda-instagram', rotulo: 'Ver o passo a passo' },
  { id: 'instagram', gatilhos: ['instagram', 'insta', 'bio', 'arroba', 'seguidores', 'destaques', 'legenda', 'post', 'story', 'stories', 'reel', 'reels', 'carrossel'], resposta: 'Em Social tem gerador de legendas, calendário do mês, análise do seu perfil, roteiro de reels e as próximas datas que vendem.', link: '#social', rotulo: 'Abrir Social' },
  { id: 'foto', gatilhos: ['foto', 'fotos', 'fotografar', 'editar foto', 'fundo', 'imagem', 'camera', 'celular'], resposta: 'Em Fotos você edita a foto do produto (corte, luz, estilo da marca, sua marca por cima) e tem o tutorial de foto com celular. Luz de janela e fundo limpo resolvem quase tudo.', link: '#fotos', rotulo: 'Abrir Fotos' },
  { id: 'logo', gatilhos: ['logo', 'logotipo', 'marca visual', 'identidade', 'paleta', 'cores', 'frase de impacto', 'slogan', 'end card'], resposta: 'Em Identidade você monta o logo (3 opções e caixa de remix), a frase de impacto, o end card pra reels e a paleta. Tudo sai da história que você contou no perfil.', link: '#identidade', rotulo: 'Abrir Identidade' },
  { id: 'referencias', gatilhos: ['pinterest', 'referencia', 'referencias', 'inspiracao', 'ideias', 'moodboard'], resposta: 'A aba Referências busca ideias no Pinterest filtradas pelo que você produz e pela personalidade da marca, e guarda o que você salvar.', link: '#referencias', rotulo: 'Abrir Referências' },
  { id: 'planos', gatilhos: ['plano', 'planos', 'preco', 'valor', 'quanto custa', 'pagar', 'pagamento', 'assinar', 'assinatura', 'mercado pago', 'parcelar', 'cartao', 'pix'], resposta: 'Durante o beta tudo está liberado, sem pagar. Depois entram os planos Semente (grátis), Florescer e Prosperar, com pagamento pelo Mercado Pago, à vista ou parcelado.', link: '#planos', rotulo: 'Ver os planos' },
  { id: 'beta', gatilhos: ['beta', 'teste', 'gratis', 'gratuito', 'de graca', 'ate quando'], resposta: 'O app está em versão beta: tudo liberado enquanto a gente ajusta com o seu feedback. A data do fim do beta aparece no botão Beta, no canto da tela.', link: '#planos', rotulo: 'Ver os planos' },
  { id: 'dados', gatilhos: ['salvar', 'salvo', 'perdi', 'sumiu', 'apagou', 'dados', 'backup', 'trocar de celular', 'outro aparelho', 'computador'], resposta: 'O que você preenche fica salvo no próprio aparelho, sem senha. Se trocar de celular ou usar o computador, precisa preencher de novo. Uma conta com login chega junto com os planos.', link: '#perfil', rotulo: 'Ver o perfil' },
  { id: 'instalar', gatilhos: ['instalar', 'baixar', 'play store', 'app store', 'tela inicial', 'icone', 'atalho', 'loja'], resposta: 'Não precisa de loja. No Android, abra o menu do navegador e toque em Instalar app ou Adicionar à tela inicial. No iPhone, pelo Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.', link: '', rotulo: '' },
  { id: 'voz', gatilhos: ['voz', 'microfone', 'ditado', 'ditar', 'nao quero digitar', 'falar em vez de digitar', 'por voz'], resposta: 'Todo campo de texto tem um microfone: toque nele e fale. Funciona no Chrome (Android e computador) e no Safari do iPhone; precisa de internet. Onde o navegador não tem reconhecimento, o botão não aparece.', link: '', rotulo: '' },
  { id: 'datas', gatilhos: ['natal', 'dia das maes', 'pascoa', 'datas', 'comemorativa', 'black friday', 'ano novo', 'quando postar'], resposta: 'Em Rótulos, aba Datas, e em Social ficam as próximas datas que vendem, com o gancho de cada uma e a frase pro rótulo.', link: '#rotulos/datas', rotulo: 'Ver as datas' },
  { id: 'inpi', gatilhos: ['inpi', 'registrar marca', 'registro de marca', 'patente', 'nome da marca registrado', 'protecao'], resposta: 'Em Verificação INPI tem o passo a passo pra conferir se o nome está livre e registrar como pessoa física, com as classes certas pro seu produto.', link: '#inpi', rotulo: 'Abrir INPI' },
  { id: 'feedback', gatilhos: ['feedback', 'avaliar', 'avaliacao', 'sugestao', 'reclamar', 'bug', 'erro', 'travou', 'nao funciona', 'nao abre'], resposta: 'Conte pra gente no botão Beta, no canto da tela: leva dois minutos e vai direto pra equipe. Se algo travou, diga em qual tela aconteceu.', link: '#feedback', rotulo: 'Avaliar o app' },
  { id: 'apagar', gatilhos: ['apagar', 'excluir', 'limpar', 'resetar', 'comecar de novo', 'sair da conta'], resposta: 'Em Mais, Configurações, tem a opção Limpar dados: apaga tudo deste aparelho e volta pro início.', link: '#config', rotulo: 'Abrir Configurações' },
  { id: 'email', gatilhos: ['email', 'e mail', 'contato', 'telefone', 'suporte', 'atendente', 'humano', 'pessoa', 'falar com alguem', 'falar com', 'quero falar'], resposta: 'O atendimento é por aqui mesmo, no chat. Toque em Falar com uma atendente que a sua mensagem vai pra equipe e a resposta aparece nesta conversa.', link: '', rotulo: '', atendente: true },
];

// Melhor resposta pra pergunta. Retorna null quando nada encaixa com confiança.
export function responder(pergunta) {
  const norm = normalizar(pergunta);
  const toks = palavras(pergunta);
  if (!norm) return null;
  let melhor = null;
  for (const intencao of INTENCOES) {
    let pontos = 0;
    for (const g of intencao.gatilhos) {
      const gn = normalizar(g);
      if (gn.includes(' ')) {
        if (norm.includes(gn)) pontos += 3;
        continue;
      }
      if (norm.split(' ').includes(gn)) pontos += 2;
      else if (toks.some((t) => parecidas(t, gn))) pontos += 1;
    }
    if (pontos > (melhor ? melhor.pontos : 0)) melhor = { intencao, pontos };
  }
  if (!melhor) return null;
  // saudação só vale se a pergunta for curtinha
  if (melhor.intencao.id === 'saudacao' && toks.length > 2) return null;
  const confianca = Math.min(1, melhor.pontos / 3);
  return { id: melhor.intencao.id, resposta: melhor.intencao.resposta, link: melhor.intencao.link, rotulo: melhor.intencao.rotulo, atendente: !!melhor.intencao.atendente, confianca };
}

// Um link colado na pergunta, se houver: a resposta pode apontar pra ele.
export function linkNaPergunta(pergunta) {
  const m = String(pergunta ?? '').match(/https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-z0-9.-]+\.(?:com|com\.br|app|me|net|org)(?:\/[^\s]*)?/i);
  return m ? m[0] : '';
}

export const FALLBACK = 'Não achei uma resposta pronta pra isso. Quer falar com uma atendente? Sua mensagem vai pra equipe e a resposta aparece aqui na conversa.';
