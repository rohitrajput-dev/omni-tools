import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';

export default function PdfMerger() {
  const [files, setFiles] = useState([]);

  const handleFiles = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ToolLayout
      title="PDF Merger"
      description="Combine multiple PDF files in your preferred order into a single document."
      category="Mergers"
    >
      <div className="space-y-6">
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:border-indigo-500 transition cursor-pointer">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <span className="font-semibold text-slate-700">Select multiple PDF files</span>
          <span className="text-xs text-slate-400 mt-1">Hold Shift or Ctrl to choose multiple documents</span>
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Files to Merge ({files.length})</h3>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {files.map((f, idx) => (
                <li key={idx} className="p-3 flex justify-between items-center bg-slate-50 first:rounded-t-lg last:rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-800">{f.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          disabled={files.length < 2}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {files.length < 2 ? 'Add at least 2 PDFs to Merge' : 'Merge All PDFs'}
        </button>
      </div>
    </ToolLayout>
  );
}