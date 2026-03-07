import { ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { CellAddress, ColumnRole, ColumnTypeConfig, NormalizedRange, SelectionRange } from './types';

export function colIndexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function normalizeRange(range: SelectionRange): NormalizedRange {
  return {
    minRow: Math.min(range.start.row, range.end.row),
    maxRow: Math.max(range.start.row, range.end.row),
    minCol: Math.min(range.start.col, range.end.col),
    maxCol: Math.max(range.start.col, range.end.col),
  };
}

export function isCellInRange(cell: CellAddress, range: NormalizedRange): boolean {
  return cell.row >= range.minRow && cell.row <= range.maxRow &&
         cell.col >= range.minCol && cell.col <= range.maxCol;
}

export function getColumnRole(colName: string, mapping: ColumnMapping): ColumnRole {
  if (mapping.labels === colName) return 'label';
  if (mapping.values?.includes(colName)) return 'value';
  if (mapping.chartsGrid === colName) return 'chartsGrid';
  if (mapping.rowFilter === colName) return 'rowFilter';
  if (mapping.infoPopups?.includes(colName)) return 'infoPopup';
  return 'unmapped';
}

export function parseClipboardText(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // Remove trailing empty line (common in clipboard data)
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.map((line) => line.split('\t'));
}

export function serializeSelectionToClipboard(
  data: DataRow[],
  columns: string[],
  range: NormalizedRange
): string {
  const rows: string[] = [];
  for (let r = range.minRow; r <= range.maxRow; r++) {
    const cells: string[] = [];
    for (let c = range.minCol; c <= range.maxCol; c++) {
      const val = data[r]?.[columns[c]];
      cells.push(val != null ? String(val) : '');
    }
    rows.push(cells.join('\t'));
  }
  return rows.join('\n');
}

export function formatColumnBadge(colNames: string[], allColumns: string[]): string {
  if (colNames.length === 0) return '';
  const indices = colNames.map((c) => allColumns.indexOf(c)).filter((i) => i >= 0).sort((a, b) => a - b);
  if (indices.length === 0) return '';
  if (indices.length === 1) return colIndexToLetter(indices[0]);

  // Check if consecutive
  let isConsecutive = true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive) {
    return `${colIndexToLetter(indices[0])}-${colIndexToLetter(indices[indices.length - 1])}`;
  }

  return indices.map((i) => colIndexToLetter(i)).join(', ');
}

export function generateUniqueColumnName(existingColumns: string[], baseName: string = 'Column'): string {
  let counter = existingColumns.length + 1;
  let name = `${baseName} ${counter}`;
  while (existingColumns.includes(name)) {
    counter++;
    name = `${baseName} ${counter}`;
  }
  return name;
}

/**
 * Format a cell value for display based on column type config.
 * Only applies formatting for number type columns.
 */
export function formatCellValue(value: string | number | null, config?: ColumnTypeConfig): string {
  if (value == null || value === '') return '';
  if (!config || config.type === 'text') return String(value);

  // Number formatting
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);

  const decimalPlaces = config.decimalPlaces ?? 2;
  const factor = Math.pow(10, decimalPlaces);
  const rounded = Math.round(num * factor) / factor;
  const fixed = rounded.toFixed(decimalPlaces);

  // Determine output format
  const format = config.outputFormat === 'match_input'
    ? (config.inputFormat || 'comma_dot')
    : (config.outputFormat || 'comma_dot');

  const [intPart, decPart] = fixed.split('.');

  let formattedInt = intPart;
  let separator = '';
  let decimalChar = '.';

  switch (format) {
    case 'comma_dot':
      separator = ',';
      decimalChar = '.';
      break;
    case 'dot_comma':
      separator = '.';
      decimalChar = ',';
      break;
    case 'space_dot':
      separator = ' ';
      decimalChar = '.';
      break;
    case 'space_comma':
      separator = ' ';
      decimalChar = ',';
      break;
  }

  if (separator) {
    // Handle negative sign
    const isNegative = formattedInt.startsWith('-');
    const absInt = isNegative ? formattedInt.slice(1) : formattedInt;
    formattedInt = (isNegative ? '-' : '') + absInt.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  return decPart ? `${formattedInt}${decimalChar}${decPart}` : formattedInt;
}
