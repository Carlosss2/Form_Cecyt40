const estadoKey = "cecyt40_admin_ok";

function leerRegistros() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}
function guardarRegistros(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}
function nombreClub(id) {
  const c = CLUBS.find(x => x.id === id);
  return c ? c.nombre : id;
}
function fmtFecha(iso) {
  try {
    return new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return iso; }
}

/* ---------- PIN ---------- */
let autenticado = localStorage.getItem(estadoKey) === "1";

function bloquear() {
  autenticado = false;
  localStorage.removeItem(estadoKey);
  document.getElementById("pinOverlay").style.display = "grid";
  document.getElementById("panelMain").style.display = "none";
}
function desbloquear() {
  autenticado = true;
  localStorage.setItem(estadoKey, "1");
  document.getElementById("pinOverlay").style.display = "none";
  document.getElementById("panelMain").style.display = "block";
}

function intentarPin() {
  const val = document.getElementById("pinInput").value;
  if (val === ADMIN_PIN) { desbloquear(); renderAll(); }
  else {
    const err = document.getElementById("pinErr");
    err.textContent = "PIN incorrecto.";
    const overlay = document.getElementById("pinOverlay");
    overlay.classList.remove("shake");
    void overlay.offsetWidth;
    overlay.classList.add("shake");
  }
}

/* ---------- Render ---------- */
function renderAll() {
  const registros = leerRegistros();

  document.getElementById("topCount").textContent = registros.length;

  const ocupados = registros.length;
  const pctGlobal = Math.round((ocupados / 227) * 100);

  let totalCupos = 0, cuposOcupados = 0;
  const conteo = {};
  CLUBS.forEach(c => conteo[c.id] = 0);
  registros.forEach(r => { if (conteo[r.club] !== undefined) conteo[r.club]++; });

  document.getElementById("statsGrid").innerHTML =
    statCard(ocupados, "Inscripciones", pctGlobal, (ocupados / TOTAL_ALUMNOS) * 100, "accent") +
    CLUBS.map(c => {
      const n = conteo[c.id];
      totalCupos += LIMITE_CLUB;
      cuposOcupados += n;
      return statCard(n, c.nombre, (n / LIMITE_CLUB) * 100, (n / LIMITE_CLUB) * 100);
    }).join("");

  document.getElementById("clubMeter").innerHTML =
    '<div class="meter-row">' +
      '<div class="meter-top"><b>Ocupación total de clubs</b><span class="cnt"><em>' + cuposOcupados + '</em> / ' + totalCupos + ' lugares (' + Math.round((cuposOcupados / totalCupos) * 100) + '%)</span></div>' +
      '<div class="meter-bar"><span class="meter-fill ' + (cuposOcupados >= totalCupos ? "full" : cuposOcupados >= (totalCupos - 20) ? "warn" : "") + '" style="width:' + (cuposOcupados / totalCupos * 100) + '%"></span></div>' +
    '</div>' +
    CLUBS.map(c => {
      const n = conteo[c.id];
      const pct = Math.round((n / LIMITE_CLUB) * 100);
      const clase = n >= LIMITE_CLUB ? "full" : n >= (LIMITE_CLUB - 5) ? "warn" : "";
      return '<div class="meter-row">' +
        '<div class="meter-top"><b>' + c.nombre + '</b><span class="cnt"><em>' + n + '</em> / ' + LIMITE_CLUB + ' · ' + pct + '%' + (n >= LIMITE_CLUB ? ' · lleno' : '') + '</span></div>' +
        '<div class="meter-bar"><span class="meter-fill ' + clase + '" style="width:' + Math.min(100, pct) + '%"></span></div>' +
      '</div>';
    }).join("");

  const filtroClub = document.getElementById("filtroClub");
  if (filtroClub.options.length === 1) {
    CLUBS.forEach(c => {
      const op = document.createElement("option");
      op.value = c.id; op.textContent = c.nombre;
      filtroClub.appendChild(op);
    });
  }

  renderTabla();
}

function statCard(num, label, pct, width, cls) {
  return '<div class="stat-card ' + (cls || "") + '">' +
    '<div class="num">' + num + '</div>' +
    '<div class="label">' + label + '</div>' +
    '<div class="bar"><span style="width:' + Math.min(100, Math.max(0, width)) + '%"></span></div>' +
  '</div>';
}

