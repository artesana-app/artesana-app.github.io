// Ditado: junta o que a pessoa falou ao que já estava escrito no campo.
// Lógica pura, sem navegador, pra dar pra testar com node --test.

// Pontuação que o reconhecimento entende quando falada ("vírgula", "ponto"...). O Chrome em pt-BR
// já converte algumas; estas cobrem o que costuma sobrar como palavra.
const FALADAS = [
  [/\s*\bponto final\b/gi, '.'], [/\s*\bponto de interrogação\b/gi, '?'], [/\s*\bponto de exclamação\b/gi, '!'],
  [/\s*\bdois pontos\b/gi, ':'], [/\s*\bvírgula\b/gi, ','], [/\s*\bponto\b(?=\s*$|\s+[A-Za-zÀ-ÿ])/gi, '.'],
  [/\s*\bnova linha\b\s*/gi, '\n'],
];

export function limparFala(texto) {
  let t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  for (const [re, por] of FALADAS) t = t.replace(re, por);
  return t.replace(/\s+([.,!?:])/g, '$1').replace(/([.,!?:])(?=[A-Za-zÀ-ÿ])/g, '$1 ').trim();
}

function maiuscula(t) {
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

// juntarDitado(oQueJaTinha, trechoFalado) -> texto novo do campo.
// Põe espaço (ou quebra) entre o antigo e o novo, e maiúscula quando começa frase.
export function juntarDitado(atual, trecho) {
  const antes = String(atual ?? '').replace(/[ \t]+$/, '');
  let novo = limparFala(trecho);
  if (!novo) return antes;
  const fimDeFrase = !antes || /[.!?\n]$/.test(antes);
  if (fimDeFrase) novo = maiuscula(novo);
  if (!antes) return novo;
  const sep = /\n$/.test(antes) ? '' : ' ';
  return antes + sep + novo;
}

// Mensagens curtas pros erros da API de reconhecimento, no vocabulário de quem usa.
export function mensagemErroDitado(codigo) {
  return {
    'not-allowed': 'O microfone está bloqueado. Libere o microfone pro site nas configurações do navegador.',
    'service-not-allowed': 'O microfone está bloqueado. Libere o microfone pro site nas configurações do navegador.',
    'audio-capture': 'Não achei um microfone neste aparelho.',
    'no-speech': 'Não ouvi nada. Toque no botão e fale perto do celular.',
    network: 'O ditado precisa de internet. Conecte e tente de novo.',
    aborted: '',
  }[codigo] ?? 'Não consegui ouvir agora. Tente de novo.';
}
