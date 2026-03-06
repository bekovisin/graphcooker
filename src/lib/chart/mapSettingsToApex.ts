import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { getPaletteColors, extendColors } from './palettes';

function parseCustomOverrides(overrides: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!overrides.trim()) return map;
  overrides.split('\n').forEach((line) => {
    const [key, value] = line.split(':').map((s) => s.trim());
    if (key && value) map[key] = value;
  });
  return map;
}

function resolveColors(settings: ChartSettings['colors'], seriesNames: string[]): string[] {
  let colors = getPaletteColors(settings.palette, settings.customPaletteColors);
  if (settings.extend) {
    colors = extendColors(colors, Math.max(seriesNames.length, colors.length));
  }
  const overrides = parseCustomOverrides(settings.customOverrides);
  return seriesNames.map((name, i) => overrides[name] || colors[i % colors.length]);
}

function buildSeries(
  data: DataRow[],
  mapping: ColumnMapping,
  columnOrder?: string[],
  seriesNames?: Record<string, string>
): ApexAxisChartSeries {
  if (!mapping.values || mapping.values.length === 0 || !mapping.labels) return [];

  // Order values by their position in columnOrder (spreadsheet column order)
  const valuesSet = new Set(mapping.values);
  const orderedValues = columnOrder
    ? columnOrder.filter((col) => valuesSet.has(col))
    : mapping.values;

  return orderedValues.map((seriesKey) => ({
    name: (seriesNames && seriesNames[seriesKey]) || seriesKey,
    data: data.map((row) => {
      const val = row[seriesKey];
      return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    }),
  }));
}

function buildCategories(data: DataRow[], mapping: ColumnMapping): string[] {
  if (!mapping.labels) return [];
  return data.map((row) => String(row[mapping.labels] || ''));
}

function formatNumber(value: number, settings: ChartSettings['numberFormatting']): string {
  let str = value.toFixed(settings.decimalPlaces);
  const [intPart, decPart] = str.split('.');

  let formattedInt = intPart;
  if (settings.thousandsSeparator !== 'none') {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousandsSeparator);
  }

  str = decPart ? `${formattedInt}${settings.decimalSeparator}${decPart}` : formattedInt;
  return `${settings.prefix}${str}${settings.suffix}`;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}

