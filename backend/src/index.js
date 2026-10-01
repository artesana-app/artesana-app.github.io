// API do artesaná.: Cloudflare Worker + D1. Rotas:
//   POST /v1/eventos            uso do app (página aberta, passo, e-mail deixado...)
//   POST /v1/perfil             "Enviar perfil" → guarda e avisa a equipe no Telegram
//   POST /v1/feedback           avaliação do beta
//   POST /v1/suporte            cliente pediu atendente → conversa + aviso no Telegram
//   GET  /v1/suporte?visitante= respostas da equipe pra essa cliente (o app consulta a cada 15 s)
//   POST /v1/pagar/:plano       cria o link de pagamento no Mercado Pago (assinatura ou anual)
//   POST /telegram/:segredo     webhook do Telegram: resposta da equipe vira mensagem na conversa
//   POST /mp/webhook            webhook do Mercado Pago: atualiza o status do pagamento
//   GET  /admin/*               painel (Basic auth: ADMIN_USER / ADMIN_SENHA)
import {
  origemPermitida, navegadorDe, codigoVisitanteValido, resumirEventos, camposDoPerfil,
  interpretarRespostaTelegram, textoAvisoSuporte, basicAuthOk, PLANOS_PAGOS, csv,
} from './util.js';

const json = (dados, status = 200, extra = {}) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra } });

