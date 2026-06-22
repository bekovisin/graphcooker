// ===== CHART SETTINGS TYPES =====

export type ChartType = 'bar_stacked_custom' | 'bar_grouped' | 'line_chart' | 'bar_chart_custom_2' | 'bar_stacked_2' | 'heatmap' | 'bar_diverging' | 'column_chart';

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
  emptyRowCustomPadding?: boolean;
  emptyRowPaddingH?: number;
  emptyRowPaddingV?: number;
  bottomBarPadding: number;
  emptyRowLine: EmptyRowLineSettings;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
  borderRadius: Record<string, { tl: number; tr: number; bl: number; br: number }>;
  manualPlotWidth?: boolean;
  manualPlotWidthValue?: number;
  // Proportional sizing (grouped bar chart): when on, bars fill a percentage of each
  // category's row pitch — at 100% they expand to fill the row completely.
  proportionalSize?: boolean;
  proportionalSizeValue?: number;
}

// ===== COLUMN CHART (vertical bars) =====
export type ColumnMode = 'grouped' | 'stacked' | 'stacked_100';
export type ColumnValuePosition = 'above' | 'inside_top' | 'inside_center' | 'inside_bottom';

export interface ColumnsSettings {
  // Stacking / layout mode
  mode: ColumnMode;
  // Geometry — fractions of the per-category band
  columnWidth: number;       // 0.1–1: how much of the category band the column group occupies
  groupSpacing: number;      // 0–0.5: gap fraction between columns inside a group (grouped mode)
  maxColumnWidth: number;    // px cap for a single column, 0 = no cap
  minColumnHeight: number;   // px floor so small non-zero values stay visible, 0 = off
  cornerRadius: number;      // top-corner radius (px)
  opacity: number;           // 0–1
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
  // Value labels drawn on / above columns
  showValues: boolean;
  valuePosition: ColumnValuePosition;
  valueFontFamily: string;
  valueFontSize: number;
  valueFontWeight: FontWeight;
  valueColorMode: 'auto' | 'custom'; // auto = contrast when inside, dark when above
  valueColor: string;
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
  barGroupVerticalOffset: number;
  showDataPointLabels: boolean;
  dataPointFontSize: number;
  dataPointFontFamily: string;
  dataPointFontWeight: FontWeight;
  dataPointFontStyle: FontStyle;
  dataPointColorMode: DataPointLabelColorMode;
  dataPointColor: string;
  dataPointAutoWhitePref: boolean; // auto-contrast: prefer white on saturated mid-tones (off = pure WCAG/Google)
  dataPointAutoWhiteStrength: number; // 0–100: how far the white/black crossover is raised toward lighter colors
  dataPointSeriesColors: Record<string, string>;
  dataPointColorCustomMode?: 'column' | 'row';
  dataPointRowColors?: Record<string, string>;
  dataPointPosition: DataPointLabelPosition | 'custom';
  dataPointCustomMode: 'column' | 'row';
  dataPointSeriesPositions: Record<string, DataPointLabelPosition>;
  dataPointRowPositions: Record<string, Record<string, DataPointLabelPosition>>;
  showZeroValues?: boolean;
  dataPointCustomPadding: boolean;
  dataPointPaddingTop: number;
  dataPointPaddingRight: number;
  dataPointPaddingBottom: number;
  dataPointPaddingLeft: number;
  dataPointPaddingH?: number;
  dataPointPaddingV?: number;
  barDataPointRowSeriesPadding?: Record<string, Record<string, { h: number; v: number }>>;
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
  lineLabelDistanceV?: number;
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
  lineLabelMatchLineColor?: boolean;

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
  lineDataPointMatchLineColor?: boolean;
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

  // Line chart — Per-series line label padding
  lineLabelPerSeriesPaddingEnabled?: Record<string, boolean>;
  lineLabelPerSeriesPadding?: Record<string, { h: number; v: number }>;

