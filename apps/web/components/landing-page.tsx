'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#A1A1A1] font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/[0.015] blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Global Nav */}
      <nav className="fixed top-6 inset-x-0 z-50 flex justify-center">
        <div className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/[0.06] px-6 py-3 rounded-full flex items-center gap-8 shadow-2xl shadow-black/80 transition-all duration-300 hover:border-white/[0.1]">
          <span className="text-lg font-serif tracking-tight text-white/90">cite</span>
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/sign-in" className="text-[#666] hover:text-white transition-colors">Log in</Link>
            <Link 
              href="/sign-in"
              className="text-[#050505] bg-[#E0E0E0] hover:bg-white px-5 py-2 rounded-full transition-all font-semibold"
            >
              Join Beta
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section - Immediate Clarity */}
        <section className="min-h-screen flex flex-col justify-center items-center px-6 relative pt-32 pb-20">
          <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} w-full max-w-5xl mx-auto`}>
            
            <div className="text-center space-y-10 mb-20">
              {/* Minimal Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-xs font-mono tracking-widest uppercase text-[#666]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  <span>Public Beta Live</span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight leading-[1] text-[#E0E0E0]">
                The Social Network <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#E0E0E0] via-[#A0A0A0] to-[#404040]">for Deep Discourse.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-[#888] max-w-2xl mx-auto leading-relaxed font-light">
                Escape the algorithmic noise. Connect ideas with <span className="text-[#CCC]">inline citations</span>, explore <span className="text-[#CCC]">chronological feeds</span>, and own your data.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  href="/sign-in"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#E0E0E0] text-[#050505] rounded-full transition-all overflow-hidden hover:bg-white hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <span className="relative z-10 text-lg font-bold tracking-tight">Start Your Archive</span>
                  <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/explore" className="text-[#666] hover:text-[#E0E0E0] transition-colors border-b border-transparent hover:border-[#E0E0E0] pb-0.5 text-sm font-medium tracking-wide uppercase">
                  Explore the Network
                </Link>
              </div>
            </div>

            {/* Hero Visual - Concrete Product Example */}
            <div className="relative max-w-2xl mx-auto transform hover:scale-[1.02] transition-transform duration-700">
               {/* Soften the container edges to make it feel less like a "box" */}
               <div className="absolute -inset-2 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2rem] blur-3xl opacity-40"></div>
               <div className="relative bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-8 md:p-10 shadow-2xl">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60 font-serif italic text-xl">S</div>
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="text-[#E0E0E0] font-medium font-sans text-lg">Sebastian Lindner</span>
                              <span className="text-[#444] text-sm font-sans">•</span>
                              <span className="text-[#666] text-sm font-sans">2h</span>
                           </div>
                           <span className="text-[#555] text-sm font-sans">Writing about <span className="hover:text-[#888] transition-colors cursor-pointer">The Attention Economy</span></span>
                        </div>
                     </div>
                     <div className="text-[#333]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                     </div>
                  </div>

                  {/* Post Body - Source Serif 4 */}
                  <div className="space-y-6 text-xl md:text-2xl text-[#B0B0B0] font-serif leading-relaxed">
                     <p>
                        I built cite to challenge a digital order engineered for <strong className="text-[#E0E0E0] font-semibold cursor-pointer hover:text-white transition-colors border-b border-white/10 hover:border-white/30">outrage over truth</strong>—where algorithms reward polarization over diversity, rage over logic, and controversy over accuracy.
                     </p>
                     <p>
                        The future deserves <strong className="text-[#E0E0E0] font-semibold cursor-pointer hover:text-white transition-colors border-b border-white/10 hover:border-white/30">verification over virality</strong>, context over chaos.
                     </p>
                  </div>

                  {/* Quote/Citation Block */}
                  <div className="mt-8 p-6 rounded-lg bg-white/[0.015] border border-white/[0.06] flex gap-5 group cursor-pointer hover:bg-white/[0.03] transition-colors">
                     <div className="w-1 bg-[#333] group-hover:bg-[#555] transition-colors rounded-full"></div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-5 h-5 rounded-full bg-white/10"></div>
                           <span className="text-sm text-[#666] font-sans">Julian S. • Oct 24</span>
                        </div>
                        <p className="text-lg text-[#888] font-serif italic leading-relaxed group-hover:text-[#AAA] transition-colors">"In a world of infinite noise, the most radical act is to curate a signal."</p>
                     </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04] text-[#444]">
                     <div className="flex gap-8">
                        <div className="flex items-center gap-2 hover:text-[#888] transition-colors cursor-pointer group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <div className="flex items-center gap-2 hover:text-[#888] transition-colors cursor-pointer group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <div className="flex items-center gap-2 hover:text-[#CCC] text-[#888] transition-colors cursor-pointer group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> 
                            <span className="text-xs font-medium tracking-wide">Cite</span>
                        </div>
                     </div>
                     <div className="text-xs font-mono text-[#333] uppercase tracking-widest">3 Citations</div>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* The Mechanics of Quality */}
        <section className="py-40 px-6 bg-[#050505] border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-32 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-serif mb-6 text-[#E0E0E0]">Designed for substance.</h2>
              <p className="text-xl text-[#666] leading-relaxed font-light">
                We replaced the mechanics of viral attention with tools for intellectual honesty and connection.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-24">
              
              {/* Feature 1: Private Likes */}
              <div className="group">
                <div className="flex justify-between items-baseline mb-8 border-b border-white/[0.04] pb-4">
                   <h3 className="text-2xl font-serif text-[#E0E0E0]">Authenticity</h3>
                   <span className="text-xs font-mono text-[#444] tracking-widest uppercase">01 — The Mechanic</span>
                </div>
                
                <div className="mb-10 relative">
                   <div className="absolute -inset-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                   <div className="relative bg-[#0A0A0A] border border-white/[0.06] rounded-sm p-10 shadow-2xl">
                      <div className="flex gap-6">
                         <div className="w-10 h-10 rounded-full bg-white/[0.05] flex-shrink-0"></div>
                         <div className="space-y-4 w-full">
                            <div className="h-3 w-32 bg-white/[0.08] rounded-sm"></div>
                            <div className="h-3 w-full bg-white/[0.04] rounded-sm"></div>
                            <div className="h-3 w-2/3 bg-white/[0.04] rounded-sm"></div>
                            
                            <div className="pt-6 flex gap-8 text-[#333]">
                               {/* The Private Like Button */}
                               <div className="flex items-center gap-3 text-white/10 group-hover:text-[#888] transition-colors duration-500">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                  <span className="text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">PRIVATE</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="absolute bottom-10 left-24 text-[#666] text-xs font-mono opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-2 group-hover:translate-y-0">
                         → Only you see this count.
                      </div>
                   </div>
                </div>
                <p className="text-[#8A8A8A] text-lg leading-relaxed font-light">
                   When likes are public, they become a scoreboard. We made them private so you can focus on your thoughts, not your stats. Write because you have something to say.
                </p>
              </div>

              {/* Feature 2: Citations */}
              <div className="group">
                <div className="flex justify-between items-baseline mb-8 border-b border-white/[0.04] pb-4">
                   <h3 className="text-2xl font-serif text-[#E0E0E0]">Web of Trust</h3>
                   <span className="text-xs font-mono text-[#444] tracking-widest uppercase">02 — The Protocol</span>
                </div>

                <div className="mb-10 relative">
                   <div className="absolute -inset-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                   <div className="relative bg-[#0A0A0A] border border-white/[0.06] rounded-sm p-10 shadow-2xl">
                      <div className="flex gap-6">
                         <div className="w-10 h-10 rounded-full bg-white/[0.05] flex-shrink-0"></div>
                         <div className="space-y-6 w-full">
                            <div className="h-3 w-32 bg-white/[0.08] rounded-sm"></div>
                            
                            {/* The Quote Block */}
                            <div className="p-5 rounded-sm border border-white/[0.08] bg-white/[0.01] group-hover:border-white/20 transition-colors duration-500">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="w-4 h-4 rounded-full bg-white/10"></div>
                                  <div className="h-2 w-20 bg-white/[0.06] rounded-sm"></div>
                               </div>
                               <div className="h-2 w-full bg-white/[0.04] rounded-sm mb-2"></div>
                               <div className="h-2 w-3/4 bg-white/[0.04] rounded-sm"></div>
                            </div>
                            
                            <div className="h-3 w-full bg-white/[0.04] rounded-sm"></div>
                         </div>
                      </div>
                   </div>
                </div>
                <p className="text-[#8A8A8A] text-lg leading-relaxed font-light">
                   Context is currency. Our native citation protocol lets you build on the work of others, creating a permanent, navigable chain of ideas. Authority here is earned by being referenced.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Human Intelligence */}
        <section className="py-40 bg-[#050505] border-t border-white/[0.04] overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-24 items-center">
                 <div className="space-y-8">
                    <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-4 max-w-sm">
                       <h3 className="text-2xl font-serif text-[#E0E0E0]">Human Agency</h3>
                       <span className="text-xs font-mono text-[#444] tracking-widest uppercase">03 — The Choice</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-serif leading-[1.1] text-[#E0E0E0]">
                       Human Intelligence. <br/>
                       <span className="text-[#444]">Not AI Dictation.</span>
                    </h2>
                    <div className="space-y-6 text-lg text-[#8A8A8A] leading-relaxed font-light">
                       <p>
                          Every other feed is now a black box. Algorithms decide what you see. AI generates the content. Bots drive the engagement. You are losing control of your own reality.
                       </p>
                       <p>
                          We give it back.
                       </p>
                       <p>
                          We do not train models on your thoughts. We do not curate your feed with engagement-bait scripts. You follow humans. You see what they write. In chronological order. Simple.
                       </p>
                    </div>
                 </div>
                 
                 {/* Visual Comparison - Refined */}
                 <div className="relative pt-12">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent rounded-full blur-[100px]"></div>
                    <div className="relative grid grid-rows-2 gap-6">
                       {/* The "Other" Way - Muted */}
                       <div className="bg-[#080808] border border-white/[0.04] rounded-sm p-8 opacity-40 blur-[1px] hover:blur-0 transition-all duration-700 select-none grayscale hover:grayscale-0">
                          <div className="flex justify-between items-center mb-6">
                             <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">The Algorithm</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-red-900/50"></div>
                          </div>
                          <div className="space-y-4">
                             <div className="h-2 w-full bg-white/[0.04] rounded-full"></div>
                             <div className="h-2 w-5/6 bg-white/[0.04] rounded-full"></div>
                             <div className="h-2 w-full bg-white/[0.04] rounded-full"></div>
                          </div>
                       </div>
                       
                       {/* The CITE Way - Clear */}
                       <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform -translate-y-4 z-10 hover:border-white/20 transition-colors duration-500">
                          <div className="flex justify-between items-center mb-8">
                             <span className="text-[10px] font-mono text-[#A1A1A1] uppercase tracking-widest">Your Feed</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                          </div>
                          <div className="flex items-start gap-5">
                             <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"></div>
                             <div className="space-y-4 w-full">
                                <div className="h-3 w-32 bg-white/20 rounded-sm"></div>
                                <div className="h-3 w-full bg-white/10 rounded-sm"></div>
                                <div className="h-3 w-full bg-white/10 rounded-sm"></div>
                                <div className="h-3 w-2/3 bg-white/10 rounded-sm"></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Deep Dive / Knowledge Graph */}
        <section className="py-40 bg-[#050505] border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6">
             <div className="grid lg:grid-cols-12 gap-16 items-center">
               <div className="lg:col-span-5 space-y-8">
                 <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-4">
                    <h3 className="text-2xl font-serif text-[#E0E0E0]">The Graph</h3>
                    <span className="text-xs font-mono text-[#444] tracking-widest uppercase">04 — The Context</span>
                 </div>
                 
                 <h2 className="text-4xl md:text-5xl font-serif leading-[1.1] text-[#E0E0E0]">
                   Traversable<br/>Knowledge.
                 </h2>
                 <p className="text-lg text-[#8A8A8A] leading-relaxed max-w-md font-light">
                   Every post is a portal. Click on inline topics, citations, and backlinks to navigate through the history of an idea. 
                   <br/><br/>
                   It’s not just a feed; it’s a living network of thought. Fall down the rabbit hole.
                 </p>
               </div>
               
               <div className="lg:col-span-7">
                 {/* Product Shot: Deep Dive */}
                 <div className="relative aspect-[4/3] rounded-sm bg-[#080808] border border-white/[0.06] shadow-2xl p-10 md:p-16 overflow-hidden transition-transform hover:scale-[1.005] duration-700 group">
                    <div className="max-w-xl mx-auto space-y-10 select-none">
                       {/* Post Header */}
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/[0.08]"></div>
                          <div>
                             <div className="h-3 w-24 bg-white/[0.15] rounded-sm mb-2"></div>
                             <div className="h-2 w-16 bg-white/[0.05] rounded-sm"></div>
                          </div>
                       </div>

                       {/* Post Body with Wikilinks - Muted Colors */}
                       <div className="space-y-6 text-xl text-[#888] font-serif leading-relaxed">
                          <p>
                             The concept of <span className="text-[#CCC] border-b border-white/20 pb-0.5 cursor-pointer hover:text-white hover:border-white/40 transition-colors">[[Digital Sovereignty]]</span> is becoming increasingly critical as we move away from <span className="text-[#CCC] border-b border-white/20 pb-0.5 cursor-pointer hover:text-white hover:border-white/40 transition-colors">[[Ad-Funded Models]]</span>.
                          </p>
                          <p>
                             As <span className="text-[#999] border-b border-white/10 pb-0.5 cursor-pointer hover:text-white transition-colors">@Julian</span> argued in <span className="text-[#CCC] border-b border-white/20 pb-0.5 cursor-pointer hover:text-white hover:border-white/40 transition-colors">[[post:the-end-of-attention]]</span>, the user must become the customer again.
                          </p>
                       </div>

                       {/* Reference Footer */}
                       <div className="pt-10 border-t border-white/[0.04]">
                          <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-6">Referenced By</div>
                          <div className="space-y-4 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                             <div className="flex items-center gap-4 p-4 rounded-sm border border-white/[0.04] bg-white/[0.01]">
                                <div className="w-5 h-5 rounded-full bg-white/10"></div>
                                <div className="h-2 w-full bg-white/[0.06] rounded-sm"></div>
                             </div>
                             <div className="flex items-center gap-4 p-4 rounded-sm border border-white/[0.04] bg-white/[0.01]">
                                <div className="w-5 h-5 rounded-full bg-white/10"></div>
                                <div className="h-2 w-3/4 bg-white/[0.06] rounded-sm"></div>
                             </div>
                          </div>
                       </div>
                    </div>
                    {/* Subtle Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none"></div>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* Sovereignty / Trust */}
        <section className="py-40 px-6 border-t border-white/[0.04]">
           <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-xs font-mono text-[#444] tracking-widest uppercase mb-12">05 — The Foundation</h2>
              <p className="text-4xl md:text-6xl font-serif leading-tight mb-20 text-[#E0E0E0]">
                 Your mind is private property.<br/>
                 <span className="text-[#444]">So is your data.</span>
              </p>
              
              <div className="grid md:grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-sm overflow-hidden">
                 <div className="bg-[#050505] p-12 hover:bg-[#080808] transition-colors group">
                    <div className="flex justify-center mb-8">
                       <svg className="w-8 h-8 text-[#333] group-hover:text-[#CCC] transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 className="font-serif text-lg text-[#E0E0E0] mb-3">EU Hosted</h3>
                    <p className="text-[#666] text-sm leading-relaxed">Data stays in Europe. Protected by the world's strongest privacy laws.</p>
                 </div>
                 <div className="bg-[#050505] p-12 hover:bg-[#080808] transition-colors group">
                    <div className="flex justify-center mb-8">
                       <svg className="w-8 h-8 text-[#333] group-hover:text-[#CCC] transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <h3 className="font-serif text-lg text-[#E0E0E0] mb-3">No Ads</h3>
                    <p className="text-[#666] text-sm leading-relaxed">We don't sell your attention. You are the customer, not the product.</p>
                 </div>
                 <div className="bg-[#050505] p-12 hover:bg-[#080808] transition-colors group">
                    <div className="flex justify-center mb-8">
                       <svg className="w-8 h-8 text-[#333] group-hover:text-[#CCC] transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <h3 className="font-serif text-lg text-[#E0E0E0] mb-3">Portable</h3>
                    <p className="text-[#666] text-sm leading-relaxed">Export your entire archive in open formats (JSON/CSV) anytime.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA - Classic & Bold */}
        <section className="py-40 px-6 border-t border-white/[0.04] text-center bg-[#050505]">
           <div className="space-y-12">
              <h2 className="text-5xl md:text-8xl font-serif font-medium tracking-tight leading-[1.1] text-[#E0E0E0]">
                 History is written by<br/>
                 <span className="text-[#333]">those who write.</span>
              </h2>
              <div className="pt-8">
                 <Link 
                   href="/sign-in"
                   className="inline-block px-12 py-5 bg-[#E0E0E0] text-[#050505] font-bold text-lg rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                 >
                   Start Writing
                 </Link>
              </div>
           </div>
        </section>

        <footer className="py-12 px-6 border-t border-white/[0.04]">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono text-[#444] uppercase tracking-widest">
              <p>© 2026 Cite Systems.</p>
              <div className="flex gap-8">
                 <Link href="/privacy" className="hover:text-[#888] transition-colors">Privacy</Link>
                 <Link href="/terms" className="hover:text-[#888] transition-colors">Terms</Link>
                 <Link href="/imprint" className="hover:text-[#888] transition-colors">Imprint</Link>
              </div>
           </div>
        </footer>

      </main>
    </div>
  );
}