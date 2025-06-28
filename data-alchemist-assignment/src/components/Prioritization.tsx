'use client';

import { useState } from 'react';

interface PrioritizationConfig {
  priorityLevel: number;
  requestedTaskFulfillment: number;
  fairness: number;
  preset: string;
}

interface PrioritizationProps {
  onConfigChange: (config: PrioritizationConfig) => void;
}

export default function Prioritization({ onConfigChange }: PrioritizationProps) {
  const [config, setConfig] = useState<PrioritizationConfig>({
    priorityLevel: 5,
    requestedTaskFulfillment: 5,
    fairness: 5,
    preset: 'custom'
  });

  const presets = {
    'maximize-fulfillment': {
      name: 'Maximize Fulfillment',
      description: 'Prioritize completing as many requested tasks as possible',
      values: { priorityLevel: 8, requestedTaskFulfillment: 9, fairness: 3 }
    },
    'fair-distribution': {
      name: 'Fair Distribution',
      description: 'Balance workload evenly across workers',
      values: { priorityLevel: 5, requestedTaskFulfillment: 5, fairness: 9 }
    },
    'minimize-workload': {
      name: 'Minimize Workload',
      description: 'Reduce overall worker load while maintaining quality',
      values: { priorityLevel: 3, requestedTaskFulfillment: 4, fairness: 7 }
    },
    'custom': {
      name: 'Custom',
      description: 'Manually adjust prioritization factors',
      values: { priorityLevel: 5, requestedTaskFulfillment: 5, fairness: 5 }
    }
  };

  const handleSliderChange = (key: keyof Omit<PrioritizationConfig, 'preset'>, value: number) => {
    const newConfig = { ...config, [key]: value, preset: 'custom' };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePresetChange = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    const newConfig = { ...config, ...preset.values, preset: presetKey };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const getSliderColor = (value: number) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSliderTrackColor = (value: number) => {
    if (value <= 3) return 'bg-red-200';
    if (value <= 6) return 'bg-yellow-200';
    return 'bg-green-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">⚖️ Prioritization Configuration</h2>
      
      {/* Preset Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Preset Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(presets).map(([key, preset]) => (
            <label key={key} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="preset"
                value={key}
                checked={config.preset === key}
                onChange={() => handlePresetChange(key)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-gray-600">{preset.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Priority Level</label>
            <span className="text-sm text-gray-500">{config.priorityLevel}/10</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10"
              value={config.priorityLevel}
              onChange={(e) => handleSliderChange('priorityLevel', parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderTrackColor(config.priorityLevel)}`}
              style={{
                background: `linear-gradient(to right, ${getSliderColor(config.priorityLevel)} 0%, ${getSliderColor(config.priorityLevel)} ${(config.priorityLevel / 10) * 100}%, ${getSliderTrackColor(config.priorityLevel)} ${(config.priorityLevel / 10) * 100}%, ${getSliderTrackColor(config.priorityLevel)} 100%)`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher values prioritize tasks with higher priority levels
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Requested Task Fulfillment</label>
            <span className="text-sm text-gray-500">{config.requestedTaskFulfillment}/10</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10"
              value={config.requestedTaskFulfillment}
              onChange={(e) => handleSliderChange('requestedTaskFulfillment', parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderTrackColor(config.requestedTaskFulfillment)}`}
              style={{
                background: `linear-gradient(to right, ${getSliderColor(config.requestedTaskFulfillment)} 0%, ${getSliderColor(config.requestedTaskFulfillment)} ${(config.requestedTaskFulfillment / 10) * 100}%, ${getSliderTrackColor(config.requestedTaskFulfillment)} ${(config.requestedTaskFulfillment / 10) * 100}%, ${getSliderTrackColor(config.requestedTaskFulfillment)} 100%)`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher values prioritize completing requested tasks
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Fairness</label>
            <span className="text-sm text-gray-500">{config.fairness}/10</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10"
              value={config.fairness}
              onChange={(e) => handleSliderChange('fairness', parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderTrackColor(config.fairness)}`}
              style={{
                background: `linear-gradient(to right, ${getSliderColor(config.fairness)} 0%, ${getSliderColor(config.fairness)} ${(config.fairness / 10) * 100}%, ${getSliderTrackColor(config.fairness)} ${(config.fairness / 10) * 100}%, ${getSliderTrackColor(config.fairness)} 100%)`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher values ensure more even workload distribution
          </p>
        </div>
      </div>

      {/* Current Configuration Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Current Configuration</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Preset:</strong> {presets[config.preset as keyof typeof presets].name}</p>
          <p><strong>Priority Level:</strong> {config.priorityLevel}/10</p>
          <p><strong>Task Fulfillment:</strong> {config.requestedTaskFulfillment}/10</p>
          <p><strong>Fairness:</strong> {config.fairness}/10</p>
        </div>
      </div>
    </div>
  );
} 