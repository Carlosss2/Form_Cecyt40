function leerRegistros() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}

function guardarRegistros(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function fetchConTimeout(url, opciones, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms || 6000);
  return fetch(url, Object.assign({}, opciones, { signal: ctrl.signal })).finally(() => clearTimeout(t));
}

async function sincronizarConHoja(nuevo) {
  if (!WAA_URL) return false;
  try {
    await fetchConTimeout(WAA_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(nuevo),
      redirect: "follow"
    }, 8000);
    return true;
  } catch (e) {
    return false;
  }
}

async function conteoRealEnHoja(idClub) {
  if (!WAA_URL) return null;
  try {
    const res = await fetchConTimeout(WAA_URL + "?accion=conteos", { method: "GET", redirect: "follow" }, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.conteos && data.conteos[idClub]) || 0;
  } catch (e) {
    return null;
  }
}

function contarPorClub() {
  const conteo = {};
  CLUBS.forEach(c => conteo[c.id] = 0);
  leerRegistros().forEach(r => { if (conteo[r.club] !== undefined) conteo[r.club]++; });
  return conteo;
}

function estadoGlobal() {
  return leerRegistros().length;
}

function actualizarContador() {
  const n = estadoGlobal();
  const top = document.getElementById("topCount");
  if (top) top.textContent = n;

  const notice = document.getElementById("msgCapacidad");
  const formCard = document.getElementById("formCard");
  if (n >= TOTAL_ALUMNOS) {
    notice.hidden = false;
    notice.innerHTML = "Los <strong>226 cupos</strong> han sido ocupados. La inscripción está cerrada por hoy.";
    document.getElementById("paso1").hidden = true;
    document.getElementById("paso2").hidden = true;
  } else if ((TOTAL_ALUMNOS - n) <= 15) {
    notice.hidden = false;
    notice.innerHTML = "Quedan <strong>" + (TOTAL_ALUMNOS - n) + " lugares</strong> disponibles de 226. ¡Apresúrate!";
  } else {
    notice.hidden = true;
  }
  return n;
}

function msgError(texto) {
  const el = document.getElementById("msgError");
  el.hidden = false;
  el.textContent = texto;
  setTimeout(() => { el.hidden = true; }, 4000);
}

