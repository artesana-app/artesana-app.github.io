// Geradores de texto da marca (frase, legendas, bio, calendário, análise, roteiro) e o remix do logo.
// Tudo por regra, sem IA: usa o que a pessoa contou no perfil. Lógica pura, sem DOM.
import { DATAS } from '../data/datas.js';
import { NICHOS, PERSONALIDADES, nichosDe } from './perfil.js';

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// vocabulário por nicho: o que a marca faz, o que a cliente sente, hashtags
export const VOZ = {
  sabonetes: { faz: 'sabonete', plural: 'sabonetes', gesto: 'o banho', sente: 'pele macia', ingrediente: 'óleo vegetal', hashtags: ['#saboariaartesanal', '#sabonetenatural', '#saboaria', '#sabonetesartesanais', '#feitoamao'] },
  velas: { faz: 'vela', plural: 'velas', gesto: 'a casa', sente: 'aconchego', ingrediente: 'cera vegetal', hashtags: ['#velasartesanais', '#velaaromatica', '#velasdecorativas', '#aromaterapia', '#feitoamao'] },
  cosmeticos: { faz: 'cosmético', plural: 'cosméticos', gesto: 'o cuidado', sente: 'pele cuidada', ingrediente: 'ativo natural', hashtags: ['#cosmeticosnaturais', '#cosmeticoartesanal', '#skincarenatural', '#autocuidado', '#feitoamao'] },
  alimentos: { faz: 'doce', plural: 'produtos', gesto: 'a mesa', sente: 'sabor de casa', ingrediente: 'ingrediente de verdade', hashtags: ['#alimentosartesanais', '#feitoemcasa', '#comidaartesanal', '#docesartesanais', '#feitoamao'] },
  artesanato: { faz: 'peça', plural: 'peças', gesto: 'o presente', sente: 'carinho', ingrediente: 'material de qualidade', hashtags: ['#artesanato', '#artesanatobrasileiro', '#feitoamao', '#handmade', '#artesa'] },
};
const GERAL = { faz: 'produto', plural: 'produtos', gesto: 'o dia', sente: 'cuidado', ingrediente: 'ingrediente escolhido', hashtags: ['#feitoamao', '#artesanato', '#pequenosnegocios', '#empreendedorismofeminino', '#artesanatobrasileiro'] };

// palavras da história que dão âncora à frase
const ANCORAS = [
  ['cozinha', 'da cozinha de casa'], ['avo', 'da receita da avó'], ['avó', 'da receita da avó'], ['mae', 'do jeito da mãe'], ['mãe', 'do jeito da mãe'],
  ['familia', 'pra família'], ['família', 'pra família'], ['filh', 'pros filhos'], ['sitio', 'do sítio'], ['sítio', 'do sítio'], ['jardim', 'do jardim'],
  ['natureza', 'da natureza'], ['mar', 'do mar'], ['floresta', 'da floresta'], ['infancia', 'da infância'], ['infância', 'da infância'],
  ['sonho', 'de um sonho antigo'], ['hobby', 'de um hobby que cresceu'], ['renda', 'que virou sustento'], ['terapia', 'que começou como terapia'],
];

function ancora(historia) {
  const h = texto(historia).toLowerCase();
  const achada = ANCORAS.find(([chave]) => h.includes(chave));
  return achada ? achada[1] : '';
}

function voz(onboarding) {
  const id = nichosDe(onboarding)[0];
  return VOZ[id] || GERAL;
}

// 6 frases curtas, uma linha, sem repetir. A pessoa escolhe uma e pode editar.
export function frasesDeImpacto({ marca, onboarding = {} } = {}) {
  const m = texto(marca) || 'a sua marca';
  const v = voz(onboarding);
  const p = texto(onboarding.personalidade);
  const anc = ancora(onboarding.historia);
  const publico = texto(onboarding.publicoAlvo);
  const base = {
    delicada: [`${maiuscula(v.faz)} feito com calma, pra quem sente a diferença.`, `Pequenos cuidados que ficam na pele e na memória.`, `${m}: o delicado também é forte.`],
    rustica: [`Feito à mão, do jeito que a gente sabe fazer.`, `Sem pressa, sem atalho, com ${v.ingrediente}.`, `${m}: simples, honesto, de verdade.`],
    sofisticada: [`O luxo de saber quem fez.`, `${maiuscula(v.plural)} pra quem escolhe com cuidado.`, `${m}: feito à mão, pensado nos detalhes.`],
    alegre: [`${maiuscula(v.gesto)} fica mais leve com ${v.faz} feito com alegria.`, `Um pouco de cor e cheiro bom pro seu dia.`, `${m}: feito pra dar vontade de sorrir.`],
  }[p] || [`Feito à mão, com ${v.ingrediente} e tempo.`, `${maiuscula(v.plural)} com história, não com fábrica.`, `${m}: de quem faz pra quem sente.`];
  const extras = [
    anc ? `${maiuscula(v.faz)} ${anc}, pra sua casa.` : `Cada ${v.faz} sai de uma mão só: a minha.`,
    publico ? `Pensado pra ${publico}.` : `Pra quem prefere o feito à mão.`,
    `Você sente ${v.sente}. A gente sente orgulho.`,
  ];
  const todas = [...base, ...extras].map((f) => f.replace(/\s+/g, ' ').trim());
  return [...new Set(todas)].slice(0, 6);
}

