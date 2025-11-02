// app/api/userinfo/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/storage"; // we’ll use direct DB lookup

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const db = await connectDB();

    // only return minimal fields — no need for passwordHash or anything sensitive
    const user = await db.collection("users").findOne(
      { email: email.trim().toLowerCase() },
      { projection: { username: 1, email: 1, createdAt: 1 } }
    );

    if (!user) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      username: user.username || "",
      email: user.email,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    });
  } catch (err) {
    console.error("userinfo API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
