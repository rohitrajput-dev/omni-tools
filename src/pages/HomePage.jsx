import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { toolCategories, tools } from '../data/toolsRegistry';

export default function HomePage() {
  const [search, setSearch] = useState('');

  const filteredTools = tools.filter(tool =>
    tool.title.toLowerCase().includes(search.toLowerCase()) ||
    tool.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="text-center py-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          All-in-One Online Tools Hub
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Secure, browser-based utilities for developers and professionals. No files are uploaded to remote servers.
        </p>

        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools (e.g., PDF, JSON, Image)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs text-sm"
          />
        </div>
      </div>

      <div className="space-y-12 mt-6">
        {toolCategories.map(cat => {
          const categoryTools = filteredTools.filter(t => t.category === cat.id);
          if (categoryTools.length === 0) return null;

          return (
            <section key={cat.id}>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
                <p className="text-sm text-slate-500">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryTools.map(tool => (
                  <Link
                    key={tool.slug}
                    to={`/${tool.slug}`}
                    className="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-400 transition flex flex-col justify-between group"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Open Tool <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}