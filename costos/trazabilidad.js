// © 2026 Víctor Hugo Ramírez Salgado — Trazabilidad de costos por eslabón, módulo de la trazabilidad de contenedores (Contopía©)
(() => {
  const $ = (id) => document.getElementById(id);
  const mxn = (n) => '$' + Math.round(n).toLocaleString('es-MX');
  const CLAVE = 'tcont-traza-costos-v1';
  const TRAMOS = { imp: 'Importación', ret: 'Retorno del vacío' };
  const NIVELES = { I: 'Internacional', F: 'Federal', N: 'Nacional', L: 'Local' };

  // Hoja «XXIX · Temas internos» de VHRS (frijol, 25 t). p = por confirmar.
  const HOJA = [
    { t: 'imp', c: 'Agencia naviera · flete marítimo', a: 'Naviera', n: 'I', i: 0, d: 0, m: 45000, f: 'Hoja XXIX. Días de tránsito por definir', p: 1 },
    { t: 'imp', c: 'Estadías del buque', a: 'Naviera', n: 'I', i: 0, d: 0, m: 0, f: 'Concepto nuevo, sin cifra', p: 1 },
    { t: 'imp', c: 'Puerto · pilotos y muellaje', a: 'ASIPONA', n: 'N', i: 0, d: 8, m: 1250, f: 'Días por confirmar', p: 1 },
    { t: 'imp', c: 'Terminal · maniobras', a: 'Terminal', n: 'I', i: 0, d: 15, m: 10000, f: 'Días por confirmar', p: 1 },
    { t: 'imp', c: 'Agencia aduanal · honorarios', a: 'Agente aduanal', n: 'L', i: 0, d: 5, m: 9000, f: 'Referencia: $3,000–8,000 por pedimento' },
    { t: 'imp', c: 'Autoridades · contribuciones', a: 'SAT / ANAM', n: 'F', i: 0, d: 5, m: 125000, f: 'Con T-MEC e IVA 0 %: DTA $3,960 + prevalidación $350', p: 1 },
    { t: 'imp', c: 'Empresa importadora · personal', a: 'Importador', n: 'N', i: 0, d: 5, m: 5000, f: 'Hoja XXIX' },
    { t: 'imp', c: 'Transporte terrestre', a: 'Transportista SPF', n: 'L', i: 0, d: 15, m: 15000, f: 'Días por confirmar', p: 1 },
    { t: 'imp', c: 'Flete terrestre a destino', a: 'Transportista SPF', n: 'L', i: 0, d: 5, m: 0, f: 'Sin cifra en la hoja (¿$8,750?)', p: 1 },
    { t: 'imp', c: 'Bodegas', a: 'Bodega', n: 'L', i: 0, d: 5, m: 3000, f: 'Hoja XXIX' },
    { t: 'imp', c: 'Consumo local · desayunos, llantas, etc.', a: 'Transportista SPF', n: 'L', i: 0, d: 2, m: 2000, f: 'Monto por confirmar', p: 1 },
    { t: 'imp', c: 'Casetas', a: 'Autopistas', n: 'F', i: 0, d: 2, m: 2000, f: 'Monto por confirmar', p: 1 },
    { t: 'imp', c: 'Valor agregado · manipulación', a: 'Bodega', n: 'L', i: 0, d: 0, m: 4000, f: 'Hoja XXIX' },
    { t: 'imp', c: 'Patios secos · entrada y salida', a: 'Patio de vacíos', n: 'L', i: 0, d: 3, m: 4500, f: '3 días' },
    { t: 'ret', c: 'Transporte SPF del vacío', a: 'Transportista SPF', n: 'L', i: 0, d: 0, m: 1500, f: 'Hoja XXIX' },
    { t: 'ret', c: 'Agencia aduanal', a: 'Agente aduanal', n: 'L', i: 0, d: 0, m: 1500, f: 'Hoja XXIX' },
    { t: 'ret', c: 'Puerto', a: 'ASIPONA', n: 'F', i: 0, d: 0, m: 2500, f: '¿$2,500 o $500?', p: 1 },
    { t: 'ret', c: 'Autoridades', a: 'SAT / ANAM', n: 'F', i: 0, d: 0, m: 300, f: 'Hoja XXIX' },
    { t: 'ret', c: 'Terminal', a: 'Terminal', n: 'I', i: 0, d: 0, m: 5200, f: 'Hoja XXIX' }
  ];
  const BASE = { op: 'Importación de frijol pinto, 25 t', cont: '', kg: 25000, fx: 18.67 };
  let filas = [];

  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const opts = (obj, v) => Object.entries(obj).map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${k.length === 1 ? k : t}</option>`).join('');

  function pintar() {
    const tb = $('t-tabla').tBodies[0];
    tb.innerHTML = filas.map((r, k) => `<tr class="${r.p ? 'pend ' : ''}${r.t}">
<td><select data-k="t" data-i="${k}" aria-label="Tramo">${opts(TRAMOS, r.t)}</select></td>
<td><input data-k="c" data-i="${k}" value="${esc(r.c)}" aria-label="Concepto"></td>
<td><input data-k="a" data-i="${k}" value="${esc(r.a)}" aria-label="Lo cobra"></td>
<td><select data-k="n" data-i="${k}" aria-label="Nivel">${opts(NIVELES, r.n)}</select></td>
<td class="n"><input class="n mono" type="number" min="0" step="1" data-k="i" data-i="${k}" value="${r.i}" aria-label="Día de inicio"></td>
<td class="n"><input class="n mono" type="number" min="0" step="1" data-k="d" data-i="${k}" value="${r.d}" aria-label="Días"></td>
<td class="n"><input class="n mono" type="number" min="0" step="100" data-k="m" data-i="${k}" value="${r.m}" aria-label="Costo MXN"></td>
<td><input data-k="f" data-i="${k}" value="${esc(r.f)}" aria-label="Fuente o nota"></td>
<td><button class="b3d chico rojo" data-quita="${k}" aria-label="Quitar">✕</button></td></tr>`).join('');
  }

  function calcular() {
    const kg = Math.max(0, +$('t-kg').value || 0), fx = Math.max(0, +$('t-fx').value || 0);
    const total = filas.reduce((s, r) => s + (+r.m || 0), 0);
    const fin = filas.reduce((s, r) => Math.max(s, (+r.i || 0) + (+r.d || 0)), 0);
    const pend = filas.filter((r) => r.p).length;
    $('t-kpis').innerHTML = [
      ['Costo total trazado', mxn(total), fx ? 'US$' + Math.round(total / fx).toLocaleString('es-MX') : ''],
      ['Duración total', fin + ' días', 'del primer al último eslabón'],
      ['Costo por día', fin ? mxn(total / fin) : '—', 'promedio de la operación'],
      ['Costo logístico por kilo', kg ? '$' + (total / kg).toFixed(2) : '—', 'sin el valor de la mercancía'],
      ['Datos por confirmar', String(pend), pend ? 'renglones con ‡' : 'todo confirmado']
    ].map(([t, v, s], k) => `<div class="kpi${k === 4 && pend ? ' alerta' : ''}"><span>${t}</span><b>${v}</b><span>${s}</span></div>`).join('');

    const suma = (key) => filas.reduce((o, r) => { o[r[key]] = (o[r[key]] || 0) + (+r.m || 0); return o; }, {});
    const pct = (v) => total ? (v / total * 100).toFixed(1) + ' %' : '—';
    const porT = suma('t');
    $('t-tramos').innerHTML = '<tr><th>Tramo</th><th class="n">MXN</th><th class="n">%</th></tr>' +
      Object.keys(TRAMOS).map((k) => `<tr><td>${TRAMOS[k]}</td><td class="n">${mxn(porT[k] || 0)}</td><td class="n">${pct(porT[k] || 0)}</td></tr>`).join('') +
      `<tr class="resalta"><td>Total</td><td class="n">${mxn(total)}</td><td class="n">100 %</td></tr>`;
    $('t-actores').innerHTML = '<tr><th>Lo cobra</th><th class="n">MXN</th><th class="n">%</th></tr>' +
      Object.entries(suma('a')).sort((x, y) => y[1] - x[1]).map(([a, m]) => `<tr><td>${esc(a)}</td><td class="n">${mxn(m)}</td><td class="n">${pct(m)}</td></tr>`).join('');

    // Línea de tiempo
    const esc_d = Math.max(fin, 1);
    $('t-gantt').innerHTML = `<div class="g-esc"><span>Día 0</span><span>Día ${Math.round(esc_d / 2)}</span><span>Día ${esc_d}</span></div>` +
      filas.map((r) => {
        const izq = (+r.i || 0) / esc_d * 100, an = Math.max((+r.d || 0) / esc_d * 100, 0.8);
        return `<div class="g-fila ${r.t}"><span class="g-c" title="${esc(r.c)}">${esc(r.c)}</span><div class="g-pista"><i style="left:${izq}%;width:${Math.min(an, 100 - izq)}%"></i></div><span class="g-m">${mxn(+r.m || 0)} · ${+r.d || 0} d</span></div>`;
      }).join('');

    // Alertas contra referencias
    const al = [];
    filas.forEach((r) => {
      const c = r.c.toLowerCase();
      if (c.includes('aduanal') && r.t === 'imp' && r.m > 8000) al.push(`<b>${esc(r.c)}:</b> ${mxn(r.m)} está arriba del rango de referencia de $3,000–8,000 por pedimento.`);
      if (c.includes('contribuc') && r.m > 60000) al.push(`<b>${esc(r.c)}:</b> ${mxn(r.m)} parece alto. Con frijol de origen T-MEC (arancel 0 %) e IVA 0 % serían unos $4,310 (DTA + prevalidación).`);
      if (c.includes('patio') && r.d && r.m / r.d > 1000) al.push(`<b>${esc(r.c)}:</b> ${mxn(r.m / r.d)} por día; como referencia, una terminal privada de Veracruz cobra $445 por día de almacenaje.‡`);
      if (!r.m && !r.p) al.push(`<b>${esc(r.c)}:</b> sin costo capturado.`);
    });
    if (filas.some((r) => r.d > 0 && !r.i) && fin > 0 && filas.filter((r) => r.d > 0).every((r) => !r.i))
      al.push('Todos los eslabones empiezan el día 0. Ajusta el día de inicio de cada uno o usa «Encadenar días» para ver la duración real de la operación.');
    $('t-alertas').innerHTML = al.length ? '<b>Revisión automática</b><ul class="puntos">' + al.map((x) => `<li>${x}</li>`).join('') + '</ul>' : '<b>Revisión automática:</b> sin observaciones.';
  }

  function cargar(d) {
    $('t-op').value = d.op; $('t-cont').value = d.cont; $('t-kg').value = d.kg; $('t-fx').value = d.fx;
    filas = (d.filas || HOJA).map((r) => ({ ...r }));
    pintar(); calcular();
  }

  function csv() {
    const out = [['Tramo', 'Concepto', 'Lo cobra', 'Nivel', 'Inicia (día)', 'Días', 'MXN', 'Fuente o nota', 'Por confirmar']];
    filas.forEach((r) => out.push([TRAMOS[r.t], r.c, r.a, r.n, r.i, r.d, r.m, r.f, r.p ? 'sí' : 'no']));
    out.push(['Operación', $('t-op').value, 'Contenedor', $('t-cont').value, '', '', '', '', '']);
    out.push(['© 2026 Víctor Hugo Ramírez Salgado · tcontenedores.com', '', '', '', '', '', '', '', '']);
    const txt = '﻿' + out.map((f) => f.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'trazabilidad-costos-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  }
  const aviso = (t) => { $('t-msg').textContent = t; setTimeout(() => { $('t-msg').textContent = ''; }, 3500); };

  // Edición
  $('t-tabla').addEventListener('input', (e) => {
    const el = e.target; if (el.dataset.i == null) return;
    const r = filas[+el.dataset.i], k = el.dataset.k;
    r[k] = ['i', 'd', 'm'].includes(k) ? Math.max(0, +el.value || 0) : el.value;
    if (['m', 'd'].includes(k) && r.p) { r.p = 0; el.closest('tr').classList.remove('pend'); }
    if (k === 't') el.closest('tr').className = r.t;
    calcular();
  });
  $('t-tabla').addEventListener('click', (e) => { const q = e.target.closest('[data-quita]'); if (q) { filas.splice(+q.dataset.quita, 1); pintar(); calcular(); } });
  $('t-agregar').addEventListener('click', () => { filas.push({ t: 'imp', c: 'Nuevo eslabón', a: '', n: 'L', i: 0, d: 0, m: 0, f: '' }); pintar(); calcular(); });
  $('t-encadenar').addEventListener('click', () => {
    ['imp', 'ret'].forEach((t) => { let dia = t === 'ret' ? filas.filter((r) => r.t === 'imp').reduce((s, r) => s + (+r.d || 0), 0) : 0;
      filas.filter((r) => r.t === t).forEach((r) => { r.i = dia; dia += +r.d || 0; }); });
    pintar(); calcular();
  });
  $('t-paralelo').addEventListener('click', () => { filas.forEach((r) => { r.i = 0; }); pintar(); calcular(); });
  ['t-kg', 't-fx'].forEach((id) => $(id).addEventListener('input', calcular));
  $('t-csv').addEventListener('click', csv);
  $('imprimir2').addEventListener('click', () => window.print());
  $('t-reset').addEventListener('click', () => cargar(BASE));
  $('t-guardar').addEventListener('click', () => {
    const d = { op: $('t-op').value, cont: $('t-cont').value, kg: $('t-kg').value, fx: $('t-fx').value, filas };
    try { localStorage.setItem(CLAVE, JSON.stringify(d)); aviso('Guardado en este equipo.'); } catch (e) { aviso('No se pudo guardar en este navegador.'); }
  });

  // Pestañas
  const pest = document.querySelectorAll('.pest');
  function abrir(p) {
    pest.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.p === p)));
    document.querySelectorAll('.panel').forEach((x) => { x.hidden = x.id !== 'p-' + p; });
  }
  pest.forEach((b) => b.addEventListener('click', () => { abrir(b.dataset.p); history.replaceState(null, '', b.dataset.p === 'traza' ? '#trazabilidad' : '#'); }));
  if (location.hash === '#trazabilidad') abrir('traza');

  // Inicio
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { d = null; }
  cargar(d && d.filas ? d : BASE);
})();