export function mapSettingsToApexOptions(
  settings: ChartSettings,
  data: DataRow[],
  mapping: ColumnMapping
): ApexCharts.ApexOptions {
  const isHorizontal = settings.chartType.chartType.startsWith('bar_');
  const isStacked = settings.chartType.chartType.includes('stacked');
  const is100Percent = settings.chartType.chartType.includes('100');
  const seriesNames = mapping.values || [];
  const categories = buildCategories(data, mapping);
  const colors = resolveColors(settings.colors, seriesNames);
  const isAboveBars = settings.labels.barLabelStyle === 'above_bars';

  const flipAxis = settings.xAxis.flipAxis;

  const labelPos = settings.labels.dataPointPosition;
  const apexDataLabelPos = (() => {
    if (labelPos === 'left') return 'bottom';
    if (labelPos === 'right') return 'top';
    return 'center';
  })() as 'top' | 'center' | 'bottom';

  const dataLabelTextAnchor = (() => {
    if (labelPos === 'left') return 'start' as const;
    if (labelPos === 'right') return 'end' as const;
    return 'middle' as const;
  })();

  const dataLabelColors = settings.labels.dataPointColorMode === 'auto'
    ? colors.map((c) => getContrastColor(c))
    : seriesNames.map((name) =>
        settings.labels.dataPointSeriesColors[name] || settings.labels.dataPointColor
      );

  const tickRotation = settings.xAxis.tickAngle;

  const tickAmount = settings.xAxis.ticksToShowMode === 'number'
    ? settings.xAxis.ticksToShowNumber
    : undefined;

  // Y axis: hidden when position=hidden OR in above_bars mode for horizontal bars
  const yAxisHidden = settings.yAxis.position === 'hidden' || (isHorizontal && isAboveBars);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: isStacked,
      stackType: is100Percent ? '100%' : undefined,
      background: 'transparent',
      animations: {
        enabled: settings.animations.enabled,
        speed: settings.animations.duration,
        animateGradually: {
          enabled: settings.animations.type === 'gradual',
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: isHorizontal,
        barHeight: `${Math.max(5, Math.min(98, Math.round(
          settings.bars.barHeight / (settings.bars.barHeight + settings.bars.spacingMain) * 100
        )))}%`,
        columnWidth: `${Math.max(5, Math.min(98, Math.round(
          settings.bars.barHeight / (settings.bars.barHeight + settings.bars.spacingMain) * 100
        )))}%`,
        borderRadius: 0,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: apexDataLabelPos,
        },
      },
    },
    colors,
    fill: {
      opacity: settings.bars.barOpacity,
    },
    stroke: settings.bars.outline
      ? {
          show: true,
          width: settings.bars.outlineWidth,
          colors: [settings.bars.outlineColor],
        }
      : settings.bars.spacingInStack > 0
        ? {
            show: true,
            width: settings.bars.spacingInStack,
            colors: [settings.layout.backgroundColor || '#ffffff'],
          }
        : {
            show: true,
            width: 0,
            colors: ['transparent'],
          },
    dataLabels: {
      enabled: settings.labels.showDataPointLabels,
      textAnchor: dataLabelTextAnchor,
      style: {
        fontSize: `${settings.labels.dataPointFontSize}px`,
        fontFamily: settings.labels.dataPointFontFamily,
        fontWeight: settings.labels.dataPointFontWeight === 'bold' ? 700 : 400,
        colors: dataLabelColors,
      },
      offsetX: settings.labels.dataPointCustomPadding ? settings.labels.dataPointPaddingLeft - settings.labels.dataPointPaddingRight : 0,
      offsetY: settings.labels.dataPointCustomPadding ? settings.labels.dataPointPaddingTop - settings.labels.dataPointPaddingBottom : 0,
      formatter: (val: number) => formatNumber(val, settings.numberFormatting),
    },
    xaxis: {
      categories,
      position: (() => {
        const pos = settings.xAxis.position;
        if (pos === 'hidden') return 'bottom';
        if (pos === 'top' || pos === 'float_up') return 'top';
        return 'bottom';
      })(),
      tickAmount,
      axisBorder: {
        show: settings.xAxis.position !== 'hidden' && settings.xAxis.axisLine.show,
        color: settings.xAxis.axisLine.color,
        height: settings.xAxis.axisLine.width,
      },
      axisTicks: {
        show: settings.xAxis.position !== 'hidden' && settings.xAxis.tickMarks.show,
        color: settings.xAxis.tickMarks.color,
        height: settings.xAxis.tickMarks.length,
        borderType: 'solid',
      },
      labels: {
        show: settings.xAxis.position !== 'hidden',
        rotate: tickRotation,
        rotateAlways: tickRotation !== 0,
        offsetY: settings.xAxis.tickPadding,
        style: {
          fontFamily: settings.xAxis.tickStyling.fontFamily,
          fontSize: `${settings.xAxis.tickStyling.fontSize}px`,
          fontWeight: settings.xAxis.tickStyling.fontWeight === 'bold' ? 700 : 400,
          colors: settings.xAxis.tickStyling.color,
        },
        formatter: isHorizontal
          ? (val: string) => {
              const num = parseFloat(val);
              return isNaN(num) ? val : formatNumber(num, settings.numberFormatting);
            }
          : undefined,
      },
      title: {
        text: settings.xAxis.titleType === 'custom' ? settings.xAxis.titleText : undefined,
        style: {
          fontFamily: settings.xAxis.titleStyling.fontFamily,
          fontSize: `${settings.xAxis.titleStyling.fontSize}px`,
          fontWeight: settings.xAxis.titleStyling.fontWeight === 'bold' ? 700 : 400,
          color: settings.xAxis.titleStyling.color,
        },
      },
      min: settings.xAxis.min ? parseFloat(settings.xAxis.min) : undefined,
      max: settings.xAxis.max ? parseFloat(settings.xAxis.max) : undefined,
    },
    yaxis: {
      show: !yAxisHidden,
      opposite: settings.yAxis.position === 'right',
      reversed: flipAxis,
      logarithmic: settings.yAxis.scaleType === 'log',
      labels: {
        show: !yAxisHidden,
        maxWidth: isHorizontal
          ? (settings.yAxis.spaceMode === 'fixed' ? settings.yAxis.spaceModeValue : 300)
          : undefined,
        style: {
          fontFamily: settings.yAxis.tickStyling.fontFamily,
          fontSize: `${settings.yAxis.tickStyling.fontSize}px`,
          fontWeight: settings.yAxis.tickStyling.fontWeight === 'bold' ? 700 : 400,
          colors: settings.yAxis.tickStyling.color,
        },
        offsetX: isHorizontal ? -(settings.yAxis.tickPadding || 0) : 0,
        formatter: !isHorizontal
          ? (val: number) => formatNumber(val, settings.numberFormatting)
          : undefined,
      },
      title: {
        text: settings.yAxis.titleType === 'custom' ? settings.yAxis.titleText : undefined,
        style: {
          fontFamily: settings.yAxis.titleStyling.fontFamily,
          fontSize: `${settings.yAxis.titleStyling.fontSize}px`,
          fontWeight: settings.yAxis.titleStyling.fontWeight === 'bold' ? 700 : 400,
          color: settings.yAxis.titleStyling.color,
        },
      },
      min: settings.yAxis.min ? parseFloat(settings.yAxis.min) : undefined,
      max: settings.yAxis.max ? parseFloat(settings.yAxis.max) : undefined,
    },
    grid: {
      show: true,
      borderColor: settings.xAxis.gridlineStyling.color,
      strokeDashArray: settings.xAxis.gridlineStyling.dashArray,
      xaxis: {
        lines: {
          show: isHorizontal ? settings.xAxis.gridlines : false,
        },
      },
      yaxis: {
        lines: {
          show: isHorizontal ? false : settings.xAxis.gridlines,
        },
      },
      padding: {
        top: isHorizontal && isAboveBars ? 0 : 10,
        right: 10,
        bottom: 10,
        left: isHorizontal && isAboveBars ? 0 : 10,
      },
    },
    legend: {
      show: settings.legend.show,
      position: settings.legend.orientation === 'vertical' ? 'right' : 'bottom',
      horizontalAlign: settings.legend.alignment === 'inline' ? 'center' : settings.legend.alignment as 'left' | 'center' | 'right',
      fontSize: `${settings.legend.size}px`,
      fontFamily: settings.legend.fontFamily || 'Inter, sans-serif',
      fontWeight: settings.legend.textWeight === 'bold' ? 700 : 400,
      labels: {
        colors: settings.legend.color,
      },
      markers: {
        size: settings.legend.swatchWidth / 3,
        shape: settings.legend.swatchRoundness > 5 ? 'circle' : 'square',
        strokeWidth: settings.legend.outline ? 1 : 0,
      },
      itemMargin: {
        horizontal: settings.legend.swatchPadding,
        vertical: 4,
      },
      offsetY: settings.legend.marginTop || 0,
    },
    tooltip: {
      enabled: settings.popupsPanels.showPopup,
      theme: settings.popupsPanels.popupStyle,
      y: {
        formatter: (val: number) => formatNumber(val, settings.numberFormatting),
      },
    },
  };

  // Add annotations - only valid ones with text and coordinates
  const validAnnotations = (settings.annotations?.annotations || []).filter(
    (ann) => ann.text && ann.x != null && ann.y != null
  );
  if (validAnnotations.length > 0) {
    options.annotations = {
      points: validAnnotations.map((ann) => ({
        x: String(ann.x),
        y: ann.y,
        label: {
          text: ann.text,
          offsetY: 0,
          style: {
            fontSize: `${ann.fontSize}px`,
            fontWeight: ann.fontWeight === 'bold' ? '700' : '400',
            color: ann.color,
            background: ann.backgroundColor,
          },
        },
      })),
    };
  }

  return options;
}

