// @ts-expect-error - bun:sqlite is a Bun built-in with no Node.js typings
import { Database } from "bun:sqlite";
import { SqliteDialect } from "kysely";
import type { Dialect } from "kysely";
import type { SqliteConfig } from "emdash/db";

// Kysely uses stmt.reader to decide whether to call all() or run()
const READER_RE = /^\s*(SELECT|WITH|EXPLAIN|PRAGMA|VALUES)\b/i;

export function createDialect(config: SqliteConfig): Dialect {
	const filePath = config.url.startsWith("file:") ? config.url.slice(5) : config.url;
	const db = new Database(filePath);

	return new SqliteDialect({
		database: {
			close: () => db.close(),
			prepare: (sql: string) => {
				const stmt = db.prepare(sql);
				return {
					reader: READER_RE.test(sql),
					run: (params: ReadonlyArray<unknown>) => stmt.run(params),
					all: (params: ReadonlyArray<unknown>) => stmt.all(params),
					iterate: (params: ReadonlyArray<unknown>) => stmt.iterate(params),
				};
			},
		},
	});
}
