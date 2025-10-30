// app/admin/layout.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authHeader = headers().get('authorization');

  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASS;

  if (!validUser || !validPass) {
    throw new Error('ADMIN_USER and ADMIN_PASS must be set in .env.local');
  }

  if (!authHeader) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Login"' },
    });
  }

  const encoded = authHeader.split(' ')[1];
  if (!encoded) {
    return new Response('Bad Request', { status: 400 });
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  if (username !== validUser || password !== validPass) {
    return new Response('Forbidden', {
      status: 403,
      headers: { 'WWW-Authenticate': 'Basic realm="Invalid credentials"' },
    });
  }

  return <>{children}</>;
}
