import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import Hero from './Hero';

const Features = dynamic(() => import('./Features'));
const Demo = dynamic(() => import('./Demo'));
const FeatureShowcase = dynamic(() => import('./FeatureShowcase'));
const FeatureTable = dynamic(() => import('./FeatureTable'));
const BetaBanner = dynamic(() => import('./BetaBanner'));
const Waitlist = dynamic(() => import('./Waitlist'));
const Footer = dynamic(() => import('./Footer'));

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
