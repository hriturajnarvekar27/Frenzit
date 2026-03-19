import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { EMI } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Plus, Trash2, Calendar, IndianRupee, CalendarClock, CheckCircle2, Sparkles, Building2, Clock, FileSpreadsheet, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExportActions } from './ExportActions';

export const EMIList: React.FC = () => {
  const [emis, setEmis] = React.useState<EMI[]>([]);
  const [providerName, setProviderName] = React.useState('');
  const [totalAmount, setTotalAmount] = React.useState('');
  const [monthlyAmount, setMonthlyAmount] = React.useState('');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = React.useState('5');
  const [loading, setLoading] = React.useState(true);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'emis'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('startDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EMI));
      setEmis(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emis');
    });

    return unsubscribe;
  }, []);

  const handleAddEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !providerName || !totalAmount || !monthlyAmount) return;

    try {
      await addDoc(collection(db, 'emis'), {
        uid: auth.currentUser.uid,
        providerName,
        totalAmount: parseFloat(totalAmount),
        monthlyAmount: parseFloat(monthlyAmount),
        startDate: new Date(startDate).toISOString(),
        dueDate: parseInt(dueDate),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setProviderName('');
      setTotalAmount('');
      setMonthlyAmount('');
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emis');
    }
  };

  const handleToggleStatus = async (emi: EMI) => {
    if (!emi.id) return;
    try {
      await updateDoc(doc(db, 'emis', emi.id), {
        status: emi.status === 'active' ? 'completed' : 'active',
      });
      if (emi.status === 'active') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'emis');
    }
  };

  const handleDeleteEMI = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'emis', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'emis');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;

  const activeEMIs = emis.filter(e => e.status === 'active');
  const totalMonthlyOutflow = activeEMIs.reduce((acc, curr) => acc + curr.monthlyAmount, 0);

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-emerald-400"
          >
            <Sparkles className="animate-pulse" />
            <span className="font-bold">EMI Updated Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Card */}
      <div className="pill-card p-8 flex items-center justify-between group hover:bg-white/5 transition-all relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">MONTHLY EMI OUTFLOW</p>
          <h4 className="text-4xl font-mono font-black text-toxic-lime tracking-tighter">₹{totalMonthlyOutflow.toLocaleString()}</h4>
          <div className="mt-6 flex items-center gap-4">
            <div className="bg-toxic-lime/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-toxic-lime/20 text-toxic-lime">
              {activeEMIs.length} ACTIVE STREAMS
            </div>
          </div>
        </div>
        <CalendarClock size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
      </div>

      {/* Add EMI Form */}
      <section className="pill-card p-8">
        <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] mb-8 uppercase flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-toxic-lime" />
          ESTABLISH NEW EMI PLAN
        </h3>
        <form onSubmit={handleAddEMI} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Provider Name</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="COMPANY OR PERSON"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700 uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Total Loan Amount</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-toxic-lime" />
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-mono focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Monthly EMI</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-toxic-lime" />
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-mono focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700"
                required
              />
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
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="15"
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
              INITIALIZE PLAN
            </button>
          </div>
        </form>
      </section>

      {/* EMI List */}
      <section className="space-y-6" id="emi-list-container">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] uppercase">ACTIVE EMI REGISTRY</h3>
          <ExportActions 
            data={emis.map(({ id, uid, ...rest }) => rest)} 
            filename="frenzit-emis" 
            elementId="emi-list-container" 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence initial={false}>
            {emis.map((emi) => (
              <motion.div
                key={emi.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`pill-card p-8 flex flex-col gap-8 group hover:bg-white/5 transition-all ${emi.status === 'completed' ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-white/5 ${emi.status === 'active' ? 'bg-toxic-lime/10 text-toxic-lime' : 'bg-zinc-800 text-zinc-500'}`}>
                      <CalendarClock size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm tracking-widest uppercase">{emi.providerName}</h4>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-2">DUE ON DAY {emi.dueDate} OF EVERY MONTH</p>
                    </div>
                  </div>
                  <button
                    onClick={() => emi.id && handleDeleteEMI(emi.id)}
                    className="p-3 text-zinc-600 hover:text-toxic-orange hover:bg-toxic-orange/10 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-toxic-orange/20"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">MONTHLY</p>
                    <p className="text-xl font-mono font-black text-white tracking-tighter">₹{emi.monthlyAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">TOTAL LOAN</p>
                    <p className="text-xl font-mono font-black text-white tracking-tighter">₹{emi.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${emi.status === 'active' ? 'bg-toxic-lime/20 text-toxic-lime' : 'bg-zinc-800 text-zinc-500'}`}>
                    {emi.status}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(emi)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${emi.status === 'active' ? 'text-toxic-lime bg-toxic-lime/10 border-toxic-lime/20' : 'text-zinc-600 border-white/5 hover:text-toxic-lime hover:bg-toxic-lime/10 hover:border-toxic-lime/20'}`}
                  >
                    {emi.status === 'active' ? (
                      <><CheckCircle2 size={14} strokeWidth={3} /> MARK COMPLETED</>
                    ) : (
                      <><Clock size={14} strokeWidth={3} /> REACTIVATE</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {emis.length === 0 && (
          <div className="md:col-span-2 text-center py-20 pill-card border-dashed border-white/10 bg-transparent">
            <p className="text-zinc-600 font-black text-xs tracking-[0.2em] uppercase italic">NO EMI DATA DETECTED</p>
          </div>
        )}
      </section>
    </div>
  );
};
