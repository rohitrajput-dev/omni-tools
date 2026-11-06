import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { Copy, Check } from 'lucide-react';

export default function JsonFormatter() {
  const [input, setInput] = useState('{"title":"OmniTools","active":true,"tags":["tools","cloudflare"]}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatJson = () => {
    try {
      setError('');
      setOutput(JSON.stringify(JSON.parse(input), null, 2));
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const minifyJson = () => {
    try {
      setError('');
      setOutput(JSON.stringify(JSON.parse(input)));
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="JSON Formatter & Validator"
      description="Format, prettify, or compress JSON data structures instantly."
      category="Formatters"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Paste JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows="7"
            className="w-full font-mono text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={formatJson}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Prettify JSON
          </button>
          <button
            onClick={minifyJson}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Minify JSON
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-mono">
            {error}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-slate-700">Result</label>
            <button
              onClick={copyToClipboard}
              disabled={!output}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Result'}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted output will appear here..."
            rows="8"
            className="w-full font-mono text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
          />
        </div>
      </div>
    </ToolLayout>
  );
}