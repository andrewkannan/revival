import RegistrationWizard from '@/components/RegistrationWizard';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f81838] to-[#2b0308]">
      <section className="w-full flex justify-center bg-black">
        <div className="relative w-full max-w-4xl aspect-[2/3] sm:aspect-auto sm:h-[80vh]">
          <Image 
            src="/revival-kids-poster.jpg" 
            alt="Revival Kids Poster" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </section>
      
      <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto text-white">
        <div id="registration" className="bg-poster-bg-light/50 border border-poster-accent/20 rounded-2xl p-8 md:p-10 backdrop-blur-sm shadow-xl scroll-mt-12">
          <h3 className="text-2xl md:text-3xl font-black mb-8 text-white uppercase tracking-wider text-center drop-shadow-md">Secure your place today</h3>
          <RegistrationWizard />
        </div>
      </section>
    </main>
  );
}
