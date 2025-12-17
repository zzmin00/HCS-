import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { MetricsDisplay } from './components/MetricsDisplay';
import { readExcelColumn, processThermalData, appendToTemplate, calculatePhysicalProperties } from './utils/excelProcessor';
import { ProcessingResult, ProcessStatus, PhysicalInputs } from './types';
import { Activity, Download, Calculator, AlertCircle, FileText, FlaskConical, Play } from 'lucide-react';

const App: React.FC = () => {
  // Processing State
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Files
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  // General Inputs
  const [sampleName, setSampleName] = useState('');
  const [refTemp, setRefTemp] = useState<string>(''); // Temp at 60s
  const [evaluationDate, setEvaluationDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default today
  const [remarks, setRemarks] = useState<string>('');

  // Physical Inputs
  const [thickness, setThickness] = useState<string>('');
  const [weightRaw, setWeightRaw] = useState<string>(''); // g
  const [width, setWidth] = useState<string>(''); // mm
  const [length, setLength] = useState<string>(''); // mm
  const [heatSourceTemp, setHeatSourceTemp] = useState<string>('');
  const [pressure, setPressure] = useState<string>('');

  const handleProcess = async () => {
    // Basic validation
    if (!sourceFile || !templateFile) {
      setErrorMsg("Please upload both the Source Log and Template files.");
      return;
    }
    if (!sampleName || !refTemp || !thickness || !weightRaw || !width || !length || !evaluationDate) {
      setErrorMsg("Please fill in all sample details and parameters.");
      return;
    }

    const refTempNum = parseFloat(refTemp);
    const thicknessNum = parseFloat(thickness);
    const weightNum = parseFloat(weightRaw);
    const widthNum = parseFloat(width);
    const lengthNum = parseFloat(length);

    if ([refTempNum, thicknessNum, weightNum, widthNum, lengthNum].some(isNaN)) {
      setErrorMsg("Please ensure numeric fields contain valid numbers.");
      return;
    }

    setStatus(ProcessStatus.PROCESSING);
    setErrorMsg(null);
    setResult(null);

    try {
      // 1. Prepare Inputs
      const physicalInputs: PhysicalInputs = {
        thickness: thicknessNum,
        weightRaw: weightNum,
        width: widthNum,
        length: lengthNum,
        heatSourceTemp,
        pressure,
        evaluationDate,
        remarks
      };

      // 2. Calculate Physical Properties (GSM, Density)
      const calculatedProps = calculatePhysicalProperties(physicalInputs);

      // 3. Read Source Data
      const tempData = await readExcelColumn(sourceFile);
      
      // 4. Process Thermal Metrics
      const thermalMetrics = processThermalData(tempData, refTempNum);

      // 5. Append to Template
      const blob = await appendToTemplate(templateFile, sampleName, thermalMetrics, physicalInputs, calculatedProps);
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create new filename: HCS결과 요약_YYMMDD.xlsx
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const newFilename = `HCS결과 요약_${yy}${mm}${dd}.xlsx`;

      setResult({
        sampleName,
        thermalMetrics,
        physicalInputs,
        calculatedProps,
        downloadUrl,
        newFilename
      });
      setStatus(ProcessStatus.SUCCESS);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unknown error occurred during processing.");
      setStatus(ProcessStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-400/20 mb-5 border-2 border-stone-900">
            <Activity className="w-10 h-10 text-stone-900" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight uppercase">
            HCS 평가 Analysis
          </h1>
          <p className="mt-3 text-lg text-stone-600 font-medium">
            Thermal Data Processing & Physical Properties
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: All Inputs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Sample Details */}
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-t-yellow-400 border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-5 flex items-center gap-2 pb-2 border-b border-stone-100">
                <FileText className="w-6 h-6 text-yellow-500" />
                Sample Info
              </h2>
              <div className="space-y-5">
                
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Evaluation Date</label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Sample Name</label>
                  <input
                    type="text"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    placeholder="e.g. Sample-A1"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Heat Source</label>
                    <input
                      type="text"
                      value={heatSourceTemp}
                      onChange={(e) => setHeatSourceTemp(e.target.value)}
                      placeholder="e.g. 200°C"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Pressure</label>
                    <input
                      type="text"
                      value={pressure}
                      onChange={(e) => setPressure(e.target.value)}
                      placeholder="e.g. 5 bar"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. Physical Properties */}
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-t-stone-400 border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-5 flex items-center gap-2 pb-2 border-b border-stone-100">
                <FlaskConical className="w-6 h-6 text-stone-500" />
                Physical Params
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Weight (g)</label>
                  <input
                    type="number"
                    value={weightRaw}
                    onChange={(e) => setWeightRaw(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Thickness (mm)</label>
                  <input
                    type="number"
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Sample Size (mm)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                       <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 text-xs font-bold">W</span>
                       <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-full pl-8 pr-3 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <span className="text-stone-400 font-bold">x</span>
                    <div className="relative w-full">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 text-xs font-bold">L</span>
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full pl-8 pr-3 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Logic Params */}
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-t-stone-800 border border-stone-200">
               <h2 className="text-xl font-bold text-stone-800 mb-5 flex items-center gap-2 pb-2 border-b border-stone-100">
                <Calculator className="w-6 h-6 text-stone-800" />
                Sync Logic
              </h2>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Temp at 60s (°C)
                </label>
                <input
                  type="number"
                  value={refTemp}
                  onChange={(e) => setRefTemp(e.target.value)}
                  placeholder="e.g. 25.5"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm font-medium focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                />
                <p className="mt-2 text-xs text-stone-500 font-medium">
                  * Time synchronization reference point (t=60s).
                </p>
              </div>
            </div>
            
             <button
                onClick={handleProcess}
                disabled={status === ProcessStatus.PROCESSING}
                className={`
                  w-full py-4 px-6 rounded-xl text-stone-900 font-bold text-lg uppercase tracking-wide flex items-center justify-center gap-3 shadow-md transition-all border-2 border-stone-900
                  ${status === ProcessStatus.PROCESSING 
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed border-stone-300' 
                    : 'bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5'
                  }
                `}
              >
                {status === ProcessStatus.PROCESSING ? (
                  'Processing...'
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-stone-900" />
                    Run Analysis
                  </>
                )}
              </button>

              {status === ProcessStatus.ERROR && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                </div>
              )}

          </div>

          {/* Right Column: Files & Results */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-t-yellow-400 border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-yellow-500" />
                Data Files
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload
                  label="1. Source Log (.xlsx)"
                  description="Raw temp data (Column D)"
                  onFileSelect={setSourceFile}
                />
                <FileUpload
                  label="2. Template (.xlsx)"
                  description="Report template file"
                  onFileSelect={setTemplateFile}
                />
              </div>
            </div>

            {status === ProcessStatus.SUCCESS && result && (
              <div className="animate-fade-in space-y-6">
                <MetricsDisplay 
                  metrics={result.thermalMetrics} 
                  calculated={result.calculatedProps}
                  physical={result.physicalInputs}
                />
                
                <div className="bg-green-100 border-2 border-green-500 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-3 rounded-full">
                       <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">Analysis Complete!</h3>
                      <p className="text-green-800 font-medium text-sm mt-1">
                        Ready to download your report.
                      </p>
                    </div>
                  </div>
                  <a
                    href={result.downloadUrl}
                    download={result.newFilename}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-yellow-400 px-8 py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg transition-colors border-2 border-stone-900"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;