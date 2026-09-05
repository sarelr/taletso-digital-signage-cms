import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (authError) {
      if (authError instanceof AuthError) {
        redirect("/login?error=credentials");
      }
      throw authError;
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fff7d1_0,#f7f7f5_38%,#e7eef1_100%)] p-5">
      <section className="card w-full max-w-md p-7" aria-labelledby="login-heading">
        <img src="/taletso-logo.jpg" alt="Taletso TVET College logo" className="mx-auto h-28 w-28 rounded-full object-cover" />
        <p className="mt-5 text-center text-xs font-bold uppercase tracking-widest text-[#9a6500]">Taletso TVET College</p>
        <h1 id="login-heading" className="mt-2 text-center text-3xl font-bold text-[#111111]">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use your assigned digital-signage operations account.</p>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            The email or password was not accepted.
          </p>
        ) : null}
        <form action={authenticate} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input name="email" type="email" autoComplete="username" required className="taletso-focus mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            <span className="flex items-center justify-between gap-3">
              Password
              <Link href="/forgot-password" className="font-medium text-[#8a5a00] underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </span>
            <input name="password" type="password" autoComplete="current-password" minLength={8} required className="taletso-focus mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none" />
          </label>
          <button type="submit" className="w-full rounded-xl border border-[#a66d00] bg-[#f2b705] px-4 py-3 text-sm font-bold text-[#111111] shadow-sm hover:bg-[#ffd12a]">Sign in securely</button>
        </form>
      </section>
    </main>
  );
}
