import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔥</span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              Roast<span className="text-gradient-flame">Me</span> AI
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Your life. Your internet history. Your terrible decisions. Roasted by AI.
          </p>
          <p className="text-xs leading-relaxed text-muted/70">
            Entertainment only. Nothing here is advice of any kind, and the AI does not actually know
            you. It only knows what you typed in.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div className="space-y-2.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/70">
              Product
            </p>
            <Link href="/roast" className="block text-muted transition-colors hover:text-chalk">
              Start a roast
            </Link>
            <Link href="/#example" className="block text-muted transition-colors hover:text-chalk">
              Example roast
            </Link>
            <Link href="/#pricing" className="block text-muted transition-colors hover:text-chalk">
              Pricing
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/70">
              Legal
            </p>
            <Link href="/privacy" className="block text-muted transition-colors hover:text-chalk">
              Privacy
            </Link>
            <Link href="/terms" className="block text-muted transition-colors hover:text-chalk">
              Terms
            </Link>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 w-full max-w-6xl text-xs text-muted/60">
        © {new Date().getFullYear()} RoastMe AI. No feelings were meaningfully protected.
      </p>
    </footer>
  );
}
