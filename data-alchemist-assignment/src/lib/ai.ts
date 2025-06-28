import { geminiChatCompletion } from './gemini';

const AI_PROVIDER = process.env.AI_PROVIDER || 'OPENAI';

export interface FilterResult {
  entityType: 'clients' | 'workers' | 'tasks';
  filterFunction: string;
  description: string;
}

export interface EditResult {
  entityType: 'clients' | 'workers' | 'tasks';
  changes: Array<{
    rowIndex: number;
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  description: string;
}

export interface RuleSuggestion {
  type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  name: string;
  config: any;
  reasoning: string;
}

export interface ValidationFix {
  rowIndex: number;
  field: string;
  oldValue: any;
  newValue: any;
  reasoning: string;
}

export interface AIValidationWarning {
  rowIndex: number;
  field: string;
  warning: string;
  severity: 'low' | 'medium' | 'high';
}

function normalizeDataRows(data: any[]): any[] {
  // Lowercase all keys and string values for each row
  return data.map(row => {
    const newRow: any = {};
    for (const key in row) {
      const normKey = key.toLowerCase();
      const value = row[key];
      newRow[normKey] = typeof value === 'string' ? value.toLowerCase() : value;
    }
    return newRow;
  });
}

function extractJsonBlock(text: string): string {
  return text.replace(/```json|```/g, '').trim();
}

function mapFilterFunctionToOriginalColumns(filterFunction: string, columns: string[]): string {
  // Map lowercased property names in the filter function to the original column names
  let mapped = filterFunction;
  columns.forEach(col => {
    const regex = new RegExp(`(?<=row\.)${col.toLowerCase()}(?=\b)`, 'g');
    mapped = mapped.replace(regex, col);
  });
  return mapped;
}

export async function generateFilter(userQuery: string, data: any[], entityType: string): Promise<FilterResult> {
  const sampleData = data.slice(0, 3);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const prompt = `
Your job is to convert a plain English query into a JavaScript array .filter() function for this dataset.

- Always use the exact column names (case-sensitive) as shown in the sample data and column list.
- Normalize casing for string values only (use .toLowerCase() on values, not keys).
- Use .includes, .toLowerCase(), or range comparisons as needed.
- The filter function should work on rows with original column names.
- Only return valid JSON, no extra text or markdown.

User Query: "${userQuery}"
Entity Type: ${entityType}
Available Columns: ${columns.join(', ')}
Sample Data: ${JSON.stringify(sampleData, null, 2)}

Example response:
{
  "entityType": "tasks",
  "filterFunction": "row => row.Duration > 1 && row.PreferredPhases.includes('2')",
  "description": "Filters tasks with duration greater than 1 and preferred in phase 2"
}
`;
  try {
    const response = await geminiChatCompletion([{ role: 'user', content: prompt }]);
    if (!response) throw new Error('No response from Gemini');
    let cleanResponse = extractJsonBlock(response);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Raw:', response);
      // eslint-disable-next-line no-console
      console.log('Cleaned:', cleanResponse);
    }
    try {
      const parsed = JSON.parse(cleanResponse);
      if (!parsed.filterFunction || typeof parsed.filterFunction !== 'string') {
        throw new Error('Unable to parse query.');
      }
      // Map property names in filterFunction to original columns
      parsed.filterFunction = mapFilterFunctionToOriginalColumns(parsed.filterFunction, columns);
      return parsed;
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Failed to parse filter:', parseError);
      }
      throw new Error('Unable to parse query.');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('AI filter error:', error);
    }
    throw new Error('Unable to parse query.');
  }
}

export async function generateEdit(userQuery: string, data: any[], entityType: string): Promise<EditResult> {
  try {
    const sampleData = data.slice(0, 3);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    const prompt = `
You are a data editing assistant. Given a user instruction and sample data, generate specific changes.

User Instruction: "${userQuery}"
Entity Type: ${entityType}
Available Columns: ${columns.join(', ')}
Sample Data: ${JSON.stringify(sampleData, null, 2)}

Return a JSON object with:
- entityType: the type of entity being edited
- changes: array of changes with rowIndex, field, oldValue, newValue
- description: brief description of the changes

Example response:
{
  "entityType": "clients",
  "changes": [
    {
      "rowIndex": 0,
      "field": "PriorityLevel",
      "oldValue": 3,
      "newValue": 5
    }
  ],
  "description": "Set priority 5 for all clients in GroupTag = Enterprise"
}

Only return valid JSON, no additional text.
`;

    const response = await geminiChatCompletion([{ role: 'user', content: prompt }]);
    if (!response) throw new Error('No response from Gemini');
    const cleanResponse = extractJsonBlock(response);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Raw:', response);
      // eslint-disable-next-line no-console
      console.log('Cleaned:', cleanResponse);
    }
    try {
      const parsed = JSON.parse(cleanResponse);
      return parsed;
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Failed to parse edit:', parseError);
      }
      throw new Error('Unable to parse query.');
    }
  } catch (error) {
    console.error('Error generating edit:', error);
    throw new Error('Failed to generate edit');
  }
}

