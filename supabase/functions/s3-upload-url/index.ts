import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify token validity against Supabase Auth (or just enforce presence for now since Edge Function runtime handles Supabase auth headers implicitly if configured, but we'll strictly require the header).
    // In a fully locked down production, we'd verify the JWT payload using the JWT secret here.
    
    // 2. Parse Request
    const { filenames } = await req.json();
    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ error: 'Bad Request: Missing filenames array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Initialize S3 Client securely using backend environment variables
    const s3Client = new S3Client({
      region: Deno.env.get('AWS_REGION') || 'eu-north-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    const bucket = Deno.env.get('AWS_S3_BUCKET') || 'olai';

    // 4. Generate Presigned URLs for each requested file
    const uploadUrls = await Promise.all(filenames.map(async (filename) => {
      // Create a unique object key preventing collisions
      const uniqueId = crypto.randomUUID();
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectKey = `uploads/${uniqueId}-${safeFilename}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        // We do not strictly bind ContentType here so the client can infer it, 
        // but we could if we passed it in the request.
      });

      // Url expires in 5 minutes
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      return {
        originalName: filename,
        objectKey: objectKey,
        uploadUrl: presignedUrl,
        publicUrl: `https://${bucket}.s3.eu-north-1.amazonaws.com/${objectKey}`
      };
    }));

    return new Response(JSON.stringify({ urls: uploadUrls }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
