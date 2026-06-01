import Link from 'next/link';

export default function Home() {
  return (
    <div className="fixed inset-0 z-50 w-full h-screen overflow-hidden bg-black text-white selection:bg-white/30 font-sans">
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
        >
          {/* Swapped broken user URL with a working cinematic placeholder video */}
          <source src="https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4" type="video/mp4" />
        </video>
        {/* Fallback dark overlay just in case video fails */}
        <div className="absolute inset-0 bg-black/40 z-10" />
      </div>

      {/* Top Navigation Pill */}
      <div className="absolute top-8 left-0 right-0 z-50 flex justify-center w-full px-4">
        <nav className="flex items-center gap-1 md:gap-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black mr-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7" /></svg>
          </div>
          <Link href="#" className="px-4 py-2 rounded-full text-[10px] md:text-xs font-semibold tracking-widest text-gray-200 hover:text-white hover:bg-white/10 transition-colors uppercase">Products</Link>
          <Link href="#" className="px-4 py-2 rounded-full text-[10px] md:text-xs font-semibold tracking-widest text-gray-200 hover:text-white hover:bg-white/10 transition-colors uppercase">Research</Link>
          <Link href="#" className="px-4 py-2 rounded-full text-[10px] md:text-xs font-semibold tracking-widest text-gray-200 hover:text-white hover:bg-white/10 transition-colors uppercase">Docs</Link>
          <Link href="#" className="px-4 py-2 rounded-full text-[10px] md:text-xs font-semibold tracking-widest text-gray-200 hover:text-white hover:bg-white/10 transition-colors uppercase">Pricing</Link>
          <Link href="#" className="px-4 py-2 rounded-full text-[10px] md:text-xs font-semibold tracking-widest text-gray-200 hover:text-white hover:bg-white/10 transition-colors uppercase">Contact</Link>
        </nav>
      </div>

      {/* Main Content (Centered) */}
      <main className="relative z-20 flex flex-col items-center justify-center h-full px-4 text-center">
        
        {/* Top Label */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">
            AI-FIRST ASSISTANT
          </span>
        </div>

        {/* Serif Heading */}
        <h1 className="font-serif text-6xl md:text-8xl lg:text-[7.5rem] leading-[1.05] tracking-tight text-[#FAFAFA] drop-shadow-2xl max-w-5xl mx-auto mb-10">
          Superintelligence<br />
          <span className="italic font-light">on-device</span>
        </h1>

        {/* CTA Button */}
        <Link 
          href="/dashboard"
          className="group flex items-center gap-3 px-6 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
        >
          <span className="text-[11px] font-bold tracking-widest text-gray-200 uppercase">
            Launch App
          </span>
          <svg className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </Link>
      </main>
      
    </div>
  );
}