  // Line chart — Per-row per-series data point padding (H/V)
  dataPointRowSeriesPaddingEnabled?: Record<string, boolean>;
  dataPointRowSeriesPadding?: Record<string, Record<string, { h: number; v: number }>>;

  // Line chart — Unified per-series line label overrides
  lineLabelPerSeriesOverrides?: Record<string, LineLabelSeriesOverride>;

  // Line chart — Line Label space mode
  lineLabelSpaceMode?: 'auto' | 'fixed';
  lineLabelSpaceValue?: number;

  // Grid title (panel label) settings — bar chart grouped grid mode
  gridTitlePosition?: 'top' | 'bottom';
  gridTitleFontFamily?: string;
  gridTitleFontSize?: number;
  gridTitleFontWeight?: FontWeight;
  gridTitleFontStyle?: FontStyle;
  gridTitleColor?: string;
  gridTitlePaddingH?: number;
  gridTitlePaddingV?: number;
  gridTitleAlignment?: 'start' | 'center' | 'end';
  gridTitlePerSeriesOverrides?: Record<string, GridTitleSeriesOverride>;
}

// Per-series line label override
export interface LineLabelSeriesOverride {
  displayName?: string;    // custom label text, use newlines for line breaks
  fontSize?: number;       // px
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;   // 'normal' | 'italic'
  letterSpacing?: number;
  color?: string;
  padding?: { h: number; v: number };
}

// Per-series grid title override
export interface GridTitleSeriesOverride {
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  fontFamily?: string;
  color?: string;
  alignment?: 'start' | 'center' | 'end';
  padding?: { h: number; v: number };
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
  labelAxisPaddingH?: number;
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

// 'auto' = One line (auto-fit label width, no wrap); 'ratio' = Auto (label column is a % of chart width, labels wrap); 'fixed' = fixed px column
export type YAxisSpaceMode = 'auto' | 'ratio' | 'fixed';

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
  spaceModeRatio: number; // 'ratio' mode: max % of total chart width the graph may use (labels get the rest)
  spaceModeCollapse: boolean; // 'ratio' mode: when on, reclaim the unused label-column slack and give it to the graph
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
  gridlineLengthExtend?: number;
  gridlinePaddingH?: number;
  gridlinePaddingV?: number;
  gridlineBetweenCategories?: boolean;
  labelTextAlign?: 'start' | 'center' | 'end';
  labelLetterSpacing?: number;
  labelMargin?: number;
  labelPaddingH?: number;
  labelPaddingV?: number;
  perRowLabelLetterSpacings?: Record<string, number>;
  perRowLabelPadding?: Record<string, { h: number; v: number }>;
  perRowLabelFontSizes?: Record<string, number>;
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
  // Whole-chart outer padding (bar_chart_custom_2): shifts the entire chart and
  // expands the canvas so nothing is clipped. Distinct from the plot-margin padding above.
  outerPaddingTop?: number;
  outerPaddingRight?: number;
  outerPaddingBottom?: number;
  outerPaddingLeft?: number;
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
  manualLengthTop?: number;
  manualLengthBottom?: number;
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
  manualLengthTop?: number;
  manualLengthBottom?: number;
}

export interface InfoBackgroundSettings {
  show: boolean;
  color: string;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  borderRadius: number;
  perRowColors: Record<string, string>;
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
  customImageOverrides: string;
  resolvedImageOverrides: Record<string, string>;
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
  background: InfoBackgroundSettings;
}

// ===== LINE INFO ANNOTATION SETTINGS =====

export type AnnotationEndpointType =
  | 'none'
  | 'round'
  | 'square'
  | 'line_arrow'
  | 'triangle_arrow'
  | 'reversed_triangle'
  | 'circle_arrow'
  | 'diamond_arrow';

