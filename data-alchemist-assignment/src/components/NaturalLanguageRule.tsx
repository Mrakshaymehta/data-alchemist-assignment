'use client';

import { useState } from 'react';

interface ParsedRule {
  type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  name: string;
  config: any;
}

interface NaturalLanguageRuleProps {
  onRuleParsed: (rule: ParsedRule) => void;
}

export default function NaturalLanguageRule({ onRuleParsed }: NaturalLanguageRuleProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null);

  // Mock AI parsing function - in real implementation, this would call OpenAI API
  const parseNaturalLanguage = async (text: string): Promise<ParsedRule> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerText = text.toLowerCase();
    
    // Simple pattern matching for demo purposes
    if (lowerText.includes('run together') || lowerText.includes('co-run')) {
      const taskMatches = text.match(/task\s+([A-Z0-9]+(?:\s+and\s+[A-Z0-9]+)*)/gi);
      if (taskMatches) {
        const taskIds = taskMatches[0].match(/[A-Z0-9]+/g) || [];
        return {
          type: 'co-run',
          name: `Co-run ${taskIds.join(' and ')}`,
          config: { taskIds }
        };
      }
    }
    
    if (lowerText.includes('limit') && lowerText.includes('slots')) {
      const groupMatch = text.match(/(?:group|workers?)\s+([A-Z0-9]+)/i);
      const slotMatch = text.match(/(\d+)\s+slots?/i);
      
      if (groupMatch && slotMatch) {
        return {
          type: 'load-limit',
          name: `Limit ${groupMatch[1]} to ${slotMatch[1]} slots`,
          config: {
            workerGroup: groupMatch[1],
            maxSlotsPerPhase: parseInt(slotMatch[1])
          }
        };
      }
    }
    
    if (lowerText.includes('phase') && lowerText.includes('window')) {
      const taskMatch = text.match(/task\s+([A-Z0-9]+)/i);
      const phaseMatch = text.match(/phases?\s+([0-9,\s]+)/i);
      
      if (taskMatch && phaseMatch) {
        const phases = phaseMatch[1].match(/\d+/g) || [];
        return {
          type: 'phase-window',
          name: `Phase window for ${taskMatch[1]}`,
          config: {
            taskId: taskMatch[1],
            allowedPhases: phases
          }
        };
      }
    }
    
    throw new Error('Unable to parse rule. Please try a different format.');
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setParsedRule(null);
    
    try {
      const rule = await parseNaturalLanguage(input);
      setParsedRule(rule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse rule');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRule = () => {
    if (parsedRule) {
      onRuleParsed(parsedRule);
      setInput('');
      setParsedRule(null);
      setError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🤖 Natural Language Rule Input</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your rule in plain English:
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., 'Make sure Task T1 and T3 always run together' or 'Limit Group A workers to 2 slots per phase'"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          disabled={isProcessing}
        />
      </div>

      <div className="mb-4">
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Parsing...' : 'Parse Rule'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <p className="text-red-600 text-xs mt-1">
            💡 Try formats like:
            <br />• "Make sure Task T1 and T3 always run together"
            <br />• "Limit Group A workers to 2 slots per phase"
            <br />• "Task T2 can only run in phases 1, 3, 5"
          </p>
        </div>
      )}

      {/* Parsed Rule Display */}
      {parsedRule && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-800 mb-2">✅ Parsed Rule:</h4>
          <div className="text-sm text-green-700">
            <p><strong>Name:</strong> {parsedRule.name}</p>
            <p><strong>Type:</strong> {parsedRule.type}</p>
            <p><strong>Config:</strong> {JSON.stringify(parsedRule.config)}</p>
          </div>
          <button
            onClick={handleAddRule}
            className="mt-3 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Add to Rules
          </button>
        </div>
      )}

      {/* Examples */}
      <div className="text-xs text-gray-600">
        <p className="font-medium mb-2">💡 Example inputs:</p>
        <ul className="space-y-1">
          <li>• "Make sure Task T1 and T3 always run together"</li>
          <li>• "Limit Group A workers to 2 slots per phase"</li>
          <li>• "Task T2 can only run in phases 1, 3, 5"</li>
          <li>• "Restrict Client Group B to minimum 3 common slots"</li>
        </ul>
      </div>
    </div>
  );
} 