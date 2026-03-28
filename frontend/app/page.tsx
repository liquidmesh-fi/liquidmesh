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
} from "./_components/landing";

export default function Home() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <X402Section />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
