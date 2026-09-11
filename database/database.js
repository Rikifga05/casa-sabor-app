const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(
    __dirname,
    "..",
    "data",
    "restaurant.db"
);

const db = new Database(dbPath);

console.log("Base de datos conectada correctamente");

module.exports = db;
