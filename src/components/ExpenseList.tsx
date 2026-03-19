import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Expense } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Plus, Trash2, Tag, Calendar, IndianRupee, FileSpreadsheet, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExportActions } from './ExportActions';

export const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('General');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = React.useState(true);

  const categories = ['Food', 'Transport', 'Rent', 'Shopping', 'Entertainment', 'Health', 'General'];

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    return unsubscribe;
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount) return;

    try {
      await addDoc(collection(db, 'expenses'), {
        uid: auth.currentUser.uid,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date).toISOString(),
        createdAt: new Date().toISOString(),
      });
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;

  return (
    <div className="space-y-10">
      {/* Add Expense Form */}
      <section className="pill-card p-8">
        <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] mb-8 uppercase flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-toxic-lime" />
          ADD NEW TRANSACTION
        </h3>
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Category</label>
            <div className="relative">
              <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none appearance-none uppercase"
              >
                {categories.map(cat => <option key={cat} value={cat} className="bg-charcoal">{cat}</option>)}
              </select>
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="TRANSACTION DETAILS"
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xs tracking-widest focus:ring-2 focus:ring-toxic-lime focus:border-transparent transition-all outline-none placeholder:text-zinc-700 uppercase"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 mt-4">
            <button
              type="submit"
              className="w-full bg-toxic-lime text-matte-black py-4 rounded-full font-black text-xs tracking-[0.3em] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-[0.98] uppercase"
            >
              EXECUTE TRANSACTION
            </button>
          </div>
        </form>
      </section>

      {/* Expense List */}
      <section className="space-y-6" id="expense-list-container">
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-black text-zinc-500 tracking-[0.3em] uppercase">RECENT TRANSACTIONS</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TOTAL OUTFLOW:</span>
              <span className="text-sm font-mono font-black text-toxic-lime">₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
            </div>
          </div>
          <ExportActions 
            data={expenses.map(({ id, uid, ...rest }) => rest)} 
            filename="frenzit-expenses" 
            elementId="expense-list-container" 
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pill-card p-5 flex items-center justify-between group hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-toxic-lime group-hover:text-matte-black transition-colors border border-white/5">
                    <Tag size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs tracking-widest uppercase">{expense.category}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{expense.description || 'NO DESCRIPTION'}</p>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-2">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-xl font-mono font-black text-white tracking-tighter">₹{expense.amount.toLocaleString()}</span>
                  <button
                    onClick={() => expense.id && handleDeleteExpense(expense.id)}
                    className="p-2.5 text-zinc-600 hover:text-toxic-orange hover:bg-toxic-orange/10 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-toxic-orange/20"
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {expenses.length === 0 && (
            <div className="text-center py-20 pill-card border-dashed border-white/10 bg-transparent">
              <p className="text-zinc-600 font-black text-xs tracking-[0.2em] uppercase italic">NO TRANSACTION DATA DETECTED</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
