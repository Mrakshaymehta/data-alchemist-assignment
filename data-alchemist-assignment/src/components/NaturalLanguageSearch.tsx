'use client';

import { useState } from 'react';
import DataGridViewer from './DataGridViewer';
// import { normalizeDataRows } from '../lib/ai';

function normalizeDataRows(data: any[]): any[] {
  return data.map(row => {
    const newRow: any = {};
    for (const key in row) {
      const value = row[key];
      newRow[key] = typeof value === 'string' ? value.trim() : value;
    }
    return newRow;
  });
}

interface NaturalLanguageSearchProps {
  clients: any[];
  workers: any[];
  tasks: any[];
}

export default function NaturalLanguageSearch({ clients, workers, tasks }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filterDescription, setFilterDescription] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<'clients' | 'workers' | 'tasks'>('tasks');

  const handleSearch = async () => {
    if (!query.trim()) return;
  
    setIsLoading(true);
    setError(null);
    setFilteredData([]);
  
    try {
      const data = selectedEntity === 'clients' ? clients : selectedEntity === 'workers' ? workers : tasks;
      const normalizedData = normalizeDataRows(data);
  
      const response = await fetch('/api/query-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuery: query,
          data: data,
          entityType: selectedEntity,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to process query');
      }
  
      const result = await response.json();
      console.log('AI response:', result);
  
      // Defensive check: ensure result.filterFunction exists and is a string
      if (!result.filterFunction || typeof result.filterFunction !== 'string') {
        throw new Error('Invalid filter function from AI');
      }
  
      try {
        // Safely create and apply the filter
        const filterFunction = new Function('row', `return ${result.filterFunction};`) as (row: any) => boolean;
  
        const cleanedData = normalizedData.filter(filterFunction);
        console.log();
        
        const filtered = normalizeDataRows(cleanedData);
  
        if (process.env.NODE_ENV === 'development') {
          console.log('AI filter function:', result.filterFunction);
          console.log('Filtered rows:', filtered);
        }
  
        setFilteredData(filtered);
        setFilterDescription(result.description || '');
  
        if (filtered.length === 0) {
          setError('No results found. Try different keywords like task name, duration, or phase number.');
        }
      } catch (filterError) {
        console.error('Filter evaluation error:', filterError);
        setError('⚠️ Unable to apply filter logic from AI. Please rephrase your query.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleEntityChange = (entity: 'clients' | 'workers' | 'tasks') => {
    setSelectedEntity(entity);
    setFilteredData([]);
    setFilterDescription('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🔍 Natural Language Search</h2>
      
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Tasks with duration > 1 and preferred in phase 2'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
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
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Example Queries */}
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">💡 Example queries:</p>
          <ul className="space-y-1">
            <li>• "Tasks with duration &gt; 1 and preferred in phase 2"</li>
            <li>• "Clients requesting task T1 or T3"</li>
            <li>• "Workers with qualification level 4 or higher"</li>
            <li>• "Tasks in ETL category with duration less than 5"</li>
          </ul>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {filteredData.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              Search Results ({filteredData.length} items)
            </h3>
            <p className="text-sm text-gray-600">{filterDescription}</p>
          </div>
          
          <DataGridViewer 
            data={filteredData} 
            onChange={() => {}} // Read-only for search results
            errors={[]}
          />
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && query && filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No results found for your query.</p>
          <p className="text-sm mt-1">Try different keywords like task name, duration, or phase number.</p>
        </div>
      )}
    </div>
  );
} 