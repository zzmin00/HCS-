import React from 'react';
import { ThermalMetrics, CalculatedProperties, PhysicalInputs } from '../types';
import { Clock, Thermometer, Scale, Ruler } from 'lucide-react';

interface MetricsDisplayProps {
  metrics: ThermalMetrics;
  calculated: CalculatedProperties;
  physical: PhysicalInputs;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, calculated, physical }) => {
  const formatVal = (val: string | number, suffix: string = '') => {
    if (val === 'N/A') return <span className="text-stone-300 italic">N/A</span>;
    if (typeof val === 'number') return <span>{val.toFixed(2)}<span className="text-sm text-stone-500 ml-0.5 font-normal">{suffix}</span></span>;
    return val;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-md overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="bg-stone-100 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
        <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
        <h3 className="font-bold text-stone-800 text-lg uppercase tracking-wide">
          Analyzed Results
        </h3>
      </div>

      {/* Physical Properties Section */}
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center gap-2 mb-4 text-stone-700">
          <Scale className="w-5 h-5 text-yellow-500" />
          <h4 className="font-bold uppercase text-sm tracking-wider">Calculated Properties</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-100">
          <MetricItem label="Weight" value={formatVal(calculated.weightGsm, ' g/m²')} />
          <MetricItem label="Thickness" value={formatVal(physical.thickness, ' mm')} />
          <MetricItem label="Density" value={formatVal(calculated.density, ' kg/m³')} />
          <MetricItem label="Condition" value={<span className="text-sm">{physical.heatSourceTemp} / {physical.pressure}</span>} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Time Results */}
        <div className="p-6 border-b md:border-b-0 md:border-r border-stone-100">
          <div className="flex items-center gap-2 mb-5 text-stone-700">
            <Clock className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold uppercase text-sm tracking-wider">Time to Reach Temp</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <MetricItem label="100°C" value={formatVal(metrics.timeTo100, 's')} highlight />
            <MetricItem label="150°C" value={formatVal(metrics.timeTo150, 's')} highlight />
            <MetricItem label="180°C" value={formatVal(metrics.timeTo180, 's')} highlight />
            <MetricItem label="200°C" value={formatVal(metrics.timeTo200, 's')} highlight />
          </div>
        </div>

        {/* Temperature Results */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5 text-stone-700">
            <Thermometer className="w-5 h-5 text-red-500" />
            <h4 className="font-bold uppercase text-sm tracking-wider">Temp at Time</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <MetricItem label="1 Min (60s)" value={formatVal(metrics.tempAt1Min, '°C')} />
            <MetricItem label="2 Min (120s)" value={formatVal(metrics.tempAt2Min, '°C')} />
            <MetricItem label="5 Min (300s)" value={formatVal(metrics.tempAt5Min, '°C')} />
            <MetricItem label="10 Min (600s)" value={formatVal(metrics.tempAt10Min, '°C')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem = ({ label, value, highlight = false }: { label: string, value: React.ReactNode, highlight?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-xs text-stone-500 font-bold uppercase mb-1">{label}</span>
    <span className={`text-xl font-mono font-bold ${highlight ? 'text-stone-900' : 'text-stone-700'}`}>
      {value}
    </span>
  </div>
);