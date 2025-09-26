// app/api/auth/login/route.ts (partial update)
// ... existing imports ...

export async function POST(request: NextRequest) {
  // ... existing IP and rate limiting code ...

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // --- Timing Attack Prevention ---
    const dummyHash = await bcrypt.hash('dummy', 12);
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, dummyHash);
    // --- End Timing Attack Prevention ---

    if (!isValid) {
      // --- Track Failed Attempts ---
      // ... existing failed attempt tracking ...
      // --- End Tracking ---
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // ✅ CHECK IF USER IS BANNED
    if (user.isBanned) {
        return Response.json({ error: 'Account has been banned' }, { status: 403 });
    }
    // ✅ END BAN CHECK

    // --- Clear Failed Attempts on Success ---
    // ... existing attempt clearing ...
    // --- End Clearing ---

    (await cookies()).set('biolink_session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
