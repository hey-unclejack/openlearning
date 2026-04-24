import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const projectDir = process.cwd();
const migrationPath = path.join(
  projectDir,
  "supabase",
  "migrations",
  "202604240001_review_system_upgrade.sql",
);

function loadLocalEnvFile(filename: string) {
  const filePath = path.join(projectDir, filename);

  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getDatabaseUrl() {
  loadLocalEnvFile(".env.local");
  loadLocalEnvFile(".env");
  return process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? null;
}

async function main() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DB_URL for migration execution.");
  }

  if (!existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const sql = readFileSync(migrationPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log("Review DB migration applied successfully.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Review DB migration failed: ${message}`);
  process.exit(1);
});
