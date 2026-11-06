import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
        Error 404
      </span>
      <h1 className="text-5xl font-black text-slate-900 mt-4">Page Not Found</h1>
      <p className="text-slate-500 mt-3 max-w-md mx-auto">
        The tool or page you are requesting doesn't exist, was moved, or has an invalid route.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
      >
        <Home className="w-4 h-4" /> Return to Homepage
      </Link>
    </div>
  );
}