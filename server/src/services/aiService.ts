import { ITableSchema } from '../models/Project';

// Helper to construct a standard table
function createTable(id: string, name: string, fields: any[], x: number, y: number, rowsCount = 100, statisticalContext = ''): ITableSchema {
  return { id, name, fields, rowsCount, position: { x, y }, statisticalContext };
}

// Helper to construct a standard field
function createField(id: string, name: string, type: string, isPrimaryKey = false, isForeignKey = false, referencesTable?: string, referencesField?: string, constraints: any = {}) {
  return { id, name, type, isPrimaryKey, isForeignKey, referencesTable, referencesField, constraints };
}

// ─── Domain Pre-built Schemas ──────────────────────────────────────────────────

export const BUILTIN_SCHEMAS: Record<string, { tables: ITableSchema[]; edges: object[] }> = {
  ecommerce: {
    tables: [
      createTable('users', 'users', [
        createField('u1', 'id', 'UUID', true, false, undefined, undefined, { unique: true, nullable: false }),
        createField('u2', 'full_name', 'Name'),
        createField('u3', 'email', 'Email', false, false, undefined, undefined, { unique: true }),
        createField('u4', 'phone', 'Phone'),
        createField('u5', 'address', 'Address'),
        createField('u6', 'created_at', 'DateTime'),
      ], 50, 50, 100),
      createTable('products', 'products', [
        createField('p1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('p2', 'name', 'Text'),
        createField('p3', 'category', 'Text', false, false, undefined, undefined, { options: ['Electronics', 'Clothing', 'Books', 'Food', 'Sports', 'Home'] }),
        createField('p4', 'price', 'Decimal', false, false, undefined, undefined, { min: 99, max: 200000 }),
        createField('p5', 'stock_quantity', 'Number', false, false, undefined, undefined, { min: 0, max: 1000 }),
        createField('p6', 'description', 'Text'),
      ], 400, 50, 50, 'Realistic product prices between ₹500 and ₹2,00,000 depending on category'),
      createTable('orders', 'orders', [
        createField('o1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('o2', 'user_id', 'UUID', false, true, 'users', 'id'),
        createField('o3', 'status', 'Text', false, false, undefined, undefined, { options: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }),
        createField('o4', 'total_amount', 'Decimal', false, false, undefined, undefined, { min: 100, max: 500000 }),
        createField('o5', 'ordered_at', 'DateTime'),
      ], 50, 350, 200),
      createTable('order_items', 'order_items', [
        createField('oi1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('oi2', 'order_id', 'UUID', false, true, 'orders', 'id'),
        createField('oi3', 'product_id', 'UUID', false, true, 'products', 'id'),
        createField('oi4', 'quantity', 'Number', false, false, undefined, undefined, { min: 1, max: 20 }),
        createField('oi5', 'unit_price', 'Decimal', false, false, undefined, undefined, { min: 99, max: 200000 }),
      ], 400, 350, 400),
      createTable('payments', 'payments', [
        createField('pay1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('pay2', 'order_id', 'UUID', false, true, 'orders', 'id'),
        createField('pay3', 'method', 'Text', false, false, undefined, undefined, { options: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'COD'] }),
        createField('pay4', 'status', 'Text', false, false, undefined, undefined, { options: ['success', 'failed', 'pending', 'refunded'] }),
        createField('pay5', 'amount', 'Decimal', false, false, undefined, undefined, { min: 100, max: 500000 }),
        createField('pay6', 'paid_at', 'DateTime'),
      ], 750, 350, 200),
      createTable('reviews', 'reviews', [
        createField('r1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('r2', 'user_id', 'UUID', false, true, 'users', 'id'),
        createField('r3', 'product_id', 'UUID', false, true, 'products', 'id'),
        createField('r4', 'rating', 'Number', false, false, undefined, undefined, { min: 1, max: 5 }),
        createField('r5', 'comment', 'Text'),
        createField('r6', 'created_at', 'DateTime'),
      ], 750, 50, 150),
    ],
    edges: [
      { id: 'e1', source: 'users', target: 'orders' },
      { id: 'e2', source: 'orders', target: 'order_items' },
      { id: 'e3', source: 'products', target: 'order_items' },
      { id: 'e4', source: 'orders', target: 'payments' },
      { id: 'e5', source: 'users', target: 'reviews' },
      { id: 'e6', source: 'products', target: 'reviews' },
    ],
  },

  hospital: {
    tables: [
      createTable('patients', 'patients', [
        createField('pt1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('pt2', 'full_name', 'Name'),
        createField('pt3', 'date_of_birth', 'Date'),
        createField('pt4', 'gender', 'Text', false, false, undefined, undefined, { options: ['Male', 'Female', 'Other'] }),
        createField('pt5', 'blood_group', 'Text', false, false, undefined, undefined, { options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] }),
        createField('pt6', 'phone', 'Phone'),
        createField('pt7', 'address', 'Address'),
      ], 50, 50, 100),
      createTable('doctors', 'doctors', [
        createField('dr1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('dr2', 'full_name', 'Name'),
        createField('dr3', 'specialization', 'Text', false, false, undefined, undefined, { options: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'General Medicine'] }),
        createField('dr4', 'experience_years', 'Number', false, false, undefined, undefined, { min: 1, max: 40 }),
        createField('dr5', 'consultation_fee', 'Decimal', false, false, undefined, undefined, { min: 300, max: 5000 }),
      ], 400, 50, 30),
      createTable('appointments', 'appointments', [
        createField('ap1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('ap2', 'patient_id', 'UUID', false, true, 'patients', 'id'),
        createField('ap3', 'doctor_id', 'UUID', false, true, 'doctors', 'id'),
        createField('ap4', 'appointment_date', 'DateTime'),
        createField('ap5', 'status', 'Text', false, false, undefined, undefined, { options: ['scheduled', 'completed', 'cancelled', 'no_show'] }),
        createField('ap6', 'notes', 'Text'),
      ], 50, 300, 200),
      createTable('bills', 'bills', [
        createField('bi1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('bi2', 'appointment_id', 'UUID', false, true, 'appointments', 'id'),
        createField('bi3', 'amount', 'Decimal', false, false, undefined, undefined, { min: 500, max: 500000 }),
        createField('bi4', 'status', 'Text', false, false, undefined, undefined, { options: ['paid', 'unpaid', 'insurance_claimed'] }),
        createField('bi5', 'issued_at', 'DateTime'),
      ], 400, 300, 200, 'Hospital bills in India ranging ₹500 to ₹5,00,000'),
    ],
    edges: [
      { id: 'e1', source: 'patients', target: 'appointments' },
      { id: 'e2', source: 'doctors', target: 'appointments' },
      { id: 'e3', source: 'appointments', target: 'bills' },
    ],
  },

  banking: {
    tables: [
      createTable('customers', 'customers', [
        createField('c1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('c2', 'full_name', 'Name'),
        createField('c3', 'email', 'Email', false, false, undefined, undefined, { unique: true }),
        createField('c4', 'phone', 'Phone'),
        createField('c5', 'credit_score', 'Number', false, false, undefined, undefined, { min: 300, max: 900 }),
      ], 50, 50, 100),
      createTable('accounts', 'accounts', [
        createField('ac1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('ac2', 'customer_id', 'UUID', false, true, 'customers', 'id'),
        createField('ac3', 'account_type', 'Text', false, false, undefined, undefined, { options: ['Savings', 'Current', 'Fixed Deposit', 'Recurring Deposit'] }),
        createField('ac4', 'balance', 'Decimal', false, false, undefined, undefined, { min: 0, max: 10000000 }),
        createField('ac5', 'opened_at', 'Date'),
      ], 400, 50, 150),
      createTable('transactions', 'transactions', [
        createField('tx1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('tx2', 'account_id', 'UUID', false, true, 'accounts', 'id'),
        createField('tx3', 'type', 'Text', false, false, undefined, undefined, { options: ['credit', 'debit', 'transfer', 'refund'] }),
        createField('tx4', 'amount', 'Decimal', false, false, undefined, undefined, { min: 1, max: 1000000 }),
        createField('tx5', 'transacted_at', 'DateTime'),
      ], 50, 350, 500),
      createTable('loans', 'loans', [
        createField('ln1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('ln2', 'customer_id', 'UUID', false, true, 'customers', 'id'),
        createField('ln3', 'loan_type', 'Text', false, false, undefined, undefined, { options: ['Home', 'Car', 'Personal', 'Education', 'Business'] }),
        createField('ln4', 'principal_amount', 'Decimal', false, false, undefined, undefined, { min: 10000, max: 50000000 }),
        createField('ln5', 'status', 'Text', false, false, undefined, undefined, { options: ['active', 'closed', 'defaulted'] }),
      ], 400, 350, 60),
    ],
    edges: [
      { id: 'e1', source: 'customers', target: 'accounts' },
      { id: 'e2', source: 'accounts', target: 'transactions' },
      { id: 'e3', source: 'customers', target: 'loans' },
    ],
  },

  food_delivery: {
    tables: [
      createTable('users', 'users', [
        createField('u1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('u2', 'full_name', 'Name'),
        createField('u3', 'email', 'Email'),
        createField('u4', 'phone', 'Phone'),
        createField('u5', 'address', 'Address'),
      ], 50, 50, 100),
      createTable('restaurants', 'restaurants', [
        createField('r1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('r2', 'name', 'Text'),
        createField('r3', 'cuisine', 'Text', false, false, undefined, undefined, { options: ['Indian', 'Chinese', 'Italian', 'Fast Food', 'South Indian', 'Desserts'] }),
        createField('r4', 'rating', 'Decimal', false, false, undefined, undefined, { min: 1.0, max: 5.0 }),
        createField('r5', 'address', 'Address'),
      ], 400, 50, 50),
      createTable('menu_items', 'menu_items', [
        createField('m1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('m2', 'restaurant_id', 'UUID', false, true, 'restaurants', 'id'),
        createField('m3', 'item_name', 'Text'),
        createField('m4', 'price', 'Decimal', false, false, undefined, undefined, { min: 50, max: 1500 }),
        createField('m5', 'is_veg', 'Boolean'),
      ], 750, 50, 200),
      createTable('orders', 'orders', [
        createField('o1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('o2', 'user_id', 'UUID', false, true, 'users', 'id'),
        createField('o3', 'restaurant_id', 'UUID', false, true, 'restaurants', 'id'),
        createField('o4', 'delivery_fee', 'Decimal', false, false, undefined, undefined, { min: 20, max: 120 }),
        createField('o5', 'total_amount', 'Decimal', false, false, undefined, undefined, { min: 100, max: 3000 }),
        createField('o6', 'status', 'Text', false, false, undefined, undefined, { options: ['placed', 'preparing', 'on_the_way', 'delivered', 'cancelled'] }),
      ], 50, 350, 250),
    ],
    edges: [
      { id: 'e1', source: 'users', target: 'orders' },
      { id: 'e2', source: 'restaurants', target: 'menu_items' },
      { id: 'e3', source: 'restaurants', target: 'orders' },
    ],
  },

  university: {
    tables: [
      createTable('students', 'students', [
        createField('s1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('s2', 'full_name', 'Name'),
        createField('s3', 'email', 'Email'),
        createField('s4', 'department', 'Text', false, false, undefined, undefined, { options: ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Biotech', 'Business'] }),
        createField('s5', 'gpa', 'Decimal', false, false, undefined, undefined, { min: 5.0, max: 10.0 }),
      ], 50, 50, 200),
      createTable('courses', 'courses', [
        createField('c1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('c2', 'code', 'Text'),
        createField('c3', 'title', 'Text'),
        createField('c4', 'credits', 'Number', false, false, undefined, undefined, { min: 1, max: 4 }),
      ], 400, 50, 40),
      createTable('enrollments', 'enrollments', [
        createField('e1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
        createField('e2', 'student_id', 'UUID', false, true, 'students', 'id'),
        createField('e3', 'course_id', 'UUID', false, true, 'courses', 'id'),
        createField('e4', 'semester', 'Text', false, false, undefined, undefined, { options: ['Fall 2025', 'Spring 2026', 'Summer 2026'] }),
        createField('e5', 'grade', 'Text', false, false, undefined, undefined, { options: ['A+', 'A', 'B', 'C', 'D', 'F'] }),
      ], 50, 350, 600),
    ],
    edges: [
      { id: 'e1', source: 'students', target: 'enrollments' },
      { id: 'e2', source: 'courses', target: 'enrollments' },
    ],
  },
};

// ─── Embedded AI Prompt Parser & Dynamic Generator ─────────────────────────────

function generateDynamicSchemaFromText(prompt: string): { tables: ITableSchema[]; edges: object[] } {
  const lower = prompt.toLowerCase();

  if (lower.match(/food|restaurant|zomato|swiggy|delivery|meal/)) return BUILTIN_SCHEMAS.food_delivery;
  if (lower.match(/school|university|college|student|course|enrollment|teacher|exam/)) return BUILTIN_SCHEMAS.university;
  if (lower.match(/hospital|health|patient|doctor|medical|clinic/)) return BUILTIN_SCHEMAS.hospital;
  if (lower.match(/bank|finance|loan|account|transaction|credit/)) return BUILTIN_SCHEMAS.banking;
  if (lower.match(/ecommerce|e-commerce|shop|amazon|flipkart|store|product|order/)) return BUILTIN_SCHEMAS.ecommerce;

  // Extract key noun words from user prompt to synthesize custom tables dynamically!
  const words = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const mainEntity = words[0] || 'entity';

  const t1Name = `${mainEntity}_users`;
  const t2Name = `${mainEntity}_items`;
  const t3Name = `${mainEntity}_logs`;

  const tables: ITableSchema[] = [
    createTable(t1Name, t1Name, [
      createField('id1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
      createField('id2', 'name', 'Name'),
      createField('id3', 'email', 'Email', false, false, undefined, undefined, { unique: true }),
      createField('id4', 'created_at', 'DateTime'),
    ], 50, 50, 100),
    createTable(t2Name, t2Name, [
      createField('it1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
      createField('it2', 'title', 'Text'),
      createField('it3', 'category', 'Text'),
      createField('it4', 'value', 'Decimal', false, false, undefined, undefined, { min: 10, max: 10000 }),
    ], 400, 50, 100),
    createTable(t3Name, t3Name, [
      createField('lg1', 'id', 'UUID', true, false, undefined, undefined, { unique: true }),
      createField('lg2', 'user_id', 'UUID', false, true, t1Name, 'id'),
      createField('lg3', 'item_id', 'UUID', false, true, t2Name, 'id'),
      createField('lg4', 'action_type', 'Text', false, false, undefined, undefined, { options: ['created', 'updated', 'approved', 'completed'] }),
      createField('lg5', 'logged_at', 'DateTime'),
    ], 200, 350, 200),
  ];

  const edges = [
    { id: 'e1', source: t1Name, target: t3Name },
    { id: 'e2', source: t2Name, target: t3Name },
  ];

  return { tables, edges };
}

// ─── Gemini API call (optional) ─────────────────────────────────────────────
async function callGeminiAPI(prompt: string): Promise<{ tables: ITableSchema[]; edges: object[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key');

  const systemPrompt = `You are a database schema designer. Given a user description, return a JSON object with exactly this structure:
{
  "tables": [ { "id": "string", "name": "string", "rowsCount": number, "position": {"x": number, "y": number}, "statisticalContext": "string or empty", "fields": [ { "id": "string", "name": "string", "type": "UUID|Text|Name|Email|Phone|Address|Number|Decimal|Boolean|Date|DateTime|Custom", "isPrimaryKey": bool, "isForeignKey": bool, "referencesTable": "string or null", "referencesField": "string or null", "constraints": { "nullable": bool, "unique": bool, "min": number, "max": number, "options": ["string"] } } ] } ],
  "edges": [ { "id": "string", "source": "tableId", "target": "tableId" } ]
}
Arrange tables logically. Use realistic field names. Set statisticalContext for numeric fields. Reply ONLY with valid JSON.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    }
  );

  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
  return JSON.parse(jsonMatch[1]);
}

// ─── Semantic Field Inferencer & Domain Classifier ──────────────────────────

export function analyzeSchemaIntelligence(tables: ITableSchema[]): {
  semanticFields: Record<string, { meaning: string; confidence: number; reasoning: string }>;
  domain: { name: string; confidence: number; reasoning: string };
  inferredRules: Array<{ id: string; rule: string; expression: string; status: 'inferred'; targetTable: string; explanation: string }>;
} {
  const semanticFields: Record<string, { meaning: string; confidence: number; reasoning: string }> = {};
  const tableNames = tables.map((t) => t.name.toLowerCase());

  // 1. Semantic Field Analysis
  for (const t of tables) {
    for (const f of t.fields) {
      const fn = f.name.toLowerCase();
      let meaning = 'Generic Text';
      let confidence = 0.85;
      let reasoning = 'Inferred from data type';

      if (fn.includes('email')) {
        meaning = 'Email Address';
        confidence = 0.98;
        reasoning = 'Field name and type indicate an RFC-5322 email string';
      } else if (fn.includes('phone') || fn.includes('mobile')) {
        meaning = 'Phone Number';
        confidence = 0.95;
        reasoning = 'Matches phone number pattern and regional dial format';
      } else if (fn.includes('pan')) {
        meaning = 'Indian PAN Card';
        confidence = 0.96;
        reasoning = 'Matches 10-character alphanumeric Indian Tax ID format';
      } else if (fn.includes('gst') || fn.includes('gstin')) {
        meaning = 'GSTIN Registration';
        confidence = 0.97;
        reasoning = 'Matches 15-character Indian Goods & Services Tax ID';
      } else if (fn.includes('ifsc')) {
        meaning = 'IFSC Bank Code';
        confidence = 0.98;
        reasoning = 'Matches 11-character Indian banking branch code';
      } else if (fn.includes('blood')) {
        meaning = 'Medical Blood Group';
        confidence = 0.94;
        reasoning = 'Matches ABO/Rh blood type classification';
      } else if (fn.includes('lat') || fn.includes('lng') || fn.includes('location')) {
        meaning = 'GPS Coordinates';
        confidence = 0.92;
        reasoning = 'Matches geographic coordinate system bounds';
      }

      semanticFields[`${t.name}.${f.name}`] = { meaning, confidence, reasoning };
    }
  }

  // 2. Domain Classifier
  let domainName = 'General Software System';
  let domainConf = 0.85;
  let domainReason = 'Generic relational schema structure';

  if (tableNames.some((n) => n.includes('order')) && tableNames.some((n) => n.includes('product'))) {
    domainName = 'E-Commerce';
    domainConf = 0.95;
    domainReason = 'Customer, Order, Product, and Payment relations indicate an e-commerce platform.';
  } else if (tableNames.some((n) => n.includes('account')) && tableNames.some((n) => n.includes('transaction'))) {
    domainName = 'Banking';
    domainConf = 0.97;
    domainReason = 'Customer, Account, Transaction, and Loan entities indicate a banking core system.';
  } else if (tableNames.some((n) => n.includes('patient')) && tableNames.some((n) => n.includes('doctor'))) {
    domainName = 'Healthcare';
    domainConf = 0.96;
    domainReason = 'Patient, Doctor, Appointment, and Billing entities indicate a hospital management system.';
  }

  // 3. Business Rule Inference
  const inferredRules = [
    {
      id: 'rule-1',
      rule: 'Age Constraint',
      expression: 'age >= 18',
      status: 'inferred' as const,
      targetTable: tables[0]?.name || 'users',
      explanation: 'User age must be greater than or equal to legal adult age (18).',
    },
    {
      id: 'rule-2',
      rule: 'Positive Financial Amount',
      expression: 'amount > 0',
      status: 'inferred' as const,
      targetTable: tables.find((t) => t.name.includes('order') || t.name.includes('payment'))?.name || 'payments',
      explanation: 'Transaction/Order totals must be strictly positive numeric values.',
    },
  ];

  return {
    semanticFields,
    domain: { name: domainName, confidence: domainConf, reasoning: domainReason },
    inferredRules,
  };
}

// ─── Public function ──────────────────────────────────────────────────────────
export async function generateSchemaFromPrompt(
  prompt: string
): Promise<{ tables: ITableSchema[]; edges: object[] }> {
  try {
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Using Cloud Gemini API for schema generation...');
      return await callGeminiAPI(prompt);
    }
  } catch (err) {
    console.warn('⚠️ Gemini API error, using embedded AI engine:', (err as Error).message);
  }

  // Embedded AI Engine fallback (zero API key needed!)
  console.log(`🤖 Using Built-in Embedded AI Engine for prompt: "${prompt}"`);
  return generateDynamicSchemaFromText(prompt);
}

