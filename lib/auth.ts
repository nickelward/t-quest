import { Pool } from "pg";

const globalForAuth = globalThis as typeof globalThis & {
  tqAuthPool?: Pool;
};

export function getAuthPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForAuth.tqAuthPool) {
    globalForAuth.tqAuthPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return globalForAuth.tqAuthPool;
}
