import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, GetObjectCommand } from "npm:@aws-sdk/client-s3@3.859.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting S3 data fetch...');
    
    // Get AWS credentials from environment
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION');
    const bucketName = Deno.env.get('S3_BUCKET_NAME');
    const objectKey = Deno.env.get('S3_OBJECT_KEY');

    console.log('Environment check:', {
      accessKeyId: accessKeyId ? 'Set' : 'Missing',
      secretAccessKey: secretAccessKey ? 'Set' : 'Missing',
      region: region || 'Missing',
      bucketName: bucketName || 'Missing',
      objectKey: objectKey || 'Missing'
    });

    if (!accessKeyId || !secretAccessKey || !region || !bucketName || !objectKey) {
      throw new Error('Missing required AWS environment variables');
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log('S3 client created, fetching object...');

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No data received from S3');
    }

    // Convert stream to string
    const bodyText = await response.Body.transformToString();
    console.log('Raw S3 data length:', bodyText.length);

    // Parse JSON
    const jsonData = JSON.parse(bodyText);
    console.log('Parsed JSON data, items count:', jsonData.length);

    return new Response(JSON.stringify(jsonData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching S3 data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch data from S3'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});