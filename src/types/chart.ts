// ===== CHART SETTINGS TYPES =====

export type ChartType = 'bar_stacked_custom' | 'bar_grouped' | 'line_chart' | 'bar_chart_custom_2';

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
  borderRadius: Record<string, { tl: number; tr: number; bl: number; br: number }>;
  manualPlotWidth?: boolean;
  manualPlotWidthValue?: number;
}

// Lines, Dots and Areas (Line chart)
export type LineCurve = 'linear' | 'catmullRom' | 'natural' | 'step' | 'stepBefore' | 'stepAfter';
export type MissingDataMode = 'continue' | 'gaps';
export type DotMode = 'auto' | 'final_only' | 'on' | 'off';

export interface LineDotsAreasSettings {
  lineWidth: number;
  lineOpacity: number;
  lineOutline: boolean;
  lineCurve: LineCurve;
  dashedLines: boolean;
  dashWidth: number;
  dashSpaceWidth: number;
  missingDataMode: MissingDataMode;
  shadeBetweenLines: boolean;
  dotMode: DotMode;
  dotOpacity: number;
  dotRadius: number;
  finalDotScale: number;
  dotHollow: boolean;
  dotInnerColor: string;
  dotInnerOpacity: number;
}

// Labels
export type BarLabelStyle = 'above_bars' | 'axis';
export type DataPointLabelPosition = 'left' | 'center' | 'right' | 'outside_right' | 'fixed';
export type DataPointLabelColorMode = 'auto' | 'custom';
export type StackLabelMode = 'none' | 'net_sum' | 'separate';

