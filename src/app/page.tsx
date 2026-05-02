import Hero from '@/components/Hero';
import RegistrationWizard from '@/components/RegistrationWizard';
import Itinerary from '@/components/Itinerary';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black">
      <Hero />
      
      <Itinerary />
      
      <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto text-white">
        <div id="registration" className="bg-poster-bg-light/50 border border-poster-accent/20 rounded-2xl p-8 md:p-10 backdrop-blur-sm shadow-xl scroll-mt-12">
          <h3 className="text-2xl md:text-3xl font-black mb-8 text-white uppercase tracking-wider text-center drop-shadow-md">Secure your place today</h3>
          <RegistrationWizard />
        </div>
      </section>
    </main>
  );
}