export type AnnotationLineStyle = 'solid' | 'dotted';
export type AnnotationDirection = 'right' | 'left';
export type AnnotationTextAlign = 'left' | 'center' | 'right';

export interface AnnotationEndpointSettings {
  type: AnnotationEndpointType;
  size: number;
  color: string;
}

export interface AnnotationLineSettings {
  show: boolean;
  style: AnnotationLineStyle;
  dotCount: number;
  thickness: number;
  color: string;
}

export interface LineInfoVerticalLineSettings extends AnnotationLineSettings {
  paddingTop: number;
  paddingBottom: number;
  topEndpoint: AnnotationEndpointSettings;
  bottomEndpoint: AnnotationEndpointSettings;
}

export interface LineInfoHorizontalLineSettings extends AnnotationLineSettings {
  endpoint: AnnotationEndpointSettings;
}

export interface LineInfoTextSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: string;
  letterSpacing: number;
  textAlign: AnnotationTextAlign;
  paddingVertical: number;
  paddingHorizontal: number;
  dataType: InfoDataType;
}

export interface LineInfoPerRowOverrides {
  show?: boolean;
  direction?: AnnotationDirection;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  color?: string;
  letterSpacing?: number;
  verticalLineColor?: string;
  verticalLineThickness?: number;
  verticalLineStyle?: AnnotationLineStyle;
  verticalLineDotCount?: number;
  verticalLinePaddingTop?: number;
  verticalLinePaddingBottom?: number;
  verticalLineTopEndpoint?: Partial<AnnotationEndpointSettings>;
  verticalLineBottomEndpoint?: Partial<AnnotationEndpointSettings>;
  horizontalLineShow?: boolean;
  horizontalLineColor?: string;
  horizontalLineThickness?: number;
  horizontalLineStyle?: AnnotationLineStyle;
  horizontalLineDotCount?: number;
  horizontalLineEndpoint?: Partial<AnnotationEndpointSettings>;
}

export interface LineInfoAnnotationSettings {
  show: boolean;
  seriesA: string;
  seriesB: string;
  direction: AnnotationDirection;
  verticalLine: LineInfoVerticalLineSettings;
  horizontalLine: LineInfoHorizontalLineSettings;
  text: LineInfoTextSettings;
  perRowOverrides: Record<string, LineInfoPerRowOverrides>;
}

export interface BarBackgroundSettings {
  show: boolean;
  color: string;
  opacity: number;
}

// ===== BAR CHART STACKED-2 (ELECTION) SETTINGS =====

export type ElectionSegmentAlign = 'left' | 'center' | 'right';
export type ElectionLabelPosition = 'above_bar' | 'below_bar' | 'hidden';

// Difference / margin bar shown below the main election bar (e.g. "İMAMOĞLU +14,70")
export type ElectionDifferenceSource = 'info' | 'auto';

export interface ElectionDifferenceBarSettings {
  show: boolean;
  source: ElectionDifferenceSource; // 'info' = value from the mapped Info column; 'auto' = leader − runner-up
  height: number;
  backgroundColor: string;
  cornerRadius: number;
  marginTop: number;                // gap below the main bar
  template: string;                 // placeholders: {leader} {trailer} {value}
  matchLeaderColor: boolean;        // text color follows the leading segment's color
  color: string;                    // text color when matchLeaderColor is off
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  numberFormat: ElectionPerRowNumberFormat;
}

export interface ElectionPerRowTextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: string;
  letterSpacing: number;
}

