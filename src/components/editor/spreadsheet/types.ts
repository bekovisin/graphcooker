export interface CellAddress {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellAddress;
  end: CellAddress;
}

export interface NormalizedRange {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export interface ColumnSizeMap {
  [colIndex: number]: number;
}

export interface RowSizeMap {
  [rowIndex: number]: number;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetRow: number | null;
  targetCol: number | null;
}

export type ColumnRole = 'label' | 'value' | 'chartsGrid' | 'rowFilter' | 'infoPopup' | 'info' | 'unmapped';

export interface ColumnTypeConfig {
  type: 'number' | 'text';
  inputFormat?: string; // e.g. '1,234.56' or '1.234,56'
  decimalPlaces?: number;
  outputFormat?: string; // e.g. 'match_input' or custom
}
