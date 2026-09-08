const STORAGE_KEY = "cecyt40_registros";
const LIMITE_CLUB = 30;
const TOTAL_ALUMNOS = 226;
const ADMIN_PIN = "aguilas40";

const WAA_URL = "https://script.google.com/macros/s/AKfycbzlnKIF17e6iqAJSQuxqQq-TsUXg8fWPIDgfUaoDsGuezcIBH8O_QWSaFzpNC0s5u7c9A/exec";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/17QVmzXZ3NBLVqYMRZUpsh39ZqhBGmiKDp-XzmgaKy3U/edit?usp=sharing";

const CLUBS = [
  { id: "robotica", nombre: "Robótica", meta: "Construcción y programación de robots" },
  { id: "radio", nombre: "Radio CECyT", meta: "Locución, producción y transmisión en vivo" },
  { id: "codigo40", nombre: "Código 40", meta: "Programación y desarrollo web" },
  { id: "oratoria", nombre: "Oratoria", meta: "Expresión oral y debate · 50 min" },
  { id: "dibujo", nombre: "Dibujo y Pintura", meta: "Arte, trazo y color en una misma clase" },
  { id: "deportes", nombre: "Deportes", meta: "Activación física y competencia" },
  { id: "teatro", nombre: "Teatro Musical", meta: "Actuación, canto y danza" },
  { id: "juegos", nombre: "Club de Razonamiento, Lógica y Estrategia", meta: "Ajedrez, dominó, gato fractal y cubo Rubik" }
];