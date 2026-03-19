import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Expense, BorrowLend, EMI, SIP } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Receipt, HandCoins, CalendarClock, TrendingUp, TrendingDown, Wallet, FileSpreadsheet, Camera, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import { ExportActions } from './ExportActions';

export const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [records, setRecords] = React.useState<BorrowLend[]>([]);
  const [emis, setEmis] = React.useState<EMI[]>([]);
  const [sips, setSips] = React.useState<SIP[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const qExpenses = query(collection(db, 'expenses'), where('uid', '==', uid));
    const qRecords = query(collection(db, 'borrows_lends'), where('uid', '==', uid));
    const qEmis = query(collection(db, 'emis'), where('uid', '==', uid));
    const qSips = query(collection(db, 'sips'), where('uid', '==', uid));

    const unsubExpenses = onSnapshot(qExpenses, (s) => setExpenses(s.docs.map(d => d.data() as Expense)), (e) => handleFirestoreError(e, OperationType.LIST, 'expenses'));
    const unsubRecords = onSnapshot(qRecords, (s) => setRecords(s.docs.map(d => d.data() as BorrowLend)), (e) => handleFirestoreError(e, OperationType.LIST, 'borrows_lends'));
    const unsubEmis = onSnapshot(qEmis, (s) => setEmis(s.docs.map(d => d.data() as EMI)), (e) => handleFirestoreError(e, OperationType.LIST, 'emis'));
    const unsubSips = onSnapshot(qSips, (s) => setSips(s.docs.map(d => d.data() as SIP)), (e) => handleFirestoreError(e, OperationType.LIST, 'sips'));

    setLoading(false);
    return () => {
      unsubExpenses();
      unsubRecords();
      unsubEmis();
      unsubSips();
    };
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBorrowed = records.filter(r => r.type === 'borrow' && r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalLent = records.filter(r => r.type === 'lend' && r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthlyEMI = emis.filter(e => e.status === 'active').reduce((acc, curr) => acc + curr.monthlyAmount, 0);
  const totalMonthlySIP = sips.filter(s => s.status === 'active').reduce((acc, curr) => {
    const monthlyAmount = curr.frequency === 'monthly' ? curr.amount : curr.amount / 3;
    return acc + monthlyAmount;
  }, 0);

  const stats = [
    { label: 'TOTAL EXPENSES', value: totalExpenses, icon: Receipt, color: 'text-white', bg: 'bg-white/5', accent: 'bg-white' },
    { label: 'TOTAL BORROWED', value: totalBorrowed, icon: TrendingDown, color: 'text-toxic-orange', bg: 'bg-toxic-orange/10', accent: 'bg-toxic-orange' },
    { label: 'MONTHLY EMI', value: totalMonthlyEMI, icon: CalendarClock, color: 'text-white', bg: 'bg-white/5', accent: 'bg-white' },
    { label: 'MONTHLY SIP', value: Math.round(totalMonthlySIP), icon: Coins, color: 'text-toxic-lime', bg: 'bg-toxic-lime/10', accent: 'bg-toxic-lime' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" id="dashboard-header">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">WELCOME, {auth.currentUser?.displayName?.split(' ')[0].toUpperCase()}</h2>
          <p className="text-zinc-500 font-bold text-xs tracking-[0.2em] mt-2 uppercase">SYSTEM STATUS: OPTIMIZED</p>
        </div>
        <div className="flex flex-col sm:items-end gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-toxic-lime animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">LIVE DATA SYNC</span>
          </div>
          <ExportActions 
            data={[
              ...expenses.map(e => ({ ...e, type: 'expense' })),
              ...records.map(r => ({ ...r, type: r.type })),
              ...emis.map(e => ({ ...e, type: 'emi' })),
              ...sips.map(s => ({ ...s, type: 'sip' }))
            ].map(({ id, uid, ...rest }) => rest)}
            filename="frenzit-full-report"
            elementId="dashboard-content"
          />
        </div>
      </header>

      <div id="dashboard-content" className="space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="pill-card p-8 flex flex-col gap-6 group hover:scale-[1.02] transition-transform"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center border border-white/5`}>
              <stat.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">{stat.label}</p>
              <h4 className={`text-3xl font-mono font-black ${stat.color} mt-2 tracking-tighter`}>
                ₹{stat.value.toLocaleString()}
              </h4>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                className={`h-full ${stat.accent}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] px-2 uppercase">FINANCIAL OVERVIEW</h3>
          <div className="pill-card p-10 min-h-[350px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(204,255,0,0.05),transparent_70%)]" />
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-zinc-700 mb-6 border border-white/5">
              <Wallet size={48} strokeWidth={1.5} />
            </div>
            <h4 className="text-2xl font-black text-white tracking-tight uppercase italic">WALLET STATUS: ACTIVE</h4>
            <p className="text-zinc-500 font-medium text-sm max-w-xs mt-4 leading-relaxed">
              System monitoring {expenses.length} transactions, {emis.length} EMIs, and {sips.length} active investments.
            </p>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= 3 ? 'bg-toxic-lime' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] px-2 uppercase">SYSTEM INSIGHTS</h3>
          <div className="space-y-4">
            {[
              { title: 'LIQUIDITY GOAL', text: 'Target 20% savings margin.', icon: TrendingUp, color: 'text-toxic-lime', bg: 'bg-toxic-lime/10' },
              { title: 'CREDIT HEALTH', text: 'Maintain zero-delay EMI cycles.', icon: CalendarClock, color: 'text-white', bg: 'bg-white/5' },
              { title: 'ASSET TRACKING', text: 'Audit all pending lends weekly.', icon: HandCoins, color: 'text-toxic-orange', bg: 'bg-toxic-orange/10' },
            ].map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="pill-card p-6 flex gap-5 hover:bg-white/5 transition-colors cursor-default"
              >
                <div className={`w-12 h-12 ${tip.bg} ${tip.color} rounded-full flex-shrink-0 flex items-center justify-center border border-white/5`}>
                  <tip.icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h5 className="font-black text-white text-xs tracking-widest uppercase">{tip.title}</h5>
                  <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed">{tip.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
