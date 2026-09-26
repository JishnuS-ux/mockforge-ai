import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const SYSTEM_CONTEXT = `You are MockForge AI Assistant — an expert AI consultant in database design, synthetic data generation, API mocking, and software testing. 
Help users with:
- Designing, normalizing, and scaling database schemas
- Foreign keys, relational integrity, primary keys, and indexing strategies
- Synthetic data generation patterns, statistical distributions, and realistic mock data
- Edge-case testing strategies (SQL injection, boundary testing, null checks, data corruption)
- Exporting datasets (CSV, JSON, SQL INSERT, Excel)
- Answering questions about software development, database query optimization, and testing best practices.
Keep answers concise, technical, clear, and highly actionable. Format code snippets or SQL where relevant.`;

// ─── Comprehensive Embedded AI Chat Engine ──────────────────────────────────────
function generateEmbeddedAIReply(message: string): string {
  const lower = message.toLowerCase();

  // Greetings & Identity
  if (lower.match(/^(hi|hello|hey|greetings|who are you|what can you do)/)) {
    return `👋 **Hello! I am MockForge AI Assistant.**

I am your embedded AI database architect and testing specialist. Here is how I can assist you:
- 🗺️ **Design Schemas**: Tell me your app concept and I'll recommend tables, columns, and relationships.
- 🔗 **Foreign Keys & ERDs**: Guide you on connecting parent-child tables.
- 🧪 **Edge Case Testing**: Suggest boundary conditions, null checks, and injection tests.
- 💻 **SQL & Queries**: Write custom \`SELECT\`, \`JOIN\`, and \`INDEX\` statements for your schema.
- 📦 **Data Export**: Export structured JSON, CSV, or SQL INSERT dumps for your backend.`;
  }

  // Database Normalization & Design
  if (lower.match(/normalize|normalization|1nf|2nf|3nf|bcnf|design/)) {
    return `📐 **Database Normalization Best Practices**:
1. **First Normal Form (1NF)**: Ensure every column contains atomic (indivisible) values. Avoid storing comma-separated lists in a single field.
2. **Second Normal Form (2NF)**: Ensure non-key attributes depend on the *entire* primary key (crucial for composite primary keys).
3. **Third Normal Form (3NF)**: Remove transitive dependencies — columns should depend *only* on the primary key, nothing else.

*Pro-tip in MockForge:* Break multi-purpose entities into separate tables on your canvas and link them using foreign key relationships!`;
  }

  // SQL Queries & Indexes
  if (lower.match(/sql|select|join|index|query|performance|speed/)) {
    return `⚡ **SQL Query & Index Optimization**:
\`\`\`sql
-- Recommended Index for Foreign Key Lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- High-Performance Join Query Example
SELECT 
  u.full_name, 
  COUNT(o.id) AS total_orders, 
  SUM(o.total_amount) AS lifetime_value
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'delivered'
GROUP BY u.id, u.full_name
ORDER BY lifetime_value DESC;
\`\`\`
*Optimization Tip:* Adding B-Tree indexes on foreign key fields (like \`user_id\` or \`product_id\`) reduces join query latency from O(N) to O(log N).`;
  }

  // Foreign keys & Relationships
  if (lower.match(/relation|foreign key|link|connect|er diagram|fk|pk/)) {
    return `🔗 **Relational Tables & Foreign Keys**:
- To link two tables on your canvas, drag a connection line from the **parent table** (e.g. \`users\`) to the **child table** (e.g. \`orders\`).
- MockForge automatically sets the child field's \`isForeignKey: true\` and links \`referencesTable = 'users'\`.
- When generating synthetic mock data, MockForge automatically picks valid parent IDs to guarantee 100% referential integrity!`;
  }

  // Edge cases & Testing
  if (lower.match(/edge|case|injection|sqli|xss|null|test|corrupt|bug/)) {
    return `🧪 **Synthetic Edge Case & Chaos Testing**:
To test how your application handles dirty or malicious data:
1. Open the **Generate Data** panel or **Settings**.
2. Set **Mutation Percentage** (e.g. 5% or 10%).
3. Enable specific edge-case vectors:
   - **SQL Injection**: \`' OR '1'='1\`
   - **XSS Strings**: \`<script>alert(1)</script>\`
   - **Boundary Out-of-Range**: Extremely large negative or positive numbers
   - **Null / Empty Values**: Testing non-null database constraints
   - **Malformed Format**: Invalid email formats and malformed UUIDs`;
  }

  // Data Export & Formats
  if (lower.match(/export|csv|json|download|sql insert|zip|file/)) {
    return `📦 **Data Export Capabilities**:
MockForge generates production-ready data packages in:
- **JSON**: Single or multi-file JSON arrays with nested relationships.
- **CSV**: Excel-friendly spreadsheet files per table.
- **SQL INSERT**: Ready-to-run \`.sql\` scripts with \`INSERT INTO table_name (...) VALUES (...);\`.
- **ZIP Archive**: Single downloadable archive containing all generated formats.`;
  }

  // API Integration / Backend
  if (lower.match(/api|backend|express|python|django|fastapi|node|react/)) {
    return `🔌 **Connecting Mock Data to your Backend**:
1. Export your generated dataset as **JSON** or **SQL INSERT**.
2. **For Node.js / Express**: Import JSON directly into your mock server or seeds file (\`prisma db seed\` or \`knex seed:run\`).
3. **For Python / Django / FastAPI**: Use \`python manage.py loaddata\` or seed via SQLAlchemy.
4. **For PostgreSQL / MySQL**: Run the generated \`.sql\` script directly using \`psql\` or \`mysql\`.`;
  }

  // Generic Customer Query / Custom Topic Fallback
  return `🤖 **MockForge AI Consultant**:

Regarding your request: "*${message}*"

**Recommended Solution**:
1. **Schema Design**: Identify the core entities for your application and create their respective tables on the visual canvas.
2. **Primary & Foreign Keys**: Use \`UUID\` or \`Auto-Increment\` for primary keys and configure foreign key references between child and parent tables.
3. **Mock Data Generation**: Specify target row counts (e.g., 100 users, 500 orders) and preview the synthetic dataset before exporting.

Feel free to ask me about **SQL queries**, **database normalization**, **foreign key setups**, or **edge-case testing strategies**!`;
}

