// Gráficos do Moskitto Radar em SVG, sem biblioteca. Cada um é desenhado na largura real do cartão.
(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('dados-json').textContent);
  const ICONES = window.ICONES;
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const nf = new Intl.NumberFormat('pt-BR');
  const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const pct = (v) => new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }).format(v);
  const sinal = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + pct(Math.abs(v));

  const FAIXAS = ['madrugada', 'manha', 'tarde', 'noite'];
  const NOME_FAIXA = { madrugada: 'Madrugada', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
  // mesmas frases do app (mobile/src/utils/rotulos.ts)
  const FRASE_FAIXA = { madrugada: 'de madrugada', manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };
  const HORAS_FAIXA = { madrugada: '0h–6h', manha: '6h–12h', tarde: '12h–18h', noite: '18h–24h' };
  const NIVEIS = ['alto', 'medio', 'baixo'];
  const NOME_NIVEL = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };
  // mesmos nomes do app (mobile/src/config/locais.ts)
  const TIPO = { bairro: 'Bairro da Av. Paulista', distrito: 'Distrito de São Paulo', municipio: 'Município da região metropolitana' };
  const LUGARES_FILTRO = { todos: 'todos os lugares', capital: 'a capital', vizinhas: 'as cidades vizinhas' };
  const ROUBO = { todos: { campo: 'taxa', frase: 'roubos' }, celular: { campo: 'taxa_celular', frase: 'roubos de celular' }, veiculo: { campo: 'taxa_veiculo', frase: 'roubos de veículo' } };
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const DIAS_EXT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const escuro = () => css('color-scheme') === 'dark';
  const mesAno = (iso) => { const [a, m] = iso.split('-'); return `${MESES[Number(m) - 1]}/${a}`; };
  const corNivel = (n) => `var(--risk-${n})`;
  const icone = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="${ICONES}#i-${id}"/></svg>`;
  const selo = (n) => `<span class="selo ${n}">${icone(n)}Risco ${NOME_NIVEL[n].toLowerCase()}</span>`;
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Movimento
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  const suave = (p) => 1 - Math.pow(1 - p, 3);
  // anima de 0 a 1 e devolve a função que cancela
  function animar(dur, passo, fim) {
    if (reduzir.matches || dur <= 0) { passo(1); if (fim) fim(); return () => {}; }
    let parado = false;
    const t0 = performance.now();
    const quadro = (agora) => {
      if (parado) return;
      const p = Math.min(1, (agora - t0) / dur);
      passo(suave(p));
      if (p < 1) requestAnimationFrame(quadro); else if (fim) fim();
    };
    requestAnimationFrame(quadro);
    return () => { parado = true; };
  }
  function entrar(elementos, atraso = 22) {
    if (reduzir.matches || !Element.prototype.animate) return;
    elementos.forEach((e, i) => e.animate(
      [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 260, delay: i * atraso, easing: 'cubic-bezier(.2,0,0,1)', fill: 'backwards' }
    ));
  }
  function piscar(e) {
    if (reduzir.matches || !e.animate) return;
    e.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,0,0,1)' });
  }

  function el(tag, attrs = {}, pai) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (pai) pai.appendChild(e);
    return e;
  }
  function texto(pai, x, y, conteudo, attrs = {}) {
    const t = el('text', { x, y, ...attrs }, pai);
    t.textContent = conteudo;
    return t;
  }

  const faixaDaHora = (h) => (h < 6 ? 'madrugada' : h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite');
  const FAIXA_AGORA = faixaDaHora(new Date().getHours());
  const N = D.numeros;
  const PERIODO = `${mesAno(N.periodo.inicio)} a ${mesAno(N.periodo.fim)}`;
  const POR_CODIGO = new Map(D.lugares.map((l) => [l.codigo, l]));

  // Estado da página, guardado na URL
  const PADRAO = { faixa: FAIXA_AGORA, niveis: ['alto', 'medio', 'baixo'], lugares: 'todos', roubo: 'todos', dias: 'todos', local: 'bela_vista' };
  const estado = (() => {
    const q = new URLSearchParams(location.search);
    const niveis = (q.get('nivel') || '').split(',').filter((n) => NIVEIS.includes(n));
    return {
      faixa: FAIXAS.includes(q.get('faixa')) ? q.get('faixa') : PADRAO.faixa,
      niveis: new Set(q.has('nivel') ? niveis : PADRAO.niveis),
      lugares: q.get('lugares') in LUGARES_FILTRO ? q.get('lugares') : PADRAO.lugares,
      roubo: q.get('roubo') in ROUBO ? q.get('roubo') : PADRAO.roubo,
      dias: ['todos', 'uteis', 'fim'].includes(q.get('dias')) ? q.get('dias') : PADRAO.dias,
      lugar: POR_CODIGO.get(q.get('local')) || POR_CODIGO.get(PADRAO.local) || D.lugares[0],
    };
  })();
  function gravarURL() {
    const q = new URLSearchParams(location.search);
    const pares = {
      faixa: estado.faixa === PADRAO.faixa ? null : estado.faixa,
      nivel: estado.niveis.size === 3 ? null : NIVEIS.filter((n) => estado.niveis.has(n)).join(','),
      lugares: estado.lugares === 'todos' ? null : estado.lugares,
      roubo: estado.roubo === 'todos' ? null : estado.roubo,
      dias: estado.dias === 'todos' ? null : estado.dias,
      local: estado.lugar.codigo === PADRAO.local ? null : estado.lugar.codigo,
    };
    for (const [k, v] of Object.entries(pares)) { if (v === null) q.delete(k); else q.set(k, v); }
    const busca = q.toString();
    history.replaceState(null, '', `${location.pathname}${busca ? `?${busca}` : ''}${location.hash}`);
  }

  const noLugar = (l) => estado.lugares === 'todos' || (estado.lugares === 'capital' ? l.tipo !== 'municipio' : l.tipo === 'municipio');
  const visivel = (l) => noLugar(l) && estado.niveis.has(l.faixas[estado.faixa].nivel);
  const taxaDe = (l, f = estado.faixa) => l.faixas[f][ROUBO[estado.roubo].campo];
  const filtrosPadrao = () => estado.niveis.size === 3 && estado.lugares === 'todos' && estado.roubo === 'todos';

  // Dica
  const dica = $('#dica');
  dica.hidden = false;
  function mostrarDica(html, x, y) {
    dica.innerHTML = html;
    dica.classList.add('on');
    const r = dica.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    dica.style.left = `${Math.max(8, left)}px`;
    dica.style.top = `${Math.max(8, top)}px`;
  }
  const esconderDica = () => dica.classList.remove('on');
  // no celular o toque não gera "sair de cima": a dica some quando a página rola
  addEventListener('scroll', esconderDica, { passive: true });
  function comDica(alvo, html) {
    alvo.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') mostrarDica(html(), e.clientX, e.clientY); });
    alvo.addEventListener('pointerleave', esconderDica);
    alvo.addEventListener('focus', () => { const r = alvo.getBoundingClientRect(); mostrarDica(html(), r.right, r.top); });
    alvo.addEventListener('blur', esconderDica);
  }
  function tabela(cab, linhas, numericas = []) {
    const c = (i) => (numericas.includes(i) ? ' class="n"' : '');
    return `<div class="rolar"><table><thead><tr>${cab.map((h, i) => `<th scope="col"${c(i)}>${h}</th>`).join('')}</tr></thead><tbody>${linhas
      .map((l) => `<tr>${l.map((v, i) => `<td${c(i)}>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // Seletor segmentado
  function segmentado(caixa, opcoes, inicial, aoMudar) {
    caixa.innerHTML = '<span class="seg-ind" aria-hidden="true"></span>';
    const ind = caixa.firstChild;
    let valor = inicial;
    const botoes = opcoes.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.valor = o.valor;
      b.innerHTML = o.html || o.rotulo;
      if (o.titulo) b.title = o.titulo;
      b.addEventListener('click', () => definir(o.valor, true));
      caixa.appendChild(b);
      return b;
    });
    function mover() {
      const b = botoes.find((x) => x.dataset.valor === valor);
      ind.style.width = `${b.offsetWidth}px`;
      ind.style.transform = `translateX(${b.offsetLeft}px)`;
    }
    function definir(v, avisar) {
      if (avisar && v === valor) return;
      valor = v;
      botoes.forEach((b) => { const on = b.dataset.valor === v; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      mover();
      if (avisar) aoMudar(v);
    }
    caixa.addEventListener('keydown', (e) => {
      const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!passo) return;
      e.preventDefault();
      const i = opcoes.findIndex((o) => o.valor === valor);
      const novo = opcoes[(i + passo + opcoes.length) % opcoes.length].valor;
      definir(novo, true);
      botoes.find((b) => b.dataset.valor === novo).focus();
    });
    if ('ResizeObserver' in window) new ResizeObserver(mover).observe(caixa);
    definir(inicial, false);
    requestAnimationFrame(() => requestAnimationFrame(() => caixa.classList.add('pronto')));
    return { definir };
  }

  // Título e números
  const altosPorFaixa = Object.fromEntries(FAIXAS.map((f) => [f, D.lugares.filter((l) => l.faixas[f].nivel === 'alto').length]));
  const faixaMais = FAIXAS.reduce((a, b) => (altosPorFaixa[b] > altosPorFaixa[a] ? b : a));
  const faixaMenos = FAIXAS.reduce((a, b) => (altosPorFaixa[b] < altosPorFaixa[a] ? b : a));
  $('#achado').innerHTML = `${maiuscula(FRASE_FAIXA[faixaMais])}, <b>${altosPorFaixa[faixaMais]} dos ${N.lugares} lugares</b> ficam em risco alto; ${FRASE_FAIXA[faixaMenos]}, ${altosPorFaixa[faixaMenos]}. Previsão feita com os roubos registrados pela SSP-SP de ${PERIODO}.`;
  $('#carimbo').textContent = `Dados até ${mesAno(N.periodo.fim)}`;
  $('#origem-periodo').textContent = `registros de ${PERIODO}`;
  const nTipo = (t) => D.lugares.filter((l) => l.tipo === t).length;
  $('#k-roubos').textContent = nf.format(N.roubos);
  $('#k-roubos-sub').textContent = `de ${PERIODO}`;
  $('#k-lugares').textContent = nf.format(N.lugares);
  $('#k-lugares-sub').textContent = `${nTipo('distrito') + nTipo('bairro')} na capital e ${nTipo('municipio')} cidades vizinhas`;
  $('#k-noite').textContent = pct(N.parte_noite);
  $('#k-acerto').textContent = pct(N.acuracia);
  $('#k-acerto-sub').textContent = `F1 macro de ${nf3.format(N.f1)}`;

  // Mapa: radar com anéis de distância até a Sé
  const SE = D.lugares.find((l) => l.nome === 'Sé') || { lat: -23.5505, lng: -46.634 };
  const ZMAX = 8;
  // Web Mercator em unidades de mundo (0 a 1), a mesma projeção dos blocos do mapa de fundo
  const mercX = (lng) => (lng + 180) / 360;
  const mercY = (lat) => { const f = lat * Math.PI / 180; return (1 - Math.log(Math.tan(f) + 1 / Math.cos(f)) / Math.PI) / 2; };
  const KM_MUNDO = 40075.017 * Math.cos(SE.lat * Math.PI / 180);  // km por unidade de mundo na latitude da Sé
  const lats = D.lugares.map((l) => l.lat), lngs = D.lugares.map((l) => l.lng);
  const B = { x0: mercX(Math.min(...lngs)), x1: mercX(Math.max(...lngs)), y0: mercY(Math.max(...lats)), y1: mercY(Math.min(...lats)) };
  const maxPorTipo = Object.fromEntries(Object.entries(ROUBO).map(([k, r]) => [k, Math.max(...D.lugares.flatMap((l) => FAIXAS.map((f) => l.faixas[f][r.campo])))]));

  const MP = {
    caixa: $('#g-mapa'), W: 0, H: 0, S: 1, ox: 0, oy: 0, base: new Map(), z: 1, tx: 0, ty: 0,
    svg: null, gFundo: null, gVelhos: null, blocos: new Map(), zBloco: -1, gAneis: null, gPontos: null, gRotulos: null, anelSel: null, pontos: new Map(),
    raio: new Map(), rotulos: [], pararVista: () => {}, pararRaios: () => {}, sujo: false,
  };

  function raioAlvo(l) {
    const esc2 = Math.min(1, MP.W / 700);
    if (!visivel(l)) return 2.5;
    return (3 + 15 * Math.sqrt(taxaDe(l) / maxPorTipo[estado.roubo])) * (0.6 + 0.4 * esc2);
  }
  const naTela = (cod) => { const b = MP.base.get(cod); return [b[0] * MP.z + MP.tx, b[1] * MP.z + MP.ty]; };

  function montarMapa() {
    const caixa = MP.caixa;
    const W = Math.max(280, Math.round(caixa.clientWidth));
    const proporcao = MP.W ? W / MP.W : 1;
    MP.W = W;
    const PAD = W < 500 ? 16 : 28;
    const H = MP.H = Math.round(Math.min(W * 0.72, 500));
    const S = MP.S = Math.min((W - 2 * PAD) / (B.x1 - B.x0), (H - 2 * PAD) / (B.y1 - B.y0));
    const ox = MP.ox = (W - (B.x1 - B.x0) * S) / 2, oy = MP.oy = (H - (B.y1 - B.y0) * S) / 2;
    const proj = (lat, lng) => [ox + (mercX(lng) - B.x0) * S, oy + (mercY(lat) - B.y0) * S];
    for (const l of D.lugares) MP.base.set(l.codigo, proj(l.lat, l.lng));
    MP.base.set('_se', proj(SE.lat, SE.lng));
    MP.tx *= proporcao; MP.ty *= proporcao;

    MP.svg?.remove();
    const svg = MP.svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    caixa.prepend(svg);
    MP.gVelhos = el('g', { class: 'fundo' }, svg);
    MP.gFundo = el('g', { class: 'fundo' }, svg);
    MP.blocos.clear(); MP.zBloco = -1;
    MP.gAneis = el('g', {}, svg);
    MP.gPontos = el('g', {}, svg);
    MP.anelSel = el('circle', { class: 'sel-anel' }, svg);
    MP.gRotulos = el('g', { class: 'rotulos' }, svg);
    MP.pontos.clear();
    for (const l of D.lugares) {
      const c = el('circle', { class: 'ponto', stroke: 'var(--surface)', 'stroke-width': 1.5, 'data-codigo': l.codigo }, MP.gPontos);
      c.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') realcar(l, true); });
      c.addEventListener('pointerleave', () => realcar(l, false));
      comDica(c, () => {
        const p = l.faixas[estado.faixa];
        return `<b>${esc(l.nome)}</b>Risco ${NOME_NIVEL[p.nivel].toLowerCase()}, pontuação ${Math.round(p.score * 100)} de 100<br>${nf1.format(taxaDe(l))} ${ROUBO[estado.roubo].frase} por dia ${FRASE_FAIXA[estado.faixa]}`;
      });
      MP.pontos.set(l.codigo, c);
      if (!MP.raio.has(l.codigo)) MP.raio.set(l.codigo, raioAlvo(l));
    }
    prenderVista();
    ligarGestos(svg);
    aplicarFiltrosMapa(false);
  }

  function desenharAneis() {
    const g = MP.gAneis;
    g.innerHTML = '';
    const [cx, cy] = naTela('_se');
    const kmPx = (MP.S / KM_MUNDO) * MP.z;
    el('line', { x1: cx, x2: cx, y1: 0, y2: MP.H, class: 'eixo' }, g);
    el('line', { x1: 0, x2: MP.W, y1: cy, y2: cy, class: 'eixo' }, g);
    const passo = MP.z >= 5 ? 2 : MP.z >= 2.2 ? 5 : 10;
    const longe = Math.hypot(Math.max(cx, MP.W - cx), Math.max(cy, MP.H - cy));
    for (let km = passo; km * kmPx <= longe; km += passo) {
      const r = km * kmPx;
      el('circle', { cx, cy, r, class: 'anel' }, g);
      if (cy + r - 5 < MP.H && cy + r > 10) texto(g, cx + 5, cy + r - 5, `${km} km`, { class: 'km' });
    }
    if (cy > 30 && cy < MP.H) texto(g, cx + 6, 14, 'N', { class: 'km' });
  }

  // Mapa de fundo: blocos do OpenStreetMap, em cinza pelo CSS (no tema escuro, invertidos).
  // Ao trocar de nível de zoom, os blocos antigos ficam embaixo até os novos carregarem.
  const urlBloco = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const posBloco = (b, img) => {
    const n = 2 ** b.z, lado = (MP.S * MP.z) / n;
    img.setAttribute('x', ((MP.ox + (b.x / n - B.x0) * MP.S) * MP.z + MP.tx).toFixed(1));
    img.setAttribute('y', ((MP.oy + (b.y / n - B.y0) * MP.S) * MP.z + MP.ty).toFixed(1));
    img.setAttribute('width', (lado + 0.6).toFixed(1));  // um pouco de sobra esconde a costura entre blocos
    img.setAttribute('height', (lado + 0.6).toFixed(1));
  };
  function desenharFundo() {
    const esc = MP.S * MP.z;  // pixels de tela por unidade de mundo
    const z = limitar(Math.round(Math.log2(esc / 256)), 0, 19), n = 2 ** z;
    if (z !== MP.zBloco) {
      MP.gVelhos.replaceChildren(...MP.gFundo.children);
      MP.blocos.clear();
      MP.zBloco = z;
    }
    const mundo = (sx, sy) => [B.x0 + ((sx - MP.tx) / MP.z - MP.ox) / MP.S, B.y0 + ((sy - MP.ty) / MP.z - MP.oy) / MP.S];
    const [xa, ya] = mundo(0, 0), [xb, yb] = mundo(MP.W, MP.H);
    const i0 = limitar(Math.floor(xa * n), 0, n - 1), i1 = limitar(Math.floor(xb * n), 0, n - 1);
    const j0 = limitar(Math.floor(ya * n), 0, n - 1), j1 = limitar(Math.floor(yb * n), 0, n - 1);
    const precisa = new Set();
    for (let x = i0; x <= i1; x++) for (let y = j0; y <= j1; y++) {
      const chave = `${z}/${x}/${y}`;
      precisa.add(chave);
      if (MP.blocos.has(chave)) continue;
      const img = el('image', { preserveAspectRatio: 'none' }, MP.gFundo);
      img._b = { z, x, y };
      const pronto = () => { img._ok = true; if ([...MP.blocos.values()].every((i) => i._ok)) MP.gVelhos.replaceChildren(); };
      img.addEventListener('load', pronto);
      img.addEventListener('error', pronto);  // sem rede, os pontos ficam sobre o fundo liso
      img.setAttribute('href', urlBloco(z, x, y));
      MP.blocos.set(chave, img);
    }
    for (const [chave, img] of MP.blocos) if (!precisa.has(chave)) { img.remove(); MP.blocos.delete(chave); }
    for (const img of MP.blocos.values()) posBloco(img._b, img);
    for (const img of MP.gVelhos.children) posBloco(img._b, img);
  }

  function render() {
    MP.sujo = false;
    desenharFundo();
    desenharAneis();
    for (const l of D.lugares) {
      const c = MP.pontos.get(l.codigo);
      const [x, y] = naTela(l.codigo);
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', MP.raio.get(l.codigo).toFixed(2));
    }
    const sel = estado.lugar, [sx, sy] = naTela(sel.codigo);
    MP.anelSel.setAttribute('cx', sx.toFixed(1));
    MP.anelSel.setAttribute('cy', sy.toFixed(1));
    MP.anelSel.setAttribute('r', (MP.raio.get(sel.codigo) + 4).toFixed(1));
    for (const r of MP.rotulos) {
      const [x, y] = naTela(r.l.codigo), raio = MP.raio.get(r.l.codigo);
      r.t.setAttribute('x', (r.esquerda ? x - raio - 5 - r.w : x + raio + 5).toFixed(1));
      r.t.setAttribute('y', (y + 4.5).toFixed(1));
    }
    $('#z-menos').disabled = MP.z <= 1.001;
    $('#z-tudo').disabled = MP.z <= 1.001 && Math.abs(MP.tx) < 1 && Math.abs(MP.ty) < 1;
    $('#z-mais').disabled = MP.z >= ZMAX - 0.001;
    MP.svg.style.touchAction = 'none';
  }
  const agendar = () => { if (!MP.sujo) { MP.sujo = true; requestAnimationFrame(render); } };

  // nomes que cabem sem se sobrepor; mais zoom, mais nomes
  function escolherRotulos() {
    MP.gRotulos.innerHTML = '';
    MP.rotulos = [];
    const caixas = [];
    const W = MP.W, H = MP.H;
    const tentar = (l, cls) => {
      const w = l.nome.length * 7.4, raio = MP.raio.get(l.codigo), [x, y] = naTela(l.codigo);
      if (x < 0 || x > W || y < 8 || y > H - 4) return false;
      let esquerda = false, x0 = x + raio + 5;
      if (x0 + w > W - 50) { esquerda = true; x0 = x - raio - 5 - w; }
      if (x0 < 2) return false;
      if (caixas.some((b) => x0 < b.x + b.w + 6 && x0 + w + 6 > b.x && Math.abs(y - b.y) < 18)) return false;
      const cobre = D.lugares.some((o) => {
        if (o === l || !visivel(o)) return false;
        const [ox, oy] = naTela(o.codigo), ro = MP.raio.get(o.codigo);
        return ox + ro > x0 && ox - ro < x0 + w && oy + ro > y - 9 && oy - ro < y + 9;
      });
      if (cobre && cls !== 'rot sel') return false;
      caixas.push({ x: x0, y, w });
      MP.rotulos.push({ l, w, esquerda, t: texto(MP.gRotulos, 0, 0, l.nome, { class: cls }) });
      return true;
    };
    tentar(estado.lugar, 'rot sel');
    const meta = Math.round((W < 500 ? 3 : 6) + 3 * (MP.z - 1));
    const ordem = D.lugares.filter((l) => visivel(l) && l !== estado.lugar).sort((a, b) => taxaDe(b) - taxaDe(a));
    let n = 0;
    for (const l of ordem) { if (n >= meta) break; if (tentar(l, 'rot')) n++; }
    render();
    MP.gRotulos.classList.remove('oculto');
  }
  const esconderRotulos = () => MP.gRotulos.classList.add('oculto');

  function aplicarFiltrosMapa(animado = true) {
    const f = estado.faixa;
    for (const l of D.lugares) {
      const c = MP.pontos.get(l.codigo);
      c.style.fill = corNivel(l.faixas[f].nivel);
      c.classList.toggle('fora', !visivel(l));
    }
    // filtrados atrás, pequenos sobre os grandes, escolhido na frente
    const ordem = [...D.lugares].sort((a, b) => (visivel(a) - visivel(b)) || raioAlvo(b) - raioAlvo(a));
    ordem.push(estado.lugar);
    for (const l of ordem) MP.gPontos.appendChild(MP.pontos.get(l.codigo));
    const de = new Map(MP.raio), para = new Map(D.lugares.map((l) => [l.codigo, raioAlvo(l)]));
    MP.pararRaios();
    esconderRotulos();
    MP.pararRaios = animar(animado ? 420 : 0, (p) => {
      for (const [cod, r1] of para) MP.raio.set(cod, lerp(de.get(cod), r1, p));
      agendar();
    }, escolherRotulos);
  }

  // arraste livre, mas sempre sobra um pedaço do mapa na tela
  const folga = () => [MP.W * 0.85, MP.H * 0.85];
  const prenderX = (tx, z) => limitar(tx, MP.W - MP.W * z - folga()[0], folga()[0]);
  const prenderY = (ty, z) => limitar(ty, MP.H - MP.H * z - folga()[1], folga()[1]);
  function prenderVista() {
    MP.z = limitar(MP.z, 1, ZMAX);
    MP.tx = prenderX(MP.tx, MP.z);
    MP.ty = prenderY(MP.ty, MP.z);
  }
  function irPara(z, tx, ty, dur = 420) {
    const de = { z: MP.z, tx: MP.tx, ty: MP.ty };
    const zA = limitar(z, 1, ZMAX);
    const alvo = { z: zA, tx: prenderX(tx, zA), ty: prenderY(ty, zA) };
    MP.pararVista();
    esconderRotulos();
    MP.pararVista = animar(dur, (p) => {
      MP.z = lerp(de.z, alvo.z, p); MP.tx = lerp(de.tx, alvo.tx, p); MP.ty = lerp(de.ty, alvo.ty, p);
      agendar();
    }, escolherRotulos);
  }
  function zoomEm(fator, sx = MP.W / 2, sy = MP.H / 2, animado = true) {
    const z = limitar(MP.z * fator, 1, ZMAX);
    const bx = (sx - MP.tx) / MP.z, by = (sy - MP.ty) / MP.z;
    if (animado) irPara(z, sx - bx * z, sy - by * z);
    else { MP.z = z; MP.tx = sx - bx * z; MP.ty = sy - by * z; prenderVista(); agendar(); }
  }
  function voarPara(l) {
    const z = Math.max(MP.z, 3), b = MP.base.get(l.codigo);
    irPara(z, MP.W / 2 - b[0] * z, MP.H / 2 - b[1] * z, 620);
  }

  function realcar(l, on) {
    MP.svg.classList.toggle('realce', on);
    MP.pontos.get(l.codigo).classList.toggle('ativo', on);
    document.querySelectorAll(`.ranking li[data-codigo="${l.codigo}"]`).forEach((li) => li.classList.toggle('realce', on));
  }

  function ligarGestos(svg) {
    const ptrs = new Map();
    let inicio = null, arrastou = false, alvo = null, pinca = null;
    const local = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * (MP.W / r.width), (e.clientY - r.top) * (MP.H / r.height)]; };
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      ptrs.set(e.pointerId, local(e));
      alvo = e.target;
      arrastou = false;
      if (ptrs.size === 1) inicio = { p: local(e), tx: MP.tx, ty: MP.ty };
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinca = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: MP.z, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], tx: MP.tx, ty: MP.ty };
      }
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, local(e));
      if (ptrs.size === 2 && pinca) {
        const [a, b] = [...ptrs.values()];
        const z = limitar(pinca.z * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinca.d), 1, ZMAX);
        const bx = (pinca.m[0] - pinca.tx) / pinca.z, by = (pinca.m[1] - pinca.ty) / pinca.z;
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        MP.pararVista(); esconderDica(); esconderRotulos();
        MP.z = z; MP.tx = m[0] - bx * z; MP.ty = m[1] - by * z;
        arrastou = true;
        prenderVista(); agendar();
        return;
      }
      if (!inicio) return;
      const [x, y] = local(e);
      if (!arrastou && Math.hypot(x - inicio.p[0], y - inicio.p[1]) < 5) return;
      if (!arrastou) { arrastou = true; MP.caixa.classList.add('arrastando'); esconderRotulos(); esconderDica(); MP.pararVista(); }
      MP.tx = inicio.tx + x - inicio.p[0];
      MP.ty = inicio.ty + y - inicio.p[1];
      prenderVista(); agendar();
    });
    const soltar = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinca = null;
      if (ptrs.size === 1) { const [p] = [...ptrs.values()]; inicio = { p, tx: MP.tx, ty: MP.ty }; return; }
      MP.caixa.classList.remove('arrastando');
      if (arrastou) escolherRotulos();
      else if (e.type === 'pointerup' && alvo?.dataset?.codigo) selecionar(POR_CODIGO.get(alvo.dataset.codigo));
      inicio = null;
    };
    svg.addEventListener('pointerup', soltar);
    svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const fator = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025));
      if ((fator < 1 && MP.z <= 1.001) || (fator > 1 && MP.z >= ZMAX - 0.001)) return;
      const [x, y] = local(e);
      MP.pararVista(); esconderRotulos(); esconderDica();
      zoomEm(fator, x, y, false);
      clearTimeout(svg._rot);
      svg._rot = setTimeout(escolherRotulos, 160);
    }, { passive: false });
    svg.addEventListener('dblclick', (e) => { e.preventDefault(); const [x, y] = local(e); zoomEm(e.shiftKey ? 0.5 : 2, x, y); });
  }

  $('#z-mais').addEventListener('click', () => zoomEm(2));
  $('#z-menos').addEventListener('click', () => zoomEm(0.5));
  $('#z-tudo').addEventListener('click', () => irPara(1, 0, 0));
  MP.caixa.addEventListener('keydown', (e) => {
    if (e.target !== MP.caixa) return;
    const p = 60;
    const acoes = {
      '+': () => zoomEm(2), '=': () => zoomEm(2), '-': () => zoomEm(0.5), 0: () => irPara(1, 0, 0),
      ArrowLeft: () => irPara(MP.z, MP.tx + p, MP.ty, 200), ArrowRight: () => irPara(MP.z, MP.tx - p, MP.ty, 200),
      ArrowUp: () => irPara(MP.z, MP.tx, MP.ty + p, 200), ArrowDown: () => irPara(MP.z, MP.tx, MP.ty - p, 200),
    };
    if (acoes[e.key]) { e.preventDefault(); acoes[e.key](); }
  });

  function textosMapa() {
    const f = estado.faixa;
    const vis = D.lugares.filter(visivel);
    const r = ROUBO[estado.roubo];
    $('#nota-mapa').textContent = `${maiuscula(FRASE_FAIXA[f])}, ${HORAS_FAIXA[f]}. Cor é o nível previsto para todos os roubos; tamanho, os ${r.frase} por dia no último ano. Anéis medem a distância até a Sé.`;
    $('#contagem').innerHTML = `${vis.length} <span>de ${D.lugares.length} lugares no mapa</span>`;
    $('#dica-uso').textContent = matchMedia('(pointer: coarse)').matches
      ? 'Use dois dedos para aproximar e arrastar; toque num ponto para ver o lugar.'
      : 'Arraste para mover; role o mouse sobre o mapa para aproximar ou afastar; clique num ponto para ver o lugar.';
    const cont = Object.fromEntries(NIVEIS.map((n) => [n, D.lugares.filter((l) => noLugar(l) && l.faixas[f].nivel === n).length]));
    MP.caixa.setAttribute('aria-label', `Mapa de risco ${FRASE_FAIXA[f]}: ${cont.alto} lugares em risco alto, ${cont.medio} em médio e ${cont.baixo} em baixo. Use as setas para mover e mais ou menos para aproximar.`);
    for (const n of NIVEIS) document.querySelector(`#f-nivel [data-nivel="${n}"] .qt`).textContent = cont[n];
    const ordem = [...vis].sort((a, b) => taxaDe(b) - taxaDe(a));
    $('#t-mapa-tab').innerHTML = ordem.length ? tabela(
      ['Lugar', 'Tipo', 'Nível', 'Pontuação', `${maiuscula(r.frase)} por dia`],
      ordem.map((l) => [esc(l.nome), TIPO[l.tipo], NOME_NIVEL[l.faixas[f].nivel], Math.round(l.faixas[f].score * 100), nf1.format(taxaDe(l))]),
      [3, 4]
    ) : '<p class="nota">Nenhum lugar com esses filtros.</p>';
  }

  // Filtros
  $('#f-nivel').innerHTML = NIVEIS.map((n) => `<button type="button" class="chip" data-nivel="${n}" aria-pressed="${estado.niveis.has(n)}"><span class="pt" style="background:${corNivel(n)}"></span>${NOME_NIVEL[n]} <span class="qt"></span></button>`).join('');
  $('#f-nivel').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const n = b.dataset.nivel;
    if (estado.niveis.has(n)) estado.niveis.delete(n); else estado.niveis.add(n);
    b.setAttribute('aria-pressed', estado.niveis.has(n));
    mudouFiltro();
  });
  const fLugar = $('#f-lugar'), fRoubo = $('#f-roubo');
  fLugar.value = estado.lugares;
  fRoubo.value = estado.roubo;
  fLugar.addEventListener('change', () => { estado.lugares = fLugar.value; mudouFiltro(); });
  fRoubo.addEventListener('change', () => { estado.roubo = fRoubo.value; mudouFiltro(); });
  $('#limpar').addEventListener('click', limparFiltros);
  function limparFiltros() {
    estado.niveis = new Set(PADRAO.niveis);
    estado.lugares = 'todos';
    estado.roubo = 'todos';
    fLugar.value = 'todos';
    fRoubo.value = 'todos';
    document.querySelectorAll('#f-nivel .chip').forEach((b) => b.setAttribute('aria-pressed', 'true'));
    mudouFiltro();
  }
  function marcarFiltros() {
    fLugar.parentElement.classList.toggle('ativo', estado.lugares !== 'todos');
    fRoubo.parentElement.classList.toggle('ativo', estado.roubo !== 'todos');
    $('#limpar').hidden = filtrosPadrao();
  }
  function mudouFiltro() {
    marcarFiltros();
    aplicarFiltrosMapa();
    textosMapa();
    desenharTrilho();
    atualizarLugar();
    gravarURL();
  }

  // Maior risco e lista
  const QTD_LISTA = 7;
  function desenharTrilho() {
    const f = estado.faixa;
    const porRoubo = estado.roubo !== 'todos';
    const ordem = D.lugares.filter(visivel).sort((a, b) => (porRoubo ? taxaDe(b) - taxaDe(a) : b.faixas[f].score - a.faixas[f].score || b.faixas[f].taxa - a.faixas[f].taxa));
    const recorte = estado.lugares === 'todos' ? '' : `, entre ${LUGARES_FILTRO[estado.lugares]}`;
    $('#d-quando').textContent = (f === FAIXA_AGORA ? `Agora, ${FRASE_FAIXA[f]}` : maiuscula(FRASE_FAIXA[f])) + recorte;
    const ol = $('#ranking');
    if (!ordem.length) {
      $('#d-titulo').textContent = 'Nenhum lugar com esses filtros';
      $('#d-selo').innerHTML = '';
      $('#d-nota').innerHTML = '<button class="limpar" type="button" data-limpar>Limpar filtros</button>';
      $('#t-lista').textContent = '';
      ol.innerHTML = '';
      return;
    }
    const pior = ordem[0], p = pior.faixas[f];
    $('#d-titulo').textContent = porRoubo ? `Mais ${ROUBO[estado.roubo].frase}: ${pior.nome}` : `Maior risco: ${pior.nome}`;
    $('#d-selo').innerHTML = selo(p.nivel);
    $('#d-nota').textContent = `Pontuação ${Math.round(p.score * 100)} de 100, segundo o modelo. ${nf1.format(taxaDe(pior))} ${ROUBO[estado.roubo].frase} por dia no último ano.`;
    $('#t-lista').textContent = porRoubo ? `Mais ${ROUBO[estado.roubo].frase} ${FRASE_FAIXA[f]}` : `Maiores riscos ${FRASE_FAIXA[f]}`;
    ol.innerHTML = '';
    const itens = ordem.slice(1, 1 + QTD_LISTA).map((l) => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      li.dataset.codigo = l.codigo;
      li.setAttribute('aria-current', l === estado.lugar);
      const sub = porRoubo ? `${nf1.format(taxaDe(l))} por dia, ${TIPO[l.tipo].split(' ')[0].toLowerCase()}` : TIPO[l.tipo];
      li.innerHTML = `<span class="nm">${esc(l.nome)}</span><span class="sub">${sub}</span>${selo(l.faixas[f].nivel)}`;
      li.addEventListener('click', () => selecionar(l, { voar: true }));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(l, { voar: true }); } });
      li.addEventListener('pointerenter', () => realcar(l, true));
      li.addEventListener('pointerleave', () => realcar(l, false));
      ol.appendChild(li);
      return li;
    });
    entrar(itens);
  }
  $('#d-nota').addEventListener('click', (e) => { if (e.target.closest('[data-limpar]')) limparFiltros(); });

  // Consulta de um lugar
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  $('#lista-lugares').innerHTML = [...D.lugares].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((l) => `<option value="${esc(l.nome)}">`).join('');
  $('#busca').addEventListener('input', (e) => {
    const l = D.lugares.find((x) => norm(x.nome) === norm(e.target.value));
    if (l) selecionar(l, { voar: true });
  });
  $('#l-faixas').innerHTML = FAIXAS.map((f) => `<li data-faixa="${f}">
      <span class="nome">${NOME_FAIXA[f]} <small>${HORAS_FAIXA[f]}</small>${f === FAIXA_AGORA ? '<span class="tag">Agora</span>' : ''}</span>
      <span class="selo-caixa"></span>
      <span class="medidor" role="meter" aria-valuemin="0" aria-valuemax="100" aria-label="Pontuação ${NOME_FAIXA[f].toLowerCase()}"><span style="width:0"></span></span>
      <span class="det"></span>
    </li>`).join('');
  function atualizarLugar(piscando = false) {
    const l = estado.lugar;
    $('#l-nome').textContent = l.nome;
    $('#l-tipo').textContent = `${TIPO[l.tipo]}. ${nf.format(l.roubos)} roubos registrados de ${PERIODO}.`;
    for (const f of FAIXAS) {
      const p = l.faixas[f], li = document.querySelector(`#l-faixas [data-faixa="${f}"]`);
      li.querySelector('.selo-caixa').innerHTML = selo(p.nivel);
      const m = li.querySelector('.medidor');
      m.setAttribute('aria-valuenow', Math.round(p.score * 100));
      m.firstElementChild.style.width = `${(p.score * 100).toFixed(0)}%`;
      m.firstElementChild.style.backgroundColor = corNivel(p.nivel);
      li.querySelector('.det').innerHTML = `Pontuação <b>${Math.round(p.score * 100)}</b> de 100<br><b>${nf1.format(taxaDe(l, f))}</b> ${ROUBO[estado.roubo].frase} por dia no último ano`;
    }
    if (piscando) [$('#l-nome'), ...document.querySelectorAll('#l-faixas .selo-caixa, #l-faixas .det')].forEach(piscar);
  }

  function selecionar(l, { rolar = false, voar = false } = {}) {
    if (!l) return;
    const mudou = l !== estado.lugar;
    estado.lugar = l;
    if (document.activeElement !== $('#busca')) $('#busca').value = l.nome;
    atualizarLugar(mudou);
    document.querySelectorAll('.ranking li').forEach((li) => li.setAttribute('aria-current', li.dataset.codigo === l.codigo));
    MP.gPontos.appendChild(MP.pontos.get(l.codigo));
    if (voar) voarPara(l); else { render(); escolherRotulos(); }
    gravarURL();
    if (AG) desenharAgora(mudou);
    if (rolar) $('.lugar').scrollIntoView({ behavior: reduzir.matches ? 'auto' : 'smooth', block: 'nearest' });
  }

  // Faixa do dia
  segmentado($('#faixas'), FAIXAS.map((f) => ({
    valor: f, titulo: HORAS_FAIXA[f] + (f === FAIXA_AGORA ? ', agora' : ''),
    html: NOME_FAIXA[f] + (f === FAIXA_AGORA ? '<span class="agora" aria-hidden="true"></span><span class="sr">, agora</span>' : ''),
  })), estado.faixa, (f) => {
    estado.faixa = f;
    aplicarFiltrosMapa();
    textosMapa();
    desenharTrilho();
    gravarURL();
    if (AG) { AGR.faixa = f; AGR.seg.definir(f, false); desenharAgora(true); }
  });

  // Roubos por hora
  // dias de cada dia da semana no período (segunda = 0)
  const DIAS_NO_PERIODO = (() => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    const fim = new Date(`${N.periodo.fim}T12:00:00`);
    for (let d = new Date(`${N.periodo.inicio}T12:00:00`); d <= fim; d.setDate(d.getDate() + 1)) c[(d.getDay() + 6) % 7]++;
    return c;
  })();
  const DIAS_DO_FILTRO = { todos: [0, 1, 2, 3, 4, 5, 6], uteis: [0, 1, 2, 3, 4], fim: [5, 6] };
  const NOME_DIAS = { todos: 'por dia', uteis: 'por dia útil', fim: 'por dia de fim de semana' };
  function mediaPorHora(filtro) {
    const ds = DIAS_DO_FILTRO[filtro], ndias = ds.reduce((s, d) => s + DIAS_NO_PERIODO[d], 0);
    return Array.from({ length: 24 }, (_, h) => ds.reduce((s, d) => s + D.horas[d][h], 0) / ndias);
  }
  const MEDIAS = Object.fromEntries(Object.keys(DIAS_DO_FILTRO).map((k) => [k, mediaPorHora(k)]));
  // escala fixa: o eixo não pula ao trocar o filtro
  const TETO_HORAS = Math.ceil(Math.max(...Object.values(MEDIAS).flat()) / 5) * 5;
  const HR = { barras: [], textosFaixa: [], atual: MEDIAS[estado.dias].slice(), parar: () => {} };

  function montarHoras() {
    const caixa = $('#g-horas');
    caixa.innerHTML = '';
    const W = Math.max(280, Math.round(caixa.clientWidth)), H = 250;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, caixa);
    const L = 34, R = 4, T = 40, Bm = 22, iw = W - L - R, ih = H - T - Bm, bw = iw / 24;
    Object.assign(HR, { T, ih });
    HR.textosFaixa = FAIXAS.map((f, i) => {
      if (i % 2 === 1) el('rect', { x: L + i * 6 * bw, y: 0, width: 6 * bw, height: T + ih, fill: 'var(--surface-2)', opacity: 0.55, rx: 6 }, svg);
      texto(svg, L + i * 6 * bw + 6, 16, 6 * bw < 84 && f === 'madrugada' ? 'Madrug.' : NOME_FAIXA[f], { class: 'forte' });
      return texto(svg, L + i * 6 * bw + 6, 31, '');
    });
    for (let v = 0; v <= TETO_HORAS; v += TETO_HORAS / 5) {
      const y = T + ih - (v / TETO_HORAS) * ih;
      el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grade' }, svg);
      texto(svg, L - 8, y + 4, nf.format(v), { 'text-anchor': 'end' });
    }
    const gap = Math.max(1.5, bw * 0.18);
    HR.barras = Array.from({ length: 24 }, (_, h) => {
      const b = el('rect', { x: L + h * bw + gap / 2, width: bw - gap, class: 'barra', tabindex: 0, 'aria-label': `${h}h` }, svg);
      comDica(b, () => `<b>${h}h às ${h + 1}h</b>Média de ${nf1.format(HR.atual[h])} roubos ${NOME_DIAS[estado.dias]}`);
      b.addEventListener('pointerenter', () => ligarColuna(h, true));
      b.addEventListener('pointerleave', () => ligarColuna(h, false));
      b.addEventListener('focus', () => ligarColuna(h, true));
      b.addEventListener('blur', () => ligarColuna(h, false));
      if (h % 3 === 0) texto(svg, L + h * bw + bw / 2, H - 5, `${h}h`, { 'text-anchor': 'middle' });
      return b;
    });
    pintarHoras();
  }
  function pintarHoras() {
    const v = HR.atual, pico = v.indexOf(Math.max(...v)), soma = v.reduce((a, b) => a + b, 0);
    HR.barras.forEach((b, h) => {
      const alt = Math.max(0, (v[h] / TETO_HORAS) * HR.ih);
      b.setAttribute('y', (HR.T + HR.ih - alt).toFixed(1));
      b.setAttribute('height', alt.toFixed(1));
      b.setAttribute('fill', h === pico ? 'var(--dado)' : 'var(--dado-suave)');
    });
    HR.textosFaixa.forEach((t, i) => { t.textContent = pct(v.slice(i * 6, i * 6 + 6).reduce((a, b) => a + b, 0) / soma); });
  }
  function textosHoras() {
    const v = MEDIAS[estado.dias], pico = v.indexOf(Math.max(...v)), soma = v.reduce((a, b) => a + b, 0);
    const noite = v.slice(18).reduce((a, b) => a + b, 0) / soma;
    $('#t-horas').textContent = `O pico é às ${pico}h; a noite concentra ${pct(noite)} dos roubos`;
    $('#nota-horas').textContent = `Média de roubos ${NOME_DIAS[estado.dias]} em cada hora do registro, de ${PERIODO}.`;
    $('#g-horas').setAttribute('aria-label', `Média de roubos ${NOME_DIAS[estado.dias]} por hora. Pico às ${pico}h, com ${nf1.format(v[pico])}.`);
    $('#t-horas-tab').innerHTML = tabela(['Hora', `Média ${NOME_DIAS[estado.dias]}`, 'Parte do dia'], v.map((x, h) => [`${h}h`, nf1.format(x), pct(x / soma)]), [1, 2]);
  }
  function mudarDias(d) {
    estado.dias = d;
    const de = HR.atual.slice(), para = MEDIAS[d];
    HR.parar();
    HR.parar = animar(480, (p) => { HR.atual = de.map((v, i) => lerp(v, para[i], p)); pintarHoras(); });
    textosHoras();
    apagarDiasNoCalor();
    gravarURL();
  }
  segmentado($('#f-dias'), [
    { valor: 'todos', rotulo: 'Todos' }, { valor: 'uteis', rotulo: 'Dias úteis' }, { valor: 'fim', rotulo: 'Fim de semana' },
  ], estado.dias, mudarDias);

  // Mapa de calor
  const rampa = () => (escuro() ? ['#13263A', '#14509A', '#1F6FC8', '#4A9BE0', '#B0DCFC'] : ['#F0F7FE', '#B0DCFC', '#4A9BE0', '#1F6FC8', '#0E3B6B']);
  function mistura(cores, t) {
    const i = Math.min(cores.length - 2, Math.floor(t * (cores.length - 1)));
    const u = t * (cores.length - 1) - i;
    const a = cores[i].match(/\w\w/g).map((h) => parseInt(h, 16));
    const b = cores[i + 1].match(/\w\w/g).map((h) => parseInt(h, 16));
    return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * u)).join(',')})`;
  }
  function montarCalor() {
    const max = Math.max(...D.horas.flat());
    let dMax = 0, hMax = 0;
    D.horas.forEach((l, d) => l.forEach((v, h) => { if (v === max) { dMax = d; hMax = h; } }));
    $('#t-calor').textContent = `${DIAS_EXT[dMax]} às ${hMax}h é o horário com mais roubos`;
    $('#g-calor').setAttribute('aria-label', `Roubos por dia da semana e hora. O máximo é ${DIAS_EXT[dMax].toLowerCase()} às ${hMax}h, com ${nf.format(max)} roubos.`);
    let h = '';
    D.horas.forEach((linha, d) => {
      h += `<div class="d" data-d="${d}">${DIAS[d]}</div>`;
      linha.forEach((_, hr) => { h += `<div class="c" data-d="${d}" data-h="${hr}"></div>`; });
    });
    h += '<div></div>';
    for (let hr = 0; hr < 24; hr++) h += `<div class="h">${hr % 6 === 0 ? `${hr}h` : ''}</div>`;
    $('#g-calor').innerHTML = h;
    $('#g-calor').querySelectorAll('.c').forEach((c) => {
      const d = Number(c.dataset.d), hr = Number(c.dataset.h);
      comDica(c, () => `<b>${DIAS_EXT[d]}, ${hr}h</b>${nf.format(D.horas[d][hr])} roubos`);
    });
    pintarCalor();
    apagarDiasNoCalor();
  }
  function pintarCalor() {
    const todos = D.horas.flat(), min = Math.min(...todos), max = Math.max(...todos), cores = rampa();
    $('#g-calor').querySelectorAll('.c').forEach((c) => { c.style.backgroundColor = mistura(cores, (D.horas[c.dataset.d][c.dataset.h] - min) / (max - min)); });
    $('#escala-calor').innerHTML = `<span>Menos, ${nf.format(min)}</span><span class="passos-cor">${[0, 0.25, 0.5, 0.75, 1].map((t) => `<span style="background:${mistura(cores, t)}"></span>`).join('')}</span><span>Mais, ${nf.format(max)} roubos</span>`;
  }
  function apagarDiasNoCalor() {
    const ds = DIAS_DO_FILTRO[estado.dias];
    $('#g-calor').querySelectorAll('.c, .d').forEach((c) => c.classList.toggle('apagado', !ds.includes(Number(c.dataset.d))));
  }
  function ligarColuna(h, on) { $('#g-calor').querySelectorAll(`.c[data-h="${h}"]`).forEach((c) => c.classList.toggle('coluna', on)); }

  // Série mensal
  const MS = D.mensal;
  const soma = (linhas, chave) => linhas.reduce((s, r) => s + r[chave], 0);
  const SERIES = [
    { chave: 'celular', nome: 'Celular', cor: 'var(--dado)', larg: 2.5, on: true },
    { chave: 'veiculo', nome: 'Veículo', cor: 'var(--neutro)', larg: 2, on: true },
    ...('outros' in MS[0] ? [{ chave: 'outros', nome: 'Outros objetos', cor: 'var(--serie-3)', larg: 2, on: true }] : []),
  ];
  const totalMes = (linhas) => SERIES.reduce((t, s) => t + soma(linhas, s.chave), 0);
  const MM = { teto: 0, parar: () => {} };
  const tetoMensal = () => {
    const v = Math.max(...SERIES.filter((s) => s.on).flatMap((s) => MS.map((r) => r[s.chave])));
    const p = v > 4000 ? 2000 : 500;
    return Math.ceil(v / p) * p;
  };
  function montarMensal() {
    const n = MS.length;
    const ini = totalMes(MS.slice(0, 12)), fim = totalMes(MS.slice(-12));
    $('#t-mensal').textContent = `Os roubos caíram ${pct(1 - fim / ini)} entre 2024 e os últimos 12 meses`;
    const caixa = $('#g-mensal');
    caixa.innerHTML = '';
    const H = 260, W = Math.max(280, Math.round(caixa.clientWidth));
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, caixa);
    const L = 44, R = SERIES.length > 2 ? 112 : 64, T = 8, Bm = 24, iw = W - L - R, ih = H - T - Bm;
    Object.assign(MM, { L, T, iw, ih, n });
    MM.gGrade = el('g', {}, svg);
    const passoX = W < 520 ? 12 : 6;
    MS.forEach((r, i) => {
      const m = Number(r.mes.split('-')[1]);
      if ((m - 1) % passoX === 0) texto(svg, L + (i / (n - 1)) * iw, H - 5, `${MESES[m - 1]}/${r.mes.slice(2, 4)}`, { 'text-anchor': i === 0 ? 'start' : 'middle' });
    });
    MM.linhas = SERIES.map((s) => el('path', { class: `linha-serie${s.on ? '' : ' off'}`, fill: 'none', stroke: s.cor, 'stroke-width': s.larg, 'stroke-linejoin': 'round' }, svg));
    MM.nomes = SERIES.map((s) => texto(svg, 0, 0, s.nome, { class: `forte linha-serie${s.on ? '' : ' off'}` }));
    const cursor = el('g', { visibility: 'hidden' }, svg);
    const linha = el('line', { y1: T, y2: T + ih, stroke: 'var(--text-muted)', 'stroke-width': 1 }, cursor);
    const pts = SERIES.map((s) => el('circle', { r: 4, fill: s.cor, stroke: 'var(--surface)', 'stroke-width': 2 }, cursor));
    const area = el('rect', { x: L, y: T, width: iw, height: ih, fill: 'transparent' }, svg);
    const x = (i) => L + (i / (n - 1)) * iw, y = (v) => T + ih - (v / MM.teto) * ih;
    area.addEventListener('pointermove', (e) => {
      const cx = svg.getBoundingClientRect();
      const i = limitar(Math.round((((e.clientX - cx.left) / cx.width) * W - L) / iw * (n - 1)), 0, n - 1);
      const r = MS[i];
      cursor.setAttribute('visibility', 'visible');
      linha.setAttribute('x1', x(i)); linha.setAttribute('x2', x(i));
      SERIES.forEach((s, j) => { pts[j].setAttribute('cx', x(i)); pts[j].setAttribute('cy', y(r[s.chave])); pts[j].style.display = s.on ? '' : 'none'; });
      mostrarDica(`<b>${mesAno(r.mes)}</b>${SERIES.filter((s) => s.on).map((s) => `${s.nome}: ${nf.format(r[s.chave])}`).join('<br>')}`, e.clientX, e.clientY);
    });
    area.addEventListener('pointerleave', () => { cursor.setAttribute('visibility', 'hidden'); esconderDica(); });
    MM.teto = MM.teto || tetoMensal();
    pintarMensal();
    caixa.setAttribute('aria-label', `Roubos por mês de ${PERIODO}: ${SERIES.map((s) => s.nome.toLowerCase()).join(', ')}.`);
    $('#t-mensal-tab').innerHTML = tabela(['Mês', ...SERIES.map((s) => s.nome)], MS.map((r) => [mesAno(r.mes), ...SERIES.map((s) => nf.format(r[s.chave]))]), SERIES.map((_, i) => i + 1));
  }
  function pintarMensal() {
    const { L, T, iw, ih, n } = MM;
    const x = (i) => L + (i / (n - 1)) * iw, y = (v) => T + ih - (v / MM.teto) * ih;
    MM.gGrade.innerHTML = '';
    const passo = MM.teto > 4000 ? 2000 : 500;
    for (let v = 0; v <= MM.teto + 1; v += passo) {
      el('line', { x1: L, x2: L + iw, y1: y(v), y2: y(v), class: 'grade' }, MM.gGrade);
      texto(MM.gGrade, L - 8, y(v) + 4, nf.format(v), { 'text-anchor': 'end' });
    }
    // rótulos no fim das linhas, afastados para não encostar um no outro
    const ys = SERIES.map((s, j) => ({ j, y: y(MS[n - 1][s.chave]) + 4 })).sort((a, b) => a.y - b.y);
    ys.forEach((r, i) => { if (i && r.y - ys[i - 1].y < 15) r.y = ys[i - 1].y + 15; });
    SERIES.forEach((s, j) => {
      MM.linhas[j].setAttribute('d', MS.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r[s.chave]).toFixed(1)}`).join(''));
      MM.nomes[j].setAttribute('x', x(n - 1) + 8);
      MM.nomes[j].setAttribute('y', ys.find((r) => r.j === j).y);
    });
  }
  function alternarSerie(j) {
    const s = SERIES[j];
    if (s.on && SERIES.filter((x) => x.on).length === 1) return;
    s.on = !s.on;
    MM.linhas[j].classList.toggle('off', !s.on);
    MM.nomes[j].classList.toggle('off', !s.on);
    document.querySelector(`.serie[data-j="${j}"]`).setAttribute('aria-pressed', s.on);
    const de = MM.teto, para = tetoMensal();
    MM.parar();
    MM.parar = animar(520, (p) => { MM.teto = lerp(de, para, p); pintarMensal(); });
  }
  function desenharTipos() {
    const ultimos = `${mesAno(MS[MS.length - 12].mes)} a ${mesAno(MS[MS.length - 1].mes)}`;
    const outros = SERIES.some((s) => s.chave === 'outros')
      ? ' Outros objetos são os boletins sem celular nem veículo (bolsa, documentos, dinheiro…), da base de objetos; o modelo usa só celular e veículo. Mar/2024 está incompleto na base de objetos.'
      : '';
    $('#nota-mensal').textContent = `Roubos por mês. Um BO com celular e veículo conta nas duas linhas.${outros} A variação compara 2024 com ${ultimos}. Clique num tipo para mostrar ou esconder a linha.`;
    const linha = (s, j) => {
      const ini = soma(MS.slice(0, 12), s.chave), fim = soma(MS.slice(-12), s.chave);
      return `<tr><td><button type="button" class="serie" data-j="${j}" aria-pressed="${s.on}"><span class="pt" style="background:${s.cor}"></span>${s.nome}</button></td><td class="n"><b>${nf.format(soma(MS, s.chave))}</b></td><td class="n">${sinal(fim / ini - 1)}</td></tr>`;
    };
    $('#tipos').innerHTML = `<thead><tr><th>Roubo de</th><th class="n">Total</th><th class="n">Variação</th></tr></thead><tbody>${SERIES.map(linha).join('')}</tbody>`;
    $('#tipos').addEventListener('click', (e) => { const b = e.target.closest('.serie'); if (b) alternarSerie(Number(b.dataset.j)); });
  }

  // Modelo
  function desenharModelo() {
    const lim = D.modelo.limites;
    $('#passo-nivel').textContent = `Até o percentil 50 das células é baixo, até o 80 é médio, acima disso é alto (${nf3.format(lim.medio)} e ${nf3.format(lim.alto)} roubos por dia).`;
    const comp = D.modelo.comparacao;
    const melhorRef = Math.max(...comp.filter((c) => c.chave !== 'modelo').map((c) => c.f1));
    const dif = (comp[0].f1 - melhorRef) * 100;
    $('#t-comp').textContent = dif > 0 ? `O modelo fica ${nf1.format(dif)} ${dif >= 2 ? 'pontos' : 'ponto'} de F1 à frente da melhor referência` : 'O modelo não supera a melhor referência';
    $('#g-comp').innerHTML = `<div class="barras">${comp.map((c) => `<div><div class="l"><span>${c.nome}</span><b class="num">${nf3.format(c.f1)}</b></div>
      <div class="t"><span style="width:${(c.f1 * 100).toFixed(1)}%;background:${c.chave === 'modelo' ? 'var(--dado)' : 'var(--neutro)'}"></span></div></div>`).join('')}</div>`;
    pintarMatriz();
  }
  function pintarMatriz() {
    const m = D.modelo.matriz;
    const total = m.flat().reduce((a, b) => a + b, 0), certos = m[0][0] + m[1][1] + m[2][2];
    $('#t-matriz').textContent = `Acerta ${pct(certos / total)} das células e nunca troca baixo por alto`;
    const cores = rampa(), ordem = ['baixo', 'medio', 'alto'];
    let h = '<div></div>' + ordem.map((n) => `<div class="rot" role="columnheader">${NOME_NIVEL[n]}</div>`).join('');
    m.forEach((linha, i) => {
      const s = linha.reduce((a, b) => a + b, 0);
      h += `<div class="rot lin" role="rowheader">${NOME_NIVEL[ordem[i]]}</div>`;
      linha.forEach((v) => {
        const p = s ? v / s : 0;
        const tinta = escuro() ? (p > 0.6 ? '#0B1520' : 'var(--text)') : (p > 0.5 ? '#fff' : 'var(--text)');
        h += `<div class="cel" role="cell" style="background:${mistura(cores, p)};color:${tinta}">${nf.format(v)}<small>${pct(p)}</small></div>`;
      });
    });
    $('#g-matriz').innerHTML = h;
  }

  // Funil
  function desenharFunil() {
    const F = D.funil, max = F[0].valor;
    $('#t-funil').textContent = `De ${nf.format(F[0].valor)} linhas a ${nf.format(F[F.length - 1].valor)} roubos`;
    $('#g-funil').innerHTML = `<tbody>${F.map((f, i) => `<tr><td>${f.etapa}<span class="t"><span style="width:${(100 * f.valor / max).toFixed(1)}%;background:${i === F.length - 1 ? 'var(--dado)' : 'var(--dado-suave)'}"></span></span></td>
      <td class="n"><b>${nf.format(f.valor)}</b><small>${i ? pct(f.valor / max) + ' das linhas' : '&nbsp;'}</small></td></tr>`).join('')}</tbody>`;
  }

  // Este mês: previsão dos meses que a SSP ainda não publicou, corrigida pelos relatos do app
  const AG = D.agora;
  const diasNoMes = (iso) => { const [a, m] = iso.split('-').map(Number); return new Date(a, m, 0).getDate(); };
  const MES_ATUAL = AG && AG.previstos[AG.previstos.length - 1];
  const ADESOES = AG ? AG.relatos.filter((r) => [0.05, 0.1, 0.2].includes(r.adesao)) : [];
  const AGR = { faixa: estado.faixa, adesao: 0.1, relatos: 0, seg: null };
  // dias do mês corrente já passados (se a página for aberta depois do mês, conta o mês todo)
  function diasPassados() {
    const hoje = new Date(), [a, m] = MES_ATUAL.split('-').map(Number);
    const agora = hoje.getFullYear() * 12 + hoje.getMonth(), alvo = a * 12 + m - 1;
    return agora < alvo ? 1 : agora > alvo ? diasNoMes(MES_ATUAL) : hoje.getDate();
  }
  // média gama-Poisson: a previsão vale `peso_dias` dias de observação; os relatos, os dias já passados
  function corrigido(previsto, relatos, adesao) {
    const dias = diasNoMes(MES_ATUAL), d = diasPassados();
    const b = AG.relatos.find((r) => r.adesao === adesao).peso_dias;
    return ((previsto / dias) * b + relatos / adesao) / (b + d) * dias;
  }
  const NOME_ADESAO = (a) => `${Math.round(a * 100)}%`;

  function textosAgora() {
    const ultimo = AG.meses[AG.meses.length - 1];
    const nomes = AG.previstos.map(mesAno);
    $('#nota-agora').textContent = `A SSP publica os boletins com cerca de ${AG.atraso} meses de atraso: o último mês completo na base é ${mesAno(ultimo)}. O modelo prevê ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]} para cada lugar e faixa do dia, só com o que já foi publicado. Escolha o lugar no mapa ou na busca acima.`;
    const comp = D.modelo.comparacao, ref = comp.find((c) => c.chave === 'nivel_anterior');
    $('#qa-nivel').innerHTML = `O nível de risco de cada lugar em cada faixa do dia, que aparece no mapa e no app. No teste de 2026, acertou <b>${pct(N.acuracia)}</b> das células (F1 ${nf3.format(N.f1)}, contra ${nf3.format(ref.f1)} de repetir o ano anterior). <a href="#modelo">Como foi testado</a>`;
    const er = AG.erro_regiao;
    $('#qa-mes').innerHTML = `Quantos roubos cada lugar deve ter nos meses que a SSP ainda não publicou. No teste de 2026, errou <b>${pct(1 - er.modelo / er.media_3m)} menos</b> no total da região que a melhor regra simples (a média dos 3 últimos meses). <a href="#teste-mes">Ver o teste</a>`;
    const dez = AG.relatos.find((r) => r.adesao === 0.1);
    $('#qa-relatos').innerHTML = `Os relatos chegam na hora, sem esperar a SSP. Somados à previsão, corrigem o mês corrente: se 10% das vítimas relatarem, o erro cai <b>${pct(dez.ganho)}</b>. Quanto mais gente relata, mais a previsão acerta para todo mundo.`;
    const max = Math.max(...AG.relatos.map((r) => r.ganho));
    $('#g-ganho').innerHTML = `<div class="barras">${AG.relatos.map((r) => `<div><div class="l"><span>${NOME_ADESAO(r.adesao)} das vítimas</span><b class="num">${sinal(-r.ganho)}</b></div>
      <div class="t"><span style="width:${(100 * r.ganho / max).toFixed(1)}%;background:var(--dado)"></span></div></div>`).join('')}</div>`;
    AGR.seg = segmentado($('#a-faixas'), FAIXAS.map((f) => ({ valor: f, rotulo: NOME_FAIXA[f], titulo: HORAS_FAIXA[f] })), AGR.faixa, (f) => { AGR.faixa = f; desenharAgora(true); });
    segmentado($('#r-adesao'), ADESOES.map((r) => ({ valor: String(r.adesao), rotulo: NOME_ADESAO(r.adesao) })), String(AGR.adesao), (v) => { AGR.adesao = Number(v); desenharAgora(); });
    $('#r-relatos').addEventListener('input', (e) => { AGR.relatos = Number(e.target.value); desenharAgora(); });
  }

  function desenharAgora(piscando = false) {
    const l = estado.lugar, c = l.mes[AGR.faixa];
    const i = AG.previstos.length - 1, prev = c.prev[i];
    const corr = corrigido(prev, AGR.relatos, AGR.adesao);
    const mediaHist = c.hist.reduce((a, b) => a + b, 0) / c.hist.length;
    $('#a-lugar').textContent = `${l.nome}, ${FRASE_FAIXA[AGR.faixa]}`;
    $('#a-titulo').textContent = `Cerca de ${nf.format(Math.round(prev))} ${Math.round(prev) === 1 ? 'roubo' : 'roubos'} em ${mesAno(MES_ATUAL)}`;
    $('#a-faixa-provavel').textContent = `O provável é entre ${nf.format(c.min[i])} e ${nf.format(c.max[i])} (8 em cada 10 vezes). A média dos últimos 12 meses publicados foi ${nf1.format(mediaHist)} por mês.`;
    $('#r-n').textContent = nf.format(AGR.relatos);
    const d = diasPassados(), dias = diasNoMes(MES_ATUAL);
    const quando = d >= dias ? `em ${mesAno(MES_ATUAL)}` : `nos primeiros ${d} dias de ${mesAno(MES_ATUAL)}`;
    const rel = AGR.relatos === 0 ? 'Sem nenhum relato' : `Com ${AGR.relatos} ${AGR.relatos === 1 ? 'relato' : 'relatos'}`;
    $('#r-resultado').innerHTML = `${rel} ${quando}, a estimativa do mês passa de ${nf.format(Math.round(prev))} para <b class="num">${nf.format(Math.round(corr))}</b> roubos.`;
    $('#r-explica').textContent = AGR.relatos === 0
      ? `Se ${NOME_ADESAO(AGR.adesao)} das vítimas relatassem, a falta de relatos também diria algo, e a estimativa cai um pouco.`
      : `Cada relato aprovado conta como ${nf.format(Math.round(1 / AGR.adesao))} roubos, porque só ${NOME_ADESAO(AGR.adesao)} das vítimas relatam. A previsão pesa como ${nf.format(AG.relatos.find((r) => r.adesao === AGR.adesao).peso_dias)} dias de relatos, peso calibrado na simulação.`;
    graficoAgora(c, corr);
    if (piscando) [$('#a-titulo'), $('#a-faixa-provavel')].forEach(piscar);
  }

  function graficoAgora(c, corr) {
    const caixa = $('#g-agora');
    caixa.innerHTML = '';
    const meses = [...AG.meses, ...AG.previstos], n = meses.length;
    const valores = [...c.hist, ...c.prev];
    const H = 210, W = Math.max(280, Math.round(caixa.clientWidth));
    const L = 32, R = 8, T = 12, Bm = 24, iw = W - L - R, ih = H - T - Bm;
    const teto = Math.max(4, ...c.hist, ...c.max, corr) * 1.08;
    const passo = teto > 40 ? 20 : teto > 16 ? 10 : teto > 8 ? 4 : 2;
    const y = (v) => T + ih - (v / teto) * ih;
    const banda = iw / n, larg = Math.max(6, Math.min(26, banda - 4));
    const x = (i) => L + banda * i + banda / 2;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, caixa);
    for (let v = 0; v <= teto; v += passo) {
      el('line', { x1: L, x2: L + iw, y1: y(v), y2: y(v), class: 'grade' }, svg);
      texto(svg, L - 6, y(v) + 4, nf.format(v), { 'text-anchor': 'end' });
    }
    const corte = L + banda * AG.meses.length;
    el('line', { x1: corte, x2: corte, y1: T, y2: T + ih, stroke: 'var(--borda)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    texto(svg, L + iw, T - 2, W < 520 ? 'previsão' : 'ainda não publicado', { class: 'fraco', 'text-anchor': 'end' });
    const passoX = W < 520 ? 3 : 1;
    meses.forEach((m, i) => {
      const futuro = i >= AG.meses.length, v = valores[i];
      const g = el('g', { class: 'barra-mes' }, svg);
      const alto = Math.max(1, (v / teto) * ih);
      el('path', { d: barraArredondada(x(i) - larg / 2, y(v), larg, alto), fill: futuro ? 'var(--dado)' : 'var(--neutro)', opacity: futuro ? 1 : 0.85 }, g);
      if (futuro) {
        const j = i - AG.meses.length;
        el('line', { x1: x(i), x2: x(i), y1: y(c.min[j]), y2: y(c.max[j]), stroke: 'var(--text)', 'stroke-width': 1.5 }, g);
        for (const v2 of [c.min[j], c.max[j]]) el('line', { x1: x(i) - 4, x2: x(i) + 4, y1: y(v2), y2: y(v2), stroke: 'var(--text)', 'stroke-width': 1.5 }, g);
      }
      if ((n - 1 - i) % passoX === 0) texto(svg, x(i), H - 6, `${MESES[Number(m.slice(5)) - 1]}${m.endsWith('-01') || i === 0 ? `/${m.slice(2, 4)}` : ''}`, { 'text-anchor': 'middle', class: futuro ? 'forte' : '' });
      const alvo = el('rect', { x: L + banda * i, y: T, width: banda, height: ih, fill: 'transparent' }, g);
      const j = i - AG.meses.length;
      const html = futuro
        ? `<b>${mesAno(m)}, previsão</b>${nf1.format(v)} roubos<br>provável: ${nf.format(c.min[j])} a ${nf.format(c.max[j])}`
        : `<b>${mesAno(m)}</b>${nf.format(v)} ${v === 1 ? 'roubo registrado' : 'roubos registrados'}`;
      comDica(alvo, html);
    });
    const comCirculo = Math.abs(corr - c.prev[c.prev.length - 1]) > 0.05;
    if (comCirculo) el('circle', { cx: x(n - 1), cy: y(corr), r: 6, fill: 'var(--surface)', stroke: 'var(--primary)', 'stroke-width': 2.5 }, svg);
    caixa.setAttribute('aria-label', `Roubos por mês de ${mesAno(AG.meses[0])} a ${mesAno(AG.meses[AG.meses.length - 1])} e previsão de ${AG.previstos.map(mesAno).join(', ')}.`);
    $('#a-legenda').textContent = `Barras cinza: roubos registrados por mês. Azuis: previsão para os meses que a SSP ainda não publicou, com a faixa provável.${comCirculo ? ' O círculo é a estimativa do mês corrigida pelos relatos.' : ''}`;
    $('#t-agora-tab').innerHTML = tabela(['Mês', 'Roubos', 'Faixa provável'], meses.map((m, i) => {
      const j = i - AG.meses.length;
      return j < 0 ? [mesAno(m), nf.format(valores[i]), '—'] : [`${mesAno(m)} (previsão)`, nf1.format(valores[i]), `${nf.format(c.min[j])} a ${nf.format(c.max[j])}`];
    }), [1]);
  }
  // barra com a ponta de cima arredondada (4px) e a base reta no eixo
  function barraArredondada(x0, y0, w, h) {
    const r = Math.min(4, w / 2, h);
    return `M${x0},${y0 + h}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + w - r}Q${x0 + w},${y0} ${x0 + w},${y0 + r}V${y0 + h}Z`;
  }

  // Teste da previsão do mês (na parte do modelo)
  const NOMES_REGRA = { modelo: 'RandomForest (nosso)', media_3m: 'Média dos 3 últimos meses', ultimo_publicado: 'Repetir o último mês publicado', media_12m: 'Média dos últimos 12 meses', mesmo_mes_ano_passado: 'Mesmo mês do ano anterior' };
  function desenharTesteMes() {
    const er = AG.erro_regiao, TR = AG.teste_regiao;
    $('#t-teste-mes').textContent = `No total da região, o modelo erra ${nf.format(Math.round(er.modelo))} roubos por mês; a melhor regra simples, ${nf.format(Math.round(er.media_3m))}`;
    const abaixo = TR.filter((r) => r.modelo < r.real).length;
    $('#nota-teste-mes').textContent = `Cada mês de 2026 foi previsto só com o que estava publicado ${AG.atraso} meses antes, como acontece de verdade. ${abaixo >= TR.length / 2 ? `O modelo ficou abaixo do real em ${abaixo} de ${TR.length} meses: aprendeu a queda de 2024 para 2025, e em 2026 os roubos pararam de cair.` : ''}`.trim();
    const regras = Object.keys(NOMES_REGRA).filter((k) => k in er).sort((a, b) => er[a] - er[b]);
    const max = Math.max(...regras.map((k) => er[k]));
    $('#g-erros').innerHTML = `<div class="barras">${regras.map((k) => `<div><div class="l"><span>${NOMES_REGRA[k]}</span><b class="num">${nf.format(Math.round(er[k]))}</b></div>
      <div class="t"><span style="width:${(100 * er[k] / max).toFixed(1)}%;background:${k === 'modelo' ? 'var(--dado)' : 'var(--neutro)'}"></span></div></div>`).join('')}</div>`;
    graficoTesteMes();
    $('#t-teste-mes-tab').innerHTML = tabela(['Mês', 'Real', 'Modelo', 'Média de 3 meses'],
      [...TR.map((r) => [mesAno(r.mes), nf.format(r.real), nf.format(r.modelo), nf.format(r.media_3m)]),
       ...AG.previstos.map((m, i) => [`${mesAno(m)} (não publicado)`, '—', nf.format(AG.futuro_regiao[i]), '—'])], [1, 2, 3]);
  }
  function graficoTesteMes() {
    const caixa = $('#g-teste-mes');
    caixa.innerHTML = '';
    const TR = AG.teste_regiao, n = TR.length + AG.previstos.length, er = AG.erro_regiao.modelo;
    const H = 240, W = Math.max(280, Math.round(caixa.clientWidth));
    const L = 48, R = 76, T = 10, Bm = 24, iw = W - L - R, ih = H - T - Bm;
    const todos = [...TR.flatMap((r) => [r.real, r.modelo, r.media_3m]), ...AG.futuro_regiao.map((v) => v + er), ...AG.futuro_regiao.map((v) => v - er)];
    const passo = 500, piso = Math.floor(Math.min(...todos) / passo) * passo, teto = Math.ceil(Math.max(...todos) / passo) * passo;
    const x = (i) => L + (i / (n - 1)) * iw, y = (v) => T + ih - ((v - piso) / (teto - piso)) * ih;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, caixa);
    for (let v = piso; v <= teto; v += passo) {
      el('line', { x1: L, x2: L + iw, y1: y(v), y2: y(v), class: 'grade' }, svg);
      texto(svg, L - 8, y(v) + 4, nf.format(v), { 'text-anchor': 'end' });
    }
    const k = TR.length;
    const fut = AG.futuro_regiao.map((v, j) => [x(k + j), v]);
    el('path', { d: `M${fut.map(([xx, v]) => `${xx},${y(v + er)}`).join('L')}L${[...fut].reverse().map(([xx, v]) => `${xx},${y(v - er)}`).join('L')}Z`, fill: 'var(--dado-suave)' }, svg);
    const corte = (x(k - 1) + x(k)) / 2;
    el('line', { x1: corte, x2: corte, y1: T, y2: T + ih, stroke: 'var(--borda)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    texto(svg, L + iw, T + 10, W < 520 ? 'previsão' : 'ainda não publicado', { class: 'fraco', 'text-anchor': 'end' });
    const linha = (pts, attrs) => el('path', { d: pts.map(([xx, v], i) => `${i ? 'L' : 'M'}${xx.toFixed(1)},${y(v).toFixed(1)}`).join(''), fill: 'none', 'stroke-linejoin': 'round', ...attrs }, svg);
    linha(TR.map((r, i) => [x(i), r.media_3m]), { stroke: 'var(--neutro)', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
    linha(TR.map((r, i) => [x(i), r.real]), { stroke: 'var(--text)', 'stroke-width': 2.5 });
    linha(TR.map((r, i) => [x(i), r.modelo]), { stroke: 'var(--dado)', 'stroke-width': 2.5 });
    linha([[x(k - 1), TR[k - 1].modelo], ...fut], { stroke: 'var(--dado)', 'stroke-width': 2.5, 'stroke-dasharray': '2 4', 'stroke-linecap': 'round' });
    texto(svg, x(k - 1) + 6, y(TR[k - 1].real) - 8, 'Real', { class: 'forte' });
    texto(svg, x(n - 1) + 8, y(AG.futuro_regiao[AG.futuro_regiao.length - 1]) + 4, 'Modelo', { class: 'forte', style: 'fill:var(--primary)' });
    const ys = [y(TR[0].media_3m), y(TR[0].real), y(TR[0].modelo)];
    texto(svg, x(0) + 4, ys[0] + (ys[0] < Math.min(ys[1], ys[2]) ? -8 : 16), 'Média de 3 meses', { class: 'fraco' });
    const meses = [...TR.map((r) => r.mes), ...AG.previstos];
    meses.forEach((m, i) => { if (W >= 520 || i % 2 === 0) texto(svg, x(i), H - 6, W < 520 ? MESES[Number(m.slice(5)) - 1] : `${MESES[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`, { 'text-anchor': 'middle' }); });
    const cursor = el('g', { visibility: 'hidden' }, svg);
    const fio = el('line', { y1: T, y2: T + ih, stroke: 'var(--text-muted)', 'stroke-width': 1 }, cursor);
    const area = el('rect', { x: L, y: T, width: iw, height: ih, fill: 'transparent' }, svg);
    area.addEventListener('pointermove', (e) => {
      const cx = svg.getBoundingClientRect();
      const i = limitar(Math.round((((e.clientX - cx.left) / cx.width) * W - L) / iw * (n - 1)), 0, n - 1);
      cursor.setAttribute('visibility', 'visible');
      fio.setAttribute('x1', x(i)); fio.setAttribute('x2', x(i));
      const html = i < k
        ? `<b>${mesAno(TR[i].mes)}</b>Real: ${nf.format(TR[i].real)}<br>Modelo: ${nf.format(TR[i].modelo)}<br>Média de 3 meses: ${nf.format(TR[i].media_3m)}`
        : `<b>${mesAno(AG.previstos[i - k])}, não publicado</b>Modelo: ${nf.format(AG.futuro_regiao[i - k])}<br>erro típico: ± ${nf.format(Math.round(er))}`;
      mostrarDica(html, e.clientX, e.clientY);
    });
    area.addEventListener('pointerleave', () => { cursor.setAttribute('visibility', 'hidden'); esconderDica(); });
    caixa.setAttribute('aria-label', `Roubos por mês na região em 2026: real, previsto pelo modelo e média de 3 meses, e a previsão de ${AG.previstos.map(mesAno).join(', ')}.`);
  }

  // Como os roubos acontecem (base de objetos junto com as de celular e veículo)
  const PF = D.perfil;
  const pctPequeno = (v) => (v > 0 && v < 0.005 ? '<1%' : pct(v));
  // até `max` linhas; o resto vira uma linha "Outros"
  function juntarResto(itens, max) {
    if (itens.length <= max) return itens;
    const resto = itens.slice(max - 1).reduce((a, i) => a + i.bos, 0);
    return [...itens.slice(0, max - 1), { rotulo: 'Outros', bos: resto }];
  }
  function barrasPerfil(caixa, itens, total, destaque) {
    const max = Math.max(...itens.map((i) => i.bos));
    caixa.innerHTML = `<div class="barras">${itens.map((i) => `<div><div class="l"><span>${esc(i.rotulo)}</span><b class="num">${pctPequeno(i.bos / total)}</b></div>
      <div class="t"><span style="width:${Math.max(1, 100 * i.bos / max).toFixed(1)}%;background:${i.rotulo === destaque ? 'var(--dado)' : 'var(--neutro)'}"></span></div></div>`).join('')}</div>`;
  }
  function desenharPerfil() {
    const tot = PF.total_bos, nao = 'Outros ou não informado';
    const lev = PF.levados.slice(0, 7);
    $('#t-levados').textContent = `${lev[0].rotulo} é levado em ${pct(lev[0].bos / tot)} dos roubos`;
    const sem = PF.cobertura.outros_objetos;
    $('#nota-levados').textContent = `Parte dos roubos em que cada coisa foi levada; um roubo pode levar várias.${sem ? ` ${pct(sem.pct)} não levam celular nem veículo.` : ''}`;
    barrasPerfil($('#g-levados'), lev, tot, lev[0].rotulo);
    const informados = PF.conduta.filter((c) => c.rotulo !== nao);
    const nInf = informados.reduce((a, c) => a + c.bos, 0);
    $('#t-conduta').textContent = `Só ${pct(nInf / tot)} dos boletins dizem como a vítima estava`;
    $('#nota-conduta').textContent = 'Entre os boletins que informam, como a vítima estava.';
    barrasPerfil($('#g-conduta'), juntarResto(informados, 7), nInf, informados[0].rotulo);
    const loc = PF.local[0];
    $('#t-local').textContent = `${pct(loc.bos / tot)} dos roubos acontecem na ${loc.rotulo.toLowerCase()}`;
    barrasPerfil($('#g-local'), juntarResto(PF.local.filter((l) => l.rotulo !== nao), 7), tot, loc.rotulo);
    const doc = PF.levados_com_celular.find((i) => i.rotulo === 'Documentos');
    $('#nota-como').textContent = `${nf.format(tot)} boletins de roubo na Região Metropolitana de ${PERIODO}, juntando as bases de celulares, veículos e objetos da SSP-SP pelo número do boletim.${doc ? ` Quando levam o celular, também levam documentos em ${pct(doc.pct)} das vezes.` : ''}`;
  }

  // Tema
  const botaoTema = $('#tema');
  const rotuloTema = () => botaoTema.setAttribute('aria-label', escuro() ? 'Usar tema claro' : 'Usar tema escuro');
  const repintar = () => { rotuloTema(); pintarCalor(); pintarMatriz(); };
  botaoTema.addEventListener('click', () => {
    const novo = escuro() ? 'light' : 'dark';
    document.documentElement.dataset.theme = novo;
    try { localStorage.setItem('moskitto-tema', novo); } catch (e) { /* o tema só não fica lembrado */ }
    repintar();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repintar);

  let largura = innerWidth, espera;
  addEventListener('resize', () => {
    if (innerWidth === largura) return;
    largura = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => {
      montarMapa(); montarHoras(); montarMensal();
      if (AG) { desenharAgora(); graficoTesteMes(); }
    }, 140);
  });

  // Início
  rotuloTema();
  marcarFiltros();
  montarMapa();
  textosMapa();
  desenharTrilho();
  $('#busca').value = estado.lugar.nome;
  atualizarLugar();
  montarHoras();
  textosHoras();
  montarCalor();
  montarMensal();
  desenharTipos();
  desenharModelo();
  if (AG) { textosAgora(); desenharAgora(); desenharTesteMes(); }
  if (PF) desenharPerfil();
  desenharFunil();
  if (new URLSearchParams(location.search).has('local')) requestAnimationFrame(() => voarPara(estado.lugar));
})();