function renderTabla() {
  const registros = leerRegistros();
  const q = normaliza(document.getElementById("busqueda").value);
  const fc = document.getElementById("filtroClub").value;

  const lista = registros
    .filter(r => !fc || r.club === fc)
    .filter(r => {
      if (!q) return true;
      return normaliza(r.ap + " " + r.am + " " + r.nombre + " " + r.grupo + " " + r.id).includes(q);
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  document.getElementById("rowCount").textContent = lista.length + " de " + registros.length;
  document.getElementById("emptyState").hidden = registros.length > 0;
  document.getElementById("tbody").innerHTML = lista.length
    ? lista.map(r =>
        '<tr>' +
          '<td class="t-folio" style="font-size:.78rem">' + r.id + '</td>' +
          '<td><strong>' + r.nombre + '</strong> ' + r.ap + ' ' + r.am + '</td>' +
          '<td><span class="chip">' + r.grupo + '</span></td>' +
          '<td class="td-muted">' + r.especialidad + '</td>' +
          '<td class="td-club">' + nombreClub(r.club) + '</td>' +
          '<td class="td-muted">' + fmtFecha(r.fecha) + '</td>' +
          '<td style="text-align:right"><button class="btn-del" data-id="' + r.id + '" title="Eliminar">✕</button></td>' +
        '</tr>'
      ).join("")
    : "";

  document.querySelectorAll(".btn-del").forEach(b =>
    b.addEventListener("click", () => eliminarRegistro(b.dataset.id)));
}

function eliminarRegistro(id) {
  if (!confirm("¿Eliminar este registro de forma permanente?")) return;
  let lista = leerRegistros();
  lista = lista.filter(r => r.id !== id);
  guardarRegistros(lista);
  renderAll();
}

/* ---------- Exportar / respaldo ---------- */
function descargar(contenido, mime, nombre) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function exportarExcel() {
  const registros = leerRegistros();
  if (!registros.length) return alert("No hay registros para exportar.");

  const filas = registros.map(r => ({
    Folio: r.id,
    "Apellido paterno": r.ap,
    "Apellido materno": r.am,
    "Nombre(s)": r.nombre,
    Grupo: r.grupo,
    Especialidad: r.especialidad,
    Club: nombreClub(r.club),
    Fecha: fmtFecha(r.fecha)
  }));

  let exito = false;
  try {
    if (typeof XLSX !== "undefined") {
      const ws = XLSX.utils.json_to_sheet(filas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inscripciones");
      ws["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 20 }, { wch: 24 }, { wch: 18 }];
      XLSX.writeFile(wb, "cecyt40-las-aguilas-inscripciones.xlsx");
      exito = true;
    }
  } catch (e) {}
  if (!exito) {
    const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + filas.map(f => Object.values(f).map(esc).join(",")).join("\r\n");
    descargar(csv, "text/csv;charset=utf-8;", "cecyt40-las-aguilas-inscripciones.csv");
    alert("Excel no disponible; se descargó un archivo CSV compatible (ábrelo con Excel).");
  }
}

function exportarBackup() {
  const registros = leerRegistros();
  if (!registros.length) return alert("No hay registros para respaldar.");
  descargar(JSON.stringify(registros, null, 2), "application/json", "cecyt40-respaldo-" + new Date().toISOString().slice(0, 10) + ".json");
}

function restaurarBackup(archivo) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const datos = JSON.parse(reader.result);
      if (!Array.isArray(datos)) throw new Error("formato");
      const validos = datos.filter(r => r && r.id && r.nombre && r.club);
      if (!confirm("Se restaurarán " + validos.length + " registros sobre los " + leerRegistros().length + " actuales. ¿Continuar?")) return;
      guardarRegistros(validos);
      renderAll();
      alert("Respaldo restaurado correctamente.");
    } catch (e) {
      alert("El archivo no es un respaldo válido de esta aplicación.");
    }
  };
  reader.readAsText(archivo);
}

function normaliza(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnPin").addEventListener("click", intentarPin);
  document.getElementById("pinInput").addEventListener("keydown", e => { if (e.key === "Enter") intentarPin(); });
  document.getElementById("btnExcel").addEventListener("click", exportarExcel);
  document.getElementById("btnBackup").addEventListener("click", exportarBackup);
  document.getElementById("btnRestore").addEventListener("click", () => document.getElementById("fileRestore").click());
  document.getElementById("fileRestore").addEventListener("change", e => {
    if (e.target.files[0]) restaurarBackup(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btnClear").addEventListener("click", () => {
    if (!confirm("¿Vaciar TODOS los registros? Esta acción no se puede deshacer.")) return;
    guardarRegistros([]);
    renderAll();
  });
  document.getElementById("busqueda").addEventListener("input", renderTabla);
  document.getElementById("filtroClub").addEventListener("change", renderTabla);

  if (autenticado) { desbloquear(); renderAll(); }
  else bloquear();
});