import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      location: true,
    },
  });

  if (!user) throw new Error("User not found");

  return {
    ...user,
    permissionKeys: user.role.permissions.map((item) => item.permission.key),
  };
}