const TIPOS_LEGENDA = ['post', 'story', 'reel', 'carrossel'];

// 3 legendas por tipo, na voz da marca, com hashtags do nicho.
export function legendas({ tipo = 'post', marca, onboarding = {}, produto, tema } = {}) {
  const t = TIPOS_LEGENDA.includes(tipo) ? tipo : 'post';
  const m = texto(marca) || 'a marca';
  const v = voz(onboarding);
  const prod = texto(produto) || texto(onboarding.tipoProduto) || v.faz;
  const anc = ancora(onboarding.historia);
  const tm = texto(tema);
  const tags = [...v.hashtags, '#pequenosnegocios', '#empreendedorismofeminino'].slice(0, 8).join(' ');
  const cta = { post: 'Chama no link da bio pra encomendar.', story: 'Arrasta pra cima ou responde aqui.', reel: 'Salva pra lembrar e me conta nos comentários.', carrossel: 'Arrasta até o fim e salva pra depois.' }[t];
  const abre = {
    post: [`${maiuscula(prod)} novo saindo${anc ? `, ${anc}` : ''}.`, `Tem coisa que só o feito à mão entrega: ${v.sente}.`, `${tm ? maiuscula(tm) + '. ' : ''}Hoje é dia de ${prod}.`],
    story: [`Bastidor de hoje: ${prod} ganhando forma.`, `Quem aí já provou o ${prod} da ${m}?`, `${tm ? maiuscula(tm) + ': ' : ''}pergunta rápida, você prefere qual?`],
    reel: [`3 segundos pra você ver como nasce um ${prod}.`, `O que ninguém vê: as horas por trás de cada ${prod}.`, `${tm ? maiuscula(tm) + '. ' : ''}Do começo ao fim, sem cortes.`],
    carrossel: [`Tudo que vai no ${prod} da ${m}, um item por página.`, `5 jeitos de usar o ${prod} (o último é o meu preferido).`, `${tm ? maiuscula(tm) + ': ' : ''}o passo a passo que eu sigo.`],
  }[t];
  const meio = [
    `Cada ${v.faz} sai com ${v.ingrediente} e o tempo que precisa. Sem pressa, sem fábrica.`,
    `Feito em pequenos lotes, pra ${v.gesto} ficar com cara de ${v.sente}.`,
    `Se você gosta de saber quem fez o que usa, esse é o lugar.`,
  ];
  return abre.map((a, i) => `${a}\n\n${meio[i]}\n\n${cta}\n\n${tags}`);
}

