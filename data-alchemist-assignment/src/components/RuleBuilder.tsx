'use client';

import { useState } from 'react';

interface Rule {
  id: string;
  type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  name: string;
  config: any;
}

interface RuleBuilderProps {
  tasks: any[];
  clients: any[];
  workers: any[];
  onRulesChange: (rules: Rule[]) => void;
}

export default function RuleBuilder({ tasks, clients, workers, onRulesChange }: RuleBuilderProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRuleType, setSelectedRuleType] = useState<Rule['type']>('co-run');
  const [ruleName, setRuleName] = useState('');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Rule type configurations
  const ruleConfigs = {
    'co-run': {
      label: 'Co-run',
      description: 'Select multiple TaskIDs that must run together',
      fields: [
        { key: 'taskIds', label: 'Task IDs', type: 'multiselect', options: tasks.map(t => ({ value: t.TaskID, label: `${t.TaskID} - ${t.TaskName}` })) }
      ]
    },
    'slot-restriction': {
      label: 'Slot Restriction',
      description: 'Select ClientGroup or WorkerGroup + minimum common slots',
      fields: [
        { key: 'groupType', label: 'Group Type', type: 'select', options: [
          { value: 'client', label: 'Client Group' },
          { value: 'worker', label: 'Worker Group' }
        ]},
        { key: 'groupName', label: 'Group Name', type: 'select', options: [
          ...Array.from(new Set([...clients.map(c => c.GroupTag), ...workers.map(w => w.WorkerGroup)])).map((group: string) => ({ value: group, label: group }))
        ]},
        { key: 'minCommonSlots', label: 'Min Common Slots', type: 'number', min: 1 }
      ]
    },
    'load-limit': {
      label: 'Load Limit',
      description: 'Select WorkerGroup + maximum slots per phase',
      fields: [
        { key: 'workerGroup', label: 'Worker Group', type: 'select', options: Array.from(new Set(workers.map(w => w.WorkerGroup))).map((group: string) => ({ value: group, label: group })) },
        { key: 'maxSlotsPerPhase', label: 'Max Slots Per Phase', type: 'number', min: 1 }
      ]
    },
    'phase-window': {
      label: 'Phase Window',
      description: 'Select TaskID + allowed phases',
      fields: [
        { key: 'taskId', label: 'Task ID', type: 'select', options: tasks.map(t => ({ value: t.TaskID, label: `${t.TaskID} - ${t.TaskName}` })) },
        { key: 'allowedPhases', label: 'Allowed Phases', type: 'multiselect', options: [
          { value: '1', label: 'Phase 1' },
          { value: '2', label: 'Phase 2' },
          { value: '3', label: 'Phase 3' },
          { value: '4', label: 'Phase 4' },
          { value: '5', label: 'Phase 5' }
        ]}
      ]
    }
  };

  const [ruleValues, setRuleValues] = useState<Record<string, any>>({});

  const addRule = () => {
    if (!ruleName.trim()) return;

    const newRule: Rule = {
      id: editingRule?.id || Date.now().toString(),
      type: selectedRuleType,
      name: ruleName,
      config: ruleValues
    };

    let updatedRules;
    if (editingRule) {
      updatedRules = rules.map(r => r.id === editingRule.id ? newRule : r);
      setEditingRule(null);
    } else {
      updatedRules = [...rules, newRule];
    }

    setRules(updatedRules);
    onRulesChange(updatedRules);
    setRuleName('');
    setRuleValues({});
  };

  const deleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const editRule = (rule: Rule) => {
    setEditingRule(rule);
    setSelectedRuleType(rule.type);
    setRuleName(rule.name);
    setRuleValues(rule.config);
  };

  const generateRulesJson = () => {
    const rulesJson = {
      rules: rules,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(rulesJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setRuleValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'input':
        return (
          <input
            type="text"
            value={ruleValues[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            min={field.min || 0}
            value={ruleValues[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'select':
        return (
          <select
            value={ruleValues[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'multiselect':
        return (
          <select
            multiple
            value={ruleValues[field.key] || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              handleFieldChange(field.key, values);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {field.options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🔧 Rule Builder</h2>
      
      {/* Rule Creation Form */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">
          {editingRule ? 'Edit Rule' : 'Create New Rule'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
            <select
              value={selectedRuleType}
              onChange={(e) => setSelectedRuleType(e.target.value as Rule['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ruleConfigs).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter rule name"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">{ruleConfigs[selectedRuleType].description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ruleConfigs[selectedRuleType].fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addRule}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {editingRule ? 'Update Rule' : 'Add Rule'}
          </button>
          {editingRule && (
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleName('');
                setRuleValues({});
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Configured Rules</h3>
        {rules.length === 0 ? (
          <p className="text-gray-500 italic">No rules configured yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">{rule.name}</h4>
                  <p className="text-sm text-gray-600">{ruleConfigs[rule.type].label}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editRule(rule)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Rules JSON */}
      <button
        onClick={generateRulesJson}
        disabled={rules.length === 0}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Generate rules.json
      </button>
    </div>
  );
} 