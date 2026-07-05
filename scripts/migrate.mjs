import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(path.join(dirname, "..", "db", "schema.sql"), "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(schema);
  console.log("Schema applied successfully.");
} finally {
  await client.end();
}
