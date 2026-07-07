import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { ApiKey } from '@/models/ApiKey';
import { UploadLog } from '@/models/UploadLog';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  // Check if datasets exist
  const count = await Dataset.countDocuments();
  if (count > 0) {
    return; // Already seeded
  }

  console.log('Database is empty. Initializing seed data...');

  // 1. Seed Datasets
  const rtoDataset = await Dataset.create({
    slug: 'rto-codes',
    name: 'RTO Codes India',
    description: 'Official RTO codes mapping for states and cities in India.',
    schemaFields: ['state', 'city', 'rto_code'],
    searchableFields: ['city', 'state'],
    uniqueKeys: ['state', 'city'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });

  const pinDataset = await Dataset.create({
    slug: 'pincodes',
    name: 'Pincodes India',
    description: 'Postal Index Number (PIN) codes for Indian post offices and regions.',
    schemaFields: ['pincode', 'office_name', 'district', 'state'],
    searchableFields: ['office_name', 'pincode', 'district'],
    uniqueKeys: ['pincode', 'office_name'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  const ifscDataset = await Dataset.create({
    slug: 'ifsc-codes',
    name: 'IFSC Codes',
    description: 'Indian Financial System Codes for bank branches.',
    schemaFields: ['bank_name', 'ifsc', 'branch', 'city', 'state'],
    searchableFields: ['bank_name', 'ifsc', 'branch', 'city'],
    uniqueKeys: ['ifsc'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });

  const isdDataset = await Dataset.create({
    slug: 'isd-codes',
    name: 'ISD Codes',
    description: 'International Subscriber Dialing codes for countries.',
    schemaFields: ['country', 'isd_code', 'capital'],
    searchableFields: ['country', 'isd_code'],
    uniqueKeys: ['country'],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  });

  // 2. Seed Records for RTO Codes
  const rtoRecords = [
    { state: 'Maharashtra', city: 'Nashik', rto_code: 'MH-15' },
    { state: 'Maharashtra', city: 'Mumbai Central', rto_code: 'MH-01' },
    { state: 'Maharashtra', city: 'Pune', rto_code: 'MH-12' },
    { state: 'Karnataka', city: 'Bangalore East', rto_code: 'KA-03' },
    { state: 'Karnataka', city: 'Bangalore Central', rto_code: 'KA-01' },
    { state: 'Delhi', city: 'Delhi Central', rto_code: 'DL-1C' },
    { state: 'Tamil Nadu', city: 'Chennai Central', rto_code: 'TN-01' },
    { state: 'Telangana', city: 'Hyderabad', rto_code: 'TS-09' },
    { state: 'Rajasthan', city: 'Jaipur', rto_code: 'RJ-14' },
    { state: 'Gujarat', city: 'Ahmedabad', rto_code: 'GJ-01' },
    { state: 'West Bengal', city: 'Kolkata', rto_code: 'WB-01' },
    { state: 'Bihar', city: 'Patna', rto_code: 'BR-01' },
    { state: 'Uttar Pradesh', city: 'Lucknow', rto_code: 'UP-32' },
    { state: 'Madhya Pradesh', city: 'Bhopal', rto_code: 'MP-04' },
    { state: 'Goa', city: 'Panaji', rto_code: 'GA-01' },
  ];

  await RecordModel.insertMany(
    rtoRecords.map(r => ({ datasetId: rtoDataset._id, data: r }))
  );

  // 3. Seed Records for Pincodes
  const pinRecords = [
    { pincode: '422001', office_name: 'Nashik H.O', district: 'Nashik', state: 'Maharashtra' },
    { pincode: '400001', office_name: 'Mumbai G.P.O.', district: 'Mumbai', state: 'Maharashtra' },
    { pincode: '411001', office_name: 'Pune H.O.', district: 'Pune', state: 'Maharashtra' },
    { pincode: '560001', office_name: 'Bangalore G.P.O.', district: 'Bangalore', state: 'Karnataka' },
    { pincode: '110001', office_name: 'New Delhi G.P.O.', district: 'New Delhi', state: 'Delhi' },
    { pincode: '600001', office_name: 'Chennai G.P.O.', district: 'Chennai', state: 'Tamil Nadu' },
    { pincode: '302001', office_name: 'Jaipur G.P.O.', district: 'Jaipur', state: 'Rajasthan' },
  ];

  await RecordModel.insertMany(
    pinRecords.map(r => ({ datasetId: pinDataset._id, data: r }))
  );

  // 4. Seed Records for IFSC Codes
  const ifscRecords = [
    { bank_name: 'State Bank of India', ifsc: 'SBIN0000437', branch: 'Nashik', city: 'Nashik', state: 'Maharashtra' },
    { bank_name: 'HDFC Bank', ifsc: 'HDFC0000003', branch: 'Mumbai Fort', city: 'Mumbai', state: 'Maharashtra' },
    { bank_name: 'ICICI Bank', ifsc: 'ICIC0000007', branch: 'Pune Bund Garden', city: 'Pune', state: 'Maharashtra' },
    { bank_name: 'State Bank of India', ifsc: 'SBIN0000813', branch: 'Bangalore Main', city: 'Bangalore', state: 'Karnataka' },
  ];

  await RecordModel.insertMany(
    ifscRecords.map(r => ({ datasetId: ifscDataset._id, data: r }))
  );

  // 5. Seed Records for ISD Codes
  const isdRecords = [
    { country: 'India', isd_code: '+91', capital: 'New Delhi' },
    { country: 'United States', isd_code: '+1', capital: 'Washington D.C.' },
    { country: 'United Kingdom', isd_code: '+44', capital: 'London' },
    { country: 'Germany', isd_code: '+49', capital: 'Berlin' },
    { country: 'Australia', isd_code: '+61', capital: 'Canberra' },
  ];

  await RecordModel.insertMany(
    isdRecords.map(r => ({ datasetId: isdDataset._id, data: r }))
  );

  // 6. Seed Demo API Key
  // Demo Key raw: lk_key_demo12345678_demosecretkey
  // Id: lk_key_demo12345678
  const demoKeyRaw = 'lk_key_demo12345678_demosecretkey';
  const demoKeyHash = bcrypt.hashSync(demoKeyRaw, 10);
  await ApiKey.create({
    keyId: 'lk_key_demo12345678',
    keyHash: demoKeyHash,
    ownerLabel: 'Personal Project X',
    allowedDatasets: ['*'],
    requestCount: 8421, // Matching screenshot stats
    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000),
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  });

  // Seed another inactive key
  const inactiveKeyRaw = 'lk_key_revoked123_revokedsecret';
  const inactiveKeyHash = bcrypt.hashSync(inactiveKeyRaw, 10);
  await ApiKey.create({
    keyId: 'lk_key_revoked123',
    keyHash: inactiveKeyHash,
    ownerLabel: 'SocietySync',
    allowedDatasets: ['rto-codes'],
    requestCount: 341,
    lastUsedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    isActive: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  });

  // Seed a third expired key for analytics matching
  const expiredKeyRaw = 'lk_key_expired123_expiredsecret';
  const expiredKeyHash = bcrypt.hashSync(expiredKeyRaw, 10);
  await ApiKey.create({
    keyId: 'lk_key_expired123',
    keyHash: expiredKeyHash,
    ownerLabel: 'Billing Widget',
    allowedDatasets: ['pincodes'],
    requestCount: 2014,
    lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  });

  // 7. Seed UploadLogs
  await UploadLog.create({
    datasetId: rtoDataset._id,
    fileName: 'rto-codes.xlsx',
    rowsInserted: 2548,
    rowsFailed: 0,
    uploadedBy: 'Aman Mahadik',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  });

  await UploadLog.create({
    datasetId: pinDataset._id,
    fileName: 'pincodes.xlsx',
    rowsInserted: 18230,
    rowsFailed: 0,
    uploadedBy: 'Aman Mahadik',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  await UploadLog.create({
    datasetId: ifscDataset._id,
    fileName: 'ifsc-codes.xlsx',
    rowsInserted: 7452,
    rowsFailed: 0,
    uploadedBy: 'Aman Mahadik',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  await UploadLog.create({
    datasetId: isdDataset._id,
    fileName: 'isd-codes.xlsx',
    rowsInserted: 4102,
    rowsFailed: 0,
    uploadedBy: 'Aman Mahadik',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });

  console.log('Seed data successfully inserted!');
}
