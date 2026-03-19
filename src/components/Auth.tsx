import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LogIn, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then((docSnap) => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || 'User',
              photoURL: u.photoURL || '',
              role: 'user',
            });
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-white/10 p-0.5" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 border border-white/10">
              <User size={18} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-black text-white tracking-wider hidden sm:inline uppercase">{user.displayName}</span>
            <span className="text-[10px] font-bold text-zinc-500 hidden sm:inline uppercase tracking-widest">PRO ACCOUNT</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-xs font-black text-zinc-500 hover:text-toxic-orange transition-colors uppercase tracking-widest"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleLogin}
      className="flex items-center gap-3 px-6 py-3 bg-toxic-lime text-matte-black rounded-full font-black text-xs tracking-widest hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all"
    >
      <LogIn size={18} strokeWidth={2.5} />
      <span>LOGIN WITH GOOGLE</span>
    </motion.button>
  );
};
