import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Template } from '../models/Template';
import { BUILTIN_SCHEMAS } from '../services/aiService';

let mongodInstance: MongoMemoryServer | null = null;

async function seedTemplatesIfEmpty(): Promise<void> {
  try {
    const count = await Template.countDocuments();
    if (count === 0) {
      console.log('ℹ️ Database templates collection is empty. Seeding built-in templates...');
      const templatesToSeed = [
        {
          name: 'E-Commerce Platform',
          description: 'Complete online shopping database with Users, Products, Orders, Payments, and Reviews',
          category: 'Commerce',
          icon: '🛒',
          tags: ['ecommerce', 'shop', 'orders', 'products'],
          tables: BUILTIN_SCHEMAS.ecommerce.tables,
          flowEdges: BUILTIN_SCHEMAS.ecommerce.edges,
          isBuiltIn: true,
        },
        {
          name: 'Hospital Management',
          description: 'Healthcare database with Patients, Doctors, Appointments, Bills, and Prescriptions',
          category: 'Healthcare',
          icon: '🏥',
          tags: ['hospital', 'patients', 'doctors', 'health'],
          tables: BUILTIN_SCHEMAS.hospital.tables,
          flowEdges: BUILTIN_SCHEMAS.hospital.edges,
          isBuiltIn: true,
        },
        {
          name: 'Banking System',
          description: 'Financial database with Customers, Accounts, Transactions, and Loans',
          category: 'Finance',
          icon: '🏦',
          tags: ['bank', 'finance', 'transactions', 'loans'],
          tables: BUILTIN_SCHEMAS.banking.tables,
          flowEdges: BUILTIN_SCHEMAS.banking.edges,
          isBuiltIn: true,
        },
      ];
      await Template.insertMany(templatesToSeed);
      console.log(`✅ Auto-seeded ${templatesToSeed.length} templates successfully!`);
    }
  } catch (err) {
    console.error('❌ Failed to seed templates:', err);
  }
}

export async function connectDB(): Promise<void> {
  let uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log('ℹ️ Connecting to configured MONGODB_URI...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB connected:', uri);
      await seedTemplatesIfEmpty();
      return;
    } catch (err) {
      console.warn('⚠️ Connection to configured MONGODB_URI failed, falling back to in-memory database...');
    }
  }

  console.log('ℹ️ Starting in-memory MongoDB server...');
  try {
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        args: ['--nounixsocket']
      }
    });
    uri = mongodInstance.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected (in-memory):', uri);
    await seedTemplatesIfEmpty();
  } catch (err) {
    console.error('❌ Critical: Failed to start and connect to in-memory MongoDB Server:', err);
    process.exit(1);
  }
}
