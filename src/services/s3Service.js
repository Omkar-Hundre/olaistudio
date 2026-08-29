/**
 * ==============================================================================
 * Service: s3Service
 * ==============================================================================
 * Handles secure file uploads to AWS S3 by first requesting Pre-signed URLs
 * from the highly secure Supabase Edge Function (`s3-upload-url`). 
 * This prevents exposing AWS Secret Keys in the frontend bundle.
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Uploads an array of File objects to S3 securely.
 * @param {File[]} files - Array of JS File objects from the file input
 * @returns {Promise<Array<{ originalName: string, objectKey: string, publicUrl: string }>>}
 */
export async function uploadFilesSecurely(files) {
  if (!files || files.length === 0) return [];

  const filenames = files.map(file => file.name);

  try {
    // 1. Request presigned URLs from our secure Edge Function
    const { data: { urls }, error } = await supabase.functions.invoke('s3-upload-url', {
      body: { filenames },
    });

    if (error) {
      console.error('Edge Function Error fetching presigned URLs:', error);
      throw new Error('Failed to securely authorize file upload.');
    }

    if (!urls || urls.length !== files.length) {
      throw new Error('Mismatch in authorized upload URLs.');
    }

    // 2. Perform raw HTTP PUT to the presigned URLs directly from the client
    const uploadPromises = files.map(async (file, index) => {
      const { uploadUrl, publicUrl, objectKey, originalName } = urls[index];

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name} to S3. Status: ${response.status}`);
      }

      return {
        originalName,
        objectKey,
        publicUrl
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults;

  } catch (err) {
    console.error('S3 Upload Service Error:', err);
    throw err;
  }
}
