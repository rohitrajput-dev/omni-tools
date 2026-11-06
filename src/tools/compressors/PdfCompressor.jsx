import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText, CheckCircle2, Loader2, Download, AlertTriangle, Sliders } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Vite-native asset resolution for pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [compressionRate, setCompressionRate] = useState(50); // 10% to 90%
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState(null);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Live estimated size based on user's target compression rate
  const estimatedSize = file ? Math.round(file.size * (1 - compressionRate / 100)) : 0;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setWarning(null);
  };

  const compressPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(0);
      setResult(null);
      setWarning(null);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Calculate dynamic scale and quality based on the slider rate
      // Higher compression rate => lower scale and lower quality
      const factor = compressionRate / 100;
      const quality = Math.max(0.2, 0.9 - factor * 0.7); // 0.83 to 0.27
      const scale = Math.max(0.6, 1.4 - factor * 0.8);   // 1.32 to 0.68

      let newPdf = null;

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

      const compressedBlob = newPdf.output('blob');
      const compressedUrl = URL.createObjectURL(compressedBlob);

      // Check if output is actually larger than the original
      if (compressedBlob.size >= file.size) {
        setWarning(
          "Notice: The compressed file is larger or similar to the original. This usually happens with pure-text or vector PDFs that are already highly optimized."
        );
      }

      setResult({
        blobUrl: compressedUrl,
        size: compressedBlob.size,
        fileName: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      });
    } catch (err) {
      console.error('Compression error:', err);
      alert('Failed to compress PDF. Please check the console.');
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
        {/* Upload Box */}
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

        {/* Selected File Card */}
        {file && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-slate-800 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">Original Size: {formatSize(file.size)}</p>
              </div>
            </div>
            {result && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </div>
        )}

        {/* Compression Rate Slider */}
        {file && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <label className="text-sm font-semibold text-slate-700">Compression Rate</label>
              </div>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {compressionRate}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={compressionRate}
              disabled={isProcessing}
              onChange={(e) => {
                setCompressionRate(Number(e.target.value));
                setResult(null); // Reset result when slider moves
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-xs text-slate-400">
              <span>Low (10%)</span>
              <span>Balanced (50%)</span>
              <span>Extreme (90%)</span>
            </div>

            {/* Live Size Estimation */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-600">Estimated Output Size:</span>
              <span className="font-semibold text-slate-800">
                ~{formatSize(estimatedSize)}
                <span className="text-xs text-emerald-600 font-normal ml-1">
                  (-{compressionRate}%)
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
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

        {/* Warning if compressed file didn't get smaller */}
        {warning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-900 font-medium">Actual New Size:</span>
              <span className="font-bold text-emerald-700">
                {formatSize(result.size)}
                <span className="ml-2 font-normal text-xs text-emerald-600">
                  ({result.size < file.size ? '-' : '+'}
                  {Math.abs(Math.round(((file.size - result.size) / file.size) * 100))}%)
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