function cors(req, env) {
  const origem = req.headers.get('Origin') || '';
  const ok = origemPermitida(origem, env.ORIGENS);
  // sendBeacon manda cookies (credentials: include): sem Allow-Credentials o navegador descarta a resposta do preflight
  return {
    'Access-Control-Allow-Origin': ok ? origem : (env.SITE_URL || 'https://artesana-mktdigital.com.br'),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function lerJson(req) {
  try { return await req.json(); } catch { return null; }
}

// ---------- avisos pra equipe: Telegram e/ou WhatsApp (Green API), o que estiver configurado ----------
async function whatsapp(env, texto) {
  if (!env.WA_INSTANCE || !env.WA_TOKEN || !env.WA_DESTINO) return null;
  try {
    const r = await fetch(`https://api.green-api.com/waInstance${env.WA_INSTANCE}/sendMessage/${env.WA_TOKEN}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: `${String(env.WA_DESTINO).replace(/\D/g, '')}@c.us`, message: texto.slice(0, 4000) }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
}

async function avisar(env, texto) {
  await Promise.all([telegram(env, texto), whatsapp(env, texto)]);
}

async function telegram(env, texto, extra = {}) {
  if (!env.TELEGRAM_TOKEN || !env.TELEGRAM_CHAT) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT, text: texto.slice(0, 4000), disable_web_page_preview: true, ...extra }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
}

// ---------- visitantes ----------
async function registrarVisitante(env, req, id, aparelho, agora) {
  const cf = req.cf || {};
  const idioma = (req.headers.get('Accept-Language') || '').split(',')[0].slice(0, 12) || null;
  await env.DB.prepare(`INSERT INTO visitantes (id, primeiro, ultimo, aparelho, pais, regiao, cidade, idioma, navegador)
    VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ON CONFLICT(id) DO UPDATE SET ultimo = ?2, aparelho = COALESCE(?3, aparelho), pais = COALESCE(?4, pais),
      regiao = COALESCE(?5, regiao), cidade = COALESCE(?6, cidade), idioma = COALESCE(?7, idioma), navegador = COALESCE(?8, navegador)`)
    .bind(id, agora, aparelho || null, cf.country || null, cf.region || null, cf.city || null, idioma, navegadorDe(req.headers.get('User-Agent') || '') || null)
    .run();
}

async function atualizarVisitante(env, id, campos, paginas = 0) {
  const sets = Object.keys(campos).map((k) => `${k} = ?`);
  const vals = Object.values(campos);
  if (paginas) sets.push(`paginas = paginas + ${Number(paginas)}`);
  if (!sets.length) return;
  await env.DB.prepare(`UPDATE visitantes SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
}

// ---------- rotas públicas ----------
async function eventos(req, env, ctx) {
  const b = await lerJson(req);
  if (!b || !codigoVisitanteValido(b.visitante)) return json({ ok: false, erro: 'visitante inválido' }, 400);
  const agora = Date.now();
  const aparelho = ['android', 'iphone', 'computador'].includes(b.aparelho) ? b.aparelho : null;
  const { linhas, campos, paginas } = resumirEventos(b.eventos, agora);
  await registrarVisitante(env, req, b.visitante, aparelho, agora);
  if (linhas.length) {
    await env.DB.batch(linhas.map((l) => env.DB.prepare('INSERT INTO eventos (visitante, t, tipo, rota, dados) VALUES (?, ?, ?, ?, ?)').bind(b.visitante, l.t, l.tipo, l.rota, l.dados)));
  }
  await atualizarVisitante(env, b.visitante, campos, paginas);
  if (campos.email) ctx.waitUntil(avisar(env, `📧 E-mail novo no app: ${campos.email}`));
  return json({ ok: true, recebidos: linhas.length });
}

async function perfil(req, env, ctx) {
  const b = await lerJson(req);
  if (!b || !codigoVisitanteValido(b.visitante)) return json({ ok: false }, 400);
  const agora = Date.now();
  const c = camposDoPerfil(b.dados);
  const resumo = String(b.resumo || '').slice(0, 4000);
  await registrarVisitante(env, req, b.visitante, b.aparelho, agora);
  await env.DB.prepare('INSERT INTO perfis (visitante, t, nome, marca, email, resumo, dados) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(b.visitante, agora, c.nome, c.marca, c.email, resumo, JSON.stringify(b.dados || {}).slice(0, 20000)).run();
  const campos = Object.fromEntries(Object.entries(c).filter(([, v]) => v != null));
  await atualizarVisitante(env, b.visitante, { ...campos, perfil_enviado: 1 });
  ctx.waitUntil(avisar(env, `📋 Perfil enviado\n\n${resumo}`));
  return json({ ok: true });
}

async function feedback(req, env, ctx) {
  const b = await lerJson(req);
  if (!b || !codigoVisitanteValido(b.visitante)) return json({ ok: false }, 400);
  const agora = Date.now();
  const nota = Number.isFinite(Number(b.nota)) ? Number(b.nota) : null;
  const texto = String(b.texto || '').slice(0, 6000);
  await registrarVisitante(env, req, b.visitante, b.aparelho, agora);
  await env.DB.prepare('INSERT INTO feedbacks (visitante, t, nota, nome, marca, email, texto, dados) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(b.visitante, agora, nota, String(b.nome || '').slice(0, 80), String(b.marca || '').slice(0, 80), String(b.email || '').slice(0, 120), texto, JSON.stringify(b.dados || {}).slice(0, 10000)).run();
  ctx.waitUntil(avisar(env, `⭐ Avaliação ${nota != null ? `${nota}/5` : ''}\n\n${texto}`));
  return json({ ok: true });
}

async function suporteEnviar(req, env, ctx) {
  const b = await lerJson(req);
  if (!b || !codigoVisitanteValido(b.visitante)) return json({ ok: false }, 400);
  const agora = Date.now();
  const nome = String(b.nome || '').slice(0, 80);
  const marca = String(b.marca || '').slice(0, 80);
  const pergunta = String(b.pergunta || '').slice(0, 2000);
  const historico = Array.isArray(b.conversa) ? b.conversa.slice(-6).map((l) => String(l).slice(0, 300)) : [];
  await registrarVisitante(env, req, b.visitante, b.aparelho, agora);
  let conv = await env.DB.prepare("SELECT id FROM conversas WHERE visitante = ? AND status = 'aberta' ORDER BY id DESC LIMIT 1").bind(b.visitante).first();
  if (!conv) {
    const r = await env.DB.prepare('INSERT INTO conversas (visitante, aberta, ultima, nome, marca) VALUES (?, ?, ?, ?, ?) RETURNING id').bind(b.visitante, agora, agora, nome, marca).first();
    conv = { id: r.id };
  } else {
    await env.DB.prepare('UPDATE conversas SET ultima = ?, nome = COALESCE(NULLIF(?, \'\'), nome), marca = COALESCE(NULLIF(?, \'\'), marca) WHERE id = ?').bind(agora, nome, marca, conv.id).run();
  }
  const textoCliente = pergunta || historico.filter((l) => l.startsWith('eu:')).pop()?.slice(3).trim() || '(pediu pra falar com uma atendente)';
  await env.DB.prepare("INSERT INTO mensagens (conversa, t, de, texto, origem) VALUES (?, ?, 'cliente', ?, 'app')").bind(conv.id, agora, textoCliente).run();
  const painel = `${env.SITE_URL || 'https://artesana-mktdigital.com.br'}/app/admin/#suporte`;
  ctx.waitUntil(avisar(env, textoAvisoSuporte({ conversa: conv.id, nome, marca, pergunta: textoCliente, historico, painel, telegram: !!env.TELEGRAM_TOKEN })));
  return json({ ok: true, ticket: conv.id });
}

async function suporteBuscar(url, env) {
  const v = url.searchParams.get('visitante') || '';
  if (!codigoVisitanteValido(v)) return json({ ok: false }, 400);
  const r = await env.DB.prepare("SELECT m.id, m.texto, m.t FROM mensagens m JOIN conversas c ON c.id = m.conversa WHERE c.visitante = ? AND m.de = 'equipe' ORDER BY m.t LIMIT 200").bind(v).all();
  return json({ ok: true, mensagens: r.results || [] });
}

// ---------- Mercado Pago ----------
async function mp(env, caminho, corpo, chave) {
  const r = await fetch(`https://api.mercadopago.com${caminho}`, {
    method: corpo ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${env.MP_TOKEN}`, 'Content-Type': 'application/json', ...(chave ? { 'X-Idempotency-Key': chave } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados };
}

async function pagar(req, env, plano, urlBase) {
  const p = PLANOS_PAGOS[plano];
  if (!p) return json({ ok: false, erro: 'plano desconhecido' }, 404);
  if (!env.MP_TOKEN) return json({ ok: false, semPagamento: true }, 503);
  const b = (await lerJson(req)) || {};
  if (!codigoVisitanteValido(b.visitante)) return json({ ok: false }, 400);
  const email = typeof b.email === 'string' && b.email.includes('@') ? b.email.trim().slice(0, 120) : '';
  const agora = Date.now();
  const referencia = `${plano}-${b.visitante.slice(0, 12)}-${agora.toString(36)}`;
  const site = env.SITE_URL || 'https://artesana-mktdigital.com.br';
  let r;
  if (p.tipo === 'assinatura') {
    if (!email) return json({ ok: false, erro: 'precisa do e-mail' }, 400);
    r = await mp(env, '/preapproval', {
      reason: p.titulo, external_reference: referencia, payer_email: email, status: 'pending',
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: p.valor, currency_id: 'BRL' },
      back_url: `${site}/app/#planos/obrigada`,
    }, referencia);
  } else {
    r = await mp(env, '/checkout/preferences', {
      items: [{ id: plano, title: p.titulo, quantity: 1, unit_price: p.valor, currency_id: 'BRL' }],
      payer: email ? { email } : undefined, external_reference: referencia, statement_descriptor: 'ARTESANA',
      payment_methods: { installments: p.parcelas || 1 },
      back_urls: { success: `${site}/app/#planos/obrigada`, pending: `${site}/app/#planos/pendente`, failure: `${site}/app/#planos` },
      auto_return: 'approved', notification_url: `${urlBase}/mp/webhook`,
    }, referencia);
  }
  if (!r.ok || !r.dados.init_point) return json({ ok: false, erro: 'Mercado Pago recusou', detalhe: r.dados && (r.dados.message || r.dados.error) }, 502);
  await env.DB.prepare('INSERT INTO pagamentos (visitante, t, plano, email, referencia, mp_id, status, valor, dados) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(b.visitante, agora, plano, email || null, referencia, String(r.dados.id || ''), 'criado', p.valor, JSON.stringify({ init_point: r.dados.init_point }).slice(0, 2000)).run();
  return json({ ok: true, url: r.dados.init_point, referencia });
}

async function assinaturaValida(req, env, corpoTexto) {
  if (!env.MP_WEBHOOK_SECRET) return true; // sem segredo configurado, aceita e confere no Mercado Pago pelo id
  const assinatura = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';
  const partes = Object.fromEntries(assinatura.split(',').map((p) => p.trim().split('=')));
  const url = new URL(req.url);
  let id = url.searchParams.get('data.id') || '';
  if (!id) { try { id = String(JSON.parse(corpoTexto).data.id || ''); } catch { /* sem id */ } }
  if (!partes.ts || !partes.v1) return false;
  const base = `id:${id.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.MP_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(base)));
  const hex = Array.from(mac, (x) => x.toString(16).padStart(2, '0')).join('');
  return hex === partes.v1;
}

async function mpWebhook(req, env, ctx) {
  const corpoTexto = await req.text();
  if (!(await assinaturaValida(req, env, corpoTexto))) return json({ ok: false }, 401);
  let corpo = {};
  try { corpo = JSON.parse(corpoTexto); } catch { /* alguns avisos vêm só na query */ }
  const url = new URL(req.url);
  const tipo = corpo.type || url.searchParams.get('type') || url.searchParams.get('topic') || '';
  const id = (corpo.data && corpo.data.id) || url.searchParams.get('data.id') || url.searchParams.get('id') || '';
  if (!id || !env.MP_TOKEN) return json({ ok: true, ignorado: true });
  const tarefa = (async () => {
    let status = null; let referencia = null; let valor = null; let email = null; let dados = null;
    if (tipo === 'payment') {
      const r = await mp(env, `/v1/payments/${id}`);
      if (!r.ok) return;
      dados = r.dados; status = dados.status; referencia = dados.external_reference; valor = dados.transaction_amount; email = dados.payer && dados.payer.email;
    } else if (tipo === 'subscription_preapproval' || tipo === 'preapproval') {
      const r = await mp(env, `/preapproval/${id}`);
      if (!r.ok) return;
      dados = r.dados; status = dados.status; referencia = dados.external_reference; valor = dados.auto_recurring && dados.auto_recurring.transaction_amount; email = dados.payer_email;
    } else return;
    const existente = referencia ? await env.DB.prepare('SELECT id, plano, status FROM pagamentos WHERE referencia = ? ORDER BY id DESC LIMIT 1').bind(referencia).first() : null;
    const resumo = JSON.stringify({ tipo, id, status, atualizado: Date.now() }).slice(0, 2000);
    if (existente) await env.DB.prepare('UPDATE pagamentos SET status = ?, mp_id = ?, valor = COALESCE(?, valor), email = COALESCE(?, email), dados = ? WHERE id = ?').bind(status, String(id), valor, email, resumo, existente.id).run();
    else await env.DB.prepare('INSERT INTO pagamentos (visitante, t, plano, email, referencia, mp_id, status, valor, dados) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)').bind(Date.now(), (referencia || '').split('-')[0] || 'desconhecido', email, referencia, String(id), status, valor, resumo).run();
    if (!existente || existente.status !== status) await avisar(env, `💰 Pagamento ${status} · ${(existente && existente.plano) || (referencia || '').split('-')[0]} · ${email || ''} · R$ ${valor ?? '?'}`);
  })();
  ctx.waitUntil(tarefa);
  return json({ ok: true });
}

// Sem depender do webhook: pergunta ao Mercado Pago o status dos pagamentos em aberto (até 20 por vez, dos últimos 60 dias).
const STATUS_FINAIS = new Set(['approved', 'authorized', 'rejected', 'cancelled', 'refunded', 'charged_back']);
async function atualizarPagamentos(env) {
  if (!env.MP_TOKEN) return;
  const abertos = (await env.DB.prepare("SELECT id, plano, referencia, mp_id, status FROM pagamentos WHERE t >= ? AND (status IS NULL OR status NOT IN ('approved','authorized','rejected','cancelled','refunded','charged_back')) ORDER BY t DESC LIMIT 20")
    .bind(Date.now() - 60 * 86400000).all()).results || [];
  for (const p of abertos) {
    try {
      let status = null; let valor = null; let email = null; let mpId = p.mp_id;
      if (p.plano === 'florescer' && p.mp_id) {
        const r = await mp(env, `/preapproval/${p.mp_id}`);
        if (r.ok) { status = r.dados.status; email = r.dados.payer_email; valor = r.dados.auto_recurring && r.dados.auto_recurring.transaction_amount; }
      } else if (p.referencia) {
        const r = await mp(env, `/v1/payments/search?external_reference=${encodeURIComponent(p.referencia)}&sort=date_created&criteria=desc`);
        const pg = r.ok && r.dados.results && r.dados.results[0];
        if (pg) { status = pg.status; valor = pg.transaction_amount; email = pg.payer && pg.payer.email; mpId = String(pg.id); }
      }
      if (status && status !== p.status) {
        await env.DB.prepare('UPDATE pagamentos SET status = ?, mp_id = ?, valor = COALESCE(?, valor), email = COALESCE(?, email) WHERE id = ?').bind(status, mpId, valor, email, p.id).run();
        if (STATUS_FINAIS.has(status)) await avisar(env, `💰 Pagamento ${status} · ${p.plano} · ${email || ''} · R$ ${valor ?? '?'}`);
      }
    } catch (e) { console.error('atualizarPagamentos', p.id, e); }
  }
}

// ---------- Telegram webhook: resposta da equipe ----------
async function telegramWebhook(req, env, segredo) {
  if (!env.TELEGRAM_SECRET || segredo !== env.TELEGRAM_SECRET) return json({ ok: false }, 404);
  const up = (await lerJson(req)) || {};
  const msg = up.message || up.edited_message;
  if (!msg || String(msg.chat && msg.chat.id) !== String(env.TELEGRAM_CHAT)) return json({ ok: true });
  const texto = String(msg.text || '').trim();
  if (texto === '/start' || texto === '/ajuda') {
    await telegram(env, 'Sou o aviso do artesaná. Quando uma cliente pedir atendente, a mensagem chega aqui com #c<número>. Responda usando "Responder" nela, ou /r <número> sua resposta. /abertas lista as conversas sem resposta.');
    return json({ ok: true });
  }
  if (texto === '/abertas') {
    const r = await env.DB.prepare(`SELECT c.id, c.nome, c.marca, c.ultima, (SELECT texto FROM mensagens m WHERE m.conversa = c.id ORDER BY m.t DESC LIMIT 1) AS ultimo_texto,
      (SELECT de FROM mensagens m WHERE m.conversa = c.id ORDER BY m.t DESC LIMIT 1) AS ultimo_de FROM conversas c WHERE c.status = 'aberta' ORDER BY c.ultima DESC LIMIT 20`).all();
    const pend = (r.results || []).filter((c) => c.ultimo_de === 'cliente');
    await telegram(env, pend.length ? pend.map((c) => `#c${c.id} ${c.nome || 'sem nome'}${c.marca ? ` (${c.marca})` : ''}: ${String(c.ultimo_texto).slice(0, 80)}`).join('\n') : 'Nenhuma conversa esperando resposta.');
    return json({ ok: true });
  }
  const resposta = interpretarRespostaTelegram(msg);
  if (!resposta) {
    await telegram(env, 'Não entendi pra quem é. Use "Responder" na mensagem da cliente, ou /r <número> sua resposta.', { reply_to_message_id: msg.message_id });
    return json({ ok: true });
  }
  const conv = await env.DB.prepare('SELECT id, status FROM conversas WHERE id = ?').bind(resposta.conversa).first();
  if (!conv) { await telegram(env, `Conversa #c${resposta.conversa} não existe.`, { reply_to_message_id: msg.message_id }); return json({ ok: true }); }
  const agora = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO mensagens (conversa, t, de, texto, origem) VALUES (?, ?, 'equipe', ?, 'telegram')").bind(conv.id, agora, resposta.texto.slice(0, 4000)),
    env.DB.prepare("UPDATE conversas SET ultima = ?, status = 'aberta' WHERE id = ?").bind(agora, conv.id),
  ]);
  await telegram(env, `✅ Enviado pra #c${conv.id}. Ela vê no app, na tela Ajuda.`, { reply_to_message_id: msg.message_id });
  return json({ ok: true });
}

// ---------- painel ----------
async function admin(req, env, url, caminho) {
  if (!basicAuthOk(req.headers.get('Authorization'), env.ADMIN_USER, env.ADMIN_SENHA)) return json({ ok: false, erro: 'login' }, 401);
  const agora = Date.now();
  const dia = 86400000;
  if (caminho === '/admin/resumo') {
    const q = (sql, ...b) => env.DB.prepare(sql).bind(...b);
    const [tot, hoje, sete, trinta, emails, perfis, fb, notas, abertas, pagos, porDia, porPais, porCidade, porAparelho, porRedes, porFaixa, porRota, porPasso, rotasVistas, entradas] = await env.DB.batch([
      q('SELECT COUNT(*) n FROM visitantes'),
      q('SELECT COUNT(*) n FROM visitantes WHERE ultimo >= ?', agora - dia),
      q('SELECT COUNT(*) n FROM visitantes WHERE ultimo >= ?', agora - 7 * dia),
      q('SELECT COUNT(*) n FROM visitantes WHERE primeiro >= ?', agora - 30 * dia),
      q("SELECT COUNT(*) n FROM visitantes WHERE email IS NOT NULL AND email <> ''"),
      q('SELECT COUNT(*) n FROM perfis'),
      q('SELECT COUNT(*) n FROM feedbacks'),
      q('SELECT AVG(nota) media FROM feedbacks WHERE nota IS NOT NULL'),
      q("SELECT COUNT(*) n FROM conversas c WHERE c.status = 'aberta' AND (SELECT de FROM mensagens m WHERE m.conversa = c.id ORDER BY m.t DESC LIMIT 1) = 'cliente'"),
      q("SELECT COUNT(*) n, COALESCE(SUM(valor), 0) total FROM pagamentos WHERE status IN ('approved', 'authorized')"),
      q("SELECT date(t / 1000, 'unixepoch', '-3 hours') dia, COUNT(DISTINCT visitante) n FROM eventos WHERE t >= ? GROUP BY dia ORDER BY dia", agora - 30 * dia),
      q('SELECT COALESCE(pais, \'?\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC LIMIT 12'),
      q("SELECT COALESCE(cidade, '?') || ' · ' || COALESCE(regiao, '') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC LIMIT 15"),
      q('SELECT COALESCE(aparelho, \'?\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC'),
      q('SELECT COALESCE(redes, \'não escolheu\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC'),
      q('SELECT COALESCE(faixa, \'não informou\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC'),
      q('SELECT COALESCE(ultima_rota, \'?\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC LIMIT 20'),
      q('SELECT COALESCE(passo, \'não começou\') k, COUNT(*) n FROM visitantes GROUP BY k ORDER BY n DESC LIMIT 20'),
      q("SELECT COALESCE(rota, '?') k, COUNT(*) n FROM eventos WHERE tipo = 'pagina' GROUP BY k ORDER BY n DESC LIMIT 25"),
      q("SELECT COUNT(*) n FROM eventos WHERE tipo = 'entrada'"),
    ]);
    const um = (r) => (r.results && r.results[0]) || {};
    const lista = (r) => r.results || [];
    return json({
      ok: true, agora,
      totais: {
        visitantes: um(tot).n, hoje: um(hoje).n, seteDias: um(sete).n, novosTrintaDias: um(trinta).n, emails: um(emails).n,
        perfis: um(perfis).n, feedbacks: um(fb).n, notaMedia: um(notas).media, conversasEsperando: um(abertas).n,
        pagamentos: um(pagos).n, receita: um(pagos).total, entradas: um(entradas).n,
      },
      porDia: lista(porDia), porPais: lista(porPais), porCidade: lista(porCidade), porAparelho: lista(porAparelho), porRedes: lista(porRedes),
      porFaixa: lista(porFaixa), porRota: lista(porRota), porPasso: lista(porPasso), rotasVistas: lista(rotasVistas),
    });
  }
  if (caminho === '/admin/visitantes') {
    const limite = Math.min(1000, Number(url.searchParams.get('limite')) || 300);
    const r = await env.DB.prepare('SELECT * FROM visitantes ORDER BY ultimo DESC LIMIT ?').bind(limite).all();
    if (url.searchParams.get('formato') === 'csv') {
      return new Response('﻿' + csv(r.results || [], ['id', 'primeiro', 'ultimo', 'aparelho', 'pais', 'regiao', 'cidade', 'idioma', 'navegador', 'redes', 'email', 'nome', 'marca', 'faixa', 'cidade_informada', 'ultima_rota', 'passo', 'paginas', 'perfil_enviado']),
        { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="visitantes.csv"' } });
    }
    return json({ ok: true, visitantes: r.results || [] });
  }
  if (caminho === '/admin/visitante') {
    const id = url.searchParams.get('id') || '';
    if (!codigoVisitanteValido(id)) return json({ ok: false }, 400);
    const [v, ev] = await env.DB.batch([
      env.DB.prepare('SELECT * FROM visitantes WHERE id = ?').bind(id),
      env.DB.prepare('SELECT t, tipo, rota, dados FROM eventos WHERE visitante = ? ORDER BY t DESC LIMIT 300').bind(id),
    ]);
    return json({ ok: true, visitante: (v.results || [])[0] || null, eventos: ev.results || [] });
  }
  if (caminho === '/admin/perfis') {
    const r = await env.DB.prepare('SELECT id, visitante, t, nome, marca, email, resumo FROM perfis ORDER BY t DESC LIMIT 300').all();
    return json({ ok: true, perfis: r.results || [] });
  }
  if (caminho === '/admin/feedbacks') {
    const r = await env.DB.prepare('SELECT id, visitante, t, nota, nome, marca, email, texto FROM feedbacks ORDER BY t DESC LIMIT 300').all();
    return json({ ok: true, feedbacks: r.results || [] });
  }
  if (caminho === '/admin/pagamentos') {
    await atualizarPagamentos(env); // consulta o Mercado Pago pelos que ainda não fecharam: funciona mesmo sem webhook
    const r = await env.DB.prepare('SELECT id, visitante, t, plano, email, referencia, mp_id, status, valor FROM pagamentos ORDER BY t DESC LIMIT 300').all();
    return json({ ok: true, pagamentos: r.results || [] });
  }
  if (caminho === '/admin/suporte') {
    const convs = (await env.DB.prepare('SELECT * FROM conversas ORDER BY ultima DESC LIMIT 100').all()).results || [];
    let mensagens = [];
    if (convs.length) {
      const ids = convs.map((c) => c.id);
      mensagens = (await env.DB.prepare(`SELECT id, conversa, t, de, texto, origem FROM mensagens WHERE conversa IN (${ids.map(() => '?').join(',')}) ORDER BY t`).bind(...ids).all()).results || [];
    }
    return json({ ok: true, conversas: convs.map((c) => ({ ...c, mensagens: mensagens.filter((m) => m.conversa === c.id) })) });
  }
  const acao = caminho.match(/^\/admin\/suporte\/(\d+)\/(responder|fechar)$/);
  if (acao && req.method === 'POST') {
    const id = Number(acao[1]);
    const conv = await env.DB.prepare('SELECT id FROM conversas WHERE id = ?').bind(id).first();
    if (!conv) return json({ ok: false }, 404);
    if (acao[2] === 'fechar') { await env.DB.prepare("UPDATE conversas SET status = 'fechada' WHERE id = ?").bind(id).run(); return json({ ok: true }); }
    const b = (await lerJson(req)) || {};
    const texto = String(b.texto || '').trim().slice(0, 4000);
    if (!texto) return json({ ok: false, erro: 'texto vazio' }, 400);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO mensagens (conversa, t, de, texto, origem) VALUES (?, ?, 'equipe', ?, 'painel')").bind(id, agora, texto),
      env.DB.prepare("UPDATE conversas SET ultima = ?, status = 'aberta' WHERE id = ?").bind(agora, id),
    ]);
    return json({ ok: true });
  }
  return json({ ok: false, erro: 'rota' }, 404);
}

export default {
  // de meia em meia hora confere no Mercado Pago os pagamentos em aberto e avisa a equipe (não depende do webhook)
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(atualizarPagamentos(env));
  },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const caminho = url.pathname.replace(/\/+$/, '') || '/';
    const cabecalhos = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhos });
    const comCors = async (fn) => {
      try {
        const r = await fn();
        for (const [k, v] of Object.entries(cabecalhos)) r.headers.set(k, v);
        return r;
      } catch (e) {
        console.error(caminho, e);
        return json({ ok: false, erro: 'interno' }, 500, cabecalhos);
      }
    };
    if (caminho === '/' || caminho === '/v1') return json({ ok: true, servico: 'artesana-api', hora: new Date().toISOString() }, 200, cabecalhos);
    if (caminho === '/v1/eventos' && req.method === 'POST') return comCors(() => eventos(req, env, ctx));
    if (caminho === '/v1/perfil' && req.method === 'POST') return comCors(() => perfil(req, env, ctx));
    if (caminho === '/v1/feedback' && req.method === 'POST') return comCors(() => feedback(req, env, ctx));
    if (caminho === '/v1/suporte' && req.method === 'POST') return comCors(() => suporteEnviar(req, env, ctx));
    if (caminho === '/v1/suporte' && req.method === 'GET') return comCors(() => suporteBuscar(url, env));
    const pg = caminho.match(/^\/v1\/pagar\/([a-z]+)$/);
    if (pg && req.method === 'POST') return comCors(() => pagar(req, env, pg[1], url.origin));
    const tg = caminho.match(/^\/telegram\/([A-Za-z0-9_-]{8,})$/);
    if (tg && req.method === 'POST') return comCors(() => telegramWebhook(req, env, tg[1]));
    if (caminho === '/mp/webhook' && req.method === 'POST') return comCors(() => mpWebhook(req, env, ctx));
    if (caminho.startsWith('/admin')) return comCors(() => admin(req, env, url, caminho));
    return json({ ok: false, erro: 'rota' }, 404, cabecalhos);
  },
};
