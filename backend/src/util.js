// Funções puras do backend, testadas em tests/backend.test.mjs.

export const ORIGENS_LOCAIS = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Origem permitida pra chamar a API: as do ORIGENS (wrangler.toml) e qualquer localhost.
export function origemPermitida(origem, lista) {
  if (!origem) return false;
  if (ORIGENS_LOCAIS.test(origem)) return true;
  return String(lista || '').split(',').map((s) => s.trim()).filter(Boolean).includes(origem);
}

export function navegadorDe(ua = '') {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/samsungbrowser/i.test(ua)) return 'Samsung';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox\//i.test(ua)) return 'Firefox';
  return ua ? 'outro' : '';
}

export function codigoVisitanteValido(v) {
  return typeof v === 'string' && /^[a-f0-9]{8,64}$/.test(v);
}

// Lê a lista de eventos que o app manda e separa o que atualiza o registro do visitante.
export function resumirEventos(eventos, agora = Date.now()) {
  const linhas = [];
  const campos = {};
  let paginas = 0;
  for (const e of Array.isArray(eventos) ? eventos.slice(0, 300) : []) {
    if (!e || typeof e !== 'object') continue;
    const tipo = String(e.tipo || '').slice(0, 40);
    if (!tipo) continue;
    const t = Number.isFinite(Number(e.t)) && Number(e.t) > 0 ? Number(e.t) : agora;
    const rota = typeof e.rota === 'string' ? e.rota.slice(0, 80) : null;
    const { t: _t, tipo: _tipo, ...dados } = e;
    linhas.push({ t, tipo, rota, dados: JSON.stringify(dados).slice(0, 2000) });
    if (tipo === 'pagina' && rota) { campos.ultima_rota = rota; paginas += 1; }
    if (tipo === 'passo' && e.passo) campos.passo = String(e.passo).slice(0, 40);
    if (tipo === 'email' && typeof e.email === 'string' && e.email.includes('@')) campos.email = e.email.trim().slice(0, 120);
    if (tipo === 'entrada' && e.redes) campos.redes = String(e.redes).slice(0, 20);
    if (tipo === 'perfil_enviado') campos.perfil_enviado = 1;
    if (tipo === 'telefone' && e.telefone) { const n = String(e.telefone).replace(/\D/g, ''); if (n.length >= 10) campos.telefone = n.slice(0, 20); }
    if (tipo === 'novidades') campos.novidades = e.aceita === true || e.aceita === 'sim' ? 1 : 0;
  }
  return { linhas, campos, paginas };
}

// Do JSON do perfil enviado, o que vale guardar no visitante.
export function camposDoPerfil(dados = {}) {
  const u = (dados && dados.user) || {};
  const limpa = (v, n = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  const tel = typeof u.telefone === 'string' ? u.telefone.replace(/\D/g, '') : '';
  const novidades = u.novidades === 'sim' || u.novidades === true ? 1 : u.novidades === 'nao' || u.novidades === false ? 0 : null;
  return { nome: limpa(u.nome, 80), marca: limpa(u.marca, 80), email: limpa(u.email), faixa: limpa(u.faixaEtaria, 20), cidade_informada: limpa(u.cidade, 80), telefone: tel.length >= 10 ? tel.slice(0, 20) : null, novidades };
}

// Mensagem do Telegram vinda da equipe: responde uma conversa por "reply" ou por "/r <id> texto".
export function interpretarRespostaTelegram(msg = {}) {
  const texto = String(msg.text || '').trim();
  if (!texto) return null;
  const cmd = texto.match(/^\/r\s+#?c?(\d+)\s+([\s\S]+)$/i);
  if (cmd) return { conversa: Number(cmd[1]), texto: cmd[2].trim() };
  const citada = msg.reply_to_message && String(msg.reply_to_message.text || msg.reply_to_message.caption || '');
  const id = citada && citada.match(/#c(\d+)\b/);
  if (id && !texto.startsWith('/')) return { conversa: Number(id[1]), texto };
  return null;
}

// Texto que vai pro Telegram quando uma cliente pede atendente. O #c<id> é o que liga a resposta à conversa.
export function textoAvisoSuporte({ conversa, nome, marca, pergunta, historico = [], painel = '', telegram = true }) {
  const quem = [nome || 'sem nome', marca ? `marca ${marca}` : ''].filter(Boolean).join(', ');
  const ultimas = historico.slice(-4).map((l) => `  ${String(l).slice(0, 200)}`).join('\n');
  const como = [];
  if (telegram) como.push(`No Telegram: use "Responder" nesta mensagem (ou /r ${conversa} sua resposta).`);
  if (painel) como.push(`No painel: ${painel}`);
  return [`💬 #c${conversa} · ${quem}`, '', pergunta ? String(pergunta).slice(0, 1000) : '(pediu pra falar com uma atendente)', ultimas ? `\nAntes disso:\n${ultimas}` : '', '', 'Pra responder:', ...como].join('\n');
}

export function basicAuthOk(cabecalho, usuario, senha) {
  if (!cabecalho || !usuario || !senha) return false;
  const m = String(cabecalho).match(/^Basic\s+(.+)$/i);
  if (!m) return false;
  let decodificado = '';
  try { decodificado = atob(m[1]); } catch { return false; }
  const esperado = `${usuario}:${senha}`;
  if (decodificado.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= decodificado.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}

export const PLANOS_PAGOS = {
  florescer: { tipo: 'assinatura', valor: 52.9, titulo: 'artesaná. plano Florescer (mensal)' },
  prosperar: { tipo: 'unico', valor: 312, parcelas: 12, titulo: 'artesaná. plano Prosperar (anual)' },
};

export function csv(linhas, colunas) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [colunas.join(';'), ...linhas.map((l) => colunas.map((c) => esc(l[c])).join(';'))].join('\r\n');
}
