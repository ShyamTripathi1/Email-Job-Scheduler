import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-300 to-red-300 text-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[20%] w-[50%] h-[50%] rounded-full bg-orange-500/20 blur-[120px]" />
      </div>

      <nav className="border-b-2 border-white/50 bg-white/50 backdrop-blur-md sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
                E
              </div>
              <span className="font-black text-2xl tracking-tight text-slate-900">Email Scheduler</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-200 border-2 border-orange-300 shadow-inner"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900">Dashboard</h1>
            <p className="text-lg font-bold text-slate-800">Overview of your email campaigns and jobs.</p>
          </div>
          <button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-6 py-3 rounded-xl font-black text-lg transition-all shadow-xl shadow-orange-600/30 flex items-center gap-2">
            <span>+ Create Job</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Sent", value: "24,593", color: "text-orange-700", trend: "+12%" },
            { label: "Pending Jobs", value: "12", color: "text-amber-700", trend: "-2%" },
            { label: "Failed Deliveries", value: "3", color: "text-red-700", trend: "0%" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm border-2 border-white/60 rounded-2xl p-6 shadow-md">
              <h3 className="text-slate-800 text-base font-bold mb-2">{stat.label}</h3>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-sm text-slate-700 font-extrabold">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm border-2 border-white/60 rounded-2xl overflow-hidden shadow-md">
          <div className="px-6 py-5 border-b-2 border-white/60 bg-white/40">
            <h2 className="text-xl font-black text-slate-900">Recent Jobs</h2>
          </div>
          <div className="divide-y-2 divide-white/60">
            {[
              { name: "Welcome Series - Cohort A", status: "Completed", time: "2 hours ago" },
              { name: "Weekly Newsletter - Devs", status: "Running", time: "Just now" },
              { name: "Inactive User Reactivation", status: "Scheduled", time: "Tomorrow" },
            ].map((job, i) => (
              <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-white/60 transition-colors">
                <div>
                  <div className="font-black text-lg text-slate-900 mb-1">{job.name}</div>
                  <div className="text-base font-bold text-slate-700">{job.time}</div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-black border-2 ${
                  job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  job.status === 'Running' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  'bg-slate-200 text-slate-800 border-slate-400'
                }`}>
                  {job.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
