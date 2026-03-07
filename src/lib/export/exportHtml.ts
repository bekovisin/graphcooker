import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';

/** Check if HTML content has meaningful text (not just empty tags) */
function hasContent(html: string): boolean {
  if (!html) return false;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length > 0;
}

/** Build question block HTML */
function buildQuestionHtml(settings: ChartSettings): string {
  const question = settings.question;
  if (!question) return '';
  const hasText = hasContent(question.text);
  const hasSubtext = hasContent(question.subtext);
  if (!hasText && !hasSubtext) return '';

  const textDefaults = question.textDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#333333', lineHeight: 1.3 };
  const subtextDefaults = question.subtextDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666666', lineHeight: 1.4 };
  const accentLine = question.accentLine;
  const showAccent = accentLine?.show;

  let contentHtml = `<div style="text-align: ${question.alignment}; flex: 1;">`;
  if (hasText) {
    contentHtml += `<div style="font-family: ${textDefaults.fontFamily}; font-size: ${textDefaults.fontSize}px; color: ${textDefaults.color}; line-height: ${textDefaults.lineHeight}; padding-top: ${question.paddingTop || 0}px; padding-right: ${question.paddingRight || 0}px; padding-bottom: ${question.paddingBottom || 0}px; padding-left: ${question.paddingLeft || 0}px;">${question.text}</div>`;
  }
  if (hasSubtext) {
    contentHtml += `<div style="font-family: ${subtextDefaults.fontFamily}; font-size: ${subtextDefaults.fontSize}px; color: ${subtextDefaults.color}; line-height: ${subtextDefaults.lineHeight}; padding-top: ${question.subtextPaddingTop || 0}px; padding-right: ${question.subtextPaddingRight || 0}px; padding-bottom: ${question.subtextPaddingBottom || 0}px; padding-left: ${question.subtextPaddingLeft || 0}px;">${question.subtext}</div>`;
  }
  contentHtml += '</div>';

  if (!showAccent) return `<div class="question-block">${contentHtml}</div>`;

  return `<div class="question-block" style="display: flex; align-items: stretch;">
    <div style="width: ${accentLine.width}px; min-width: ${accentLine.width}px; background-color: ${accentLine.color}; border-radius: ${accentLine.borderRadius}px; margin-top: ${accentLine.paddingTop || 0}px; margin-right: ${accentLine.paddingRight || 0}px; margin-bottom: ${accentLine.paddingBottom || 0}px; margin-left: ${accentLine.paddingLeft || 0}px; flex-shrink: 0;"></div>
    ${contentHtml}
  </div>`;
}

