import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Marquee } from "@/components/landing/Marquee";
import {
  Categories,
  ExampleRoast,
  Faq,
  FinalCta,
  HowItWorks,
  Pricing,
  SampleShareCards,
  SocialProof,
} from "@/components/landing/Sections";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <SocialProof />
        <HowItWorks />
        <ExampleRoast />
        <Categories />
        <SampleShareCards />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