// Line chart label types
export type LineOverlapMode = 'spread' | 'hide' | 'nothing';
export type ConnectorLineMode = 'auto' | 'on' | 'off';
export type ConnectorLineStyle = 'straight' | 'step';
export type DataPointShowMode = 'all' | 'last' | 'min_max' | 'custom';
export type DataPointTextColor = 'auto' | 'match_data' | 'contrast' | 'fixed';
export type DataPointLabelContent = 'auto' | 'value' | 'label' | 'both';
export type LineDataPointPosition = 'above' | 'below';

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
  dataPointPosition: DataPointLabelPosition | 'custom';
  dataPointCustomMode: 'column' | 'row';
  dataPointSeriesPositions: Record<string, DataPointLabelPosition>;
  dataPointRowPositions: Record<string, DataPointLabelPosition>;
  dataPointCustomPadding: boolean;
  dataPointPaddingTop: number;
  dataPointPaddingRight: number;
  dataPointPaddingBottom: number;
  dataPointPaddingLeft: number;
  outsideLabelPadding: number;
  fixedLabelAlignment: 'start' | 'center' | 'end';
  dataPointLetterSpacing: number;
  perRowDataPointLetterSpacings?: Record<string, number>;
  showPercentPrefix: boolean;
  percentPrefixFontSize: number;
  percentPrefixFontWeight: FontWeight;
  percentPrefixColor: string;
  percentPrefixPadding: number;
  percentPrefixPaddingTop: number;
  percentPrefixPaddingBottom: number;
  percentPrefixPosition: 'left' | 'right';
  percentPrefixVerticalAlign: 'bottom' | 'center' | 'top';
  stackLabelMode: StackLabelMode;

  // Line chart — Line Labels
  showLineLabels?: boolean;
  lineLabelMaxWidth?: number;
  lineLabelOverlap?: LineOverlapMode;
  lineLabelSpacing?: number;
  lineLabelDistance?: number;
  lineLabelShowOnly?: string;

  // Line chart — Line Label Text
  lineLabelColor?: string;
  lineLabelSize?: number;
  lineLabelOutline?: string;
  lineLabelOutlineWidth?: number;
  lineLabelLineHeight?: number;
  lineLabelMaxLines?: number;
  lineLabelWeight?: FontWeight;
  lineLabelFontFamily?: string;
  lineLabelFontStyle?: FontStyle;
  lineLabelColorMode?: 'auto' | 'fixed' | 'custom';
  lineLabelSeriesColors?: Record<string, string>;

  // Line chart — Connector Lines
  connectorLineMode?: ConnectorLineMode;
  connectorLineStyle?: ConnectorLineStyle;
  connectorLineColor?: string;
  connectorLineWidth?: number;
  connectorLineLength?: number;
  connectorLinePadding?: number;

  // Line chart — Data Point Labels extensions
  dataPointShowMode?: DataPointShowMode;
  dataPointHideOverlapping?: boolean;
  dataPointCenterOnDot?: boolean;
  dataPointTextColorMode?: DataPointTextColor;
  dataPointTextColorFixed?: string;
  dataPointLabelContent?: DataPointLabelContent;
  dataPointSizeMode?: 'auto' | 'fixed';
  dataPointSizeFixed?: number;
  dataPointOutlineOn?: boolean;
  dataPointOutlineSize?: number;

  // Line chart — Data Point Label custom colors (per-series or per-row)
  lineDataPointColorMode?: 'auto' | 'match_data' | 'fixed' | 'custom';
  lineDataPointColorFixed?: string;
  lineDataPointSeriesColors?: Record<string, string>;
  lineDataPointColorCustomMode?: 'column' | 'row';
  lineDataPointRowColors?: Record<string, Record<string, string>>;

  // Line chart — Data Point Position (above/below)
  lineDataPointPosition?: LineDataPointPosition | 'custom';
  lineDataPointCustomMode?: 'column' | 'row';
  lineDataPointSeriesPositions?: Record<string, LineDataPointPosition>;
  // Row positions: each row maps to per-series position overrides
  lineDataPointRowPositions?: Record<string, Record<string, LineDataPointPosition>>;

  // Line chart — Per-row custom padding
  dataPointRowPaddingEnabled?: Record<string, boolean>;
  dataPointRowPadding?: Record<string, { top: number; right: number; bottom: number; left: number }>;

  // Line chart — Line Label space mode
  lineLabelSpaceMode?: 'auto' | 'fixed';
  lineLabelSpaceValue?: number;
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
  startPadding: number;
  endPadding: number;
  tickMarks: TickMarksSettings;
  axisLine: AxisLineSettings;
  zeroLine: AxisLineSettings;
  zeroLineExtendTop: number;
  zeroLineExtendBottom: number;
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
  fixedMaxLines: number;
  fixedEllipsis: boolean;
  axisLine: AxisLineSettings;
  gridlines: boolean;
  gridlineStyling: { color: string; width: number; dashArray: number };
  showGridlineStyling: boolean;

  // Line chart extensions
  flipAxis?: boolean;
  configureDefaultMinMax?: boolean;
  axisTitlePosition?: 'side' | 'top_bottom';
  labelWeight?: 'bold' | 'normal';
  labelMaxLines?: number;
  labelLineHeight?: number;
  ticksToShowMode?: TicksToShowMode;
  ticksToShowNumber?: number;
  customTickStart?: number;
  customTickEnd?: number;
  edgePadding?: number;
  gridlineStyle?: 'solid' | 'dashed' | 'dotted';
  gridlineBetweenCategories?: boolean;
  labelTextAlign?: 'start' | 'center' | 'end';
  labelLetterSpacing?: number;
  labelMargin?: number;
  perRowLabelLetterSpacings?: Record<string, number>;
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
  showTrailingZeros: boolean;
  roundDecimal: boolean;
  xAxisCustomDecimals: boolean;
  xAxisDecimalPlaces: number;
  yAxisCustomDecimals: boolean;
  yAxisDecimalPlaces: number;
  infoCustomDecimals: boolean;
  infoDecimalPlaces: number;
  infoPrefix: string;
  infoSuffix: string;
  infoThousandsSeparator?: ThousandsSeparator;
  infoDecimalSeparator?: DecimalSeparator;
}

// Legend
export type LegendAlignment = 'left' | 'center' | 'right' | 'inline';
export type LegendOrientation = 'horizontal' | 'vertical';
export type LegendPosition = 'below' | 'above' | 'overlay';
export type LegendWrapMode = 'auto' | 'fixed';
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
  wrapMode: LegendWrapMode;
  fixedItemsPerRow: number;
  rowGap: number;
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

// ===== BAR CHART CUSTOM 2 SETTINGS =====