export async function generateRuleSuggestions(clients: any[], workers: any[], tasks: any[]): Promise<RuleSuggestion[]> {
  try {
    const prompt = `
You are a scheduling rule recommendation assistant. Analyze the provided data and suggest useful scheduling or co-run rules.

Clients Data: ${JSON.stringify(clients.slice(0, 5), null, 2)}
Workers Data: ${JSON.stringify(workers.slice(0, 5), null, 2)}
Tasks Data: ${JSON.stringify(tasks.slice(0, 5), null, 2)}

Suggest 3-5 useful rules based on patterns in the data. Consider:
- Tasks that should run together based on dependencies
- Worker group load balancing
- Client priority considerations
- Phase scheduling optimizations

Return a JSON array of rule suggestions with:
- type: 'co-run', 'slot-restriction', 'load-limit', or 'phase-window'
- name: descriptive rule name
- config: rule configuration object
- reasoning: explanation of why this rule is useful

Example response:
[
  {
    "type": "co-run",
    "name": "Critical Data Pipeline Tasks",
    "config": { "taskIds": ["T1", "T4", "T8"] },
    "reasoning": "These tasks form a critical data pipeline and should run together"
  }
]

Only return raw JSON. Do not wrap it in markdown code blocks.
`;
    const response = await geminiChatCompletion([{ role: 'user', content: prompt }]);
    if (!response) throw new Error('No response from Gemini');
    const cleaned = extractJsonBlock(response);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Raw:', response);
      // eslint-disable-next-line no-console
      console.log('Cleaned:', cleaned);
    }
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Failed to parse rule suggestions:', parseError);
      }
      throw new Error('Failed to parse rule suggestions. Try refining your prompt.');
    }
  } catch (error) {
    console.error('Error generating rule suggestions:', error);
    throw new Error('Failed to generate rule suggestions');
  }
}

export async function generateValidationFixes(errors: any[], data: any[]): Promise<ValidationFix[]> {
  try {
    const prompt = `
You are a data validation fix assistant. Given validation errors and sample data, suggest corrections.

Validation Errors: ${JSON.stringify(errors, null, 2)}
Sample Data: ${JSON.stringify(data.slice(0, 3), null, 2)}

For each error, suggest a reasonable fix. Consider:
- Data type corrections
- Range adjustments
- Format fixes
- Logical consistency

Return a JSON array of fixes with:
- rowIndex: the row index to fix
- field: the field name
- oldValue: current value
- newValue: suggested corrected value
- reasoning: explanation of the fix

Example response:
[
  {
    "rowIndex": 0,
    "field": "PriorityLevel",
    "oldValue": 6,
    "newValue": 5,
    "reasoning": "PriorityLevel must be between 1-5, setting to maximum allowed value"
  }
]

Only return raw JSON. Do not wrap it in markdown code blocks.
`;
    const response = await geminiChatCompletion([{ role: 'user', content: prompt }]);
    if (!response) throw new Error('No response from Gemini');
    const cleaned = extractJsonBlock(response);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Raw:', response);
      // eslint-disable-next-line no-console
      console.log('Cleaned:', cleaned);
    }
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Failed to parse validation fixes:', parseError);
      }
      throw new Error('Failed to parse validation fixes. Try refining your prompt.');
    }
  } catch (error) {
    console.error('Error generating validation fixes:', error);
    throw new Error('Failed to generate validation fixes');
  }
}

export async function generateAIValidationWarnings(data: any[], entityType: string): Promise<AIValidationWarning[]> {
  try {
    const prompt = `
You are a data quality analyst. Review the provided data and flag any potential inconsistencies or suspicious entries.

Entity Type: ${entityType}
Data: ${JSON.stringify(data.slice(0, 10), null, 2)}

Look for:
- Unusual patterns or outliers
- Potential data quality issues
- Logical inconsistencies
- Missing or suspicious values

Return a JSON array of warnings with:
- rowIndex: the row index
- field: the field name
- warning: description of the issue
- severity: 'low', 'medium', or 'high'

Example response:
[
  {
    "rowIndex": 0,
    "field": "Duration",
    "warning": "Duration seems unusually high for this task type",
    "severity": "medium"
  }
]

Only return raw JSON. Do not wrap it in markdown code blocks.
`;
    const response = await geminiChatCompletion([{ role: 'user', content: prompt }]);
    if (!response) throw new Error('No response from Gemini');
    const cleaned = extractJsonBlock(response);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Raw:', response);
      // eslint-disable-next-line no-console
      console.log('Cleaned:', cleaned);
    }
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Failed to parse AI validation warnings:', parseError);
      }
      throw new Error('Failed to parse AI validation warnings. Try refining your prompt.');
    }
  } catch (error) {
    console.error('Error generating AI validation warnings:', error);
    throw new Error('Failed to generate AI validation warnings');
  }
}

export { normalizeDataRows }; 