const { createClient } = require("@libsql/client");

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

console.log("Conexión con Turso configurada correctamente");

module.exports = db;