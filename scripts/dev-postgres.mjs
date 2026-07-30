import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = new PGlite("./.pglite-data");
const server = new PGLiteSocketServer({ db, port: 5432, host: "127.0.0.1" });

await server.start();
console.log("PGlite Postgres-kompatibler Server läuft auf 127.0.0.1:5432");
