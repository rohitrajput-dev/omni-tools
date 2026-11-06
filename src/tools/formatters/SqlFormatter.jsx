import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';

export default function SqlFormatter() {
  const [input, setInput] = useState('select id, name, email from users where active = 1 order by id desc;');
  const [output, setOutput] = useState('');

  const formatSql = () => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 
      'GROUP BY', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 
      'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'
    ];
    let formatted = input;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${kw}`);
    });
    setOutput(formatted.trim());
  };

  return (
    <ToolLayout
      title="SQL Query Formatter"
      description="Standardize keywords, format clauses, and organize database queries."
      category="Formatters"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Input SQL Query</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows="6"
            className="w-full font-mono text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={formatSql}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Format SQL
        </button>

        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Formatted Query</label>
          <textarea
            readOnly
            value={output}
            rows="7"
            placeholder="Formatted SQL output..."
            className="w-full font-mono text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
          />
        </div>
      </div>
    </ToolLayout>
  );
}