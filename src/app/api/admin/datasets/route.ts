import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { validateAdminSecret } from '@/utils/auth';

// GET: List all datasets
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const datasets = await Dataset.find({}).sort({ createdAt: -1 });
    return NextResponse.json(datasets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new dataset
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const { slug, name, description, schemaFields, searchableFields, uniqueKeys } = body;

    // Validation
    if (!slug || !name || !schemaFields || !searchableFields) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, schemaFields, searchableFields' },
        { status: 400 }
      );
    }

    // Check slug pattern
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await Dataset.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: `Dataset with slug "${slug}" already exists` }, { status: 409 });
    }

    const newDataset = await Dataset.create({
      slug,
      name,
      description,
      schemaFields: schemaFields.map((s: string) => s.trim()),
      searchableFields: searchableFields.map((s: string) => s.trim()),
      uniqueKeys: (uniqueKeys || []).map((s: string) => s.trim()),
    });

    return NextResponse.json(newDataset, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a dataset and its associated records & upload logs
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing dataset ID parameter' }, { status: 400 });
    }

    // Find dataset first
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Import models inline to prevent circular references if any
    const { RecordModel } = require('@/models/Record');
    const { UploadLog } = require('@/models/UploadLog');

    // Cascading deletion
    await RecordModel.deleteMany({ datasetId: dataset._id });
    await UploadLog.deleteMany({ datasetId: dataset._id });
    
    // Delete the dataset itself
    await Dataset.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true, 
      message: `Dataset "${dataset.name}" and all associated records deleted successfully.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update an existing dataset definition
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing dataset ID parameter' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, schemaFields, searchableFields, uniqueKeys } = body;

    // Find dataset
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Update fields
    if (name) dataset.name = name;
    if (description !== undefined) dataset.description = description;
    if (schemaFields) dataset.schemaFields = schemaFields.map((s: string) => s.trim());
    if (searchableFields) dataset.searchableFields = searchableFields.map((s: string) => s.trim());
    if (uniqueKeys) dataset.uniqueKeys = uniqueKeys.map((s: string) => s.trim());

    await dataset.save();

    return NextResponse.json(dataset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