export interface ElectionPerRowPrefixSettings {
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

export interface ElectionPerRowNumberFormat {
  decimalPlaces: number;
  thousandsSeparator: ThousandsSeparator;
  decimalSeparator: DecimalSeparator;
  prefix: string;
  suffix: string;
  showTrailingZeros: boolean;
}

export interface ElectionRowImageSide {
  show: boolean;
  url: string;
  width: number;
  height: number;
  borderRadius: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export interface ElectionBarSettings {
  // Bar layout
  barHeight: number;
  spacingBetweenSegments: number;
  barOpacity: number;
  manualPlotWidth: boolean;
  manualPlotWidthValue: number;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;

  // Data points
  showDataPoints: boolean;
  defaultDataPointStyle: ElectionPerRowTextStyle;
  perRowDataPointStyles: Record<string, Partial<ElectionPerRowTextStyle>>;
  perRowDataPointAlign: Record<string, ElectionSegmentAlign>;
  dataPointPaddingTop: number;
  dataPointPaddingRight: number;
  dataPointPaddingBottom: number;
  dataPointPaddingLeft: number;
  perRowDataPointPadding: Record<string, { top: number; right: number; bottom: number; left: number }>;

  // Prefix per row
  defaultPrefix: ElectionPerRowPrefixSettings;
  perRowPrefixSettings: Record<string, Partial<ElectionPerRowPrefixSettings>>;

  // Segment labels (bar labels)
  defaultLabelPosition: ElectionLabelPosition;
  defaultLabelAlign: 'left' | 'center' | 'right';
  defaultLabelStyle: ElectionPerRowTextStyle;
  perRowLabelPosition: Record<string, ElectionLabelPosition>;
  perRowLabelAlign: Record<string, 'left' | 'center' | 'right'>;
  perRowLabelStyles: Record<string, Partial<ElectionPerRowTextStyle>>;

  // Legend control
  legendVisibleRows: Record<string, boolean>;

  // Data points info (below bar)
  showDataPointsInfo: boolean;
  defaultInfoStyle: ElectionPerRowTextStyle;
  perRowInfoVisible: Record<string, boolean>;
  perRowInfoStyles: Record<string, Partial<ElectionPerRowTextStyle>>;
  infoPaddingTop: number;

  // Number formatting (data points)
  defaultNumberFormat: ElectionPerRowNumberFormat;
  perRowNumberFormat: Record<string, Partial<ElectionPerRowNumberFormat>>;

  // Number formatting (info)
  defaultInfoNumberFormat: ElectionPerRowNumberFormat;
  perRowInfoNumberFormat: Record<string, Partial<ElectionPerRowNumberFormat>>;

  // Left/right images
  leftImage: {
    show: boolean;
    defaultSettings: ElectionRowImageSide;
    perRowSettings: Record<string, Partial<ElectionRowImageSide>>;
  };
  rightImage: {
    show: boolean;
    defaultSettings: ElectionRowImageSide;
    perRowSettings: Record<string, Partial<ElectionRowImageSide>>;
  };

  // Difference / margin bar below the main bar
  differenceBar: ElectionDifferenceBarSettings;
}

// ===== HEATMAP SETTINGS =====
export type HeatmapColorMode = 'single' | 'diverging';
export type HeatmapDensity = 'compact' | 'normal' | 'comfortable';
export type HeatmapAlign = 'left' | 'center' | 'right';
export type HeatmapSizingMode = 'auto' | 'custom';
export type HeatmapTotalsMode = 'column' | 'row' | 'both';

// ===== DIVERGING (back-to-back) BAR CHART SETTINGS =====
export type DivergingScaleMode = 'independent' | 'symmetric';
// In-bar value label placement, specific to the diverging layout:
// 'center' = centered in each bar; 'inner' = both labels meet at the center baseline;
// 'outer' = labels at the outer ends (opposite corners).
export type DivergingLabelPosition = 'center' | 'inner' | 'outer';

export interface DivergingBarSettings {
  seriesSides: Record<string, 'left' | 'right'>; // per-series side override; default: index 0 → left, rest → right
  scaleMode: DivergingScaleMode; // 'independent' = each side scaled to its own max; 'symmetric' = shared max
  centerGap: number; // px gap between the two halves at the center baseline
  absoluteValues: boolean; // draw bar length and label from |value| (so negative-encoded data works)
  labelPosition: DivergingLabelPosition; // diverging-specific in-bar value label placement
  legendCenterOnPlot: boolean; // center the legend over the plot/graph area (not the full width incl. labels)
  legendCenterGap: number; // extra px spread between the two legend groups when centered over the plot
}

export interface HeatmapSettings {
  // Coloring
  colorMode: HeatmapColorMode;
  baseColor: string;
  positiveColor: string;
  negativeColor: string;
  intensity: number;
  includeTotalInScale: boolean;

