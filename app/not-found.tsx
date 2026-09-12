import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">👻</span>
        <h1 className="mt-7 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Nothing here. Not even a roast.
        </h1>
        <p className="mt-4 text-sm text-muted">
          That link may have expired, or it never existed and someone was messing with you.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href="/roast">Start a roast 🔥</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
