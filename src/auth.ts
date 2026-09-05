import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials);
        if (!parsed.success) return null;

        const user = await getDb().user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true, email: true, name: true, passwordHash: true },
        });
        if (!user?.passwordHash) return null;

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
