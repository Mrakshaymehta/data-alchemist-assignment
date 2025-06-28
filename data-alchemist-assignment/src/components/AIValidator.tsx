'use client';

import { useState, useEffect } from 'react';

interface AIValidationWarning {
  rowIndex: number;
  field: string;
  warning: string;
  severity: 'low' | 'medium' | 'high';
}

interface AIValidatorProps {
  clients: any[];
  workers: any[];
  tasks: any[];
}

export default function AIValidator({ clients, workers, tasks }: AIValidatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<{
    clients: AIValidationWarning[];
    workers: AIValidationWarning[];
    tasks: AIValidationWarning[];
  }>({ clients: [], workers: [], tasks: [] });

  const runAIValidation = async () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const validationPromises = [];
      
      if (clients.length > 0) {
        validationPromises.push(
          fetch('/api/ai-validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: clients, entityType: 'clients' })
          }).then(res => res.json())
        );
      }
      
      if (workers.length > 0) {
        validationPromises.push(
          fetch('/api/ai-validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: workers, entityType: 'workers' })
          }).then(res => res.json())
        );
      }
      
      if (tasks.length > 0) {
        validationPromises.push(
          fetch('/api/ai-validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: tasks, entityType: 'tasks' })
          }).then(res => res.json())
        );
      }

      const results = await Promise.all(validationPromises);
      
      const newWarnings = { clients: [], workers: [], tasks: [] };
      
      if (clients.length > 0) {
        newWarnings.clients = results[0] || [];
      }
      if (workers.length > 0) {
        newWarnings.workers = results[clients.length > 0 ? 1 : 0] || [];
      }
      if (tasks.length > 0) {
        newWarnings.tasks = results[results.length - 1] || [];
      }
      
      setWarnings(newWarnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run AI validation');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run validation when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
        runAIValidation();
      }
    }, 2000); // Delay to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [clients, workers, tasks]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const totalWarnings = warnings.clients.length + warnings.workers.length + warnings.tasks.length;

  if (totalWarnings === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🧠 AI Validation Warnings</h2>
        <button
          onClick={runAIValidation}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isLoading ? 'Running...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Warnings Summary */}
      {totalWarnings > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>{totalWarnings}</strong> AI validation warning{totalWarnings !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Warnings by Entity */}
      {warnings.clients.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Clients ({warnings.clients.length})</h3>
          <div className="space-y-2">
            {warnings.clients.map((warning, index) => (
              <div key={index} className={`p-3 border rounded-md ${getSeverityColor(warning.severity)}`}>
                <div className="flex items-start gap-2">
                  <span>{getSeverityIcon(warning.severity)}</span>
                  <div>
                    <p className="text-sm font-medium">
                      Row {warning.rowIndex + 1} • {warning.field}
                    </p>
                    <p className="text-sm">{warning.warning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.workers.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Workers ({warnings.workers.length})</h3>
          <div className="space-y-2">
            {warnings.workers.map((warning, index) => (
              <div key={index} className={`p-3 border rounded-md ${getSeverityColor(warning.severity)}`}>
                <div className="flex items-start gap-2">
                  <span>{getSeverityIcon(warning.severity)}</span>
                  <div>
                    <p className="text-sm font-medium">
                      Row {warning.rowIndex + 1} • {warning.field}
                    </p>
                    <p className="text-sm">{warning.warning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.tasks.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Tasks ({warnings.tasks.length})</h3>
          <div className="space-y-2">
            {warnings.tasks.map((warning, index) => (
              <div key={index} className={`p-3 border rounded-md ${getSeverityColor(warning.severity)}`}>
                <div className="flex items-start gap-2">
                  <span>{getSeverityIcon(warning.severity)}</span>
                  <div>
                    <p className="text-sm font-medium">
                      Row {warning.rowIndex + 1} • {warning.field}
                    </p>
                    <p className="text-sm">{warning.warning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Running AI validation...</span>
          </div>
        </div>
      )}
    </div>
  );
} 