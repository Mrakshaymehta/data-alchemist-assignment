'use client';

import { useState, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
import DataGridViewer from '../components/DataGridViewer';
import RuleBuilder from '../components/RuleBuilder';
import NaturalLanguageRule from '../components/NaturalLanguageRule';
import Prioritization from '../components/Prioritization';
import NaturalLanguageSearch from '../components/NaturalLanguageSearch';
import NaturalLanguageEditor from '../components/NaturalLanguageEditor';
import AIRecommendations from '../components/AIRecommendations';
import AutoFixPanel from '../components/AutoFixPanel';
import AIValidator from '../components/AIValidator';
import { validateData } from '../utils/validators';

interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

interface Rule {
  id: string;
  type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  name: string;
  config: any;
}

interface PrioritizationConfig {
  priorityLevel: number;
  requestedTaskFulfillment: number;
  fairness: number;
  preset: string;
}

export default function Home() {
  const [clients, setClients] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  const [clientErrors, setClientErrors] = useState<ValidationError[]>([]);
  const [workerErrors, setWorkerErrors] = useState<ValidationError[]>([]);
  const [taskErrors, setTaskErrors] = useState<ValidationError[]>([]);

  const [rules, setRules] = useState<Rule[]>([]);
  const [prioritizationConfig, setPrioritizationConfig] = useState<PrioritizationConfig>({
    priorityLevel: 5,
    requestedTaskFulfillment: 5,
    fairness: 5,
    preset: 'custom'
  });

  const onFileUpload = (type: string, data: any[]) => {
    console.log(`File uploaded for ${type}:`, data);
    if (type === 'clients') {
      setClients(data);
      const validation = validateData('clients', data);
      console.log('Client validation result:', validation);
      setClientErrors(validation.errors);
    } else if (type === 'workers') {
      setWorkers(data);
      const validation = validateData('workers', data);
      console.log('Worker validation result:', validation);
      setWorkerErrors(validation.errors);
    } else {
      setTasks(data);
      const validation = validateData('tasks', data);
      console.log('Task validation result:', validation);
      setTaskErrors(validation.errors);
    }
  };

  // Validate data when it changes (for inline editing)
  useEffect(() => {
    if (clients.length > 0) {
      const validation = validateData('clients', clients);
      console.log('Client validation on change:', validation);
      setClientErrors(validation.errors);
    }
  }, [clients]);

  useEffect(() => {
    if (workers.length > 0) {
      const validation = validateData('workers', workers);
      console.log('Worker validation on change:', validation);
      setWorkerErrors(validation.errors);
    }
  }, [workers]);

  useEffect(() => {
    if (tasks.length > 0) {
      const validation = validateData('tasks', tasks);
      console.log('Task validation on change:', validation);
      setTaskErrors(validation.errors);
    }
  }, [tasks]);

  const getErrorCount = (errors: ValidationError[]) => {
    const uniqueRows = new Set(errors.map(error => error.rowIndex));
    return uniqueRows.size;
  };

  const totalErrorRows = getErrorCount(clientErrors) + getErrorCount(workerErrors) + getErrorCount(taskErrors);

  const handleNaturalLanguageRule = (parsedRule: any) => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type: parsedRule.type,
      name: parsedRule.name,
      config: parsedRule.config
    };
    setRules(prev => [...prev, newRule]);
  };

  const exportData = () => {
    // Export CSV files
    const exportCSV = (data: any[], filename: string) => {
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Export rules.json
    const exportRules = () => {
      const rulesData = {
        rules: rules,
        prioritization: prioritizationConfig,
        generatedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(rulesData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rules.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    // Export all files
    exportCSV(clients, 'clients.csv');
    exportCSV(workers, 'workers.csv');
    exportCSV(tasks, 'tasks.csv');
    exportRules();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Data Alchemist - AI-Powered Configuration</h1>
      
      {/* File Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📁 Data Upload</h2>
        <FileUploader onFileUpload={onFileUpload} />

        {/* Validation Summary Panel */}
        {totalErrorRows > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Validation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Clients:</span>
                <span className={`font-semibold ${getErrorCount(clientErrors) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getErrorCount(clientErrors)} error rows
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Workers:</span>
                <span className={`font-semibold ${getErrorCount(workerErrors) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getErrorCount(workerErrors)} error rows
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tasks:</span>
                <span className={`font-semibold ${getErrorCount(taskErrors) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getErrorCount(taskErrors)} error rows
                </span>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              💡 Hover over red cells to see validation errors
            </p>
          </div>
        )}
      </div>

      {/* AI Validator */}
      <div className="mb-8">
        <AIValidator clients={clients} workers={workers} tasks={tasks} />
      </div>

      {/* Auto-Fix Panels */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clientErrors.length > 0 && (
          <AutoFixPanel 
            errors={clientErrors}
            data={clients}
            entityType="clients"
            onDataUpdate={setClients}
          />
        )}
        {workerErrors.length > 0 && (
          <AutoFixPanel 
            errors={workerErrors}
            data={workers}
            entityType="workers"
            onDataUpdate={setWorkers}
          />
        )}
        {taskErrors.length > 0 && (
          <AutoFixPanel 
            errors={taskErrors}
            data={tasks}
            entityType="tasks"
            onDataUpdate={setTasks}
          />
        )}
      </div>

      {/* Data Grids Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Data Review</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Clients</h3>
            <DataGridViewer 
              data={clients} 
              onChange={setClients} 
              errors={clientErrors}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Workers</h3>
            <DataGridViewer 
              data={workers} 
              onChange={setWorkers} 
              errors={workerErrors}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Tasks</h3>
            <DataGridViewer 
              data={tasks} 
              onChange={setTasks} 
              errors={taskErrors}
            />
          </div>
        </div>
      </div>

      {/* AI-Powered Data Operations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🤖 AI-Powered Operations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NaturalLanguageSearch 
            clients={clients}
            workers={workers}
            tasks={tasks}
          />
          <NaturalLanguageEditor 
            clients={clients}
            workers={workers}
            tasks={tasks}
            onClientsChange={setClients}
            onWorkersChange={setWorkers}
            onTasksChange={setTasks}
          />
        </div>
      </div>

      {/* Rule Configuration Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🔧 Rule Configuration</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RuleBuilder 
            tasks={tasks}
            clients={clients}
            workers={workers}
            onRulesChange={setRules}
          />
          <NaturalLanguageRule onRuleParsed={handleNaturalLanguageRule} />
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mb-8">
        <AIRecommendations 
          clients={clients}
          workers={workers}
          tasks={tasks}
          onRuleAdd={(rule) => setRules(prev => [...prev, rule])}
        />
      </div>

      {/* Prioritization Section */}
      <div className="mb-8">
        <Prioritization onConfigChange={setPrioritizationConfig} />
      </div>

      {/* Export Section */}
      <div className="text-center">
        <button
          onClick={exportData}
          disabled={clients.length === 0 && workers.length === 0 && tasks.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
        >
          📥 Export All Data & Configuration
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Downloads: clients.csv, workers.csv, tasks.csv, and rules.json
        </p>
      </div>
    </div>
  );
}
