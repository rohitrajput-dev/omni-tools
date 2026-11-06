export const toolCategories = [
  {
    id: 'converters',
    name: 'File Converters',
    description: 'Transform documents between different file types.',
  },
  {
    id: 'compressors',
    name: 'File Compressors',
    description: 'Reduce file sizes without compromising quality.',
  },
  {
    id: 'formatters',
    name: 'Code & Data Formatters',
    description: 'Clean, prettify, and validate code and data payloads.',
  },
  {
    id: 'mergers',
    name: 'Document Mergers',
    description: 'Combine multiple files into a single unified document.',
  },
];

export const tools = [
  {
    slug: 'converters/word-to-pdf',
    title: 'Word to PDF',
    category: 'converters',
    description: 'Convert DOC/DOCX documents to clean PDF format.',
  },
  {
    slug: 'converters/pdf-to-word',
    title: 'PDF to Word',
    category: 'converters',
    description: 'Extract and convert PDF content into editable Word files.',
  },
  {
    slug: 'compressors/image-compressor',
    title: 'Image Compressor',
    category: 'compressors',
    description: 'Compress PNG, JPEG, and WebP images client-side.',
  },
  {
    slug: 'compressors/pdf-compressor',
    title: 'PDF Compressor',
    category: 'compressors',
    description: 'Shrink PDF file size for easy emailing and uploading.',
  },
  {
    slug: 'formatters/json-formatter',
    title: 'JSON Formatter & Validator',
    category: 'formatters',
    description: 'Format, validate, prettify, and minify your JSON data.',
  },
  {
    slug: 'mergers/pdf-merger',
    title: 'PDF Merger',
    category: 'mergers',
    description: 'Combine multiple PDF files into one ordered document.',
  },
];