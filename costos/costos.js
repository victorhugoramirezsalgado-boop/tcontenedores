// © 2026 Víctor Hugo Ramírez Salgado — Costeo por contenedor, módulo de la trazabilidad de contenedores (Contopía©)
(() => {
  const $ = (id) => document.getElementById(id);
  const mxn = (n) => '$' + Math.round(n).toLocaleString('es-MX');
  const CLAVE = 'tcont-costeo-v1';

  // Cargos de la hoja de trabajo de VHRS (frijol 25 t, 1 contenedor). p = por confirmar.
  const CARGOS_HOJA = [
    { c: 'Puerto (uso de infraestructura)', a: 'ASIPONA', n: 'N', m: 1250 },
    { c: 'Terminal (maniobras)', a: 'Terminal', n: 'I', m: 10000 },
    { c: 'Transporte terrestre', a: 'Transportista SPF', n: 'L', m: 15000 },
    { c: 'Agencia aduanal (honorarios)', a: 'Agente aduanal', n: 'L', m: 9000 },
    { c: 'Importador (personal)', a: 'Importador', n: 'N', m: 5000 },
    { c: 'Flete terrestre a destino', a: 'Transportista SPF', n: 'L', m: 0, p: 1 },
    { c: 'Bodega del frijol (25 t)', a: 'Bodega', n: 'L', m: 3000 },
    { c: 'Consumos del transporte terrestre', a: 'Transportista SPF', n: 'L', m: 4000 },
    { c: 'Casetas', a: 'Autopistas', n: 'F', m: 2000 },
    { c: 'Valor agregado / manipulación', a: 'Bodega', n: 'L', m: 0, p: 1 },
    { c: 'Patio seco · estadía 3 días', a: 'Patio de vacíos', n: 'L', m: 4500 },
    { c: 'SPF · retorno del vacío', a: 'Transportista SPF', n: 'L', m: 3000 },
    { c: 'Agencia aduanal (2.º cargo)', a: 'Agente aduanal', n: 'L', m: 1000 },
    { c: 'Puerto (2.º cargo)', a: 'ASIPONA', n: 'F', m: 500 },
    { c: 'Autoridades', a: 'Autoridades', n: 'F', m: 500 },
    { c: 'Terminal (2.º cargo)', a: 'Terminal', n: 'I', m: 2000 }
  ];
  const base = { merc: 'Frijol común seco', frac: '0713.33.01', kg: 25000, ncont: 1, fact: 450000, flete: 45000, seg: 0, cif: false, cc: 0, dta: 8, prv: 0 };
  const ESC = {
    hoja: { ...base, igi: 10, iva: 0 },
    tmec: { ...base, igi: 0, iva: 0 },
    nmf: { ...base, igi: 20, iva: 0 },
    general: { ...base, merc: 'Mercancía general', frac: '', igi: 10, iva: 16 }
  };
  // Cifras escritas a mano en la hoja original, para comparar.
  const HOJA = { impuestos: 125000, total: 239500 };

  const CAMPOS = ['merc', 'frac', 'kg', 'ncont', 'fact', 'flete', 'seg', 'igi', 'cc', 'iva', 'dta', 'prv'];
  let cargos = [];

  function cargarEscenario(k) {
    const e = ESC[k];
    CAMPOS.forEach((f) => { $(f).value = e[f]; });
    $('cif').checked = e.cif;
    cargos = CARGOS_HOJA.map((r) => ({ ...r }));
    pintarCargos(); calcular();
  }

  function pintarCargos() {
    const tb = $('cargos').tBodies[0];
    tb.innerHTML = '';
    cargos.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (r.p) tr.className = 'pend';
      tr.innerHTML = `<td><input data-i="${i}" data-k="c" value="${r.c.replace(/"/g, '&quot;')}" aria-label="Concepto"></td>
<td><input data-i="${i}" data-k="a" value="${r.a.replace(/"/g, '&quot;')}" aria-label="Lo cobra"></td>
<td><select data-i="${i}" data-k="n" aria-label="Nivel">${['I', 'F', 'N', 'L'].map((n) => `<option${n === r.n ? ' selected' : ''}>${n}</option>`).join('')}</select></td>
<td class="n"><input class="n mono" type="number" min="0" step="100" data-i="${i}" data-k="m" value="${r.m}" aria-label="Monto"></td>
<td><button class="b3d chico rojo" data-quita="${i}" aria-label="Quitar">✕</button></td>`;
      tb.appendChild(tr);
    });
  }

  function num(id) { return Math.max(0, parseFloat($(id).value) || 0); }

  function calcular() {
    const fact = num('fact'), flete = num('flete'), seg = num('seg') / 100, kg = num('kg'), nc = Math.max(1, num('ncont'));
    const cif = $('cif').checked;
    const seguro = cif ? 0 : fact * seg;
    const va = cif ? fact : fact + flete + seguro;
    const igi = va * num('igi') / 100;
    const cc = va * num('cc') / 100;
    const dta = va * num('dta') / 1000;
    const prv = num('prv');
    const iva = (va + igi + cc + dta) * num('iva') / 100;
    const contrib = igi + cc + dta + prv + iva;
    const otros = cargos.reduce((s, r) => s + (+r.m || 0), 0);
    const fleteCosto = cif ? 0 : flete + seguro;
    const costoCont = fleteCosto + contrib + otros;
    const destino = fact + costoCont;

    $('kpis').innerHTML = [
      ['Costo del contenedor', mxn(costoCont), 'flete + contribuciones + cargos'],
      ['Contribuciones', mxn(contrib), 'IGI, CC, DTA, IVA y derechos'],
      ['Puesto en destino', mxn(destino), 'factura + costo del contenedor'],
      ['Por kilo', kg ? '$' + (destino / kg).toFixed(2) : '—', mxn(costoCont / nc) + ' por contenedor'],
      ['Sobre la factura', fact ? (costoCont / fact * 100).toFixed(1) + ' %' : '—', 'costo logístico y fiscal']
    ].map(([t, v, s]) => `<div class="kpi"><span>${t}</span><b>${v}</b><span>${s}</span></div>`).join('');

    $('contrib').innerHTML = '<tr><th>Concepto</th><th class="n">MXN</th></tr>' + [
      ['Valor en aduana (base)', va], ['Arancel IGI ' + num('igi') + ' %', igi], ['Cuota compensatoria', cc],
      ['DTA ' + num('dta') + ' al millar', dta], ['Prevalidación y otros', prv], ['IVA ' + num('iva') + ' %', iva],
      ['Total de contribuciones', contrib]
    ].map(([c, m], i, a) => `<tr${i === a.length - 1 ? ' class="resalta"' : ''}><td>${c}</td><td class="n">${mxn(m)}</td></tr>`).join('');

    const porNivel = { I: fleteCosto, F: contrib, N: 0, L: 0 };
    const porActor = {};
    if (fleteCosto) porActor['Naviera (flete y seguro)'] = fleteCosto;
    porActor['SAT / ANAM (contribuciones)'] = contrib;
    cargos.forEach((r) => { porNivel[r.n] = (porNivel[r.n] || 0) + (+r.m || 0); porActor[r.a] = (porActor[r.a] || 0) + (+r.m || 0); });
    const nom = { I: 'Internacional', F: 'Federal', N: 'Nacional', L: 'Local' };
    $('niveles').innerHTML = '<tr><th>Nivel</th><th class="n">MXN</th><th class="n">%</th></tr>' +
      Object.keys(nom).map((k) => `<tr><td>${nom[k]}</td><td class="n">${mxn(porNivel[k])}</td><td class="n">${costoCont ? (porNivel[k] / costoCont * 100).toFixed(1) : 0}</td></tr>`).join('');
    $('actores').innerHTML = '<tr><th>Lo cobra</th><th class="n">MXN</th></tr>' +
      Object.entries(porActor).sort((a, b) => b[1] - a[1]).map(([a, m]) => `<tr><td>${a}</td><td class="n">${mxn(m)}</td></tr>`).join('');

    const sumaHoja = 45000 + CARGOS_HOJA.reduce((s, r) => s + r.m, 0) + HOJA.impuestos;
    $('compara').innerHTML = `<b>Contra la hoja original:</b> en la hoja, el total escrito es ${mxn(HOJA.total)}, pero sus renglones suman ${mxn(sumaHoja)} (<b class="rojo">diferencia de ${mxn(HOJA.total - sumaHoja)}</b>). La hoja anota impuestos por ${mxn(HOJA.impuestos)}; con los datos de arriba son ${mxn(contrib)}, y el contenedor cuesta ${mxn(costoCont)} (${costoCont <= HOJA.total ? mxn(HOJA.total - costoCont) + ' menos' : mxn(costoCont - HOJA.total) + ' más'} que el total escrito).`;

    window.__costeo = { va, igi, cc, dta, prv, iva, contrib, fleteCosto, otros, costoCont, destino };
  }

  function csv() {
    const r = window.__costeo; const filas = [['Concepto', 'Lo cobra', 'Nivel', 'MXN']];
    filas.push(['Flete marítimo y seguro', 'Naviera', 'I', r.fleteCosto.toFixed(2)]);
    [['Arancel IGI', r.igi], ['Cuota compensatoria', r.cc], ['DTA', r.dta], ['Prevalidación y otros', r.prv], ['IVA', r.iva]]
      .forEach(([c, m]) => filas.push([c, 'SAT / ANAM', 'F', m.toFixed(2)]));
    cargos.forEach((x) => filas.push([x.c + (x.p ? ' (por confirmar)' : ''), x.a, x.n, (+x.m).toFixed(2)]));
    filas.push(['Costo del contenedor', '', '', r.costoCont.toFixed(2)], ['Puesto en destino', '', '', r.destino.toFixed(2)]);
    filas.push(['© 2026 Víctor Hugo Ramírez Salgado · tcontenedores.com', '', '', '']);
    const txt = '﻿' + filas.map((f) => f.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'costeo-contenedor-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }

  function aviso(t) { $('msg').textContent = t; setTimeout(() => { $('msg').textContent = ''; }, 3500); }

  // Eventos
  CAMPOS.concat('cif').forEach((f) => $(f).addEventListener('input', calcular));
  $('cif').addEventListener('change', calcular);
  $('ejemplo').addEventListener('change', (e) => cargarEscenario(e.target.value));
  document.querySelectorAll('[data-igi]').forEach((b) => b.addEventListener('click', () => { $('igi').value = b.dataset.igi; calcular(); }));
  $('cargos').addEventListener('input', (e) => {
    const t = e.target; if (t.dataset.i == null) return;
    const r = cargos[+t.dataset.i]; r[t.dataset.k] = t.dataset.k === 'm' ? Math.max(0, +t.value || 0) : t.value;
    if (t.dataset.k === 'm' && r.p) { r.p = 0; t.closest('tr').classList.remove('pend'); }
    calcular();
  });
  $('cargos').addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') { cargos[+e.target.dataset.i].n = e.target.value; calcular(); } });
  $('cargos').addEventListener('click', (e) => { const q = e.target.closest('[data-quita]'); if (q) { cargos.splice(+q.dataset.quita, 1); pintarCargos(); calcular(); } });
  $('agregar').addEventListener('click', () => { cargos.push({ c: 'Nuevo cargo', a: '', n: 'L', m: 0 }); pintarCargos(); calcular(); });
  $('csv').addEventListener('click', csv);
  $('imprimir').addEventListener('click', () => window.print());
  $('reset').addEventListener('click', () => cargarEscenario($('ejemplo').value));
  $('guardar').addEventListener('click', () => {
    const d = { campos: Object.fromEntries(CAMPOS.map((f) => [f, $(f).value])), cif: $('cif').checked, cargos };
    try { localStorage.setItem(CLAVE, JSON.stringify(d)); aviso('Guardado en este equipo.'); } catch (e) { aviso('No se pudo guardar en este navegador.'); }
  });

  // Inicio: recupera lo guardado o carga la hoja.
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { d = null; }
  if (d && d.campos) {
    CAMPOS.forEach((f) => { if (f in d.campos) $(f).value = d.campos[f]; });
    $('cif').checked = !!d.cif; cargos = d.cargos || CARGOS_HOJA.map((r) => ({ ...r }));
    pintarCargos(); calcular();
  } else cargarEscenario('hoja');
})();
