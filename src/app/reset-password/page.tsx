import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { resetPassword } from "@/lib/password-reset";

type Props = { searchParams: Promise<{ token?: string; error?: string; success?: string }> };
const passwordSchema = z.string().min(12).max(128);

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  async function submit(formData: FormData) {
    "use server";
    const token = z.string().min(20).safeParse(formData.get("token"));
    const password = passwordSchema.safeParse(formData.get("password"));
    const confirmation = formData.get("confirmation");
    if (!token.success || !password.success || password.data !== confirmation) {
      redirect(`/reset-password?token=${encodeURIComponent(token.success ? token.data : "")}&error=validation`);
    }
    const changed = await resetPassword(token.data, password.data);
    if (!changed) redirect("/reset-password?error=invalid");
    redirect("/reset-password?success=1");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fff7d1_0,#f7f7f5_38%,#e7eef1_100%)] p-5">
      <section className="card w-full max-w-md p-7" aria-labelledby="reset-heading">
        <h1 id="reset-heading" className="text-center text-3xl font-bold">Reset password</h1>
        {params.success ? <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Your password has been changed. You can now sign in.</p> : null}
        {params.error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{params.error === "validation" ? "Use at least 12 characters and make sure both passwords match." : "This reset link is invalid, expired, or has already been used."}</p> : null}
        {!params.success && params.token ? (
          <form action={submit} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={params.token} />
            <label className="block text-sm font-semibold text-slate-700">New password
              <input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required className="taletso-focus mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Confirm new password
              <input name="confirmation" type="password" minLength={12} maxLength={128} autoComplete="new-password" required className="taletso-focus mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none" />
            </label>
            <button className="w-full rounded-xl border border-[#a66d00] bg-[#f2b705] px-4 py-3 text-sm font-bold hover:bg-[#ffd12a]">Reset password</button>
          </form>
        ) : null}
        {!params.token && !params.success ? <p className="mt-5 text-sm text-slate-600">Request a new reset link to continue.</p> : null}
        <Link href={params.success ? "/login" : "/forgot-password"} className="mt-5 block text-center text-sm font-semibold text-[#8a5a00] hover:underline">{params.success ? "Continue to sign in" : "Request a new link"}</Link>
      </section>
    </main>
  );
}