// Duas opções de bio pro Instagram, dentro dos 150 caracteres.
export function biosInstagram({ marca, onboarding = {}, cidade, link } = {}) {
  const m = texto(marca) || 'Minha marca';
  const v = voz(onboarding);
  const p = (PERSONALIDADES.find((x) => x.id === onboarding.personalidade) || {}).emoji || '✨';
  const cid = texto(cidade);
  const l = texto(link).replace(/^https?:\/\//, '');
  const nomes = nichosDe(onboarding).map((id) => (NICHOS.find((n) => n.id === id) || {}).nome).filter(Boolean);
  const oque = nomes.length ? nomes.join(' · ').replace(/ e saboaria| e aromas| naturais| artesanais| em geral/g, '') : maiuscula(v.plural);
  const op1 = [`${p} ${oque} feitos à mão`, cid ? `📍 ${cid}` : '', l ? `👇 pedidos: ${l}` : '👇 pedidos pelo link'].filter(Boolean).join('\n');
  const op2 = [`${m} · ${v.plural} com ${v.ingrediente}`, `Pequenos lotes, feitos por mim`, cid ? `${cid} · envio pro Brasil` : 'Envio pro Brasil', l ? `👇 ${l}` : ''].filter(Boolean).join('\n');
  return [op1, op2].map((b) => (b.length > 150 ? b.slice(0, 147).trim() + '…' : b));
}

// Calendário do mês: um ritmo leve (3 a 4 publicações por semana) mais as datas comemorativas do mês.
export function calendarioMes({ ano, mes, onboarding = {} } = {}) {
  const v = voz(onboarding);
  const prod = texto(onboarding.tipoProduto) || v.faz;
  const dias = new Date(ano, mes, 0).getDate();
  const ritmo = { 1: { tipo: 'post', tema: `Foto do ${prod} com a frase da marca` }, 3: { tipo: 'story', tema: 'Bastidor: produção ou embalagem' }, 5: { tipo: 'reel', tema: `Como nasce um ${prod}, em 15 segundos` }, 6: { tipo: 'carrossel', tema: 'Dúvidas de cliente respondidas, uma por página' } };
  const saida = [];
  for (let d = 1; d <= dias; d++) {
    const semana = new Date(ano, mes - 1, d).getDay();
    const data = DATAS.find((x) => x.mes === mes && x.dia === d);
    if (data) saida.push({ dia: d, tipo: 'post', tema: `${data.emoji} ${data.nome}: ${data.gancho}`, data: true });
    else if (ritmo[semana]) saida.push({ dia: d, ...ritmo[semana] });
  }
  const moveis = DATAS.filter((x) => x.mes === mes && !x.dia);
  return { dias: saida, avisos: moveis.map((x) => `${x.emoji} ${x.nome} é neste mês: ${x.gancho}`) };
}

// Leitura do público a partir do que a pessoa escreveu e da personalidade da marca.
export function analisePublico({ onboarding = {} } = {}) {
  const publico = texto(onboarding.publicoAlvo).toLowerCase();
  const v = voz(onboarding);
  const p = texto(onboarding.personalidade);
  const tom = { delicada: 'calmo e próximo, frases curtas, sem gíria', rustica: 'direto e caloroso, fala como quem está na feira', sofisticada: 'elegante e contido, poucas palavras, bem escolhidas', alegre: 'leve e animado, com humor e emoji na medida' }[p] || 'simples e verdadeiro, como uma conversa';
  const idade = /\b(1[5-9]|2\d)\b/.test(publico) ? 'jovem' : /\b(5\d|6\d|7\d)\b|senhor|idos|matur/.test(publico) ? 'madura' : 'adulta';
  const horarios = idade === 'jovem' ? ['12h às 13h', '20h às 23h'] : idade === 'madura' ? ['7h às 9h', '19h às 21h'] : ['12h às 14h', '19h às 21h'];
  const dores = [`Não saber quem fez o ${v.faz} que usa`, 'Produto industrial que promete e não entrega', /presente|presentear/.test(publico) ? 'Achar um presente que pareça pensado' : 'Rotina sem um momento de cuidado'];
  const desejos = [`Sentir ${v.sente} de verdade`, 'Comprar de uma pessoa, não de uma fábrica', /natural|org[aâ]nico|vegan/.test(publico) ? 'Ingredientes que ela consegue ler' : 'Um produto bonito de deixar à vista'];
  const chamadas = ['Me chama no WhatsApp que eu monto o seu', 'Encomendas abertas até sexta', 'Quer de presente? Eu embalo e mando'];
  return { tom, horarios, dores, desejos, chamadas, resumo: publico ? `Você vende pra ${publico}.` : 'Preencha pra quem você vende, no perfil, pra afinar esta leitura.' };
}

// Roteiro de reel de 15 a 20 segundos: gancho, três cenas e chamada.
export function roteiroReel({ marca, onboarding = {}, produto } = {}) {
  const v = voz(onboarding);
  const prod = texto(produto) || texto(onboarding.tipoProduto) || v.faz;
  const m = texto(marca) || 'a marca';
  return {
    gancho: `Você sabia que um ${prod} leva mais tempo pra ficar pronto do que pra ser usado?`,
    cenas: [
      { seg: '0 a 3', acao: `Close nas mãos começando o ${prod}.`, texto: 'Ninguém vê essa parte' },
      { seg: '3 a 12', acao: 'Três cortes rápidos do processo: mistura, forma, acabamento.', texto: 'Tempo, ingrediente e cuidado' },
      { seg: '12 a 18', acao: `O ${prod} pronto, embalado, com o rótulo da ${m} aparecendo.`, texto: 'Pronto pra chegar na sua casa' },
    ],
    cta: 'End card com o @ e o link do WhatsApp por 3 segundos.',
    musica: 'Uma trilha calma da biblioteca do Instagram, sem letra.',
  };
}

// "quero a tipografia da 1 com as cores da 3" -> { tipografia: 1, cores: 3 }
const NUMEROS = { 1: 1, um: 1, uma: 1, primeira: 1, primeiro: 1, 2: 2, dois: 2, duas: 2, segunda: 2, segundo: 2, 3: 3, tres: 3, três: 3, terceira: 3, terceiro: 3 };
const ASPECTOS = [['tipografia', /tipograf|fonte|letra|texto/], ['cores', /\bcor|cores|paleta|tom/], ['simbolo', /simbol|símbol|desenho|icone|ícone|marca d|figura/]];

export function remixLogo(pedido) {
  const norm = String(pedido ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const partes = norm.split(/\b(?:com|e|mais|junto|\+)\b/);
  const saida = {};
  for (const parte of partes) {
    const aspecto = ASPECTOS.find(([, re]) => re.test(parte));
    const num = parte.match(/\b(1|2|3|um|uma|dois|duas|tres|primeira|primeiro|segunda|segundo|terceira|terceiro)\b/);
    if (aspecto && num) saida[aspecto[0]] = NUMEROS[num[1]];
  }
  return saida;
}
