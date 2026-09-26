import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Template } from '../models/Template';
import { BUILTIN_SCHEMAS } from '../services/aiService';

const templates = [
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
  {
    name: 'University Management',
    description: 'Academic database with Students, Courses, Faculty, Grades, and Attendance',
    category: 'Education',
    icon: '🎓',
    tags: ['university', 'students', 'courses', 'education'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'HR Management System',
    description: 'Employee lifecycle database with Employees, Departments, Payroll, Leaves, and Performance',
    category: 'HR',
    icon: '👥',
    tags: ['hr', 'employees', 'payroll', 'hrms'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Ride-Sharing Platform',
    description: 'Mobility platform with Drivers, Riders, Trips, Payments, and Ratings',
    category: 'Transport',
    icon: '🚗',
    tags: ['ride', 'uber', 'transport', 'trips'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Hotel Booking System',
    description: 'Hospitality database with Rooms, Guests, Bookings, Amenities, and Invoices',
    category: 'Hospitality',
    icon: '🏨',
    tags: ['hotel', 'booking', 'rooms', 'guests'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Social Media Platform',
    description: 'Social network with Users, Posts, Comments, Likes, Follows, and Messages',
    category: 'Social',
    icon: '📱',
    tags: ['social', 'posts', 'users', 'comments'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Inventory Management',
    description: 'Warehouse database with Products, Warehouses, Stock, Suppliers, and Purchase Orders',
    category: 'Logistics',
    icon: '📦',
    tags: ['inventory', 'warehouse', 'stock', 'suppliers'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'CRM System',
    description: 'Customer relationship database with Leads, Contacts, Deals, Tasks, and Activities',
    category: 'Business',
    icon: '🤝',
    tags: ['crm', 'leads', 'sales', 'contacts'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Library Management',
    description: 'Library database with Books, Members, Borrowings, Authors, and Fines',
    category: 'Education',
    icon: '📚',
    tags: ['library', 'books', 'borrowing', 'members'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
  {
    name: 'Airline Reservation',
    description: 'Aviation database with Flights, Passengers, Bookings, Seats, and Crew',
    category: 'Transport',
    icon: '✈️',
    tags: ['airline', 'flights', 'passengers', 'bookings'],
    tables: [],
    flowEdges: [],
    isBuiltIn: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mockforge');
  await Template.deleteMany({ isBuiltIn: true });
  await Template.insertMany(templates);
  console.log(`✅ Seeded ${templates.length} built-in templates`);
  await mongoose.disconnect();
}

seed().catch(console.error);
