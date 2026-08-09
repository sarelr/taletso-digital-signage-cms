import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

async function authenticate(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=credentials");
    throw error;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e4ac45] text-xl font-black text-[#07172c]">T</div>
          <h1 className="text-2xl font-bold text-[#07172c]">Taletso Digital Signage CMS</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your authorised college account.</p>
        </div>
        {params.error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Invalid email address or password.</div>}
        <form action={authenticate} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">Email address<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b07822]" placeholder="name@taletso.edu.za" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b07822]" /></label>
          <button type="submit" className="w-full rounded-xl bg-[#07172c] px-4 py-3 font-semibold text-white hover:bg-[#102947]">Sign in</button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">Access is restricted to authorised Taletso TVET College and technical administration users.</p>
      </section>
    </main>
  );
}
