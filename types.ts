export interface ThermalMetrics {
  timeTo100: number | string;
  timeTo150: number | string;
  timeTo180: number | string;
  timeTo200: number | string;
  tempAt1Min: number | string;
  tempAt2Min: number | string;
  tempAt5Min: number | string;
  tempAt10Min: number | string;
}

export interface PhysicalInputs {
  thickness: number; // mm
  weightRaw: number; // g
  width: number; // mm
  length: number; // mm
  heatSourceTemp: string;
  pressure: string;
  evaluationDate: string;
  remarks: string;
}

export interface CalculatedProperties {
  weightGsm: number; // g/m2
  density: number; // kg/m3
}

export interface ProcessingResult {
  sampleName: string;
  thermalMetrics: ThermalMetrics;
  physicalInputs: PhysicalInputs;
  calculatedProps: CalculatedProperties;
  downloadUrl?: string;
  newFilename?: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}