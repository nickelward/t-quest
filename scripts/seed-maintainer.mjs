import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const isDevelopment =
  process.env.APP_ENV === "development" &&
  process.env.NODE_ENV !== "production";
const isIsolatedStaging =
  process.env.APP_ENV === "staging" &&
  process.env.MAINTAINER_SEED_ENABLED === "true" &&
  process.env.ISOLATED_STAGING_DB === "true";

if (!isDevelopment && !isIsolatedStaging) {
  console.error(
    "Refusing to create a maintainer account outside development or explicitly isolated staging."
  );
  process.exit(1);
}

const requiredVariables = [
  "DATABASE_URL",
  "MAINTAINER_EMAIL",
  "MAINTAINER_USERNAME",
  "MAINTAINER_FIRST_NAME",
  "MAINTAINER_LAST_NAME",
  "MAINTAINER_PASSWORD",
];
const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim()
);

if (missingVariables.length > 0) {
  console.error(`Missing required environment values: ${missingVariables.join(", ")}`);
  process.exit(1);
}

const email = process.env.MAINTAINER_EMAIL.trim().toLowerCase();
const username = process.env.MAINTAINER_USERNAME.trim();
const firstName = process.env.MAINTAINER_FIRST_NAME.trim();
const lastName = process.env.MAINTAINER_LAST_NAME.trim();
const password = process.env.MAINTAINER_PASSWORD;

if (password.length < 12) {
  console.error("MAINTAINER_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await client.query(
    `INSERT INTO users (first_name, last_name, username, email, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [firstName, lastName, username, email, passwordHash]
  );

  if (result.rowCount === 0) {
    console.error("An account with that email already exists; no changes were made.");
    process.exitCode = 1;
  } else {
    console.log("Maintainer account created. Sign in with its configured email and password.");
  }
} catch (error) {
  console.error("Could not create maintainer account:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}