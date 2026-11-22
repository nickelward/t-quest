const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-jwt-secret";

const app = require("../server");
const pool = require("../quest-db/db");

const users = new Map();
let nextUserId = 1;
const originalQuery = pool.query;

pool.query = async (query, values) => {
  if (query.includes("SELECT id") && query.includes("WHERE email = $1")) {
    const user = users.get(values[0]);
    return { rows: user ? [user] : [] };
  }

  if (query.includes("INSERT INTO users")) {
    assert.match(query, /VALUES\s*\(\s*\$1,\s*\$2,\s*\$3,\s*\$4,\s*\$5\s*\)/i);
    assert.match(query, /first_name,\s*last_name,\s*username,\s*email,\s*password_hash/i);
    assert.equal(values.length, 5);

    const [firstName, lastName, username, email, passwordHash] = values;
    const user = {
      id: nextUserId++,
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password_hash: passwordHash
    };
    users.set(email, user);
    return {
      rows: [{ id: user.id, username, email }]
    };
  }

  throw new Error(`Unexpected database query: ${query}`);
};

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  pool.query = originalQuery;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    body: await response.json()
  };
}

function jsonPost(body) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

test("register stores a password hash and returns the created user", async () => {
  const result = await request(
    "/auth/register",
    jsonPost({
      first_name: "Test",
      last_name: "User",
      username: "test-user",
      email: " test@example.com ",
      password: "correct-horse"
    })
  );

  assert.equal(result.status, 201);
  assert.deepEqual(result.body, {
    id: 1,
    username: "test-user",
    email: "test@example.com"
  });
  assert.equal(
    await bcrypt.compare("correct-horse", users.get("test@example.com").password_hash),
    true
  );
  assert.equal(users.get("test@example.com").first_name, "Test");
  assert.equal(users.get("test@example.com").last_name, "User");
});

test("register rejects missing fields and duplicate email addresses", async () => {
  const missing = await request(
    "/auth/register",
    jsonPost({
      first_name: "Incomplete",
      last_name: "User",
      username: "incomplete"
    })
  );
  const duplicate = await request(
    "/auth/register",
    jsonPost({
      first_name: "Another",
      last_name: "User",
      username: "another-user",
      email: "test@example.com",
      password: "another-password"
    })
  );
  assert.equal(missing.status, 400);
  assert.equal(duplicate.status, 400);
  assert.equal(duplicate.body.error, "Email already exists");
});

test("login issues a token only for valid credentials", async () => {
  const success = await request(
    "/auth/login",
    jsonPost({
      email: "test@example.com",
      password: "correct-horse"
    })
  );
  const wrongPassword = await request(
    "/auth/login",
    jsonPost({
      email: "test@example.com",
      password: "wrong-password"
    })
  );
  const unknownUser = await request(
    "/auth/login",
    jsonPost({
      email: "missing@example.com",
      password: "correct-horse"
    })
  );

  assert.equal(success.status, 200);
  assert.equal(jwt.verify(success.body.token, process.env.JWT_SECRET).userId, 1);
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownUser.status, 401);
});

test("authenticated identity endpoint rejects missing or invalid tokens", async () => {
  const missing = await request("/auth/me");
  const invalid = await request("/auth/me", {
    headers: { authorization: "Bearer not-a-valid-token" }
  });
  const token = jwt.sign({ userId: 42 }, process.env.JWT_SECRET);
  const authenticated = await request("/auth/me", {
    headers: { authorization: `bEaReR ${token}` }
  });

  assert.equal(missing.status, 401);
  assert.equal(invalid.status, 403);
  assert.equal(authenticated.status, 200);
  assert.deepEqual(authenticated.body, { userId: 42 });
});
