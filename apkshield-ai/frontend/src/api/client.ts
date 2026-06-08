import axios from 'axios';
import type {
  AnalysisResponse,
  ScanDetail,
  ScanListItem,
  UploadResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ── Upload ─────────────────────────────────────────────────────────────────────
export const uploadAPK = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadResponse>('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
};

// ── Analysis ───────────────────────────────────────────────────────────────────
export const startAnalysis = async (scanId: number): Promise<AnalysisResponse> => {
  const { data } = await api.post<AnalysisResponse>(`/api/analyze/${scanId}`);
  return data;
};

export const getScan = async (scanId: number): Promise<ScanDetail> => {
  const { data } = await api.get<ScanDetail>(`/api/scan/${scanId}`);
  return data;
};

export const listScans = async (): Promise<ScanListItem[]> => {
  const { data } = await api.get<ScanListItem[]>('/api/scans');
  return data;
};

// ── Reports ────────────────────────────────────────────────────────────────────
export const downloadJSONReport = (scanId: number): void => {
  window.open(`${BASE_URL}/api/report/${scanId}/json`, '_blank');
};

export const downloadPDFReport = (scanId: number): void => {
  window.open(`${BASE_URL}/api/report/${scanId}/pdf`, '_blank');
};
