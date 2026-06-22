import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';
import { SpotlightCursor } from '@/components/motion/SpotlightCursor';
import { CustomCursor } from '@/components/motion/CustomCursor';
import { KonamiEasterEgg } from '@/components/motion/KonamiEasterEgg';

export default function LandingPage() {
  return (
    <>
      <SpotlightCursor />
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
      <KonamiEasterEgg />
    </>
  );
}
