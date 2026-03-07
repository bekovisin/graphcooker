// ===== CHART SETTINGS TYPES =====

export type ChartType = 'bar_stacked_custom' | 'bar_grouped';

export type StackSortMode = 'normal' | 'ascending' | 'descending';
export type GridMode = 'single' | 'grid';
export type HeightMode = 'auto' | 'standard' | 'aspect_ratio';
export type AggregationMode = 'none' | 'sum' | 'average' | 'count';
export type SortMode = 'data_sheet' | 'value' | 'label';

export interface ChartTypeSettings {
  chartType: ChartType;
  stackSortMode: StackSortMode;
  gridMode: GridMode;
  heightMode: HeightMode;
  standardHeight: number;
  aspectRatio: number;
  aggregationMode: AggregationMode;
  sortMode: SortMode;
}

// Controls & Filters
export type FilterMode = 'off' | 'single_select' | 'multi_select';
export type ControlPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export interface ControlsFiltersSettings {
  seriesFilter: FilterMode;
  maxSeriesToShow: number;
  filterRowsNoData: boolean;
  controlPosition: ControlPosition;
}

// Colors
export type ColorMode = 'by_column' | 'by_row';

export interface ColorsSettings {
  colorMode: ColorMode;
  palette: string;
  extend: boolean;
  customOverrides: string;
  customPaletteColors?: string[];
  themeId?: number;
}

// Bars
export type EmptyRowLineStyle = 'solid' | 'dashed' | 'dotted';

export interface EmptyRowLineSettings {
  show: boolean;
  color: string;
  width: number;
  style: EmptyRowLineStyle;
  dashLength: number;
}

