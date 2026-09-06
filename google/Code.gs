const NOMBRE_HOJA = "Inscripciones";
const HEADERS = ["id", "apellido_paterno", "apellido_materno", "nombre", "grupo", "especialidad", "club", "fecha"];

function hoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(NOMBRE_HOJA);
  if (!sh) sh = ss.insertSheet(NOMBRE_HOJA);
  if (!sh.getLastRow()) sh.appendRow(HEADERS);
  return sh;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const datos = JSON.parse(e.postData.contents);
  const sh = hoja();
  sh.appendRow(HEADERS.map(h => (datos[h] !== undefined ? datos[h] : "")));
  return json({ ok: true });
}

function doGet(e) {
  const accion = e && e.parameter ? e.parameter.accion || "" : "";
  const sh = hoja();
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).map(r => {
    const o = {};
    HEADERS.forEach((h, i) => (o[h] = r[i]));
    return o;
  });

  if (accion === "conteos") {
    const conteos = {};
    rows.forEach(r => {
      const c = String(r.club || "");
      conteos[c] = (conteos[c] || 0) + 1;
    });
    return json({ conteos });
  }

  return json({ rows });
}