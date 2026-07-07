import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { ApiKey } from '@/models/ApiKey';
import { validateAdminSecret } from '@/utils/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await ApiKey.findById(id);
    if (!apiKey) {
      return NextResponse.json({ error: `API key with id "${id}" not found` }, { status: 404 });
    }

    apiKey.isActive = false;
    await apiKey.save();

    const { keyHash, ...safeObj } = apiKey.toObject();

    return NextResponse.json({
      success: true,
      message: 'API Key successfully revoked',
      apiKey: safeObj
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