export function exportHtml(
  settings: ChartSettings,
  _data: DataRow[],
  _columnMapping: ColumnMapping,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  // Get the current SVG from the DOM and embed it directly
  const svgElement = document.querySelector('#chart-container svg');
  let svgMarkup = '';

  if (svgElement) {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Apply export dimensions if provided
    if (options?.width) {
      const origW = parseFloat(clonedSvg.getAttribute('width') || '800');
      const origH = parseFloat(clonedSvg.getAttribute('height') || '600');
      if (!clonedSvg.getAttribute('viewBox')) {
        clonedSvg.setAttribute('viewBox', `0 0 ${origW} ${origH}`);
      }
      clonedSvg.setAttribute('width', String(options.width));
      if (options.height) {
        clonedSvg.setAttribute('height', String(options.height));
      }
    }

    if (options?.transparent) {
      const bgRect = clonedSvg.querySelector('rect:first-child');
      if (bgRect) {
        bgRect.setAttribute('fill', 'none');
        bgRect.setAttribute('fill-opacity', '0');
        bgRect.removeAttribute('opacity');
      }
    }

    // Make SVG responsive
    clonedSvg.setAttribute('width', '100%');
    clonedSvg.style.maxWidth = options?.width ? `${options.width}px` : '100%';
    clonedSvg.style.height = 'auto';

    svgMarkup = new XMLSerializer().serializeToString(clonedSvg);
  }

  const bgColor = options?.transparent ? 'transparent' : settings.layout.backgroundColor;

  // Build question block
  const questionHtml = buildQuestionHtml(settings);
  const questionPosition = settings.question?.position || 'above';
  const isHorizontalQuestion = questionPosition === 'left' || questionPosition === 'right';

  // Build chart area with optional horizontal question
  let chartAreaHtml = '';
  if (isHorizontalQuestion && questionHtml) {
    const questionSide = `<div style="flex-shrink: 0; max-width: 40%;">${questionHtml}</div>`;
    const chartSide = `<div class="chart-area" style="flex: 1; min-width: 0;">${svgMarkup}</div>`;
    chartAreaHtml = `<div style="display: flex; flex-direction: row;">
      ${questionPosition === 'left' ? questionSide : ''}
      ${chartSide}
      ${questionPosition === 'right' ? questionSide : ''}
    </div>`;
  } else {
    chartAreaHtml = `<div class="chart-area">${svgMarkup}</div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(filename)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #chart-wrapper {
      max-width: ${options?.width ? options.width + 'px' : (settings.layout.maxWidth > 0 ? settings.layout.maxWidth + 'px' : '100%')};
      margin: 0 auto;
      background: ${bgColor};
    }
    .header { padding: 20px 24px 0; text-align: ${settings.header.alignment}; }
    .header h2 {
      font-family: ${settings.header.titleStyling.fontFamily};
      font-size: ${settings.header.titleStyling.fontSize}px;
      font-weight: ${settings.header.titleStyling.fontWeight === 'bold' ? 700 : 400};
      color: ${settings.header.titleStyling.color};
      line-height: ${settings.header.titleStyling.lineHeight};
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-family: ${settings.header.subtitleStyling.fontFamily};
      font-size: ${settings.header.subtitleStyling.fontSize}px;
      font-weight: ${settings.header.subtitleStyling.fontWeight === 'bold' ? 700 : 400};
      color: ${settings.header.subtitleStyling.color};
      line-height: ${settings.header.subtitleStyling.lineHeight};
      margin-bottom: 4px;
    }
    .header .text {
      font-family: ${settings.header.textStyling.fontFamily};
      font-size: ${settings.header.textStyling.fontSize}px;
      font-weight: ${settings.header.textStyling.fontWeight === 'bold' ? 700 : 400};
      color: ${settings.header.textStyling.color};
      line-height: ${settings.header.textStyling.lineHeight};
    }
    .chart-area {
      background: ${settings.plotBackground.backgroundColor};
      ${settings.plotBackground.border ? `border: ${settings.plotBackground.borderWidth}px solid ${settings.plotBackground.borderColor};` : ''}
    }
    .chart-area svg { display: block; width: 100%; height: auto; }
    .footer { padding: 8px 24px 16px; text-align: ${settings.footer.alignment}; }
    .footer p { font-size: ${settings.footer.size}px; color: ${settings.footer.color}; margin: 0; }
    .footer .note { font-size: ${settings.footer.size - 1}px; opacity: 0.8; margin-top: 4px; }
  </style>
</head>
<body>
  <div id="chart-wrapper">
    ${settings.header.title || settings.header.subtitle || settings.header.text ? `
    <div class="header"${settings.header.border !== 'none' ? ` style="${settings.header.border === 'top' || settings.header.border === 'both' ? 'border-top: 2px solid #e5e7eb;' : ''}${settings.header.border === 'bottom' || settings.header.border === 'both' ? 'border-bottom: 2px solid #e5e7eb;' : ''}"` : ''}>
      ${settings.header.title ? `<h2>${escHtml(settings.header.title)}</h2>` : ''}
      ${settings.header.subtitle ? `<p class="subtitle">${escHtml(settings.header.subtitle)}</p>` : ''}
      ${settings.header.text ? `<p class="text">${escHtml(settings.header.text)}</p>` : ''}
    </div>` : ''}
    ${questionPosition === 'above' ? questionHtml : ''}
    ${chartAreaHtml}
    ${questionPosition === 'below' ? questionHtml : ''}
    ${settings.footer.sourceName || settings.footer.notePrimary ? `
    <div class="footer"${settings.footer.border !== 'none' ? ` style="${settings.footer.border === 'top' || settings.footer.border === 'both' ? 'border-top: 1px solid #e5e7eb;' : ''}${settings.footer.border === 'bottom' || settings.footer.border === 'both' ? 'border-bottom: 1px solid #e5e7eb;' : ''}"` : ''}>
      ${settings.footer.sourceName ? `<p>${escHtml(settings.footer.sourceLabel)}: ${settings.footer.sourceUrl ? `<a href="${escHtml(settings.footer.sourceUrl)}" target="_blank" rel="noopener">${escHtml(settings.footer.sourceName)}</a>` : escHtml(settings.footer.sourceName)}</p>` : ''}
      ${settings.footer.notePrimary ? `<p class="note">${escHtml(settings.footer.notePrimary)}</p>` : ''}
    </div>` : ''}
  </div>
</body>
</html>`;

  downloadHtml(html, filename);
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
