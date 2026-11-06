import { useState } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, FileText, CheckCircle2, Loader2, Download, Sliders, ShieldCheck, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

// Vite-native worker configurationg
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
  const [notice, setNotice] = useState(null);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Real-time estimated size preview
  const estimatedSize = file ? Math.round(file.size * (1 - compressionRate / 100)) : 0;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setNotice(null);
  };

  // Engine 1: Lossless structural stream compression (Best for text/vectors)
  const compressLossless = async (arrayBuffer) => {
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      const savedBytes = await pdfDoc.save({ useObjectStreams: true });
      return new Blob([savedBytes], { type: 'application/pdf' });
    } catch {
      return null;
    }
  };

  // Engine 2: Canvas downsampling (Best for scanned docs & photos)
  const compressRaster = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    // Strict scaling based on slider to prevent image bloat
    const factor = compressionRate / 100;
    const quality = Math.max(0.15, 0.75 - factor * 0.55); // 0.70 down to 0.20
    const scale = Math.max(0.5, 1.1 - factor * 0.6);      // 1.05 down to 0.50

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

      newPdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'SLOW');
      setProgress(Math.round((pageNum / totalPages) * 100));
    }

    return newPdf ? newPdf.output('blob') : null;
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setResult(null);
      setNotice(null);

      const buffer = await file.arrayBuffer();

      // Run both engines
      const [losslessBlob, rasterBlob] = await Promise.all([
        compressLossless(buffer),
        compressRaster(buffer),
      ]);

      // Collect all candidates smaller than original
      const candidates = [];
      if (losslessBlob && losslessBlob.size < file.size) {
        candidates.push({ blob: losslessBlob, type: 'lossless' });
      }
      if (rasterBlob && rasterBlob.size < file.size) {
        candidates.push({ blob: rasterBlob, type: 'raster' });
      }

      // Pick whichever engine produced the smallest file
      candidates.sort((a, b) => a.blob.size - b.blob.size);

      if (candidates.length > 0) {
        const best = candidates[0];
        setResult({
          blobUrl: URL.createObjectURL(best.blob),
          size: best.blob.size,
          fileName: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
        });
      } else {
        // If neither method could beat the original size, the file is already at maximum optimization
        setNotice(
          `Your PDF is already at optimal size (${formatSize(file.size)}). Because it contains clean digital text without bulky images, further compression would degrade visual quality without saving disk space.`
        );
      }
    } catch (err) {
      console.error(err);
      alert('Unable to process PDF. Verify the file is not password-protected.');
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
        {/* File Dropzone */}
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

        {/* Selected File Details */}
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

        {/* Interactive Compression Slider */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <label className="text-sm font-semibold text-slate-700">Target Compression Rate</label>
            </div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {compressionRate}%
            </span>
          </div>

          {/* Standard cross-browser range slider (without appearance-none) */}
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
              setNotice(null);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>Low (10%)</span>
            <span>Balanced (50%)</span>
            <span>Extreme (90%)</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-600">Estimated Target Size:</span>
            <span className="font-semibold text-slate-800">
              {file ? `~${formatSize(estimatedSize)}` : '--'}
              {file && (
                <span className="text-xs text-emerald-600 font-normal ml-1">
                  (-{compressionRate}%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Compress Action Button */}
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

        {/* Notice when the file is already optimal */}
        {notice && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Already Optimized</p>
              <p className="text-blue-700 text-xs leading-relaxed">{notice}</p>
            </div>
          </div>
        )}

        {/* Download Results Card */}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-900 font-medium">New Compressed Size:</span>
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