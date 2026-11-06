import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <Wrench className="w-6 h-6 text-indigo-600" />
          <span>OmniTools</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          Client-Side & Secure
        </span>
      </div>
    </header>
  );
}