export function buildChartData(
  data: DataRow[],
  mapping: ColumnMapping,
  settings: ChartSettings,
  columnOrder?: string[],
  seriesNames?: Record<string, string>
): { series: ApexAxisChartSeries; options: ApexCharts.ApexOptions; autoHeight: number; isAboveBars: boolean; categories: string[] } {
  const series = buildSeries(data, mapping, columnOrder, seriesNames);
  const options = mapSettingsToApexOptions(settings, data, mapping);
  const isHorizontal = settings.chartType.chartType.startsWith('bar_');
  const isAboveBars = settings.labels.barLabelStyle === 'above_bars' && isHorizontal;
  const categories = buildCategories(data, mapping);

  // Sort data if needed
  if (settings.chartType.sortMode === 'value' && series.length > 0) {
    const totals = data.map((_, i) => {
      return series.reduce((sum, s) => sum + ((s.data[i] as number) || 0), 0);
    });
    const indices = totals.map((_, i) => i).sort((a, b) => totals[b] - totals[a]);

    series.forEach((s) => {
      s.data = indices.map((i) => s.data[i]) as typeof s.data;
    });
    if (options.xaxis && Array.isArray(options.xaxis.categories)) {
      options.xaxis.categories = indices.map((i) => options.xaxis!.categories![i]);
    }
  }

  // Stack sort
  if (settings.chartType.stackSortMode !== 'normal') {
    const sortAsc = settings.chartType.stackSortMode === 'ascending';
    series.sort((a, b) => {
      const sumA = (a.data as number[]).reduce((s, v) => s + (v || 0), 0);
      const sumB = (b.data as number[]).reduce((s, v) => s + (v || 0), 0);
      return sortAsc ? sumA - sumB : sumB - sumA;
    });
  }

  // Compute auto height based on bar settings and number of categories
  const numCategories = data.length || 1;
  const barHeightPx = settings.bars.barHeight;
  const spacingPx = settings.bars.spacingMain;
  const labelRowHeight = isAboveBars ? settings.yAxis.tickStyling.fontSize + 8 : 0;
  const autoHeight = Math.max(150, numCategories * (barHeightPx + spacingPx + labelRowHeight) + 80);

  return { series, options, autoHeight, isAboveBars, categories };
}
