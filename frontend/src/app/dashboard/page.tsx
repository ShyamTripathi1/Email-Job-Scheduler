"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "scheduled" | "sent";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("scheduled");
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // If you have a backend logout endpoint, you could call it here.
      // await fetch("http://localhost:3001/api/auth/logout", { method: "POST", credentials: "include" });
      
      // For now, simply redirect the user to the login page so they can log in with a different account.
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Mock data for display purposes
  const scheduledEmails = [
    { id: 1, email: "john@example.com", subject: "Welcome to our platform!", time: "Today at 2:00 PM", status: "Scheduled" },
    { id: 2, email: "sarah@company.com", subject: "Follow up on your inquiry", time: "Tomorrow at 9:00 AM", status: "Scheduled" },
    { id: 3, email: "mike@startup.io", subject: "Your weekly analytics report", time: "Oct 12 at 10:00 AM", status: "Scheduled" },
    { id: 6, email: "emily@marketing.org", subject: "Q4 Marketing Strategy", time: "Oct 14 at 1:00 PM", status: "Scheduled" },
    { id: 7, email: "chris@devteam.com", subject: "API Integration Docs", time: "Oct 15 at 9:30 AM", status: "Scheduled" },
    { id: 8, email: "jessica@hr.co", subject: "Team Building Event Details", time: "Oct 16 at 3:15 PM", status: "Scheduled" },
    { id: 9, email: "mark@sales.net", subject: "Lead Gen Report", time: "Oct 18 at 8:00 AM", status: "Scheduled" },
    { id: 10, email: "lisa@design.studio", subject: "New Figma Assets", time: "Oct 20 at 11:45 AM", status: "Scheduled" },
  ];

  const sentEmails = [
    { id: 4, email: "david@test.com", subject: "Invoice #INV-2024", time: "Yesterday at 4:30 PM", status: "Sent" },
    { id: 5, email: "alex@design.co", subject: "New feature update", time: "Oct 3 at 11:15 AM", status: "Failed" },
    { id: 11, email: "samantha@agency.com", subject: "Project Kickoff Recap", time: "Oct 2 at 5:00 PM", status: "Sent" },
    { id: 12, email: "brian@consulting.io", subject: "Contract Renewal", time: "Oct 1 at 2:10 PM", status: "Sent" },
    { id: 13, email: "kelly@ecommerce.net", subject: "Abandoned Cart Reminder", time: "Sep 30 at 8:45 AM", status: "Sent" },
    { id: 14, email: "peter@logistics.com", subject: "Shipping Delay Notice", time: "Sep 28 at 1:20 PM", status: "Failed" },
    { id: 15, email: "nancy@education.org", subject: "Webinar Registration Confirmation", time: "Sep 25 at 10:30 AM", status: "Sent" },
    { id: 16, email: "kevin@startup.co", subject: "Investor Pitch Deck", time: "Sep 20 at 3:55 PM", status: "Sent" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-300 to-red-300 text-slate-900 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[20%] w-[50%] h-[50%] rounded-full bg-orange-500/20 blur-[120px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white/30 backdrop-blur-xl border-b border-white/40 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
                E
              </div>
              <span className="font-black text-2xl tracking-tight text-slate-900">Email Scheduler</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">John Doe</div>
                  <div className="text-xs text-slate-700 font-medium">john@example.com</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-200 border-2 border-orange-300 shadow-inner flex items-center justify-center text-orange-700 font-black">
                  JD
                </div>
              </div>
              <button onClick={handleLogout} className="text-sm font-bold text-slate-700 hover:text-red-700 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-0">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-800 font-bold text-lg">Overview of your email campaigns and jobs.</p>
          </div>
          
          <button 
            onClick={() => setIsComposeModalOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-6 py-3 rounded-xl font-black text-lg transition-all shadow-xl shadow-orange-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>+ Create Job</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Sent", value: "24,593", trend: "+12%", color: "text-orange-700" },
            { label: "Pending Jobs", value: "12", trend: "-2%", color: "text-amber-700" },
            { label: "Failed Deliveries", value: "3", trend: "0%", color: "text-red-700" },
          ].map((stat, i) => (
            <div key={i} className="bg-orange-50/80 backdrop-blur-sm border-2 border-white/60 rounded-2xl p-6 shadow-md">
              <div className="text-slate-800 text-base font-bold mb-2">{stat.label}</div>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-sm text-slate-700 font-extrabold">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs and Table */}
        <div className="bg-orange-50/80 backdrop-blur-sm border-2 border-white/60 rounded-2xl overflow-hidden shadow-md">
          
          {/* Tabs */}
          <div className="flex border-b-2 border-white/60 bg-white/40">
            <button 
              onClick={() => setActiveTab("scheduled")}
              className={`flex-1 py-4 text-center font-black text-base transition-all border-b-4 ${
                activeTab === "scheduled" ? "border-orange-500 text-orange-700 bg-white/50" : "border-transparent text-slate-700 hover:text-slate-900 hover:bg-white/30"
              }`}
            >
              Scheduled Emails
            </button>
            <button 
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-4 text-center font-black text-base transition-all border-b-4 ${
                activeTab === "sent" ? "border-orange-500 text-orange-700 bg-white/50" : "border-transparent text-slate-700 hover:text-slate-900 hover:bg-white/30"
              }`}
            >
              Sent Emails
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-white/60 text-slate-600 text-xs uppercase tracking-wider bg-white/20">
                  <th className="p-4 font-black">Recipient</th>
                  <th className="p-4 font-black">Subject</th>
                  <th className="p-4 font-black">Time</th>
                  <th className="p-4 font-black text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-white/60">
                {(activeTab === "scheduled" ? scheduledEmails : sentEmails).map((email) => (
                  <tr key={email.id} className="hover:bg-white/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-black text-lg text-slate-900">{email.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-bold truncate max-w-xs">{email.subject}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 text-base font-bold">{email.time}</div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black border-2 ${
                        email.status === 'Scheduled' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        email.status === 'Sent' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Empty State */}
                {(activeTab === "scheduled" && scheduledEmails.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-700 font-bold text-lg">
                      No emails scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-orange-50/95 backdrop-blur-xl border-2 border-white/60 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b-2 border-white/60 flex justify-between items-center bg-white/40">
              <h2 className="text-2xl font-black text-slate-900">Compose New Email Job</h2>
              <button onClick={() => setIsComposeModalOpen(false)} className="text-slate-600 hover:text-slate-900 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">Subject</label>
                <input type="text" className="w-full font-bold bg-white/70 border-2 border-white/80 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-orange-500/50 focus:border-transparent transition-all shadow-inner" placeholder="Enter email subject" />
              </div>
              
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">Upload Leads (CSV)</label>
                <div className="border-4 border-dashed border-white/80 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-100/50 transition-colors cursor-pointer bg-white/40 shadow-inner">
                  <svg className="w-10 h-10 text-orange-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-base text-slate-800 font-bold">Click to upload or drag and drop</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-2">Start Time</label>
                  <input type="datetime-local" className="w-full font-bold bg-white/70 border-2 border-white/80 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/50 focus:border-transparent transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-2">Hourly Limit</label>
                  <input type="number" className="w-full font-bold bg-white/70 border-2 border-white/80 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-orange-500/50 focus:border-transparent transition-all shadow-inner" placeholder="e.g. 200" />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t-2 border-white/60 bg-white/40 flex justify-end gap-4">
              <button onClick={() => setIsComposeModalOpen(false)} className="px-5 py-3 font-bold text-lg text-slate-700 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-8 py-3 rounded-xl font-black text-lg shadow-xl shadow-orange-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                Schedule Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
