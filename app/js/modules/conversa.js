// Perfil da marca em forma de conversa: uma pergunta por tela, letra grande, um campo só, com microfone.
// Rota #conversa/<passo>. Cada resposta é salva na hora; "Fazer depois" pula; "Ver tudo" abre o formulário inteiro.
import { h, pergunta, toast, chips, copiar } from '../ui.js';
import { campo, area } from '../campos.js';
import * as store from '../store.js';
import * as router from '../router.js';
import * as analitica from '../analitica.js';
import { NICHOS, PERSONALIDADES, FAIXAS_ETARIAS, nichosDe, camposFaltando } from '../lib/perfil.js';
import { validar, versoesDoLink } from '../lib/whatsapp.js';
import { baseLinkCurto } from '../site.js';
import { enviarPerfil } from '../onboarding.js';

const PASSOS = ['nome', 'marca', 'nichos', 'produto', 'historia', 'publico', 'personalidade', 'arroba', 'whatsapp', 'sobre', 'resumo'];

const arroba = (v) => { const t = String(v || '').trim().replace(/^@+/, ''); return t ? `@${t}` : ''; };

export function montar(section, param) {
  const passo = PASSOS.includes(param) ? param : PASSOS[0];
  const n = PASSOS.indexOf(passo);
  const user = store.usuario();
  const o = store.get('onboarding', {});
  const ig = store.get('instagram', {});
  const wa = store.get('whatsapp', {});
  const marca = (user.marca || '').trim();
  const nome = (user.nome || '').trim().split(' ')[0];

  const irPara = (p) => router.ir(`#conversa/${p}`);
  const seguinte = () => { analitica.evento('passo', { passo }); irPara(PASSOS[Math.min(n + 1, PASSOS.length - 1)]); };
  let salvar = () => true; // cada passo define; devolve false se não puder seguir

  let miolo; let titulo; let ajuda; let extra = null;

  if (passo === 'nome') {
    titulo = 'Como você se chama?'; ajuda = 'Só o primeiro nome já basta.';
    const c = campo({ valor: user.nome || '', placeholder: 'Seu nome', autocomplete: 'given-name', autocapitalize: 'words', class: 'input grande' });
    miolo = c.el;
    salvar = () => { const v = c.input.value.trim(); if (!v) { toast('Conta seu nome pra gente'); return false; } store.patch('user', { nome: v }); return true; };
  } else if (passo === 'marca') {
    titulo = nome ? `Prazer, ${nome}. Como se chama a sua marca?` : 'Como se chama a sua marca?';
    ajuda = 'Pode ser o nome que já está na etiqueta. Se ainda não tem, deixe em branco: a gente ajuda a criar.';
    const c = campo({ valor: user.marca || '', placeholder: 'Nome da marca', autocapitalize: 'words', class: 'input grande' });
    miolo = c.el;
    salvar = () => { store.patch('user', { marca: c.input.value.trim() }); return true; };
  } else if (passo === 'nichos') {
    titulo = marca ? `E o que a ${marca} faz?` : 'O que você produz?'; ajuda = 'Pode marcar mais de um. Se não estiver na lista, escreva embaixo.';
    let escolhidos = nichosDe(o);
    const outro = campo({ valor: o.nichoOutro || '', placeholder: 'Outro: bordado, cerâmica, doces...', class: 'input' });
    miolo = h('div', {}, chips({ opcoes: NICHOS, valor: escolhidos, multi: true, aoMudar: (v) => { escolhidos = v; } }), h('div', { class: 'field', style: { marginTop: '14px' } }, outro.el));
    salvar = () => {
      const nichoOutro = outro.input.value.trim();
      if (!escolhidos.length && !nichoOutro) { toast('Marque pelo menos um, ou escreva o seu'); return false; }
      store.patch('onboarding', { nichos: escolhidos, nicho: escolhidos[0] || '', nichoOutro });
      return true;
    };
  } else if (passo === 'produto') {
    titulo = 'Qual é o seu produto principal?'; ajuda = 'O que mais vende, ou o que você mais gosta de fazer.';
    const c = campo({ valor: o.tipoProduto || '', placeholder: 'Ex.: sabonete de lavanda', class: 'input grande' });
    miolo = c.el;
    salvar = () => { store.patch('onboarding', { tipoProduto: c.input.value.trim() }); return true; };
  } else if (passo === 'historia') {
    titulo = 'Como tudo começou?'; ajuda = 'Conte do seu jeito, falando ou escrevendo. Vira frase de impacto, bio e legendas.';
    const c = area({ valor: o.historia || '', placeholder: 'Ex.: Comecei fazendo sabonete pra minha família, as amigas pediram e virou renda...', rows: '6' });
    miolo = c.el;
    salvar = () => { const v = c.input.value.trim(); if (!v) { toast('Conta um pouquinho, mesmo que curto'); return false; } store.patch('onboarding', { historia: v }); return true; };
  } else if (passo === 'publico') {
    titulo = 'Pra quem você vende?'; ajuda = 'Quem compra de você hoje, ou quem você quer alcançar.';
    const c = campo({ valor: o.publicoAlvo || '', placeholder: 'Ex.: mulheres de 30 a 50 que gostam do natural', class: 'input grande' });
    miolo = c.el;
    salvar = () => { const v = c.input.value.trim(); if (!v) { toast('Diga pra quem você vende'); return false; } store.patch('onboarding', { publicoAlvo: v }); return true; };
  } else if (passo === 'personalidade') {
    titulo = marca ? `Se a ${marca} fosse uma pessoa, como ela seria?` : 'Se a sua marca fosse uma pessoa, como ela seria?';
    ajuda = 'Isso define o tom das frases e das legendas.';
    let valor = o.personalidade || '';
    miolo = chips({ opcoes: PERSONALIDADES, valor, aoMudar: (v) => { valor = v; } });
    salvar = () => { if (!valor) { toast('Escolha uma'); return false; } store.patch('onboarding', { personalidade: valor }); return true; };
  } else if (passo === 'arroba') {
    titulo = 'Qual é o seu @ no Instagram?'; ajuda = 'Se ainda não tem conta, sem problema: a gente te mostra como criar, passo a passo.';
    const c = campo({ valor: ig.arroba || '', placeholder: '@suamarca', autocapitalize: 'none', class: 'input grande' });
    miolo = c.el;
    extra = h('button', { type: 'button', class: 'btn ghost block', onClick: () => { store.patch('instagram', { semConta: true, arroba: '' }); router.ir('#ajuda-instagram'); } }, 'Ainda não tenho. Me ajuda?');
    salvar = () => { const v = arroba(c.input.value); store.patch('instagram', { arroba: v, semConta: v ? false : !!ig.semConta }); return true; };
  } else if (passo === 'whatsapp') {
    titulo = 'Qual é o seu WhatsApp?'; ajuda = 'Vira o link curto pra bio e o QR code pra embalagem.';
    const ddd = h('input', { class: 'input grande', inputmode: 'numeric', maxlength: '4', placeholder: 'DDD', 'aria-label': 'DDD', style: { maxWidth: '110px' } });
    const numero = h('input', { class: 'input grande', inputmode: 'numeric', maxlength: '11', placeholder: '99999-9999', 'aria-label': 'Número' });
    ddd.value = wa.ddd || ''; numero.value = wa.numero || '';
    miolo = h('div', { class: 'inline' }, h('span', { class: 'prefix' }, '+55'), ddd, numero);
    salvar = () => {
      if (!ddd.value.trim() && !numero.value.trim()) return true; // pode deixar pra depois
      const v = validar({ ddd: ddd.value, numero: numero.value });
      if (!v.ok) { toast(v.erro); return false; }
      const dados = { ddd: v.ddd, numero: v.numero, mensagem: wa.mensagem || '' };
      const links = versoesDoLink({ base: baseLinkCurto(), marca, ...dados });
      store.set('whatsapp', { ...dados, link: links.comMensagem || links.curto, linkCurto: links.curto, linkMarca: links.comMarca });
      return true;
    };
  } else if (passo === 'sobre') {
    titulo = 'Só mais duas coisinhas sobre você.'; ajuda = 'As duas são opcionais e ajudam a gente a entender quem usa o app.';
    let faixa = user.faixaEtaria || '';
    const cidade = campo({ valor: user.cidade || '', placeholder: 'Cidade e estado', autocapitalize: 'words', class: 'input' });
    miolo = h('div', {},
      h('div', { class: 'field' }, h('label', {}, 'Quantos anos você tem?'), chips({ opcoes: FAIXAS_ETARIAS.map((f) => ({ id: f, nome: f })), valor: faixa, aoMudar: (v) => { faixa = v; } })),
      h('div', { class: 'field' }, h('label', {}, 'De onde você é?'), cidade.el));
    salvar = () => { store.patch('user', { faixaEtaria: faixa, cidade: cidade.input.value.trim() }); return true; };
  } else {
    // resumo e envio
    const dados = { user: store.usuario(), onboarding: store.get('onboarding', {}), instagram: store.get('instagram', {}), whatsapp: store.get('whatsapp', {}) };
    const faltando = camposFaltando(dados);
    titulo = faltando.length ? 'Quase lá.' : (marca ? `A ${marca} está pronta pra começar.` : 'Seu perfil está pronto.');
    ajuda = faltando.length ? `Falta: ${faltando.map((c) => c.rotulo.toLowerCase()).join(', ')}. Você pode enviar mesmo assim e completar depois.` : 'Confira o resumo. Ao enviar, a equipe do artesaná. recebe e o app segue pra sua identidade.';
    const pre = h('pre', { class: 'perfil-resumo' }, '');
    import('../lib/perfil.js').then(({ resumoPerfil }) => { pre.textContent = resumoPerfil(dados); });
    miolo = h('div', {}, pre, h('div', { class: 'btn-row' },
      h('button', { class: 'btn white', type: 'button', onClick: () => copiar(pre.textContent, 'Resumo copiado') }, 'Copiar resumo'),
      h('a', { class: 'btn white', href: '#perfil' }, 'Ajustar algo')));
    salvar = async () => {
      const r = await enviarPerfil();
      if (r.faltando.length) { store.set('perfil_enviado', { data: new Date().toISOString(), enviado: false, parcial: true }); }
      toast(r.enviado ? 'Perfil enviado. Obrigada!' : 'Perfil salvo neste aparelho');
      router.ir('#identidade');
      return false; // já navegou
    };
  }

  const ultimo = passo === 'resumo';
  section.innerHTML = '';
  section.append(h('div', { class: 'screen conversa no-tab' },
    h('div', { class: 'conversa-topo' },
      h('a', { class: 'back', href: n > 0 ? `#conversa/${PASSOS[n - 1]}` : '#home', 'aria-label': 'Voltar' }, '←'),
      h('div', { class: 'progress dark' }, h('i', { style: { width: `${((n + 1) / PASSOS.length) * 100}%` } })),
      h('span', { class: 'passo' }, `${n + 1} de ${PASSOS.length}`)),
    h('div', { class: 'conversa-miolo' },
      pergunta(titulo, ajuda),
      miolo,
      extra,
      h('div', { class: 'conversa-acoes' },
        h('button', { class: 'btn peach block grande', type: 'button', onClick: async () => { if ((await salvar()) !== false && !ultimo) seguinte(); } }, ultimo ? 'Enviar perfil e seguir' : 'Continuar'),
        ultimo ? null : h('div', { class: 'conversa-links' },
          h('a', { href: `#conversa/${PASSOS[Math.min(n + 1, PASSOS.length - 1)]}` }, 'Fazer depois'),
          h('a', { href: '#perfil' }, 'Ver tudo que preciso preencher'))),
    ),
  ));
  const foco = section.querySelector('input.grande, textarea');
  if (foco && window.matchMedia('(min-width: 900px)').matches) setTimeout(() => foco.focus(), 100);
}
