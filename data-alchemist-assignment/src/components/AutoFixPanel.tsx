'use client';

import { useState } from 'react';

interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

interface ValidationFix {
  rowIndex: number;
  field: string;
  oldValue: any;
  newValue: any;
  reasoning: string;
}

interface AutoFixPanelProps {
  errors: ValidationError[];
  data: any[];
  entityType: 'clients' | 'workers' | 'tasks';
  onDataUpdate: (updatedData: any[]) => void;
}

export default function AutoFixPanel({ errors, data, entityType, onDataUpdate }: AutoFixPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedFixes, setSuggestedFixes] = useState<ValidationFix[]>([]);
  const [selectedFixes, setSelectedFixes] = useState<Set<number>>(new Set());

  const handleGenerateFixes = async () => {
    if (errors.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSuggestedFixes([]);
    setSelectedFixes(new Set());

    try {
      const response = await fetch('/api/autofix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors,
          data,
          entityType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate validation fixes');
      }

      const result = await response.json();
      setSuggestedFixes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSelection = (index: number) => {
    const newSelected = new Set(selectedFixes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFixes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFixes.size === suggestedFixes.length) {
      setSelectedFixes(new Set());
    } else {
      setSelectedFixes(new Set(suggestedFixes.map((_, index) => index)));
    }
  };

  const handleApplySelectedFixes = () => {
    if (selectedFixes.size === 0) return;

    const updatedData = [...data];
    
    // Apply selected fixes
    selectedFixes.forEach(index => {
      const fix = suggestedFixes[index];
      if (updatedData[fix.rowIndex]) {
        updatedData[fix.rowIndex][fix.field] = fix.newValue;
      }
    });

    onDataUpdate(updatedData);
    setSuggestedFixes([]);
    setSelectedFixes(new Set());
  };

  const handleApplyAllFixes = () => {
    const updatedData = [...data];
    
    // Apply all fixes
    suggestedFixes.forEach(fix => {
      if (updatedData[fix.rowIndex]) {
        updatedData[fix.rowIndex][fix.field] = fix.newValue;
      }
    });

    onDataUpdate(updatedData);
    setSuggestedFixes([]);
    setSelectedFixes(new Set());
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🛠️ AI Auto-Fix Suggestions</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {errors.length} validation error{errors.length !== 1 ? 's' : ''} found
          </p>
          <button
            onClick={handleGenerateFixes}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating Fixes...' : 'Generate AI Fixes'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Suggested Fixes */}
      {suggestedFixes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Suggested Fixes ({suggestedFixes.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {selectedFixes.size === suggestedFixes.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleApplySelectedFixes}
                disabled={selectedFixes.size === 0}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Apply Selected ({selectedFixes.size})
              </button>
              <button
                onClick={handleApplyAllFixes}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply All
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suggestedFixes.map((fix, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFixes.has(index)}
                    onChange={() => handleFixSelection(index)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Row {fix.rowIndex + 1}</span>
                      <span className="text-gray-500">•</span>
                      <span className="font-medium">{fix.field}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600">{fix.oldValue}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-600 font-medium">{fix.newValue}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      <strong>Reasoning:</strong> {fix.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Fixes Generated */}
      {!isLoading && !error && suggestedFixes.length === 0 && errors.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>Click "Generate AI Fixes" to get suggested corrections for validation errors.</p>
        </div>
      )}
    </div>
  );
} 