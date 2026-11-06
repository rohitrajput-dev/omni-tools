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
  const [compressionRate, setCompressionRate] = useState(50); // 10% to 90%
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

  // 1. Lossless metadata and object-stream compression
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

  // 2. Budget-driven canvas rasterizer
  const compressWithBudget = async (buffer, targetBytes) => {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const totalPages = pdf.numPages;

    // Calculate maximum allowable bytes per page to meet user target
    const bytesPerPage = targetBytes / totalPages;

    // Dynamically adjust scale & quality based on per-page budget
    let scale = 1.0;
    let quality = 0.6;

    if (bytesPerPage < 35 * 1024) {
      // Strict budget (<35KB/page): aggressive downscaling
      scale = 0.55;
      quality = 0.25;
    } else if (bytesPerPage < 70 * 1024) {
      // Moderate budget (35KB - 70KB/page)
      scale = 0.75;
      quality = 0.45;
    } else {
      // Generous budget (>70KB/page)
      scale = 0.95;
      quality = 0.65;
    }

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

      // Run lossless and budget rasterizer concurrently
      const [losslessBlob, rasterBlob] = await Promise.all([
        compressLossless(buffer),
        compressWithBudget(buffer, targetSize),
      ]);

      // Filter options that actually achieved compression
      const validOptions = [];
      if (losslessBlob && losslessBlob.size < file.size) {
        validOptions.push(losslessBlob);
      }
      if (rasterBlob && rasterBlob.size < file.size) {
        validOptions.push(rasterBlob);
      }

      if (validOptions.length === 0) {
        setErrorMsg(
          `Unable to compress further. The document is already at maximum optimization (${formatSize(file.size)}).`
        );
        return;
      }

      // Pick whichever candidate came closest to (or below) the user's target size
      validOptions.sort((a, b) => Math.abs(a.size - targetSize) - Math.abs(b.size - targetSize));
      const bestBlob = validOptions[0];

      setResult({
        blobUrl: URL.createObjectURL(bestBlob),
        size: bestBlob.size,
        fileName: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Compression failed. Please ensure the PDF is not encrypted.');
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
        {/* Upload Zone */}
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

        {/* File Card */}
        {file && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-slate-800 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">Current Size: {formatSize(file.size)}</p>
              </div>
            </div>
            {result && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </div>
        )}

        {/* Compression Goal Slider */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <label className="text-sm font-semibold text-slate-700">Compression Goal</label>
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

        {/* Compress Button */}
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

        {/* Notice if already minimal */}
        {errorMsg && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-900 font-medium">Actual Result:</span>
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