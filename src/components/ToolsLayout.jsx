import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ToolLayout({ title, description, category, children }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to All Tools
        </Link>
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded">
          {category}
        </span>
      </div>

      <header className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {children}
      </div>
    </div>
  );
}