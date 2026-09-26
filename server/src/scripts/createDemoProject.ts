import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { BUILTIN_SCHEMAS } from '../services/aiService';

async function seedUserProjects() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mockforge');
  console.log('🔄 Connected to MongoDB for seeding demo projects...');

  const users = await User.find({});
  if (users.length === 0) {
    console.log('⚠️ No users found in database yet.');
    await mongoose.disconnect();
    return;
  }

  for (const user of users) {
    // Check if user already has projects
    const existingCount = await Project.countDocuments({ userId: user._id });
    if (existingCount === 0) {
      console.log(`✨ Creating sample projects for user: ${user.email}`);

      await Project.create([
        {
          name: 'E-Commerce Production System',
          description: 'Full-stack relational schema with Users, Products, Orders, Order Items, Payments, and Reviews.',
          userId: user._id,
          prompt: 'Generate an e-commerce platform with users, products, orders, order items, payments and reviews',
          tables: BUILTIN_SCHEMAS.ecommerce.tables,
          flowEdges: BUILTIN_SCHEMAS.ecommerce.edges,
          generationSettings: {
            rowsCount: 500,
            exportFormat: 'ZIP',
            edgeCases: { mutationPercentage: 10, mutations: { injectSQLi: true, injectXSS: true } },
          },
          totalRowsGenerated: 25000,
          totalExports: 4,
          lastGeneratedAt: new Date(),
          tags: ['ecommerce', 'relational', 'testing', 'production'],
        },
        {
          name: 'Banking & Core Finance System',
          description: 'High-scale financial database schema linking Customers, Savings Accounts, Transactions, and Loans.',
          userId: user._id,
          prompt: 'Generate a banking database with customers, accounts, transactions and loans',
          tables: BUILTIN_SCHEMAS.banking.tables,
          flowEdges: BUILTIN_SCHEMAS.banking.edges,
          generationSettings: {
            rowsCount: 1000,
            exportFormat: 'SQL',
            edgeCases: { mutationPercentage: 5, mutations: { injectNulls: true } },
          },
          totalRowsGenerated: 100000,
          totalExports: 8,
          lastGeneratedAt: new Date(Date.now() - 86400000),
          tags: ['banking', 'finance', 'sql', 'transactions'],
        },
        {
          name: 'Hospital Management & EHR',
          description: 'Healthcare environment connecting Patients, Doctors, Appointments, and Inpatient Billing.',
          userId: user._id,
          prompt: 'Generate a hospital system with patients, doctors, appointments and billing',
          tables: BUILTIN_SCHEMAS.hospital.tables,
          flowEdges: BUILTIN_SCHEMAS.hospital.edges,
          generationSettings: {
            rowsCount: 250,
            exportFormat: 'JSON',
            edgeCases: { mutationPercentage: 0, mutations: {} },
          },
          totalRowsGenerated: 12500,
          totalExports: 2,
          lastGeneratedAt: new Date(Date.now() - 86400000 * 2),
          tags: ['healthcare', 'patients', 'ehr'],
        },
      ]);
      console.log(`✅ Demo projects created for user: ${user.email}`);
    } else {
      console.log(`ℹ️ User ${user.email} already has ${existingCount} project(s).`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Demo project seeding finished.');
}

seedUserProjects().catch(console.error);
