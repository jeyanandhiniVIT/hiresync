import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-natural-bg font-sans text-natural-text">
      {!isAdminPage && (
        <header className="sticky top-0 z-50 w-full border-b border-natural-border bg-white shadow-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-natural-primary text-natural-bg shadow-sm">
                <Briefcase size={20} />
              </div>
              <span className="italic">Vendhan Hire</span>
            </Link>

            <nav className="flex items-center gap-8">
              <Link 
                to="/" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-natural-primary",
                  location.pathname === '/' ? "text-natural-primary" : "text-natural-muted"
                )}
              >
                Jobs
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-2 rounded-full bg-natural-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-natural-secondary"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
              )}
              
              {!isAdmin && user && (
                <button 
                  onClick={() => logout()}
                  className="text-sm font-medium text-natural-muted hover:text-natural-text"
                >
                  Logout
                </button>
              )}

              {!user && (
                <Link 
                  to="/login"
                  className="text-sm font-medium text-natural-muted transition-colors hover:text-natural-primary"
                >
                  Admin Login
                </Link>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={cn(isAdminPage ? "flex h-screen overflow-hidden" : "")}>
        {children}
      </main>

      {!isAdminPage && (
        <footer className="border-t border-natural-border bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="font-serif italic text-xl mb-2">Vendhan Hire</p>
            <p className="text-[10px] text-natural-muted font-mono uppercase tracking-[0.2em] mb-4">
              A Product of Vendhan InfoTech
            </p>
            <p className="text-[10px] text-natural-muted font-mono uppercase tracking-[0.2em]">
              © 2026 Vendhan InfoTech • All rights reserved
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
