import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ADMIN_COOKIE, isAdminAuthed, matchesAdminSecret } from "@/lib/admin/auth";
import { getAdminStats } from "@/lib/admin/stats";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  "use server";
  const secret = String(formData.get("secret") ?? "");
  if (!matchesAdminSecret(secret)) redirect("/admin?error=1");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!(await isAdminAuthed())) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-muted">Enter the ADMIN_SECRET for this deployment.</p>

        {!env.adminSecret ? (
          <p className="mt-5 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
            ADMIN_SECRET isn&apos;t set on the server, so the dashboard is disabled. Set it in your
            environment and redeploy.
          </p>
        ) : (
          <form action={login} className="mt-6 space-y-3">
            <Input name="secret" type="password" placeholder="Admin secret" autoFocus required />
            <Button type="submit" size="lg" className="w-full">
              Unlock dashboard
            </Button>
            {error ? <p className="text-sm text-ember">That secret didn&apos;t match.</p> : null}
          </form>
        )}
      </main>
    );
  }

  const stats = await getAdminStats();
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: stats.currency });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            RoastMe AI · Admin
          </h1>
          <p className="mt-1 text-sm text-muted">Live numbers from this deployment&apos;s database.</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sessions" value={stats.totalSessions} />
        <Stat label="Roasts generated" value={stats.roastsGenerated} />
        <Stat label="Free roasts" value={stats.freeRoasts} />
        <Stat label="Paid roasts" value={stats.paidSessions} accent />
        <Stat label="Paywall views" value={stats.paywallViews} />
        <Stat label="Checkout starts" value={stats.checkoutStarts} />
        <Stat
          label="Paywall → paid"
          value={`${stats.conversionRate.toFixed(1)}%`}
          hint={`${stats.checkoutConversionRate.toFixed(1)}% of checkout starts`}
        />
        <Stat label="Revenue" value={money.format(stats.revenueCents / 100)} accent />
        <Stat label="Share clicks" value={stats.shareClicks} />
        <Stat label="Card downloads" value={stats.shareDownloads} />
        <Stat label="Emails captured" value={stats.emailCaptures} />
        <Stat label="Roast levels" value={stats.levels.map((l) => `${l.key} ${l.count}`).join(" · ") || "—"} />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardEyebrow>Top roast categories</CardEyebrow>
          <div className="mt-5 space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="text-sm text-muted">No roasts yet.</p>
            ) : (
              stats.topCategories.map((category) => {
                const max = stats.topCategories[0].count || 1;
                return (
                  <div key={category.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-chalk/90">{category.label}</span>
                      <span className="tabular-nums text-muted">{category.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-flame to-ember"
                        style={{ width: `${(category.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardEyebrow>Recent payments</CardEyebrow>
          <div className="mt-5 space-y-2.5">
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-muted">No payments yet.</p>
            ) : (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-white/[0.025] px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-chalk">
                      {payment.product} · {payment.providerOrderId}
                    </p>
                    <p className="truncate text-xs text-muted/70">
                      {new Date(payment.createdAt).toLocaleString()} · session {payment.sessionId.slice(0, 8)}
                    </p>
                  </div>
                  <span
                    className={
                      payment.status === "PAID"
                        ? "shrink-0 rounded-full bg-acid/15 px-2.5 py-1 text-xs font-semibold text-acid"
                        : "shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-muted"
                    }
                  >
                    {money.format(payment.amount / 100)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 ${accent ? "border-flame/40" : ""}`}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${accent ? "text-gradient-flame" : "text-chalk"}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted/70">{hint}</p> : null}
    </div>
  );
}
