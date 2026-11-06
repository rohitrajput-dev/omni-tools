import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolsLayout';
import { UploadCloud, Download } from 'lucide-react';

export default function ImageCompressor() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setOriginalSize((file.size / 1024).toFixed(1));
      const url = URL.createObjectURL(file);
      setPreview(url);
      compressImage(url, quality);
    }
  };

  const compressImage = (src, q) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      setCompressedUrl(dataUrl);

      // Estimate compressed size
      const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
      setCompressedSize((sizeInBytes / 1024).toFixed(1));
    };
  };

  return (
    <ToolLayout
      title="Image Compressor"
      description="Compress JPG and PNG images right in your browser without uploading to any server."
      category="Compressors"
    >
      <canvas ref={canvasRef} className="hidden" />

      {!imageFile ? (
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center flex flex-col items-center justify-center hover:border-indigo-500 transition cursor-pointer">
          <UploadCloud className="w-12 h-12 text-slate-400 mb-2" />
          <span className="font-semibold text-slate-700">Choose an image file to compress</span>
          <span className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-1 w-full text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Original ({originalSize} KB)</span>
              <img src={preview} alt="Original Preview" className="mt-2 h-48 w-full object-contain rounded-lg border border-slate-200" />
            </div>
            <div className="flex-1 w-full text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Compressed (~{compressedSize} KB)</span>
              {compressedUrl && (
                <img src={compressedUrl} alt="Compressed Preview" className="mt-2 h-48 w-full object-contain rounded-lg border border-slate-200" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Compression Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={quality}
              onChange={(e) => {
                const q = parseFloat(e.target.value);
                setQuality(q);
                compressImage(preview, q);
              }}
              className="w-full"
            />
          </div>

          <div className="flex gap-4">
            <a
              href={compressedUrl}
              download="compressed-image.jpg"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" /> Download Compressed Image
            </a>
            <button
              onClick={() => {
                setImageFile(null);
                setPreview(null);
                setCompressedUrl(null);
              }}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Upload another image
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}