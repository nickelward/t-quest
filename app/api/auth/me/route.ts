import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("tq-token")?.value;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 401 });
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET) as { userId: number };
    return NextResponse.json({ userId: user.userId });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
