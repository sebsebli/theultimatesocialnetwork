'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#6E7A8A]/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1D]">
        <div className="flex items-center gap-2">
           <span className="text-xl font-serif font-normal tracking-tight text-[#F2F2F2]">cite</span>
        </div>
        
        <div className="flex items-center gap-6 md:gap-8 text-sm font-medium">
          <Link href="/sign-in" className="text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">Log in</Link>
          <Link 
            href="/sign-in"
            className="text-[#F2F2F2] hover:text-white transition-colors decoration-1 underline underline-offset-4 decoration-[#6E7A8A]"
          >
            Request Access
          </Link>
        </div>
      </nav>

      <main className="pt-32 md:pt-40 pb-20">
        
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32 md:mb-48">
          <div className={`transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] tracking-tight text-[#F2F2F2] mb-12 max-w-5xl">
              Social media designed for <br/>
              <span className="text-[#A8A8AA]">the century of complexity.</span>
            </h1>
            
            <div className="flex flex-col md:flex-row gap-12 md:items-start justify-between">
              <div className="max-w-xl space-y-6">
                <p className="text-lg md:text-xl text-[#A8A8AA] leading-relaxed font-light">
                  We are drowning in content but starving for context. 
                </p>
                <p className="text-lg md:text-xl text-[#A8A8AA] leading-relaxed font-light">
                  Cite is a new network built on a simple premise: <strong>Authority should come from being referenced, not from going viral.</strong> We replaced the algorithm with a citation graph, giving you a quiet place to think, write, and connect ideas.
                </p>
              </div>
              
              <div className="flex flex-col gap-5 w-full md:w-auto pt-2">
                <Link 
                  href="/sign-in"
                  className="inline-flex justify-center items-center px-8 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold text-lg rounded-full hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join the Network
                </Link>
                <Link 
                  href="/imprint" 
                  className="inline-flex justify-center items-center px-8 py-4 border border-[#333] text-[#A8A8AA] font-medium text-lg rounded-full hover:border-[#666] hover:text-[#F2F2F2] transition-colors"
                >
                  Read the Manifesto
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Core Problem */}
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto mb-32 border-t border-[#1A1A1D] pt-24">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4">The Problem</h2>
              <h3 className="text-3xl font-serif font-normal text-[#F2F2F2]">The Attention Trap</h3>
            </div>
            <div className="md:col-span-8 space-y-6 text-lg text-[#A8A8AA] font-light leading-relaxed">
              <p>
                Modern feeds are engineered for addiction. They prioritize "engagement"—which usually means outrage, polarization, and superficiality. The result is a fractured reality where ideas are stripped of their origin and nuance is flattened into memes.
              </p>
              <p>
                When you scroll a traditional feed, you are consuming a disjointed stream of consciousness. There is no memory. No structure. No history. Just an endless "now."
              </p>
            </div>
          </div>
        </section>

        {/* How It Works - The Mechanics */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-12 border-b border-[#1A1A1D] pb-4">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-16">
            
            <div className="group">
              <div className="mb-6 h-64 bg-[#0F0F10] border border-[#1A1A1D] rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-6 left-6 right-6">
                  <div className="text-[#6E6E73] font-mono text-xs mb-2">Editor</div>
                  <div className="text-[#A8A8AA] font-serif text-lg">
                    The history of <span className="text-[#F2F2F2] bg-[#6E7A8A]/20 px-1 rounded">[[Internet Sovereignty]]</span> suggests...
                  </div>
                </div>
                <div className="absolute bottom-6 right-6">
                  <div className="bg-[#1A1A1D] px-3 py-1 rounded text-xs text-[#F2F2F2] border border-[#333]">Link created</div>
                </div>
              </div>
              <h3 className="text-2xl font-serif font-normal text-[#F2F2F2] mb-3">1. Inline Citations</h3>
              <p className="text-[#A8A8AA] leading-relaxed">
                Connect your thoughts directly to other posts, topics, or external sources. Linking isn't an afterthought; it's the core interaction. By citing others, you build a web of trust and context.
              </p>
            </div>

            <div className="group">
              <div className="mb-6 h-64 bg-[#0F0F10] border border-[#1A1A1D] rounded-lg p-6 relative overflow-hidden flex flex-col justify-center">
                <div className="space-y-3 opacity-60">
                   <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-[#333]"></div><div className="h-2 w-32 bg-[#1A1A1D] rounded"></div></div>
                   <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-[#333]"></div><div className="h-2 w-48 bg-[#1A1A1D] rounded"></div></div>
                </div>
                <div className="my-4 p-3 border border-[#333] bg-[#0B0B0C] rounded relative z-10 shadow-xl">
                   <div className="flex justify-between items-center text-xs text-[#F2F2F2]">
                      <span>Your Post</span>
                      <span className="text-[#6E6E73]">Cited by 12</span>
                   </div>
                </div>
                <div className="space-y-3 opacity-60">
                   <div className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-[#333]"></div><div className="h-2 w-24 bg-[#1A1A1D] rounded"></div></div>
                </div>
              </div>
              <h3 className="text-2xl font-serif font-normal text-[#F2F2F2] mb-3">2. The Reputation Graph</h3>
              <p className="text-[#A8A8AA] leading-relaxed">
                On Cite, you gain visibility when your work is referenced by others. It is a meritocracy of ideas. Quality rises not because it is loud, but because it is useful.
              </p>
            </div>

            <div className="group">
              <div className="mb-6 h-64 bg-[#0F0F10] border border-[#1A1A1D] rounded-lg p-6 relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                   <div className="text-4xl font-serif text-[#333] mb-2">245</div>
                   <div className="text-xs font-mono uppercase tracking-widest text-[#6E6E73]">Private Likes</div>
                   <div className="mt-4 text-sm text-[#A8A8AA] bg-[#1A1A1D] px-3 py-1 rounded-full inline-block">Visible only to you</div>
                </div>
              </div>
              <h3 className="text-2xl font-serif font-normal text-[#F2F2F2] mb-3">3. Private Signals</h3>
              <p className="text-[#A8A8AA] leading-relaxed">
                Public like counts create performance anxiety and herd behavior. We made them private. Validate good work, but don't perform for the crowd.
              </p>
            </div>

          </div>
        </section>

        {/* Product Visualization - Deep Dive */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <div className="bg-[#0F0F10] border border-[#1A1A1D] rounded-xl p-8 md:p-16 relative overflow-hidden">
             <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                   <h3 className="text-3xl md:text-4xl font-serif font-normal text-[#F2F2F2] mb-4">Navigable Context</h3>
                   <p className="text-[#A8A8AA]">Every post is a portal. Click through the chain of thought.</p>
                </div>
                
                {/* Abstract UI representation of a thread/chain */}
                <div className="space-y-8 relative">
                   <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-[#333] via-[#333] to-transparent"></div>
                   
                   {/* Post 1 */}
                   <div className="relative pl-12">
                      <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#333] rounded-full border-2 border-[#0F0F10]"></div>
                      <div className="text-sm text-[#6E6E73] mb-1">Original Thesis • @alex</div>
                      <p className="text-[#A8A8AA] font-serif text-lg">"Digital minimalist design often fails because it removes <span className="text-[#F2F2F2] underline decoration-[#333] underline-offset-4">[[affordances]]</span> that users actually rely on."</p>
                   </div>

                   {/* Post 2 */}
                   <div className="relative pl-12">
                      <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#6E7A8A] rounded-full border-2 border-[#0F0F10]"></div>
                      <div className="text-sm text-[#6E6E73] mb-1">Rebuttal • @sarah</div>
                      <p className="text-[#F2F2F2] font-serif text-xl">"I disagree. As <span className="text-[#6E7A8A] cursor-pointer hover:underline">@alex</span> mentions, affordances matter, but we must distinguish between utility and clutter. See <span className="text-[#6E7A8A] cursor-pointer hover:underline">[[post:ref-123|The Clutter Tax]]</span>."</p>
                      <div className="mt-4 flex gap-4 text-xs font-mono text-[#6E6E73]">
                         <span>2 Sources</span>
                         <span>Cited by 5</span>
                      </div>
                   </div>
                   
                   {/* Post 3 */}
                   <div className="relative pl-12 opacity-50">
                      <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#333] rounded-full border-2 border-[#0F0F10]"></div>
                      <div className="text-sm text-[#6E6E73] mb-1">Synthesis • @david</div>
                      <p className="text-[#A8A8AA] font-serif text-lg">"Perhaps the middle ground is..."</p>
                   </div>
                </div>
             </div>
             
             {/* Background Mesh */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          </div>
        </section>

        {/* Distinction & Investor Appeal */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32 border-t border-[#1A1A1D] pt-24">
          <div className="grid md:grid-cols-2 gap-20">
             <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4">The Distinction</h2>
                <h3 className="text-3xl font-serif font-normal text-[#F2F2F2] mb-6">Why Cite is Different</h3>
                <p className="text-[#A8A8AA] text-lg leading-relaxed mb-6">
                   Most platforms are ephemeral. They are designed to consume your time and sell your attention. Cite is designed to be an archive.
                </p>
                <p className="text-[#A8A8AA] text-lg leading-relaxed">
                   We are building a protocol for discourse that respects the user's intelligence and data rights. This is infrastructure for the long term.
                </p>
             </div>
             
             <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <h4 className="text-[#F2F2F2] font-medium">Sovereign Data</h4>
                   <p className="text-sm text-[#6E6E73] leading-relaxed">Hosted strictly in the EU (Germany/Finland). Your data is yours. Exportable to open formats (JSON/CSV) at any time.</p>
                </div>
                <div className="space-y-2">
                   <h4 className="text-[#F2F2F2] font-medium">No Ads</h4>
                   <p className="text-sm text-[#6E6E73] leading-relaxed">Our business model is simple: We serve you, not advertisers. Zero tracking pixels. Zero data sales.</p>
                </div>
                <div className="space-y-2">
                   <h4 className="text-[#F2F2F2] font-medium">Transparent Algorithms</h4>
                   <p className="text-sm text-[#6E6E73] leading-relaxed">Explore is optional and transparent. You can see exactly why a post was recommended to you.</p>
                </div>
                <div className="space-y-2">
                   <h4 className="text-[#F2F2F2] font-medium">Verified Humans</h4>
                   <p className="text-sm text-[#6E6E73] leading-relaxed">We prioritize human verification to keep the signal high and the bots out.</p>
                </div>
             </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 md:px-12 max-w-[800px] mx-auto text-center mb-32 pt-12">
          <h2 className="text-4xl md:text-5xl font-serif font-normal text-[#F2F2F2] mb-8 leading-tight">
            The internet was meant to be a library.<br/>
            <span className="text-[#6E6E73]">Let's rebuild it.</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
             <Link 
               href="/sign-in"
               className="inline-block px-10 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold rounded-full hover:bg-white transition-all shadow-lg hover:shadow-white/10"
             >
               Start Your Archive
             </Link>
             <span className="text-[#6E6E73] text-sm">Beta access is currently open.</span>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#1A1A1D] bg-[#0B0B0C] py-12 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <span className="text-lg font-serif font-normal text-[#F2F2F2]">cite</span>
             <span className="text-[#6E6E73] text-sm font-mono border-l border-[#333] pl-4">
               © 2026 Cite Systems GmbH
             </span>
          </div>
          <div className="flex gap-8 text-sm text-[#A8A8AA]">
            <Link href="/imprint" className="hover:text-[#F2F2F2] transition-colors">Imprint</Link>
            <Link href="/privacy" className="hover:text-[#F2F2F2] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#F2F2F2] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
