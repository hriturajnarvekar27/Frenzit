/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { auth } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { BorrowLendList } from './components/BorrowLendList';
import { EMIList } from './components/EMIList';
import { SIPList } from './components/SIPList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, LogIn } from 'lucide-react';
import { Auth } from './components/Auth';

export default function App() {
  const [user, setUser] = React.useState(auth.currentUser);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matte-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-toxic-lime"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-toxic-lime rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-matte-black p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-charcoal p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-white/5 text-center flex flex-col items-center gap-10"
        >
          <div className="w-24 h-24 bg-toxic-lime rounded-[2rem] flex items-center justify-center text-matte-black shadow-[0_0_40px_rgba(204,255,0,0.3)] rotate-6 hover:rotate-0 transition-transform duration-500">
            <Wallet size={48} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic">FRENZIT</h1>
            <p className="text-zinc-500 mt-4 font-bold text-xs tracking-[0.2em] uppercase leading-relaxed">
              PREMIUM FINANCIAL SUITE <br/>
              <span className="text-toxic-lime opacity-70">SYSTEM STATUS: READY</span>
            </p>
          </div>
          <div className="w-full">
            <Auth />
          </div>
          <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] mt-4">
            ENCRYPTED SESSION · GOOGLE AUTH
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'expenses': return <ExpenseList />;
      case 'borrows': return <BorrowLendList />;
      case 'emis': return <EMIList />;
      case 'sips': return <SIPList />;
      default: return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}

