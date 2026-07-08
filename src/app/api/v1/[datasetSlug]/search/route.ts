import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { validateApiKey } from '@/utils/auth';
import { checkRateLimit } from '@/utils/rateLimit';
import { searchRecords } from '@/services/search';

// Preflight CORS OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET: Fuzzy search records
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ datasetSlug: string }> }
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };

  try {
    const { datasetSlug } = await params;

    // 1. Authenticate API Key
    const authResult = await validateApiKey(req.headers, datasetSlug);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status, headers: corsHeaders });
    }

    // 2. Enforce Rate Limiting (default 100 req/min)
    const keyId = authResult.apiKeyRecord!.keyId;
    if (!checkRateLimit(keyId, 100)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 100 requests per minute.' }, { status: 429, headers: corsHeaders });
    }

    // 3. Extract query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Missing required query parameter "q"' }, { status: 400, headers: corsHeaders });
    }

    await connectToDatabase();

    // 4. Fetch dataset definition
    const dataset = await Dataset.findOne({ slug: datasetSlug });
    if (!dataset) {
      return NextResponse.json({ error: `Dataset slug "${datasetSlug}" not found` }, { status: 404, headers: corsHeaders });
    }

    // 5. Fetch all records from database for this dataset
    const records = await RecordModel.find({ datasetId: dataset._id }).lean();

    // 6. Run fuzzy search
    const results = searchRecords(records, query, dataset.searchableFields);

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
