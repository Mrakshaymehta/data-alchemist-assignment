'use client';

import { useState } from 'react';

interface NaturalLanguageEditorProps {
  clients: any[];
  workers: any[];
  tasks: any[];
  onClientsChange: (clients: any[]) => void;
  onWorkersChange: (workers: any[]) => void;
  onTasksChange: (tasks: any[]) => void;
}

interface EditChange {
  rowIndex: number;
  field: string;
  oldValue: any;
  newValue: any;
}

function parseEditInstruction(instruction: string, data: any[]): EditChange[] {
  // set column=value where column2=somevalue
  const match = instruction.match(/^set\s+(\w+)\s*=\s*([^\s]+)\s+where\s+(\w+)\s*=\s*([^\s]+)$/i);
  if (match) {
    const field = match[1];
    const newValue = match[2];
    const whereField = match[3];
    const whereValue = match[4].toLowerCase();
    return data.map((row, i) => {
      if (String(row[whereField]).toLowerCase() === whereValue) {
        // Handle JSON field
        if (typeof row[field] === 'string' && row[field].trim().startsWith('{') && row[field].trim().endsWith('}')) {
          try {
            const obj = JSON.parse(row[field]);
            // Set all keys to newValue (for demo)
            Object.keys(obj).forEach(k => obj[k] = newValue);
            return { rowIndex: i, field, oldValue: row[field], newValue: JSON.stringify(obj) };
          } catch { /* fallback */ }
        }
        // Handle array field (comma-separated)
        if (typeof row[field] === 'string' && row[field].includes(',')) {
          return { rowIndex: i, field, oldValue: row[field], newValue: row[field] + ',' + newValue };
        }
        // Fallback: set value
        return { rowIndex: i, field, oldValue: row[field], newValue };
      }
      return null;
    }).filter(Boolean) as EditChange[];
  }
  // set column=value (all rows)
  const matchAll = instruction.match(/^set\s+(\w+)\s*=\s*([^\s]+)$/i);
  if (matchAll) {
    const field = matchAll[1];
    const newValue = matchAll[2];
    return data.map((row, i) => {
      // Handle JSON field
      if (typeof row[field] === 'string' && row[field].trim().startsWith('{') && row[field].trim().endsWith('}')) {
        try {
          const obj = JSON.parse(row[field]);
          Object.keys(obj).forEach(k => obj[k] = newValue);
          return { rowIndex: i, field, oldValue: row[field], newValue: JSON.stringify(obj) };
        } catch { /* fallback */ }
      }
      // Handle array field (comma-separated)
      if (typeof row[field] === 'string' && row[field].includes(',')) {
        return { rowIndex: i, field, oldValue: row[field], newValue: row[field] + ',' + newValue };
      }
      // Fallback: set value
      return { rowIndex: i, field, oldValue: row[field], newValue };
    });
  }
  return [];
}

export default function NaturalLanguageEditor({ 
  clients, 
  workers, 
  tasks, 
  onClientsChange, 
  onWorkersChange, 
  onTasksChange 
}: NaturalLanguageEditorProps) {
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<EditChange[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<'clients' | 'workers' | 'tasks'>('clients');

  const handleEdit = () => {
    setError(null);
    setPendingChanges([]);
    const data = selectedEntity === 'clients' ? clients : selectedEntity === 'workers' ? workers : tasks;
    const changes = parseEditInstruction(instruction, data);
    if (changes.length === 0) {
      setError('Unable to parse instruction. Try: set column=value where column2=somevalue');
    } else {
      setPendingChanges(changes);
    }
  };

  const handleApplyChanges = () => {
    if (pendingChanges.length === 0) return;
    const data = selectedEntity === 'clients' ? [...clients] : selectedEntity === 'workers' ? [...workers] : [...tasks];
    pendingChanges.forEach(change => {
      if (data[change.rowIndex]) {
        data[change.rowIndex][change.field] = change.newValue;
      }
    });
    if (selectedEntity === 'clients') {
      onClientsChange(data);
    } else if (selectedEntity === 'workers') {
      onWorkersChange(data);
    } else {
      onTasksChange(data);
    }
    setPendingChanges([]);
    setInstruction('');
  };

  const handleCancelChanges = () => {
    setPendingChanges([]);
    setInstruction('');
    setError(null);
  };

  const handleEntityChange = (entity: 'clients' | 'workers' | 'tasks') => {
    setSelectedEntity(entity);
    setPendingChanges([]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">✏️ Natural Language Editor</h2>
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Edit Instruction</label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., 'set PriorityLevel=5 where GroupTag=Enterprise'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <select
              value={selectedEntity}
              onChange={(e) => handleEntityChange(e.target.value as 'clients' | 'workers' | 'tasks')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="clients">Clients</option>
              <option value="workers">Workers</option>
              <option value="tasks">Tasks</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleEdit}
              disabled={!instruction.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Process Edit
            </button>
          </div>
        </div>
        {/* Example Instructions */}
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">💡 Example instructions:</p>
          <ul className="space-y-1">
            <li>• "set PriorityLevel=5 where GroupTag=Enterprise"</li>
            <li>• "set Duration=4 where Category=ETL"</li>
            <li>• "set MaxLoadPerPhase=3"</li>
          </ul>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {/* Pending Changes */}
      {pendingChanges.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-3">Pending Changes ({pendingChanges.length} changes)</h3>
          <div className="space-y-2 mb-4">
            {pendingChanges.map((change, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <span className="font-medium">Row {change.rowIndex + 1}</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium">{change.field}:</span>
                  <span className="mx-2 text-red-600">{change.oldValue}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-600">{change.newValue}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyChanges}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Apply Changes
            </button>
            <button
              onClick={handleCancelChanges}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 