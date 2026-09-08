# Form_Cecyt40

Inscripción a clubs para alumnos del CECyT 40 «Las Águilas» (Chiapas).

- Formulario público: `index.html`
- Panel administrativo: `admin.html` (PIN: `aguilas40`)
- Cupo de **30 alumnos por club**.
- Los registros se guardan en el navegador (localStorage) y, si configuras Google Sheets, también se envían a tu hoja en tiempo real.

## Conexión a Google Sheets (para ver los datos en tu equipo)

1. Entra a https://sheets.new y crea una hoja de cálculo nueva.
2. En el menú: **Extensiones → Apps Script**.
3. Reemplaza el código por el contenido de `google/Code.gs` y guarda.
4. **Implementar → Nueva implementación → Aplicación web** (type: Web app).
5. Configura:
   - *Ejecutar como:* **Tú (tu cuenta de Google)**
   - *Acceso:* **Cualquier persona** (quien tenga el enlace)
6. Acepta los permisos y copia la **URL de la app** (termina en `/exec`).
7. Abre `js/config.js` y pega:
   - `WAA_URL = "https://script.google.com/macros/s/…/exec"`
   - `SHEET_URL = "https://docs.google.com/spreadsheets/d/…"` (la URL de tu hoja)
8. Sube los cambios a GitHub (GitHub Pages los publica en un par de minutos).

Desde ese momento, cada alumno que se registre aparecerá en tu Google Sheet al instante. Ahí puedes verla y exportarla a Excel (Archivo → Descargar → xlsx). En el panel admin también hay botones **Abrir Google Sheet** y **Sincronizar**.

> Nota: el cupo de 30 por club se verifica contra la hoja antes de cada registro cuando `WAA_URL` está configurado; de lo contrario solo cuenta los registros del dispositivo actual.