import mammoth from 'mammoth';
import xlsx from 'xlsx';

// Use dynamic import for pdf-parse to avoid ESM issues
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse');
    const pdf = pdfParse.default || pdfParse;
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    return '[Unable to extract text from PDF - parsing error]';
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<string> {
  try {
    if (contentType === 'application/pdf') {
      return await parsePDF(buffer);
    }
    
    if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        contentType === 'application/vnd.ms-excel' ||
        fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += `\n\n=== Sheet: ${sheetName} ===\n`;
        text += xlsx.utils.sheet_to_txt(sheet);
      });
      return text;
    }
    
    if (contentType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      return buffer.toString('utf-8');
    }
    
    return `[Unable to extract text from file type: ${contentType}]`;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `[Error extracting text from file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

export function getSupportedFileTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv'
  ];
}

export function getMaxFileSize(): number {
  return 10 * 1024 * 1024; // 10MB
}
