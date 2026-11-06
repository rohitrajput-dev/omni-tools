import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText } from 'lucide-react';

export default function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');

  return (
    <ToolLayout
      title="PDF Compressor"
      description="Reduce PDF file size for easy sharing, archiving, and email attachments."
      category="Compressors"
    >
      <div className="space-y-6">
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:border-indigo-500 transition cursor-pointer">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <span className="font-semibold text-slate-700">Select PDF document to compress</span>
          <span className="text-xs text-slate-400 mt-1">Accepts standard PDF documents up to 50MB</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {file && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-sm text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">Compression Strength</label>
          <div className="grid grid-cols-3 gap-3">
            {['low', 'medium', 'extreme'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLevel(opt)}
                className={`py-2 px-3 text-sm font-semibold capitalize rounded-lg border transition ${
                  level === opt
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!file}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
        >
          Compress PDF
        </button>
      </div>
    </ToolLayout>
  );
}