import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 });
  }

  const pool = getAuthPool();
  if (!pool) return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 });

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email]
    );
    if (!result.rows.length) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const user = result.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("tq-token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
