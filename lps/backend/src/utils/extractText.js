const fs = require('fs');

async function extractTextFromFile(filePath, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || null;
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || null;
    }

    if (mimetype === 'application/msword') {
      console.warn('Legacy DOC files are stored, but text extraction is not supported.');
      return null;
    }

    console.warn(`Unsupported file type for text extraction: ${mimetype}`);
    return null;
  } catch (err) {
    console.error('Text extraction failed:', err.message);
    return null;
  }
}

module.exports = { extractTextFromFile };