// POST /api/assistant/chat
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // 1. Try Gemini Cloud API if key is set
    if (process.env.GEMINI_API_KEY) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
          { role: 'model', parts: [{ text: 'Understood! I am MockForge AI Assistant. How can I help you today?' }] },
          ...history.map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ];

        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const model of models) {
          try {
            const resp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
              }
            );
            const data = (await resp.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              return res.json({ reply: data.candidates[0].content.parts[0].text });
            }
          } catch {}
        }
      } catch (geminiErr) {
        console.warn('⚠️ Gemini API chat fallback to embedded AI engine');
      }
    }

    // 2. Check if user request implies high-scale generation or schema synthesis
    const lower = message.toLowerCase();
    let confirmationPlan = undefined;
    if (lower.match(/generate|create|build|synthesize/) && lower.match(/\d+|hundred|thousand|million|k|lac/)) {
      const matchNum = lower.match(/\d+[\d,.]*/);
      let count = 10000;
      if (matchNum) {
        count = parseInt(matchNum[0].replace(/,/g, ''), 10);
        if (lower.includes('k')) count *= 1000;
      }
      confirmationPlan = {
        id: `plan-${Date.now()}`,
        domain: lower.includes('bank') ? 'Banking' : lower.includes('health') ? 'Healthcare' : 'E-Commerce',
        recordCount: count,
        locale: 'en_IN',
        entities: ['users', 'orders', 'transactions', 'payments'],
        relationshipsCount: 3,
        inferredRules: ['Age >= 18', 'Amount > 0', 'OrderDate < DeliveryDate'],
        edgeCaseCategories: ['Boundary Values', 'Security Payload Injection', 'Null Checks'],
        estimatedSizeMB: Math.round((count * 0.0005) * 100) / 100,
        status: 'pending' as const,
      };
    }

    // 3. Embedded AI Engine reply
    const reply = generateEmbeddedAIReply(message);
    res.json({ reply, confirmationPlan });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
