import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { BorrowLend } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Plus, Trash2, User, Calendar, IndianRupee, HandCoins, CheckCircle2, Clock, FileSpreadsheet, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExportActions } from './ExportActions';

export const BorrowLendList: React.FC = () => {
  const [records, setRecords] = React.useState<BorrowLend[]>([]);
  const [amount, setAmount] = React.useState('');
  const [personName, setPersonName] = React.useState('');
  const [type, setType] = React.useState<'borrow' | 'lend'>('borrow');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'borrows_lends'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowLend));
      setRecords(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'borrows_lends');
    });

    return unsubscribe;
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !personName) return;

    try {
      await addDoc(collection(db, 'borrows_lends'), {
        uid: auth.currentUser.uid,
        amount: parseFloat(amount),
        type,
        personName,
        date: new Date(date).toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setAmount('');
      setPersonName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'borrows_lends');
    }
  };

  const handleToggleStatus = async (record: BorrowLend) => {
    if (!record.id) return;
    try {
      await updateDoc(doc(db, 'borrows_lends', record.id), {
        status: record.status === 'pending' ? 'paid' : 'pending',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'borrows_lends');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'borrows_lends', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'borrows_lends');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;

  const totalBorrowed = records.filter(r => r.type === 'borrow' && r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalLent = records.filter(r => r.type === 'lend' && r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="pill-card p-8 flex items-center justify-between group hover:bg-white/5 transition-all">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">TOTAL BORROWED</p>
            <h4 className="text-3xl font-mono font-black text-toxic-orange tracking-tighter">₹{totalBorrowed.toLocaleString()}</h4>
          </div>
          <div className="w-14 h-14 bg-toxic-orange/10 text-toxic-orange rounded-full flex items-center justify-center border border-toxic-orange/20">
            <HandCoins size={28} strokeWidth={2.5} />
          </div>
        </div>
        <div className="pill-card p-8 flex items-center justify-between group hover:bg-white/5 transition-all">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">TOTAL LENT</p>
            <h4 className="text-3xl font-mono font-black text-toxic-lime tracking-tighter">₹{totalLent.toLocaleString()}</h4>
          </div>
          <div className="w-14 h-14 bg-toxic-lime/10 text-toxic-lime rounded-full flex items-center justify-center border border-toxic-lime/20">
            <HandCoins size={28} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Add Record Form */}
      <section className="pill-card p-8">
        <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] mb-8 uppercase flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-toxic-lime" />
          NEW BORROW/LEND RECORD
        </h3>
        <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Type</label>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setType('borrow')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'borrow' ? 'bg-toxic-orange text-white shadow-lg' : 'text-zinc-500'}`}
              >
                Borrow
              </button>
              <button
                type="button"
                onClick={() => setType('lend')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'lend' ? 'bg-toxic-lime text-matte-black shadow-lg' : 'text-zinc-500'}`}
              >
                Lend
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Person Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="CONTACT NAME"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700 uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Amount</label>
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
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none uppercase"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-4 mt-4">
            <button
              type="submit"
              className="w-full bg-toxic-lime text-matte-black py-4 rounded-full font-black text-xs tracking-[0.3em] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-[0.98] uppercase"
            >
              INITIALIZE RECORD
            </button>
          </div>
        </form>
      </section>

      {/* Records List */}
      <section className="space-y-6" id="borrow-lend-list-container">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] uppercase">TRANSACTION LOG</h3>
          <ExportActions 
            data={records.map(({ id, uid, ...rest }) => rest)} 
            filename="frenzit-borrow-lend" 
            elementId="borrow-lend-list-container" 
          />
        </div>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`pill-card p-6 flex items-center justify-between group hover:bg-white/5 transition-all ${record.status === 'paid' ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border border-white/5 ${record.type === 'borrow' ? 'bg-toxic-orange/10 text-toxic-orange' : 'bg-toxic-lime/10 text-toxic-lime'}`}>
                    <HandCoins size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-white text-sm tracking-widest uppercase">{record.personName}</h4>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${record.type === 'borrow' ? 'bg-toxic-orange/20 text-toxic-orange' : 'bg-toxic-lime/20 text-toxic-lime'}`}>
                        {record.type}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-2">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-white tracking-tighter block">₹{record.amount.toLocaleString()}</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${record.status === 'paid' ? 'text-toxic-lime' : 'text-toxic-orange'}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleStatus(record)}
                      className={`p-3 rounded-full transition-all border ${record.status === 'paid' ? 'text-toxic-lime bg-toxic-lime/10 border-toxic-lime/20' : 'text-zinc-600 border-white/5 hover:text-toxic-lime hover:bg-toxic-lime/10 hover:border-toxic-lime/20'}`}
                      title={record.status === 'paid' ? 'Mark as Pending' : 'Mark as Paid'}
                    >
                      {record.status === 'paid' ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Clock size={22} strokeWidth={2.5} />}
                    </button>
                    <button
                      onClick={() => record.id && handleDeleteRecord(record.id)}
                      className="p-3 text-zinc-600 hover:text-toxic-orange hover:bg-toxic-orange/10 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-toxic-orange/20"
                    >
                      <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {records.length === 0 && (
            <div className="text-center py-20 pill-card border-dashed border-white/10 bg-transparent">
              <p className="text-zinc-600 font-black text-xs tracking-[0.2em] uppercase italic">NO RECORD DATA DETECTED</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
