// Datas comemorativas BR com gancho de venda. mes 1-12; dia null = móvel (Páscoa) ou mês inteiro.
export const DATAS = [
  { id: 'ano-novo', nome: 'Ano Novo', emoji: '🎆', mes: 1, dia: 1, gancho: 'Kits de renovação: aromas cítricos, tons claros, "começo leve".' },
  { id: 'carnaval', nome: 'Carnaval', emoji: '🎭', mes: 2, dia: null, gancho: 'Cores vivas, brilho e glitter biodegradável. Miniaturas pra bloquinho.' },
  { id: 'mulher', nome: 'Dia da Mulher', emoji: '💐', mes: 3, dia: 8, gancho: 'Presentes corporativos em caixinhas; frase de autocuidado no rótulo.' },
  { id: 'pascoa', nome: 'Páscoa', emoji: '🐰', mes: 4, dia: null, gancho: 'Formato de ovo/coelho, cheiro de chocolate e cacau, tag "feito com amor".' },
  { id: 'maes', nome: 'Dia das Mães', emoji: '🌷', mes: 5, dia: null, gancho: 'A data que mais vende: kits com sabonete + vela + cartão. Comece a divulgar 3 semanas antes.' },
  { id: 'namorados', nome: 'Dia dos Namorados', emoji: '❤️', mes: 6, dia: 12, gancho: 'Duplinhas "pra ele / pra ela", tons de vinho e pêssego, tag com frase romântica.' },
  { id: 'festa-junina', nome: 'Festa Junina', emoji: '🌽', mes: 6, dia: null, gancho: 'Aromas de milho, canela e paçoca; rótulo xadrez e barbante rústico.' },
  { id: 'pais', nome: 'Dia dos Pais', emoji: '👔', mes: 8, dia: null, gancho: 'Barra de barbear, sabonete de carvão e cedro; embalagem escura e sóbria.' },
  { id: 'primavera', nome: 'Primavera', emoji: '🌸', mes: 9, dia: 22, gancho: 'Florais, pétalas na massa, paleta clara. Bom pra renovar fotos do feed.' },
  { id: 'criancas', nome: 'Dia das Crianças', emoji: '🧸', mes: 10, dia: 12, gancho: 'Sabonetes com brinquedo dentro, formatos de bichinhos, sem óleos essenciais fortes.' },
  { id: 'black-friday', nome: 'Black Friday', emoji: '🏷️', mes: 11, dia: null, gancho: 'Combos com desconto real, não promoção fake. Ótimo pra desovar estoque e testar kits.' },
  { id: 'natal', nome: 'Natal', emoji: '🎄', mes: 12, dia: 25, gancho: 'Kits presenteáveis, tag "de: / para:", aromas de canela, laranja e pinho. Produza em outubro.' },
];

export function proximas(qtd = 3, hoje = new Date()) {
  const ano = hoje.getFullYear();
  const ordenadas = DATAS.map((d) => {
    let data = new Date(ano, d.mes - 1, d.dia || 1);
    if (data < hoje) data = new Date(ano + 1, d.mes - 1, d.dia || 1);
    return { ...d, data };
  }).sort((a, b) => a.data - b.data);
  return ordenadas.slice(0, qtd);
}
