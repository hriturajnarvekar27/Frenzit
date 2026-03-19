import React from 'react';
import { Auth } from './Auth';
import { LayoutDashboard, Receipt, HandCoins, CalendarClock, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'expenses', label: 'EXPENSES', icon: Receipt },
    { id: 'borrows', label: 'BORROWS/LENDS', icon: HandCoins },
    { id: 'emis', label: 'EMIS', icon: CalendarClock },
    { id: 'sips', label: 'SIPS', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-matte-black flex flex-col sm:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full sm:w-72 bg-charcoal border-b sm:border-r border-white/5 p-6 sm:p-8 flex flex-col gap-10 z-10 shadow-2xl">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 bg-toxic-lime rounded-2xl flex items-center justify-center text-matte-black shadow-[0_0_30px_rgba(204,255,0,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500">
            <Zap size={28} strokeWidth={3} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter italic leading-none">FRENZIT</h1>
            <p className="text-[8px] font-black text-toxic-lime tracking-[0.4em] mt-1 opacity-70">PREMIUM SUITE</p>
          </div>
        </div>

        <nav className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-full font-black text-xs tracking-widest transition-all whitespace-nowrap group ${
                activeTab === tab.id
                  ? 'bg-toxic-lime text-matte-black shadow-[0_0_20px_rgba(204,255,0,0.2)]'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                activeTab === tab.id ? 'border-matte-black/20' : 'border-white/10 group-hover:border-white/20'
              }`}>
                <tab.icon size={16} strokeWidth={2.5} />
              </div>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto hidden sm:block pt-8 border-t border-white/5">
          <Auth />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-20 bg-charcoal/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between sm:hidden">
          <h2 className="text-sm font-black text-white tracking-[0.2em]">{activeTab.toUpperCase()}</h2>
          <Auth />
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};
