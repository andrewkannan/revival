import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Hero />
      
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-white">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience the Next Level</h2>
            <p className="text-slate-400 text-lg mb-4">
              We've re-engineered the conference experience from the ground up. 
              Enjoy a seamless registration process powered by a robust backend.
            </p>
            <p className="text-slate-400 text-lg">
              Interact with the shapes above—throw them around, watch them collide.
              That's the level of dynamic performance we're bringing to REVIVAL.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-6">Quick Registration</h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <button 
                type="button"
                className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-slate-200 transition-colors mt-2"
              >
                Continue to Ticket Selection
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
