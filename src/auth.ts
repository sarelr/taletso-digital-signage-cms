import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

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
        return { id: "demo-admin", email: parsed.data.email, name: "Taletso Administrator" };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
