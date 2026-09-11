const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(
    __dirname,
    "..",
    "data",
    "restaurant.db"
);

// Crear la carpeta data si no existe
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

console.log("Base de datos conectada correctamente");

module.exports = db;