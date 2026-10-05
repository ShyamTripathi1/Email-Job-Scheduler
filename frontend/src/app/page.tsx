import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations matching the login theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[100px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-300">The Ultimate Email Job Scheduler</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 mb-6 tracking-tight">
          Automate Your Inbox
        </h1>
        
        <p className="mt-4 text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          Schedule, track, and manage all your email jobs in one beautiful dashboard. Never miss a follow-up again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg rounded-xl px-8 py-4 shadow-xl shadow-orange-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
              Login / Get Started
            </button>
          </Link>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/queues`} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl px-8 py-4 backdrop-blur-md transition-all border border-white/10">
              View BullMQ Dashboard
            </button>
          </a>
        </div>
      </main>
      
      <footer className="absolute bottom-8 text-slate-500 text-sm font-medium">
        © {new Date().getFullYear()} Email Job Scheduler. All rights reserved.
      </footer>
    </div>
  );
}
