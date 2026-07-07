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

// GET: Paginated full dataset lookup
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

    // 2. Enforce Strict Rate Limiting for full scans (10 req/min per key)
    const keyId = authResult.apiKeyRecord!.keyId;
    if (!checkRateLimit(`${keyId}_all_scans`, 10)) {
      return NextResponse.json({
        error: 'Rate limit exceeded for full dataset scans. Max 10 requests per minute.'
      }, { status: 429, headers: corsHeaders });
    }

    await connectToDatabase();

    // 3. Fetch dataset definition
    const dataset = await Dataset.findOne({ slug: datasetSlug });
    if (!dataset) {
      return NextResponse.json({ error: `Dataset slug "${datasetSlug}" not found` }, { status: 404, headers: corsHeaders });
    }

    // 4. Parse page & limit parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 5. Query records with count
    const totalRecords = await RecordModel.countDocuments({ datasetId: dataset._id });
    const records = await RecordModel.find({ datasetId: dataset._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const results = records.map(r => ({
      _id: r._id,
      datasetId: r.datasetId,
      data: r.data,
    }));

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
      },
      results
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
