import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-blue-500 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-300 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The requested PRP block resource or page does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
