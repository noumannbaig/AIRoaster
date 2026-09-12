import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoastInput } from "@/components/RoastInput";

export const metadata: Metadata = {
  title: "Start your roast",
  description: "Hand over the evidence. The AI will handle the rest.",
};

export default async function RoastPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-flame/12 blur-[130px]"
        />
        <div className="relative">
          <RoastInput referredBy={ref} />
        </div>
      </main>
      <Footer />
    </>
  );
}