export type BorderLineStyle = 'solid' | 'dashed' | 'dotted';
export type BorderAlignment = 'top' | 'center' | 'bottom';
export type BarRowBordersMode = 'all' | 'custom';

export interface BarRowBordersSettings {
  show: boolean;
  mode: BarRowBordersMode;
  color: string;
  width: number;
  style: BorderLineStyle;
  dashLength: number;
  alignment: BorderAlignment;
  customRows: number[];
}

export interface ConnectorBorderSettings {
  show: boolean;
  color: string;
  width: number;
  style: BorderLineStyle;
  length: number;
  paddingBar: number;
  paddingLabel: number;
  alignment: BorderAlignment;
  manualLength?: boolean;
  manualLengthValue?: number;
}

export interface CustomPrefixSettings {
  show: boolean;
  text: string;
  position: 'left' | 'right';
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
  padding: number;
  paddingTop: number;
  paddingBottom: number;
  verticalAlign: 'bottom' | 'center' | 'top';
}

export type InfoPosition = 'left' | 'right';

export interface InfoIconSettings {
  show: boolean;
  size: number;
  borderWidth: number;
  defaultColor: string;
  perRowColors: Record<string, string>;
  perRowIconNames: Record<string, string>;
  iconName: string;
  customPadding?: boolean;
  paddingVertical?: number;
  paddingHorizontal?: number;
}

export interface InfoBorderSettings {
  show: boolean;
  color: string;
  width: number;
  style: BorderLineStyle;
  padding?: number;
  manualLength?: boolean;
  manualLengthValue?: number;
}

export interface RowImagesSettings {
  show: boolean;
  imagePosition: 'left' | 'right';
  defaultUrl: string;
  defaultWidth: number;
  defaultHeight: number;
  borderRadius: number;
  customPadding: boolean;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  perRowUrls: Record<string, string>;
  perRowWidths: Record<string, number>;
  perRowHeights: Record<string, number>;
}

export type InfoDataType = 'number' | 'text';
export type InfoVerticalAlignment = 'top' | 'center' | 'bottom';

export interface InfoColumnSettings {
  show: boolean;
  position: InfoPosition;
  verticalAlignment: InfoVerticalAlignment;
  verticalPadding: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle?: FontStyle;
  color: string;
  letterSpacing: number;
  padding: number;
  customPadding?: boolean;
  paddingVertical?: number;
  paddingHorizontal?: number;
  dataType: InfoDataType;
  perRowColors: Record<string, string>;
  perRowFontSizes: Record<string, number>;
  perRowFontFamilies: Record<string, string>;
  perRowFontWeights: Record<string, FontWeight>;
  perRowLetterSpacings: Record<string, number>;
  perRowPaddings: Record<string, number>;
  icon: InfoIconSettings;
  borderLeft: InfoBorderSettings;
  borderRight: InfoBorderSettings;
}

export interface BarBackgroundSettings {
  show: boolean;
  color: string;
  opacity: number;
}

// ===== MASTER SETTINGS OBJECT =====
export interface ChartSettings {
  chartType: ChartTypeSettings;
  controlsFilters: ControlsFiltersSettings;
  colors: ColorsSettings;
  bars: BarsSettings;
  lineDotsAreas: LineDotsAreasSettings;
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
  barRowBorders: BarRowBordersSettings;
  connectorBorder: ConnectorBorderSettings;
  customPrefix: CustomPrefixSettings;
  infoColumn: InfoColumnSettings;
  barBackground: BarBackgroundSettings;
  rowImages: RowImagesSettings;
}

// ===== PREVIEW STATE (persisted in columnMapping) =====
export interface PreviewState {
  previewDevice?: string;
  customPreviewWidth?: number;
  customPreviewHeight?: number;
  canvasBackgroundColor?: string;
}

// ===== COLUMN MAPPING =====
export interface ColumnMapping {
  labels: string;
  values: string[];
  chartsGrid?: string;
  rowFilter?: string;
  infoPopups?: string[];
  info?: string;
  seriesNames?: Record<string, string>;
  _previewState?: PreviewState;
  _columnOrder?: string[];
}
