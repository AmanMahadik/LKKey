import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { ApiKey } from '@/models/ApiKey';
import { generateApiKey } from '@/utils/generateApiKey';
import { validateAdminSecret } from '@/utils/auth';

// GET: List all API Keys
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const keys = await ApiKey.find({}).sort({ createdAt: -1 });
    // Remove hashes before returning
    const safeKeys = keys.map(k => {
      const { keyHash, ...obj } = k.toObject();
      return obj;
    });

    return NextResponse.json(safeKeys);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Generate a new API Key
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const { ownerLabel, allowedDatasets } = body;

    if (!ownerLabel || !allowedDatasets || !Array.isArray(allowedDatasets)) {
      return NextResponse.json(
        { error: 'Missing required fields: ownerLabel (string), allowedDatasets (array of slugs or ["*"])' },
        { status: 400 }
      );
    }

    const { rawKey, keyId, keyHash } = generateApiKey();

    const apiKeyRecord = await ApiKey.create({
      keyId,
      keyHash,
      ownerLabel,
      allowedDatasets,
      requestCount: 0,
      isActive: true
    });

    // Return the raw key ONCE along with metadata
    return NextResponse.json({
      key: rawKey, // Raw key shown to user once
      _id: apiKeyRecord._id,
      keyId: apiKeyRecord.keyId,
      ownerLabel: apiKeyRecord.ownerLabel,
      allowedDatasets: apiKeyRecord.allowedDatasets,
      isActive: apiKeyRecord.isActive,
      createdAt: apiKeyRecord.createdAt
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
