import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-300 to-red-300 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/30 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-red-500/30 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-orange-700/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-lg font-bold text-slate-800">Sign in to manage your email jobs</p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-base font-bold text-slate-900 mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full font-bold bg-white/70 border-2 border-white/80 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:border-transparent transition-all shadow-inner"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-900 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full font-bold bg-white/70 border-2 border-white/80 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:border-transparent transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <Link href="/dashboard" className="block w-full">
              <button 
                type="button"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-extrabold text-lg rounded-xl px-4 py-3 shadow-xl shadow-orange-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </button>
            </Link>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 font-bold bg-white/60 backdrop-blur-md rounded-full text-slate-800">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google`} className="w-full">
              <button type="button" className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-xl px-4 py-3 transition-colors border-2 border-slate-300 shadow-md cursor-pointer">
                Google
              </button>
            </a>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/github`} className="w-full">
              <button type="button" className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-xl px-4 py-3 transition-colors border-2 border-slate-300 shadow-md cursor-pointer">
                GitHub
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
