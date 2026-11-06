import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Converter Tools
import WordToPdf from './tools/converters/WordToPdf';
import PdfToWord from './tools/converters/PdfToWord';

// Compressor Tools
import ImageCompressor from './tools/compressors/ImageCompressor';
import PdfCompressor from './tools/compressors/PdfCompressor';

// Formatter Tools
import JsonFormatter from './tools/formatters/JsonFormatter';
import SqlFormatter from './tools/formatters/SqlFormatter';

// Merger Tools
import PdfMerger from './tools/mergers/PdfMerger';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* Converters */}
          <Route path="/converters/word-to-pdf" element={<WordToPdf />} />
          <Route path="/converters/pdf-to-word" element={<PdfToWord />} />

          {/* Compressors */}
          <Route path="/compressors/image-compressor" element={<ImageCompressor />} />
          <Route path="/compressors/pdf-compressor" element={<PdfCompressor />} />

          {/* Formatters */}
          <Route path="/formatters/json-formatter" element={<JsonFormatter />} />
          <Route path="/formatters/sql-formatter" element={<SqlFormatter />} />

          {/* Mergers */}
          <Route path="/mergers/pdf-merger" element={<PdfMerger />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}