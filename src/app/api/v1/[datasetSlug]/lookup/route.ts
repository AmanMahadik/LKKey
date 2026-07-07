import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { validateApiKey } from '@/utils/auth';
import { checkRateLimit } from '@/utils/rateLimit';

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

// GET: Exact/filtered database lookup
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

    await connectToDatabase();

    // 3. Fetch dataset definition
    const dataset = await Dataset.findOne({ slug: datasetSlug });
    if (!dataset) {
      return NextResponse.json({ error: `Dataset slug "${datasetSlug}" not found` }, { status: 404, headers: corsHeaders });
    }

    // 4. Parse query parameters into Mongoose query filters
    const { searchParams } = new URL(req.url);
    const queryFilter: Record<string, any> = { datasetId: dataset._id };
    let hasFilter = false;

    searchParams.forEach((val, key) => {
      if (val && val.trim() !== '') {
        // Match exact value case-insensitively using regex
        queryFilter[`data.${key}`] = { $regex: new RegExp(`^${val.trim()}$`, 'i') };
        hasFilter = true;
      }
    });

    if (!hasFilter) {
      return NextResponse.json({
        error: 'Missing query parameters. Please specify at least one schema field query parameter (e.g. ?city=Nashik)'
      }, { status: 400, headers: corsHeaders });
    }

    // 5. Query MongoDB
    const records = await RecordModel.find(queryFilter).limit(100);

    const results = records.map(r => ({
      _id: r._id,
      datasetId: r.datasetId,
      data: r.data,
    }));

    return NextResponse.json({
      success: true,
      count: results.length,
      results
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
