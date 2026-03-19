import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { SIP } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Plus, Trash2, Calendar, IndianRupee, Repeat, CheckCircle2, Sparkles, TrendingUp, Clock, Pause, Play, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExportActions } from './ExportActions';

export const SIPList: React.FC = () => {
  const [sips, setSips] = React.useState<SIP[]>([]);
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [frequency, setFrequency] = React.useState<'monthly' | 'quarterly'>('monthly');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = React.useState('5');
  const [loading, setLoading] = React.useState(true);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'sips'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('startDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SIP));
      setSips(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sips');
    });

    return unsubscribe;
  }, []);

  const handleAddSIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !name || !amount) return;

    try {
      await addDoc(collection(db, 'sips'), {
        uid: auth.currentUser.uid,
        name,
        amount: parseFloat(amount),
        frequency,
        startDate: new Date(startDate).toISOString(),
        nextDueDate: parseInt(nextDueDate),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setName('');
      setAmount('');
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sips');
    }
  };

  const handleToggleStatus = async (sip: SIP, newStatus: 'active' | 'paused' | 'completed') => {
    if (!sip.id) return;
    try {
      await updateDoc(doc(db, 'sips', sip.id), {
        status: newStatus,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sips');
    }
  };

  const handleDeleteSIP = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sips', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'sips');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;

  const activeSIPs = sips.filter(s => s.status === 'active');
  const totalMonthlyInvestment = activeSIPs.reduce((acc, curr) => {
    const monthlyAmount = curr.frequency === 'monthly' ? curr.amount : curr.amount / 3;
    return acc + monthlyAmount;
  }, 0);

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-8 right-8 bg-toxic-lime text-matte-black px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-toxic-lime/40"
          >
            <Sparkles className="animate-pulse" />
            <span className="font-black text-xs tracking-widest uppercase">SIP REGISTRY UPDATED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Card */}
      <div className="pill-card p-8 flex items-center justify-between group hover:bg-white/5 transition-all relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">AVG MONTHLY INVESTMENT</p>
          <h4 className="text-4xl font-mono font-black text-toxic-lime tracking-tighter">₹{Math.round(totalMonthlyInvestment).toLocaleString()}</h4>
          <div className="mt-6 flex items-center gap-4">
            <div className="bg-toxic-lime/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-toxic-lime/20 text-toxic-lime">
              {activeSIPs.length} ACTIVE STREAMS
            </div>
          </div>
        </div>
        <TrendingUp size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
      </div>

      {/* Add SIP Form */}
      <section className="pill-card p-8">
        <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] mb-8 uppercase flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-toxic-lime" />
          INITIALIZE NEW INVESTMENT STREAM
        </h3>
        <form onSubmit={handleAddSIP} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Fund Name</label>
            <div className="relative">
              <Coins size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MUTUAL FUND / STOCK"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700 uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Installment Amount</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-toxic-lime" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-mono focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Frequency</label>
            <div className="relative">
              <Repeat size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'quarterly')}
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none uppercase appearance-none"
              >
                <option value="monthly" className="bg-matte-black">MONTHLY</option>
                <option value="quarterly" className="bg-matte-black">QUARTERLY</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Start Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Due Day (1-31)</label>
            <div className="relative">
              <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="number"
                min="1"
                max="31"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                placeholder="1"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-mono focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700"
                required
              />
            </div>
          </div>

          <div className="lg:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-toxic-lime text-matte-black py-4 rounded-full font-black text-xs tracking-[0.3em] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-[0.98] uppercase"
            >
              DEPLOY CAPITAL
            </button>
          </div>
        </form>
      </section>

      {/* SIP List */}
      <section className="space-y-6" id="sip-list-container">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] uppercase">ACTIVE INVESTMENT REGISTRY</h3>
          <ExportActions 
            data={sips.map(({ id, uid, ...rest }) => rest)} 
            filename="frenzit-sips" 
            elementId="sip-list-container" 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence initial={false}>
            {sips.map((sip) => (
              <motion.div
                key={sip.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`pill-card p-8 flex flex-col gap-8 group hover:bg-white/5 transition-all ${sip.status !== 'active' ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-white/5 ${sip.status === 'active' ? 'bg-toxic-lime/10 text-toxic-lime' : 'bg-zinc-800 text-zinc-500'}`}>
                      <TrendingUp size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm tracking-widest uppercase">{sip.name}</h4>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-2">{sip.frequency} CYCLE · DAY {sip.nextDueDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sip.id && handleDeleteSIP(sip.id)}
                    className="p-3 text-zinc-600 hover:text-toxic-orange hover:bg-toxic-orange/10 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-toxic-orange/20"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">INSTALLMENT</p>
                    <p className="text-xl font-mono font-black text-white tracking-tighter">₹{sip.amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">START DATE</p>
                    <p className="text-xs font-mono font-black text-white tracking-tighter">{new Date(sip.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${sip.status === 'active' ? 'bg-toxic-lime/20 text-toxic-lime' : 'bg-zinc-800 text-zinc-500'}`}>
                    {sip.status}
                  </span>
                  <div className="flex gap-2">
                    {sip.status === 'active' ? (
                      <>
                        <button
                          onClick={() => handleToggleStatus(sip, 'paused')}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border text-zinc-600 border-white/5 hover:text-white hover:bg-white/10"
                        >
                          <Pause size={14} strokeWidth={3} /> PAUSE
                        </button>
                        <button
                          onClick={() => handleToggleStatus(sip, 'completed')}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border text-toxic-lime bg-toxic-lime/10 border-toxic-lime/20"
                        >
                          <CheckCircle2 size={14} strokeWidth={3} /> COMPLETE
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(sip, 'active')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border text-toxic-lime bg-toxic-lime/10 border-toxic-lime/20"
                      >
                        <Play size={14} strokeWidth={3} /> RESUME
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sips.length === 0 && (
          <div className="md:col-span-2 text-center py-20 pill-card border-dashed border-white/10 bg-transparent">
            <p className="text-zinc-600 font-black text-xs tracking-[0.2em] uppercase italic">NO INVESTMENT STREAMS DETECTED</p>
          </div>
        )}
      </section>
    </div>
  );
};
