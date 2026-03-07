import { ColumnRole } from './types';

export const DEFAULT_COL_WIDTH = 180;
export const MIN_COL_WIDTH = 50;
export const DEFAULT_ROW_HEIGHT = 34;
export const MIN_ROW_HEIGHT = 24;
export const ROW_NUMBER_WIDTH = 48;
export const HEADER_HEIGHT = 48;

export const COLUMN_ROLE_COLORS: Record<ColumnRole, { bg: string; headerBg: string; text: string; border: string; badge: string }> = {
  label:      { bg: '#fce4ec', headerBg: '#f8bbd0', text: '#c62828', border: '#ef9a9a', badge: '#e91e63' },
  value:      { bg: '#ede7f6', headerBg: '#d1c4e9', text: '#4527a0', border: '#b39ddb', badge: '#7c4dff' },
  chartsGrid: { bg: '#fff3e0', headerBg: '#ffe0b2', text: '#e65100', border: '#ffcc80', badge: '#ff9800' },
  rowFilter:  { bg: '#e3f2fd', headerBg: '#bbdefb', text: '#1565c0', border: '#90caf9', badge: '#2196f3' },
  infoPopup:  { bg: '#e8f5e9', headerBg: '#c8e6c9', text: '#2e7d32', border: '#a5d6a7', badge: '#4caf50' },
  unmapped:   { bg: '#fafafa', headerBg: '#f5f5f5', text: '#616161', border: '#e0e0e0', badge: '#9e9e9e' },
};
