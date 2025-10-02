// lib/recaptcha.ts
export async function verifyRecaptcha(token: string): Promise<number> {
  if (!token) return 0;
  try {
    const res = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: 'POST' }
    );
    const data = await res.json();
    return data.score ?? 0;
  } catch (e) {
    console.error('reCAPTCHA verification failed:', e);
    return 0; // Treat as bot
  }
}
