import React from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

export default function Login() {
  const { user, login, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/admin" />;

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-[40px] border border-natural-border bg-white p-10 shadow-2xl shadow-natural-primary/5"
      >
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-natural-primary text-white shadow-lg shadow-natural-primary/20">
            <LogIn size={28} />
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Admin Access</h1>
          <p className="mt-2 text-sm text-natural-muted">Enter the Vendhan Hire recruitment suite</p>
        </div>

        {user && !isAdmin && (
          <div className="mb-8 flex items-start gap-4 rounded-3xl bg-orange-50 p-5 text-orange-800 border border-orange-100">
            <ShieldAlert className="shrink-0" size={20} />
            <div className="text-xs leading-relaxed">
              <p className="font-bold uppercase tracking-wider mb-1">Access Resticted</p>
              <p>Your account (<strong>{user.email}</strong>) is not registered as an administrator. Please contact IT support.</p>
            </div>
          </div>
        )}

        <button 
          onClick={() => login()}
          className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-natural-accent bg-white px-6 py-5 text-sm font-bold uppercase tracking-widest transition-all hover:bg-natural-bg hover:border-natural-primary"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4 grayscale group-hover:grayscale-0" />
          Sign in with Google
        </button>

        <div className="mt-12 flex justify-center opacity-20">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Authorized Personnel Only</p>
        </div>
      </motion.div>
    </div>
  );
}
