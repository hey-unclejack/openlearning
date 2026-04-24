import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectDir = process.cwd();

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

loadLocalEnvFile(".env.local");
loadLocalEnvFile(".env");

function fail(message: string): never {
  throw new Error(message);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    fail(
      `Missing Supabase admin env vars. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ${projectDir}.`,
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function verifySelect(params: {
  resource: string;
  columns: string;
  expectRows?: boolean;
}) {
  const { resource, columns } = params;
  const client = getAdminClient();
  const { error } = await client.from(resource).select(columns).limit(1);

  if (error) {
    fail(`Failed verifying ${resource}: ${error.message}`);
  }
}

async function main() {
  await verifySelect({
    resource: "review_items",
    columns:
      "review_item_id, lesson_id, unit_id, learning_type, importance, last_outcome, last_confidence, needs_reinforcement",
  });

  await verifySelect({
    resource: "review_logs",
    columns:
      "review_item_id, session_type, confidence, response_ms, lesson_id, unit_id, learning_type, outcome",
  });

  await verifySelect({
    resource: "review_learning_type_summary",
    columns:
      "session_id, learning_type, attempts, correct_count, incorrect_count, accuracy, formal_attempts, extra_attempts, last_reviewed_at",
  });

  await verifySelect({
    resource: "review_lesson_hotspots",
    columns: "session_id, lesson_id, attempts, misses, miss_rate, last_reviewed_at",
  });

  console.log("Review database verification passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Review database verification failed: ${message}`);
  process.exit(1);
});