function normaliza(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

function yaRegistrado(ap, am, nombre) {
  const clave = normaliza(ap + " " + am + " " + nombre);
  return leerRegistros().some(r => normaliza(r.ap + " " + r.am + " " + r.nombre) === clave);
}

/* ---------- Estado del wizard ---------- */
const state = { ap: "", am: "", nombre: "", grupo: "", especialidad: "", club: "" };

const grupos = ["A", "B", "C", "D", "E", "F"];
const especialidades = ["Mecatrónica", "Laboratorista Químico", "Ventas"];

function inicializarPills() {
  grupos.forEach(g => {
    const b = document.querySelector('#grupoGroup button[data-value="' + g + '"]');
    b.addEventListener("click", () => {
      grupos.forEach(x => document.querySelector('#grupoGroup button[data-value="' + x + '"]').classList.remove("selected"));
      b.classList.add("selected");
      state.grupo = g;
    });
  });
  especialidades.forEach(e => {
    const b = document.querySelector('#especialidadGroup button[data-value="' + e + '"]');
    b.addEventListener("click", () => {
      especialidades.forEach(x => document.querySelector('#especialidadGroup button[data-value="' + x + '"]').classList.remove("selected"));
      b.classList.add("selected");
      state.especialidad = e;
    });
  });
}

function renderizarClubes() {
  const conteo = contarPorClub();
  const grid = document.getElementById("clubGrid");
  grid.innerHTML = "";

  CLUBS.forEach((club, idx) => {
    const n = conteo[club.id];
    const lleno = n >= LIMITE_CLUB;
    const pct = Math.min(100, Math.round((n / LIMITE_CLUB) * 100));

    const label = document.createElement("label");
    label.className = "club-option" + (lleno ? " full" : "");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "club";
    input.value = club.id;
    input.disabled = lleno;
    input.addEventListener("change", () => { state.club = club.id; });

    const card = document.createElement("span");
    card.className = "club-card";
    card.innerHTML =
      '<span class="club-head">' +
        '<span class="club-name">' + club.nombre + '</span>' +
        '<span class="check-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>' +
      '</span>' +
      '<span class="club-meta">' + club.meta + '</span>' +
      '<span class="cap">' +
        '<span class="cap-row"><span>Cupo</span><b>' + n + ' / ' + LIMITE_CLUB + '</b></span>' +
        '<span class="cap-bar"><span class="cap-fill ' + (lleno ? "full" : (n >= (LIMITE_CLUB - 5) ? "warn" : "")) + '" style="width:' + pct + '%"></span></span>' +
      '</span>' +
      (lleno ? '<span class="tag-lleno">Cupo lleno</span>' : (n >= (LIMITE_CLUB - 5) ? '<span class="tag-casi">Quedan pocos lugares</span>' : ''));

    label.appendChild(input);
    label.appendChild(card);
    grid.appendChild(label);
  });
}

/* ---------- Flujo ---------- */
function irPaso2() {
  const ap = document.getElementById("ap").value.trim();
  const am = document.getElementById("am").value.trim();
  const nombre = document.getElementById("nombre").value.trim();

  if (!ap || !am || !nombre) return msgError("Completa los tres campos de tu nombre.");
  if (!state.grupo) return msgError("Selecciona tu grupo.");
  if (!state.especialidad) return msgError("Selecciona tu especialidad.");

  if (yaRegistrado(ap, am, nombre)) {
    return msgError("Este alumno ya está registrado en un club.");
  }

  state.ap = ap.charAt(0).toUpperCase() + ap.slice(1);
  state.am = am.charAt(0).toUpperCase() + am.slice(1);
  state.nombre = nombre.replace(/\b\w/g, c => c.toUpperCase());

  document.getElementById("paso1").hidden = true;
  document.getElementById("paso2").hidden = false;
  document.getElementById("stepDot1").classList.add("done");
  const luz = document.querySelector(".step-line");
  luz.classList.remove("empty", "fill");
  requestAnimationFrame(() => luz.classList.add("fill"));
  document.getElementById("saludoClub").innerHTML =
    state.ap + " " + state.am + ", " + state.nombre +
    " · Grupo <strong>" + state.grupo + "</strong> · " +
    state.especialidad + ". Elige un club:";

  state.club = "";
  renderizarClubes();
  document.getElementById("btnEnviar").innerHTML = "Confirmar inscripción <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12l14 0M13 6l6 6-6 6\"/></svg>";
}

async function registrar() {
  if (!state.club) return msgError("Selecciona un club para continuar.");

  let enClub = leerRegistros().filter(r => r.club === state.club).length;

  const enHoja = await conteoRealEnHoja(state.club);
  if (enHoja !== null) enClub = enHoja;

  if (enClub >= LIMITE_CLUB) {
    renderizarClubes();
    return msgError("Ese club ya alcanzó su cupo de " + LIMITE_CLUB + " alumnos. Elige otro.");
  }
  if (leerRegistros().length >= TOTAL_ALUMNOS) return msgError("Los 226 lugares ya fueron ocupados.");

  const id = "C40-" + String(Date.now()).slice(-8) + "-" + Math.floor(Math.random() * 90 + 10);
  const nuevo = {
    id: id,
    ap: state.ap,
    am: state.am,
    nombre: state.nombre,
    grupo: state.grupo,
    especialidad: state.especialidad,
    club: state.club,
    fecha: new Date().toISOString()
  };

  const registros = leerRegistros();
  registros.push(nuevo);
  guardarRegistros(registros);

  const envio = await sincronizarConHoja(nuevo);
  mostrarConfirmacion(nuevo, envio);
  actualizarContador();
  limpiar();
}

function limpiar() {
  state.ap = state.am = state.nombre = state.grupo = state.especialidad = state.club = "";
  ["ap", "am", "nombre"].forEach(id => document.getElementById(id).value = "");
  document.querySelectorAll(".pill.selected").forEach(p => p.classList.remove("selected"));
}

function mostrarConfirmacion(r, envio) {
  const club = CLUBS.find(c => c.id === r.club) || {};
  document.getElementById("paso1").hidden = true;
  document.getElementById("paso2").hidden = true;
  document.getElementById("confirmacion").hidden = false;
  document.getElementById("stepDot2").classList.add("done");
  document.getElementById("confNombre").textContent = r.nombre + " " + r.ap + " " + r.am;

  const estadoSync = document.getElementById("syncEstado");
  if (WAA_URL) {
    estadoSync.hidden = false;
    estadoSync.textContent = envio
      ? "Tu registro se envió a la plataforma oficial."
      : "Registro guardado en este equipo. Se intentará enviar a la plataforma oficial cuando haya conexión.";
  } else {
    estadoSync.hidden = true;
  }

  const fecha = new Date(r.fecha).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  document.getElementById("confTicket").innerHTML =
    '<div class="ticket-head">Pase de inscripción · CECyT 40</div>' +
    '<div class="ticket-body">' +
      '<div class="t-row"><span>Folio</span><span class="t-folio">' + r.id + '</span></div>' +
      '<div class="t-row"><span>Club</span><span>' + club.nombre + '</span></div>' +
      '<div class="t-row"><span>Grupo</span><span>' + r.grupo + '</span></div>' +
      '<div class="t-row"><span>Especialidad</span><span>' + r.especialidad + '</span></div>' +
      '<div class="t-row"><span>Fecha</span><span>' + fecha + '</span></div>' +
    '</div>';
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarPills();
  renderizarClubes();
  actualizarContador();

  document.getElementById("paso1").addEventListener("submit", e => { e.preventDefault(); irPaso2(); });
  document.getElementById("paso2").addEventListener("submit", e => { e.preventDefault(); registrar(); });
  document.getElementById("btnAtras").addEventListener("click", () => {
    document.getElementById("paso2").hidden = true;
    document.getElementById("confirmacion").hidden = true;
    document.getElementById("paso1").hidden = false;
    document.querySelector(".step-line").classList.add("empty");
    document.querySelector(".step-line").classList.remove("fill");
    document.getElementById("stepDot1").classList.remove("done");
  });
  document.getElementById("btnOtro").addEventListener("click", () => {
    document.getElementById("confirmacion").hidden = true;
    document.getElementById("formCard").scrollIntoView({ behavior: "smooth" });
  });
});