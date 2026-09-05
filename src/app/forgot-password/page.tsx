import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/password-reset";

type Props = { searchParams: Promise<{ sent?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent } = await searchParams;

  async function submit(formData: FormData) {
    "use server";
    const parsed = z.string().email().safeParse(formData.get("email"));
    if (parsed.success) {
      try {
        await requestPasswordReset(parsed.data);
      } catch (error) {
        console.error("Password reset email could not be sent.", error);
      }
    }
    redirect("/forgot-password?sent=1");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fff7d1_0,#f7f7f5_38%,#e7eef1_100%)] p-5">
      <section className="card w-full max-w-md p-7" aria-labelledby="forgot-heading">
        <img src="/taletso-logo.jpg" alt="Taletso TVET College logo" className="mx-auto h-24 w-24 rounded-full object-cover" />
        <h1 id="forgot-heading" className="mt-5 text-center text-3xl font-bold">Forgot password</h1>
        {sent ? (
          <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">If an account matches that email, a reset link has been sent. Check your inbox and spam folder.</p>
        ) : (
          <form action={submit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">Enter your assigned account email. The reset link will expire after 30 minutes.</p>
            <label className="block text-sm font-semibold text-slate-700">Email
              <input name="email" type="email" autoComplete="email" required className="taletso-focus mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none" />
            </label>
            <button className="w-full rounded-xl border border-[#a66d00] bg-[#f2b705] px-4 py-3 text-sm font-bold hover:bg-[#ffd12a]">Send reset link</button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#8a5a00] hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
