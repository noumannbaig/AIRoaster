import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="text-xl transition-transform duration-300 group-hover:rotate-12">🔥</span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Roast<span className="text-gradient-flame">Me</span> AI
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          <Link href="/#how" className="transition-colors hover:text-chalk">
            How it works
          </Link>
          <Link href="/#example" className="transition-colors hover:text-chalk">
            Example roast
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-chalk">
            Pricing
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-chalk">
            FAQ
          </Link>
        </div>

        <Button asChild size="sm" className="shrink-0">
          <Link href="/roast">Roast me 🔥</Link>
        </Button>
      </nav>
    </header>
  );
}
