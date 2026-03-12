/**
 * Complete settings map for the General Settings page.
 * Each section contains sub-settings that can be individually toggled.
 */

export interface SubSetting {
  key: string;
  label: string;
}

export interface SettingsSection {
  id: string;
  title: string;
  settings: SubSetting[];
}

export const settingsMap: SettingsSection[] = [
  {
    id: 'chart-type',
    title: 'Chart type',
    settings: [
      { key: 'chartType', label: 'Chart type' },
      { key: 'stackSortMode', label: 'Stack sort mode' },
      { key: 'gridMode', label: 'Grid mode' },
      { key: 'heightMode', label: 'Height mode' },
      { key: 'standardHeight', label: 'Standard height' },
      { key: 'aspectRatio', label: 'Aspect ratio' },
      { key: 'aggregationMode', label: 'Aggregation mode' },
      { key: 'sortMode', label: 'Sort mode' },
    ],
  },
  {
    id: 'controls-filters',
    title: 'Controls & filters',
    settings: [
      { key: 'seriesFilter', label: 'Series filter' },
      { key: 'maxSeriesToShow', label: 'Max series to show' },
      { key: 'filterRowsNoData', label: 'Filter rows with no data' },
      { key: 'controlPosition', label: 'Control position' },
    ],
  },
  {
    id: 'colors',
    title: 'Colors',
    settings: [
      { key: 'colorMode', label: 'Color mode' },
      { key: 'palette', label: 'Palette' },
      { key: 'extend', label: 'Extend palette' },
      { key: 'customOverrides', label: 'Custom overrides' },
      { key: 'themeId', label: 'Color theme' },
    ],
  },
  {
    id: 'bars',
    title: 'Bars',
    settings: [
      { key: 'barHeight', label: 'Bar height' },
      { key: 'barOpacity', label: 'Bar opacity' },
      { key: 'spacingMain', label: 'Main spacing' },
      { key: 'spacingInStack', label: 'Stack spacing' },
      { key: 'emptyRowSpacing', label: 'Empty row spacing' },
      { key: 'bottomBarPadding', label: 'Bottom bar padding' },
      { key: 'emptyRowLine', label: 'Empty row line' },
      { key: 'outline', label: 'Bar outline' },
      { key: 'outlineColor', label: 'Outline color' },
      { key: 'outlineWidth', label: 'Outline width' },
    ],
  },
  {
    id: 'line-dots-areas',
    title: 'Lines, dots and areas',
    settings: [
      { key: 'lineWidth', label: 'Line width' },
      { key: 'lineOpacity', label: 'Line opacity' },
      { key: 'lineOutline', label: 'Line outline' },
      { key: 'lineCurve', label: 'Line curve' },
      { key: 'dashedLines', label: 'Dashed lines' },
      { key: 'missingDataMode', label: 'Missing data' },
      { key: 'shadeBetweenLines', label: 'Shade between lines' },
      { key: 'dotMode', label: 'Dot mode' },
      { key: 'dotOpacity', label: 'Dot opacity' },
      { key: 'dotRadius', label: 'Dot radius' },
      { key: 'finalDotScale', label: 'Final dot scale' },
      { key: 'dotHollow', label: 'Hollow dots' },
    ],
  },
  {
    id: 'labels',
    title: 'Labels',
    settings: [
      { key: 'barLabelStyle', label: 'Bar label style' },
      { key: 'aboveBarPadding', label: 'Above-bar padding' },
      { key: 'showDataPointLabels', label: 'Data point labels' },
      { key: 'dataPointPosition', label: 'Data point position' },
      { key: 'dataPointCustomPadding', label: 'Data point custom padding' },
      { key: 'dataPointFont', label: 'Data point font' },
      { key: 'dataPointColorMode', label: 'Data point color mode' },
      { key: 'fixedLabelAlignment', label: 'Fixed label alignment' },
      { key: 'dataPointLetterSpacing', label: 'Data point letter spacing' },
      { key: 'perRowDataPointLetterSpacings', label: 'Per-row data point letter spacing' },
      { key: 'stackLabelMode', label: 'Stack label mode' },
      { key: 'lineLabelDistanceV', label: 'Line label vertical distance' },
      { key: 'lineLabelPerSeriesPadding', label: 'Per-series line label padding' },
      { key: 'lineLabelPerSeriesOverrides', label: 'Per-series line label overrides' },
      { key: 'dataPointRowSeriesPadding', label: 'Per-row per-series data point padding' },
    ],
  },
  {
    id: 'x-axis',
    title: 'X axis',
    settings: [
      { key: 'position', label: 'Position' },
      { key: 'scaleType', label: 'Scale type' },
      { key: 'minMax', label: 'Min / Max' },
      { key: 'flipAxis', label: 'Flip axis' },
      { key: 'titleType', label: 'Title' },
      { key: 'titleStyling', label: 'Title styling' },
      { key: 'tickPosition', label: 'Tick position' },
      { key: 'tickStyling', label: 'Tick styling' },
      { key: 'tickPadding', label: 'Tick padding' },
      { key: 'tickAngle', label: 'Tick angle' },
      { key: 'ticksToShowMode', label: 'Ticks to show' },
      { key: 'tickMarks', label: 'Tick marks' },
      { key: 'axisLine', label: 'Axis line' },
      { key: 'zeroLine', label: 'Zero line' },
      { key: 'gridlines', label: 'Gridlines' },
      { key: 'gridlineStyling', label: 'Gridline styling' },
    ],
  },
  {
    id: 'y-axis',
    title: 'Y axis',
    settings: [
      { key: 'position', label: 'Position' },
      { key: 'scaleType', label: 'Scale type' },
      { key: 'minMax', label: 'Min / Max' },
      { key: 'titleType', label: 'Title' },
      { key: 'titleStyling', label: 'Title styling' },
      { key: 'tickPosition', label: 'Tick position' },
      { key: 'tickStyling', label: 'Tick styling' },
      { key: 'tickPadding', label: 'Tick padding' },
      { key: 'spaceMode', label: 'Space mode' },
      { key: 'axisLine', label: 'Axis line' },
      { key: 'gridlines', label: 'Gridlines' },
      { key: 'gridlineStyling', label: 'Gridline styling' },
      { key: 'labelTextAlign', label: 'Label text alignment' },
      { key: 'labelLetterSpacing', label: 'Label letter spacing' },
      { key: 'perRowLabelLetterSpacings', label: 'Per-row label letter spacing' },
      { key: 'labelMargin', label: 'Label margin' },
    ],
  },
  {
    id: 'plot-background',
    title: 'Plot background',
    settings: [
      { key: 'backgroundColor', label: 'Background color' },
      { key: 'backgroundOpacity', label: 'Background opacity' },
      { key: 'border', label: 'Border' },
      { key: 'borderColor', label: 'Border color' },
      { key: 'borderWidth', label: 'Border width' },
    ],
  },
  {
    id: 'number-formatting',
    title: 'Number formatting',
    settings: [
      { key: 'decimalPlaces', label: 'Decimal places' },
      { key: 'thousandsSeparator', label: 'Thousands separator' },
      { key: 'decimalSeparator', label: 'Decimal separator' },
      { key: 'prefix', label: 'Prefix' },
      { key: 'suffix', label: 'Suffix' },
    ],
  },
  {
    id: 'legend',
    title: 'Legend',
    settings: [
      { key: 'show', label: 'Show legend' },
      { key: 'clickToFilter', label: 'Click to filter' },
      { key: 'alignment', label: 'Alignment' },
      { key: 'orientation', label: 'Orientation' },
      { key: 'position', label: 'Position' },
      { key: 'titleText', label: 'Title text' },
      { key: 'fontFamily', label: 'Font family' },
      { key: 'color', label: 'Color' },
      { key: 'size', label: 'Size' },
      { key: 'swatch', label: 'Swatch settings' },
      { key: 'padding', label: 'Padding' },
      { key: 'customOrder', label: 'Custom order' },
      { key: 'maxWidth', label: 'Max width' },
    ],
  },
  {
    id: 'popups-panels',
    title: 'Popups & panels',
    settings: [
      { key: 'showPopup', label: 'Show popup' },
      { key: 'popupContent', label: 'Popup content' },
      { key: 'popupStyle', label: 'Popup style' },
    ],
  },
  {
    id: 'annotations',
    title: 'Annotations',
    settings: [
      { key: 'annotations', label: 'Annotations list' },
    ],
  },
  {
    id: 'animations',
    title: 'Animations',
    settings: [
      { key: 'enabled', label: 'Enable animations' },
      { key: 'duration', label: 'Duration' },
      { key: 'type', label: 'Animation type' },
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    settings: [
      { key: 'maxWidth', label: 'Max width' },
      { key: 'padding', label: 'Padding' },
      { key: 'backgroundColor', label: 'Background color' },
      { key: 'backgroundOpacity', label: 'Background opacity' },
    ],
  },
  {
    id: 'question',
    title: 'Question',
    settings: [
      { key: 'text', label: 'Question text' },
      { key: 'textDefaults', label: 'Text defaults' },
      { key: 'subtext', label: 'Subtext' },
      { key: 'subtextDefaults', label: 'Subtext defaults' },
      { key: 'position', label: 'Position' },
      { key: 'alignment', label: 'Alignment' },
      { key: 'padding', label: 'Padding' },
      { key: 'subtextPadding', label: 'Subtext padding' },
      { key: 'accentLine', label: 'Accent line' },
    ],
  },
  {
    id: 'header',
    title: 'Header',
    settings: [
      { key: 'alignment', label: 'Alignment' },
      { key: 'title', label: 'Title' },
      { key: 'titleStyling', label: 'Title styling' },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'subtitleStyling', label: 'Subtitle styling' },
      { key: 'text', label: 'Text' },
      { key: 'textStyling', label: 'Text styling' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    id: 'footer',
    title: 'Footer',
    settings: [
      { key: 'alignment', label: 'Alignment' },
      { key: 'size', label: 'Size' },
      { key: 'color', label: 'Color' },
      { key: 'advancedStyles', label: 'Advanced styles' },
      { key: 'textStyling', label: 'Text styling' },
      { key: 'sourceName', label: 'Source name' },
      { key: 'sourceUrl', label: 'Source URL' },
      { key: 'multipleSources', label: 'Multiple sources' },
      { key: 'sourceLabel', label: 'Source label' },
      { key: 'notePrimary', label: 'Primary note' },
      { key: 'noteSecondary', label: 'Secondary note' },
      { key: 'logoUrl', label: 'Logo URL' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    settings: [
      { key: 'alternativeDescription', label: 'Alternative description' },
      { key: 'altText', label: 'Alt text' },
    ],
  },
  {
    id: 'election-bar',
    title: 'Election bar',
    settings: [
      { key: 'barHeight', label: 'Bar height' },
      { key: 'spacingBetweenSegments', label: 'Spacing between segments' },
      { key: 'barOpacity', label: 'Bar opacity' },
      { key: 'manualPlotWidth', label: 'Manual plot width' },
      { key: 'outline', label: 'Outline' },
      { key: 'showDataPoints', label: 'Data points' },
      { key: 'prefix', label: 'Prefix' },
      { key: 'labels', label: 'Segment labels' },
      { key: 'showDataPointsInfo', label: 'Data points info' },
      { key: 'numberFormat', label: 'Number formatting' },
      { key: 'images', label: 'Images' },
      { key: 'legendRows', label: 'Legend rows' },
    ],
  },
  {
    id: 'bar-background',
    title: 'Bar background',
    settings: [
      { key: 'show', label: 'Show bar background' },
      { key: 'color', label: 'Background color' },
      { key: 'opacity', label: 'Opacity' },
    ],
  },
  {
    id: 'bar-row-borders',
    title: 'Bar row borders',
    settings: [
      { key: 'show', label: 'Show row borders' },
      { key: 'mode', label: 'Mode' },
      { key: 'customRows', label: 'Custom rows' },
      { key: 'color', label: 'Color' },
      { key: 'width', label: 'Width' },
      { key: 'style', label: 'Style' },
      { key: 'dashLength', label: 'Dash length' },
      { key: 'alignment', label: 'Alignment' },
    ],
  },
  {
    id: 'connector-border',
    title: 'Connector border',
    settings: [
      { key: 'show', label: 'Show connector' },
      { key: 'color', label: 'Color' },
      { key: 'width', label: 'Width' },
      { key: 'style', label: 'Style' },
      { key: 'length', label: 'Length' },
      { key: 'paddingBar', label: 'Padding (bar side)' },
      { key: 'paddingLabel', label: 'Padding (label side)' },
      { key: 'alignment', label: 'Alignment' },
    ],
  },
  {
    id: 'info-column',
    title: 'Info column',
    settings: [
      { key: 'show', label: 'Show info column' },
      { key: 'position', label: 'Position' },
      { key: 'verticalAlignment', label: 'Vertical alignment' },
      { key: 'customPadding', label: 'Custom padding' },
      { key: 'paddingVertical', label: 'Padding vertical' },
      { key: 'paddingHorizontal', label: 'Padding horizontal' },
      { key: 'padding', label: 'Padding' },
      { key: 'dataType', label: 'Data type' },
      { key: 'fontFamily', label: 'Font family' },
      { key: 'fontWeight', label: 'Font weight' },
      { key: 'fontStyle', label: 'Font style' },
      { key: 'fontSize', label: 'Font size' },
      { key: 'color', label: 'Color' },
      { key: 'letterSpacing', label: 'Letter spacing' },
      { key: 'perRowOverrides', label: 'Per-row overrides' },
      { key: 'icon', label: 'Icon settings' },
      { key: 'borderLeft', label: 'Border left' },
      { key: 'borderRight', label: 'Border right' },
    ],
  },
  {
    id: 'row-images',
    title: 'Row images',
    settings: [
      { key: 'show', label: 'Show row images' },
      { key: 'imagePosition', label: 'Image position' },
      { key: 'defaultUrl', label: 'Default image URL' },
      { key: 'defaultWidth', label: 'Default width' },
      { key: 'defaultHeight', label: 'Default height' },
      { key: 'borderRadius', label: 'Border radius' },
      { key: 'customPadding', label: 'Custom padding' },
      { key: 'paddingTop', label: 'Padding top' },
      { key: 'paddingRight', label: 'Padding right' },
      { key: 'paddingBottom', label: 'Padding bottom' },
      { key: 'paddingLeft', label: 'Padding left' },
    ],
  },
  {
    id: 'line-info-annotation',
    title: 'Info annotation',
    settings: [
      { key: 'show', label: 'Show info annotation' },
      { key: 'seriesPair', label: 'Series pair' },
      { key: 'direction', label: 'Direction' },
      { key: 'perRowDirection', label: 'Per-row direction' },
      { key: 'verticalLine', label: 'Vertical line' },
      { key: 'horizontalLine', label: 'Horizontal line' },
      { key: 'text', label: 'Info text' },
      { key: 'perRowOverrides', label: 'Per-row overrides' },
    ],
  },
];

/** Get all setting keys as "sectionId.settingKey" format */
export function getAllSettingKeys(): string[] {
  return settingsMap.flatMap((s) =>
    s.settings.map((sub) => `${s.id}.${sub.key}`)
  );
}

/** Count total number of sub-settings */
export function getTotalSettingsCount(): number {
  return settingsMap.reduce((sum, s) => sum + s.settings.length, 0);
}
