import * as XLSX from 'xlsx';
import { ThermalMetrics, PhysicalInputs, CalculatedProperties } from '../types';

export const readExcelColumn = async (file: File, colIndex: number = 3): Promise<(number | null)[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        const columnData = jsonData.map(row => {
          const val = row[colIndex];
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        });

        resolve(columnData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const processThermalData = (
  tempData: (number | null)[], 
  refTempAt60s: number
): ThermalMetrics => {
  let anchorIndex = -1;
  let minDiff = Number.MAX_VALUE;

  for (let i = 0; i < tempData.length; i++) {
    const temp = tempData[i];
    if (temp !== null) {
      const diff = Math.abs(temp - refTempAt60s);
      if (diff < minDiff) {
        minDiff = diff;
        anchorIndex = i;
      }
    }
  }

  if (anchorIndex === -1) {
    throw new Error("Could not find reference temperature in the data.");
  }

  const getTimeForIndex = (idx: number) => 60 + (idx - anchorIndex);
  const getIndexForTime = (time: number) => anchorIndex + (time - 60);

  const findTimeForTemp = (targetTemp: number): number | string => {
    for (let i = 0; i < tempData.length; i++) {
      const val = tempData[i];
      if (val !== null && val >= targetTemp) {
        return getTimeForIndex(i);
      }
    }
    return "N/A";
  };

  const findTempAtTime = (targetTime: number): number | string => {
    const idx = getIndexForTime(targetTime);
    if (idx >= 0 && idx < tempData.length && tempData[idx] !== null) {
      return tempData[idx] as number;
    }
    return "N/A";
  };

  return {
    timeTo100: findTimeForTemp(100),
    timeTo150: findTimeForTemp(150),
    timeTo180: findTimeForTemp(180),
    timeTo200: findTimeForTemp(200),
    tempAt1Min: findTempAtTime(60),
    tempAt2Min: findTempAtTime(120),
    tempAt5Min: findTempAtTime(300),
    tempAt10Min: findTempAtTime(600)
  };
};

export const calculatePhysicalProperties = (inputs: PhysicalInputs): CalculatedProperties => {
  const { thickness, weightRaw, width, length } = inputs;
  
  // Area in m^2
  const areaM2 = (width * length) / 1_000_000;
  
  // Weight in g/m^2
  // If dimensions are 0, return 0 to avoid Infinity
  const weightGsm = areaM2 > 0 ? weightRaw / areaM2 : 0;
  
  // Density calculation (kg/m^3)
  // Mass in kg
  const massKg = weightRaw / 1000;
  // Volume in m^3 = Area(m^2) * Thickness(m)
  const thicknessM = thickness / 1000;
  const volumeM3 = areaM2 * thicknessM;
  
  const density = volumeM3 > 0 ? massKg / volumeM3 : 0;

  return { weightGsm, density };
};

export const appendToTemplate = async (
  templateFile: File, 
  sampleName: string, 
  metrics: ThermalMetrics,
  physical: PhysicalInputs,
  calculated: CalculatedProperties
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        // Define the data to append as a column (vertical vector)
        // Updated Order: Date | Name | Weight(GSM) | Thickness | Density ...
        const columnValues = [
            physical.evaluationDate,
            sampleName,
            Number(calculated.weightGsm.toFixed(2)),
            physical.thickness,
            Number(calculated.density.toFixed(2)),
            physical.heatSourceTemp,
            physical.pressure,
            metrics.timeTo100,
            metrics.timeTo150,
            metrics.timeTo180,
            metrics.timeTo200,
            metrics.tempAt1Min,
            metrics.tempAt2Min,
            metrics.tempAt5Min,
            metrics.tempAt10Min,
            physical.remarks
        ];

        // Determine the maximum number of columns in the existing rows that we will touch.
        let maxColCount = 0;
        for (let i = 0; i < columnValues.length; i++) {
          if (sheetData[i]) {
            maxColCount = Math.max(maxColCount, sheetData[i].length);
          }
        }

        // Iterate through the values and append each to its corresponding row
        for (let i = 0; i < columnValues.length; i++) {
          // If the row doesn't exist, create it
          if (!sheetData[i]) {
            sheetData[i] = [];
          }

          // Pad the row with nulls/empty strings to reach the current max column count
          while (sheetData[i].length < maxColCount) {
            sheetData[i].push(null);
          }

          // Push the new value for this row (which acts as the new column cell)
          sheetData[i].push(columnValues[i]);
        }

        const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
        workbook.Sheets[firstSheetName] = newWorksheet;

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        resolve(blob);

      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(templateFile);
  });
};