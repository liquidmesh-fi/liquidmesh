import {
  LandingNav,
  Hero,
  StatsBar,
  Features,
  HowItWorks,
  X402Section,
  FAQ,
  CTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main>
      <LandingNav />
      <div className="relative">
        <Hero />
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <StatsBar />
        </div>
      </div>
      <Features />
      <HowItWorks />
      <X402Section />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
