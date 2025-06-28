'use client';

import { useState } from 'react';

interface RuleSuggestion {
  type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  name: string;
  config: any;
  reasoning: string;
}

interface AIRecommendationsProps {
  clients: any[];
  workers: any[];
  tasks: any[];
  onRuleAdd: (rule: any) => void;
}

export default function AIRecommendations({ clients, workers, tasks, onRuleAdd }: AIRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RuleSuggestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      setError('Please upload some data first to generate rule suggestions');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch('/api/rule-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients,
          workers,
          tasks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate rule suggestions');
      }

      const result = await response.json();
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: RuleSuggestion) => {
    const newRule = {
      id: Date.now().toString(),
      type: suggestion.type,
      name: suggestion.name,
      config: suggestion.config
    };
    onRuleAdd(newRule);
    
    // Remove the accepted suggestion
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleEditSuggestion = (suggestion: RuleSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsEditing(true);
  };

  const handleSaveEditedSuggestion = () => {
    if (!selectedSuggestion) return;
    
    const newRule = {
      id: Date.now().toString(),
      type: selectedSuggestion.type,
      name: selectedSuggestion.name,
      config: selectedSuggestion.config
    };
    onRuleAdd(newRule);
    
    // Remove the edited suggestion
    setSuggestions(prev => prev.filter(s => s !== selectedSuggestion));
    setSelectedSuggestion(null);
    setIsEditing(false);
  };

  const handleIgnoreSuggestion = (suggestion: RuleSuggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🤖 AI Rule Recommendations</h2>
      
      <div className="mb-6">
        <button
          onClick={handleGenerateSuggestions}
          disabled={isLoading || (clients.length === 0 && workers.length === 0 && tasks.length === 0)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Generating Suggestions...' : 'Suggest AI Rules'}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          AI will analyze your data and suggest useful scheduling or co-run rules based on patterns and dependencies.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            AI Suggestions ({suggestions.length})
          </h3>
          
          {suggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-lg">{suggestion.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    Type: {suggestion.type.replace('-', ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleEditSuggestion(suggestion)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleIgnoreSuggestion(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Ignore
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Reasoning:</strong> {suggestion.reasoning}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Configuration:</strong> {JSON.stringify(suggestion.config, null, 2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={selectedSuggestion.name}
                  onChange={(e) => setSelectedSuggestion({
                    ...selectedSuggestion,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configuration</label>
                <textarea
                  value={JSON.stringify(selectedSuggestion.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setSelectedSuggestion({
                        ...selectedSuggestion,
                        config
                      });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEditedSuggestion}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save & Add
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedSuggestion(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Suggestions */}
      {!isLoading && !error && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No rule suggestions yet.</p>
          <p className="text-sm mt-1">Click "Suggest AI Rules" to generate recommendations based on your data.</p>
        </div>
      )}
    </div>
  );
} 