  // Cells
  cellFontFamily: string;
  cellFontSize: number;
  cellFontWeight: FontWeight;
  cellColor: string;
  dashColor: string;
  valueAlign: HeatmapAlign;
  density: HeatmapDensity;
  zeroAsDash: boolean;
  showPercent: boolean;
  percentPosition: 'left' | 'right';
  percentFontSize: number; // size of the % sign in data cells
  striped: boolean;
  stripedColor: string;

  // Column header row
  headerBg: string;
  headerFontFamily: string;
  headerFontSize: number;
  headerFontWeight: FontWeight;
  headerColor: string;
  headerUppercase: boolean;
  headerLetterSpacing: number;
  headerAlign: HeatmapAlign;
  cornerLabel: string; // top-left header cell; empty = use the label column name

  // Row labels (left column)
  showRowDots: boolean;
  dotSize: number;
  dotRadius: number;
  labelFontFamily: string;
  labelFontSize: number;
  labelFontWeight: FontWeight;
  labelColor: string;
  labelAlign: HeatmapAlign;

  // Sizing
  sizingMode: HeatmapSizingMode; // auto = fit to content; custom = use manual sizes below
  wrapText: boolean; // wrap box text to a second line when it doesn't fit
  // Manual box dimensions (used in custom mode; 0 = auto for that dimension)
  labelColWidth: number; // left label box width
  dataColWidth: number; // data box width
  headerHeight: number; // top label box height
  rowHeight: number; // data / left label box height

  // Per-series overrides (0/absent = use the defaults above)
  perColHeaderFontSizes: Record<string, number>; // keyed by value column name
  perColWidths: Record<string, number>; // keyed by value column name
  perColHeaderPadding: Record<string, number>; // horizontal padding inside the column header box
  perRowLabelFontSizes: Record<string, number>; // keyed by row label
  perRowHeights: Record<string, number>; // keyed by row label
  perRowLabelPadding: Record<string, number>; // horizontal padding inside the row label box

  // Borders
  borderShow: boolean;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed';

  // Totals
  showTotals: boolean;
  totalsMode: HeatmapTotalsMode; // column / row / both
  totalLabel: string;
  totalFontSize: number;
  totalColor: string;
  totalPercentFontSize: number; // size of the % sign in total cells
  totalCustomDecimals: boolean; // when on, total cells use totalDecimalPlaces instead of number-formatting decimals
  totalDecimalPlaces: number; // decimal places for total cells (when totalCustomDecimals is on)

  // Outer
  cornerRadius: number;
}

// ===== MASTER SETTINGS OBJECT =====
export interface ChartSettings {
  chartType: ChartTypeSettings;
  controlsFilters: ControlsFiltersSettings;
  colors: ColorsSettings;
  bars: BarsSettings;
  columns: ColumnsSettings;
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
  electionBar: ElectionBarSettings;
  lineInfoAnnotation: LineInfoAnnotationSettings;
  heatmap: HeatmapSettings;
  divergingBar: DivergingBarSettings;
}

// ===== PREVIEW STATE (persisted in columnMapping) =====
export interface PreviewState {
  previewDevice?: string;
  customPreviewWidth?: number;
  customPreviewHeight?: number;
  autoComputedHeight?: number;
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
  _columnTypes?: Record<string, { type: 'number' | 'text'; inputFormat?: string; decimalPlaces?: number; outputFormat?: string }>;
}
