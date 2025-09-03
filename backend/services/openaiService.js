import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const localSummarize = (aggregates) => {
  const lines = [];
  lines.push(`Here is the current overview:`);
  if (aggregates.totalProjects !== undefined) lines.push(`- Total projects: ${aggregates.totalProjects}`);
  if (aggregates.activeProjects !== undefined) lines.push(`- Active projects: ${aggregates.activeProjects}`);
  if (aggregates.totalBudgetAllocated !== undefined) lines.push(`- Total budget allocated: ₹${Math.round(aggregates.totalBudgetAllocated).toLocaleString('en-IN')}`);
  if (aggregates.budgetSpentToDate !== undefined) lines.push(`- Budget spent to-date: ₹${Math.round(aggregates.budgetSpentToDate).toLocaleString('en-IN')}`);
  if (aggregates.paymentsCompletedCount !== undefined) lines.push(`- Payments completed: ${aggregates.paymentsCompletedCount}`);
  if (aggregates.totalAcquiredArea !== undefined) lines.push(`- Total acquired area (Ha): ${Number(aggregates.totalAcquiredArea).toFixed(2)}`);
  if (aggregates.totalAreaLoaded !== undefined) lines.push(`- Total land loaded (Ha): ${Number(aggregates.totalAreaLoaded).toFixed(2)}`);
  if (aggregates.noticesIssued !== undefined) lines.push(`- Notices issued: ${aggregates.noticesIssued}`);
  if (aggregates.kycCompleted !== undefined) lines.push(`- KYC completed: ${aggregates.kycCompleted}`);
  if (aggregates.kycPending !== undefined) lines.push(`- KYC pending: ${aggregates.kycPending}`);
  return lines.join('\n');
};

async function openAIRequest(body) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: ${resp.status} ${msg}`);
  }
  return resp.json();
}

export async function extractFiltersWithOpenAI(question) {
  if (!OPENAI_API_KEY) return {};
  const system = 'Extract filters for an insights API without revealing PII. Return ONLY via the provided function.';
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_overview_kpis',
        description: 'Get aggregated KPIs with optional filters (no personal data).',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID if mentioned' },
            district: { type: 'string' },
            taluka: { type: 'string' },
            village: { type: 'string' },
            paymentStatus: { type: 'string', enum: ['all','completed','pending','initiated','failed','reversed'] },
            isTribal: { type: 'boolean' },
            from: { type: 'string', description: 'ISO date' },
            to: { type: 'string', description: 'ISO date' }
          }
        }
      }
    }
  ];
  const body = { model: OPENAI_MODEL, messages: [
    { role: 'system', content: system },
    { role: 'user', content: question }
  ], tools, tool_choice: 'auto', temperature: 0 };
  const data = await openAIRequest(body);
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return {};
  try {
    const args = JSON.parse(call.function?.arguments || '{}');
    return args || {};
  } catch {
    return {};
  }
}

export async function generateAIResponse(question, aggregates) {
  if (!OPENAI_API_KEY) {
    return localSummarize(aggregates);
  }
  const systemPrompt = `You are an assistant for a land acquisition dashboard. Use ONLY the provided aggregates and do not reveal or infer any personal details. If asked for PII (names, contacts, account numbers, per-person amounts), refuse.`;
  try {
    const content = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Question: ${question}\n\nAggregates (use only these):\n${JSON.stringify(aggregates)}` }
    ];
    const data = await openAIRequest({ model: OPENAI_MODEL, messages: content, temperature: 0.2, max_tokens: 300 });
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || localSummarize(aggregates);
  } catch {
    return localSummarize(aggregates);
  }
}

export async function chatUsingLiveInsights(question, defaultFilters, insightsFn) {
  // Extract filters with OpenAI (optional)
  const extracted = await extractFiltersWithOpenAI(question).catch(() => ({}));
  const filters = { ...defaultFilters, ...extracted };
  const aggregates = await insightsFn(filters);
  const answer = await generateAIResponse(question, aggregates);
  return { answer, aggregates, filters };
}


