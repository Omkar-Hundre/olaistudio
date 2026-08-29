/**
 * ==============================================================================
 * Utility: fileParser
 * ==============================================================================
 * Handles local client-side parsing of File blobs before they are uploaded.
 * Extracts text for AI context and generates data URIs for UI previews.
 * ==============================================================================
 */

/**
 * Checks if a file is a text-based file (code, markdown, plaintext)
 */
export function isTextFile(file) {
  const textTypes = [
    'text/', 
    'application/json', 
    'application/javascript',
    'application/xml',
    'application/x-sh',
    'application/x-httpd-php'
  ];
  if (textTypes.some(type => file.type.startsWith(type))) return true;

  // Fallback checking extensions for common code files that might lack strict MIME types
  const textExtensions = ['.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.txt', '.env'];
  if (textExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) return true;

  return false;
}

/**
 * Checks if a file is an image
 */
export function isImageFile(file) {
  return file.type.startsWith('image/');
}

/**
 * Parses a single file, extracting text content if applicable, 
 * and generating a preview URL (Object URL) for images.
 * @param {File} file 
 * @returns {Promise<{ file: File, name: string, type: string, size: number, textContent: string | null, previewUrl: string | null }>}
 */
export async function parseLocalFile(file) {
  return new Promise((resolve, reject) => {
    const result = {
      file: file, // Keep reference to raw file for S3 upload
      name: file.name,
      type: file.type,
      size: file.size,
      textContent: null,
      previewUrl: null
    };

    if (isImageFile(file)) {
      result.previewUrl = URL.createObjectURL(file);
      resolve(result); // We don't extract text from images locally
    } else if (isTextFile(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        result.textContent = e.target.result;
        resolve(result);
      };
      reader.onerror = () => reject(new Error(`Failed to read text file: ${file.name}`));
      reader.readAsText(file);
    } else {
      // PDF or other binary formats that we cannot parse purely with FileReader text
      resolve(result);
    }
  });
}