export interface BarsSettings {
  barHeight: number;
  barOpacity: number;
  spacingMain: number;
  spacingInStack: number;
  emptyRowSpacing: number;
  bottomBarPadding: number;
  emptyRowLine: EmptyRowLineSettings;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

// Labels
export type BarLabelStyle = 'above_bars' | 'axis';
export type DataPointLabelPosition = 'left' | 'center' | 'right' | 'outside_right';
export type DataPointLabelColorMode = 'auto' | 'custom';
export type StackLabelMode = 'none' | 'net_sum' | 'separate';

export interface LabelsSettings {
  barLabelStyle: BarLabelStyle;
  aboveBarPaddingTop: number;
  aboveBarPaddingRight: number;
  aboveBarPaddingBottom: number;
  aboveBarPaddingLeft: number;
  showDataPointLabels: boolean;
  dataPointFontSize: number;
  dataPointFontFamily: string;
  dataPointFontWeight: FontWeight;
  dataPointFontStyle: FontStyle;
  dataPointColorMode: DataPointLabelColorMode;
  dataPointColor: string;
  dataPointSeriesColors: Record<string, string>;
  dataPointPosition: DataPointLabelPosition;
  dataPointCustomPadding: boolean;
  dataPointPaddingTop: number;
  dataPointPaddingRight: number;
  dataPointPaddingBottom: number;
  dataPointPaddingLeft: number;
  stackLabelMode: StackLabelMode;
}

// Axis shared types
export type AxisPosition = 'bottom' | 'float_down' | 'float_up' | 'top' | 'hidden';
export type YAxisPosition = 'left' | 'right' | 'hidden';
export type ScaleType = 'linear' | 'log';
export type AxisTitleType = 'auto' | 'custom';
export type TickPosition = 'default' | 'left' | 'right';
export type TicksToShowMode = 'auto' | 'number' | 'custom';
export type TickMarkPosition = 'outside' | 'inside' | 'cross';

export type FontWeight = '100' | '200' | '300' | 'normal' | '500' | '600' | 'bold' | '800' | '900';
export type FontStyle = 'normal' | 'italic';

export interface AxisStyling {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle?: FontStyle;
  color: string;
}

export interface TickMarksSettings {
  show: boolean;
  position: TickMarkPosition;
  length: number;
  width: number;
  color: string;
}

export interface AxisLineSettings {
  show: boolean;
  width: number;
  color: string;
}

export type TickLabelCountMode = 'all' | 'custom';

export interface XAxisSettings {
  position: AxisPosition;
  scaleType: ScaleType;
  min: string;
  max: string;
  flipAxis: boolean;
  titleType: AxisTitleType;
  titleText: string;
  titleStyling: AxisStyling;
  showTitleStyling: boolean;
  tickPosition: TickPosition;
  tickStyling: AxisStyling;
  showTickStyling: boolean;
  tickPadding: number;
  tickAngle: number;
  ticksToShowMode: TicksToShowMode;
  ticksToShowNumber: number;
  tickStep: number;
  tickLabelCountMode: TickLabelCountMode;
  tickLabelCount: number;
  hiddenTickLabels: string[];
  firstLabelPadding: number;
  firstTickPadding: number;
  lastLabelPadding: number;
  lastTickPadding: number;
  labelAxisPadding: number;
  tickMarks: TickMarksSettings;
  axisLine: AxisLineSettings;
  zeroLine: AxisLineSettings;
  gridlines: boolean;
  showZeroGridline: boolean;
  gridlineStyling: { color: string; width: number; dashArray: number };
  showGridlineStyling: boolean;
}

export type YAxisSpaceMode = 'auto' | 'fixed';

export interface YAxisSettings {
  position: YAxisPosition;
  scaleType: ScaleType;
  min: string;
  max: string;
  titleType: AxisTitleType;
  titleText: string;
  titleStyling: AxisStyling;
  showTitleStyling: boolean;
  tickPosition: TickPosition;
  tickStyling: AxisStyling;
  showTickStyling: boolean;
  tickPadding: number;
  spaceMode: YAxisSpaceMode;
  spaceModeValue: number;
  axisLine: AxisLineSettings;
  gridlines: boolean;
  gridlineStyling: { color: string; width: number; dashArray: number };
  showGridlineStyling: boolean;
}

// Plot Background
export interface PlotBackgroundSettings {
  backgroundColor: string;
  backgroundOpacity: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

// Number Formatting
export type ThousandsSeparator = ',' | '.' | ' ' | 'none';
export type DecimalSeparator = '.' | ',';

export interface NumberFormattingSettings {
  decimalPlaces: number;
  thousandsSeparator: ThousandsSeparator;
  decimalSeparator: DecimalSeparator;
  prefix: string;
  suffix: string;
}

// Legend
export type LegendAlignment = 'left' | 'center' | 'right' | 'inline';
export type LegendOrientation = 'horizontal' | 'vertical';
export type LegendPosition = 'below' | 'above' | 'overlay';
export type DataColorsHeader = 'auto' | 'custom' | 'off';

export interface LegendSettings {
  show: boolean;
  clickToFilter: FilterMode;
  alignment: LegendAlignment;
  titleWeight: 'normal' | '500' | '600' | 'bold';
  textWeight: 'normal' | '500' | '600' | 'bold';
  textStyle: 'normal' | 'italic';
  fontFamily: string;
  color: string;
  size: number;
  marginTop: number;
  titleText: string;
  swatchWidth: number;
  swatchHeight: number;
  swatchRoundness: number;
  swatchPadding: number;
  outline: boolean;
  customOrder: string;
  maxWidth: number;
  orientation: LegendOrientation;
  position: LegendPosition;
  overlayX: number;
  overlayY: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  dataColorsHeader: DataColorsHeader;
}

// Popups & Panels
export type PopupStyle = 'light' | 'dark';

export interface PopupsPanelsSettings {
  showPopup: boolean;
  popupContent: string;
  popupStyle: PopupStyle;
}

// Annotations
export interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor: string;
}

export interface AnnotationsSettings {
  annotations: Annotation[];
}

// Animations
export type AnimationType = 'gradual' | 'grow' | 'slide' | 'fade';

export interface AnimationsSettings {
  enabled: boolean;
  duration: number;
  type: AnimationType;
}

// Layout
export interface LayoutSettings {
  maxWidth: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  backgroundColor: string;
  backgroundOpacity: number;
}

// Header
export type TextAlignment = 'left' | 'center' | 'right';
export type BorderStyle = 'none' | 'top' | 'bottom' | 'both';

export interface TextStyling {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  lineHeight: number;
}

export interface HeaderSettings {
  alignment: TextAlignment;
  title: string;
  titleStyling: TextStyling;
  subtitle: string;
  subtitleStyling: TextStyling;
  text: string;
  textStyling: TextStyling;
  border: BorderStyle;
}

// Footer
export interface FooterSettings {
  alignment: TextAlignment;
  size: number;
  color: string;
  advancedStyles: boolean;
  textStyling: TextStyling;
  showTextStyling: boolean;
  sourceName: string;
  sourceUrl: string;
  multipleSources: boolean;
  sourceLabel: string;
  notePrimary: string;
  noteSecondary: string;
  logoUrl: string;
  border: BorderStyle;
}

// Accessibility
export interface AccessibilitySettings {
  alternativeDescription: string;
  altText: string;
}

// Question
export type QuestionPosition = 'above' | 'below' | 'left' | 'right';

export interface QuestionAccentLine {
  show: boolean;
  width: number;
  color: string;
  borderRadius: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export interface QuestionTextDefaults {
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
}

export interface QuestionSettings {
  text: string; // HTML from rich text editor
  textDefaults: QuestionTextDefaults;
  subtext: string; // HTML from rich text editor
  subtextDefaults: QuestionTextDefaults;
  position: QuestionPosition;
  alignment: TextAlignment;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  subtextPaddingTop: number;
  subtextPaddingRight: number;
  subtextPaddingBottom: number;
  subtextPaddingLeft: number;
  accentLine: QuestionAccentLine;
  // Legacy fields kept for backward compatibility with deepMerge
  textStyling?: TextStyling;
  showTextStyling?: boolean;
  subtextStyling?: TextStyling;
  showSubtextStyling?: boolean;
}

// ===== MASTER SETTINGS OBJECT =====
export interface ChartSettings {
  chartType: ChartTypeSettings;
  controlsFilters: ControlsFiltersSettings;
  colors: ColorsSettings;
  bars: BarsSettings;
  labels: LabelsSettings;
  xAxis: XAxisSettings;
  yAxis: YAxisSettings;
  plotBackground: PlotBackgroundSettings;
  numberFormatting: NumberFormattingSettings;
  legend: LegendSettings;
  popupsPanels: PopupsPanelsSettings;
  annotations: AnnotationsSettings;
  animations: AnimationsSettings;
  layout: LayoutSettings;
  question: QuestionSettings;
  header: HeaderSettings;
  footer: FooterSettings;
  accessibility: AccessibilitySettings;
}

// ===== COLUMN MAPPING =====
export interface ColumnMapping {
  labels: string;
  values: string[];
  chartsGrid?: string;
  rowFilter?: string;
  infoPopups?: string[];
}
