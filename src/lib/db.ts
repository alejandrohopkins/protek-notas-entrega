import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;
export type Runner = Sql | postgres.TransactionSql;

declare global {
  var __pgSql: Sql | undefined;
}

function createConnection(): Sql {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL.");
  }
  return postgres(connectionString, {
    ssl: "require",
    // Requerido por el pooler de Supabase en modo transacción (Supavisor).
    prepare: false,
  });
}

export function getDb(): Sql {
  if (!global.__pgSql) {
    global.__pgSql = createConnection();
  }
  return global.__pgSql;
}

/** Traduce placeholders `?` (estilo SQLite, usados en todo el código) a `$1,$2,...` (Postgres). */
function toPositional(sqlText: string): string {
  let i = 0;
  return sqlText.replace(/\?/g, () => `$${++i}`);
}

async function run(
  runner: Runner,
  sqlText: string,
  params: readonly unknown[],
): Promise<Record<string, unknown>[]> {
  const rows = await runner.unsafe(toPositional(sqlText), params as never[]);
  return rows as unknown as Record<string, unknown>[];
}

export async function queryOne<T>(
  sqlText: string,
  params: readonly unknown[] = [],
  runner: Runner = getDb(),
): Promise<T | undefined> {
  const rows = await run(runner, sqlText, params);
  return (rows[0] as T) ?? undefined;
}

export async function queryAll<T>(
  sqlText: string,
  params: readonly unknown[] = [],
  runner: Runner = getDb(),
): Promise<T[]> {
  const rows = await run(runner, sqlText, params);
  return rows as unknown as T[];
}

export async function runInTransaction<T>(fn: (tx: Runner) => Promise<T>): Promise<T> {
  return getDb().begin((tx) => fn(tx)) as Promise<T>;
}

export function nowIso(): string {
  return new Date().toISOString();
}
