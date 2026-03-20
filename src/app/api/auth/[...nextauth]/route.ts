import NextAuth, { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../../lib/prisma';

const providers: NonNullable<NextAuthOptions['providers']> = [];

if (process.env.EMAIL_FROM && process.env.RESEND_API_KEY) {
  const resendApiKey = process.env.RESEND_API_KEY.trim();
  providers.push(
    EmailProvider({
      server: 'smtp://placeholder:placeholder@localhost:2525',
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60,
      async sendVerificationRequest({ identifier, url, provider }) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: 'Logga in på Konstbyte',
            html: `<p>Klicka på länken för att logga in:</p><p><a href="${url}">${url}</a></p><p>Länken är giltig i 24 timmar.</p>`,
            text: `Logga in på Konstbyte: ${url}`
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Resend API error: ${response.status} ${errorText}`);
        }
      }
    })
  );
} else if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'database'
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  logger: {
    error(code, metadata) {
      console.error('NextAuth error:', code, metadata);
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
