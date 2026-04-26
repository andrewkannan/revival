import Hero from '@/components/Hero';
import RegistrationWizard from '@/components/RegistrationWizard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black">
      <Hero />
      
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-white">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-poster-accent-bright">Experience the Next Level</h2>
            <p className="text-poster-accent text-lg mb-4">
              We've re-engineered the conference experience from the ground up. 
              Enjoy a seamless registration process powered by a robust backend.
            </p>
            <p className="text-poster-accent text-lg">
              Interact with the shapes above—throw them around, watch them collide.
              That's the level of dynamic performance we're bringing to REVIVAL.
            </p>
          </div>
          <div id="registration" className="bg-poster-bg-light/50 border border-poster-accent/20 rounded-2xl p-8 backdrop-blur-sm shadow-xl scroll-mt-12">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-white uppercase tracking-wide">Get Your Revival Seats Now</h3>
            <RegistrationWizard />
          </div>
        </div>
      </section>
    </main>
  );
}
