import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Demo from './Demo';
import FeatureShowcase from './FeatureShowcase';
import FeatureTable from './FeatureTable';
import BetaBanner from './BetaBanner';
import Waitlist from './Waitlist';
import Footer from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-slate-50/50">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Demo />
        <FeatureShowcase />
        <FeatureTable />
        <BetaBanner />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
