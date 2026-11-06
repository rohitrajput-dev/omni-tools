import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText, CheckCircle2, Loader2, Download, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Vite-native asset resolution for pdfjs worker (works in both dev and production build)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Compression presets (scale affects canvas pixel resolution, quality is JPEG compression)
  const compressionConfig = {
    low: { scale: 1.5, quality: 0.75 },     // Modest compression, highest clarity
    medium: { scale: 1.2, quality: 0.55 },   // Recommended balance
    extreme: { scale: 0.9, quality: 0.35 },  // Maximum size reduction
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const compressPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setResult(null);
      setError(null);

      // 1. Read uploaded file buffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let newPdf = null;
      const { scale, quality } = compressionConfig[level];

      // 2. Loop through each page, render to canvas, recompress as JPEG
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        const imgData = canvas.toDataURL('image/jpeg', quality);

        // Get unscaled standard PDF points (72 DPI) to preserve physical dimensions
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const widthPt = unscaledViewport.width;
        const heightPt = unscaledViewport.height;
        const orientation = widthPt > heightPt ? 'landscape' : 'portrait';

        if (pageNum === 1) {
          newPdf = new jsPDF({
            orientation,
            unit: 'pt',
            format: [widthPt, heightPt],
            compress: true,
          });
        } else {
          newPdf.addPage([widthPt, heightPt], orientation);
        }

        newPdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      // 3. Create compressed output
      const compressedBlob = newPdf.output('blob');
      const compressedUrl = URL.createObjectURL(compressedBlob);

      setResult({
        blobUrl: compressedUrl,
        size: compressedBlob.size,
        fileName: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      });
    } catch (err) {
      console.error('Compression error:', err);
      setError('Could not compress this PDF. Make sure it is not password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {file && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-slate-800 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {result && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">Compression Strength</label>
          <div className="grid grid-cols-3 gap-3">
            {['low', 'medium', 'extreme'].map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={isProcessing}
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          disabled={!file || isProcessing}
          onClick={compressPdf}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compressing ({progress}%)...
            </>
          ) : (
            'Compress PDF'
          )}
        </button>

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-900 font-medium">New Size:</span>
              <span className="font-bold text-emerald-700">
                {(result.size / (1024 * 1024)).toFixed(2)} MB
                <span className="ml-2 font-normal text-xs text-emerald-600">
                  (-{Math.max(0, Math.round(((file.size - result.size) / file.size) * 100))}%)
                </span>
              </span>
            </div>
            <a
              href={result.blobUrl}
              download={result.fileName}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
            >
              <Download className="w-4 h-4" />
              Download Compressed PDF
            </a>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}