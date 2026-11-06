import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileCheck } from 'lucide-react';

export default function PdfToWord() {
  const [file, setFile] = useState(null);

  return (
    <ToolLayout
      title="PDF to Word Converter"
      description="Extract PDF layouts and text into editable Microsoft Word (.docx) documents."
      category="Converters"
    >
      <div className="space-y-6">
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:border-indigo-500 transition cursor-pointer">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <span className="font-semibold text-slate-700">Choose a PDF file</span>
          <span className="text-xs text-slate-400 mt-1">Accepts standard PDF files</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {file && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-sm text-indigo-900">{file.name}</p>
              <p className="text-xs text-indigo-700">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        )}

        <button
          disabled={!file}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
        >
          Convert to Word
        </button>
      </div>
    </ToolLayout>
  );
}