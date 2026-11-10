import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText, CheckCircle2, Loader2, Download, Sliders, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [compressionRate, setCompressionRate] = useState(70);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const targetSize = file ? Math.round(file.size * (1 - compressionRate / 100)) : 0;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setErrorMsg(null);
  };

  // Structural compression fallback
  const compressLossless = async (buffer) => {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      const bytes = await pdfDoc.save({ useObjectStreams: true });
      return new Blob([bytes], { type: 'application/pdf' });
    } catch {
      return null;
    }
  };

  // Maps a strict byte budget per page into scale & JPEG quality
  const getParamsForBudget = (bytesPerPage) => {
    if (bytesPerPage < 20 * 1024) {
      return { scale: 0.40, quality: 0.18 };
    } else if (bytesPerPage < 40 * 1024) {
      return { scale: 0.52, quality: 0.28 };
    } else if (bytesPerPage < 70 * 1024) {
      return { scale: 0.68, quality: 0.42 };
    } else if (bytesPerPage < 120 * 1024) {
      return { scale: 0.82, quality: 0.58 };
    } else {
      return { scale: 0.95, quality: 0.72 };
    }
  };

  // Closed-loop per-page adaptive controller
  const compressAdaptive = async (buffer, targetBytes) => {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const totalPages = pdf.numPages;

    // Reserve ~2KB per page for jsPDF container, xref table, and metadata overhead
    const containerOverhead = totalPages * 2048;
    let remainingBudget = Math.max(totalPages * 8192, targetBytes - containerOverhead);

    let newPdf = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const remainingPages = totalPages - pageNum + 1;
      const currentBudgetPerPage = remainingBudget / remainingPages;

      let { scale, quality } = getParamsForBudget(currentBudgetPerPage);

      const page = await pdf.getPage(pageNum);
      let viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      let imgData = canvas.toDataURL('image/jpeg', quality);

      // Estimate binary bytes from Base64 (length * 0.75)
      let pageBytes = (imgData.length - 23) * 0.75;

      // Micro-adjustment: if page exceeded its budget by >20%, downscale and re-render this page
      if (pageBytes > currentBudgetPerPage * 1.20 && remainingPages > 1) {
        const factor = Math.sqrt(currentBudgetPerPage / pageBytes);
        scale = Math.max(0.35, scale * factor);
        quality = Math.max(0.15, quality * factor);

        viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        imgData = canvas.toDataURL('image/jpeg', quality);
        pageBytes = (imgData.length - 23) * 0.75;
      }

      // Deduct actual consumed bytes from the remaining budget for future pages
      remainingBudget -= pageBytes;

      // Add to PDF
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

    return newPdf.output('blob');
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(5);
      setResult(null);
      setErrorMsg(null);

      const buffer = await file.arrayBuffer();

      const [losslessBlob, adaptiveBlob] = await Promise.all([
        compressLossless(buffer),
        compressAdaptive(buffer, targetSize),
      ]);

      const candidates = [];
      if (losslessBlob && losslessBlob.size < file.size) {
        candidates.push(losslessBlob);
      }
      if (adaptiveBlob && adaptiveBlob.size < file.size) {
        candidates.push(adaptiveBlob);
      }

      if (candidates.length === 0) {
        setErrorMsg(`Your document is already at maximum optimization (${formatSize(file.size)}).`);
        return;
      }

      // Select candidate closest to the slider's target size
      candidates.sort((a, b) => Math.abs(a.size - targetSize) - Math.abs(b.size - targetSize));
      const bestBlob = candidates[0];

      setResult({
        blobUrl: URL.createObjectURL(bestBlob),
        size: bestBlob.size,
        fileName: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Compression failed. Please ensure the document is not password-protected.');
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
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center hover:border-indigo-500 transition cursor-pointer bg-white">
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
                <p className="text-xs text-slate-500">Original Size: {formatSize(file.size)}</p>
              </div>
            </div>
            {result && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </div>
        )}

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <label className="text-sm font-semibold text-slate-700">Target Reduction</label>
            </div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {compressionRate}% reduction
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
              setResult(null);
              setErrorMsg(null);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>Light (10%)</span>
            <span>Balanced (50%)</span>
            <span>Maximum (90%)</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-600">Target Output Size:</span>
            <span className="font-semibold text-slate-800">
              {file ? `~${formatSize(targetSize)}` : '--'}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={!file || isProcessing}
          onClick={handleCompress}
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

        {errorMsg && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-900 font-medium">Actual Output Size:</span>
              <span className="font-bold text-emerald-700">
                {formatSize(result.size)}
                <span className="ml-2 font-normal text-xs text-emerald-600">
                  (-{Math.round(((file.size - result.size) / file.size) * 100)}%)
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