// ============================================================
// Exports — PDF (jsPDF), Executive Brief (html2canvas), DOCX
// ============================================================

// ── Build the Executive Brief as an HTML string ───────────────
function buildBriefHTML(r) {
  const dateStr = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const P = '28px';
  const s = [];
  const NAVY = '#1A3350',
    RED = '#E74243',
    BLUE = '#4174B9',
    LGRAY = '#F2F4F6',
    BODY = '#191C1E',
    MUTED = '#676766';
  const typeLabel =
    {
      market_analysis: 'Análisis de Mercado',
      strategic_plan: 'Plan Estratégico',
      due_diligence: 'Due Diligence',
      competitive: 'Análisis Competitivo',
      general: 'Informe Estratégico',
    }[currentReportType] || 'Informe Estratégico';

  s.push(
    '<div style="width:660px;background:#fff;overflow:hidden;box-sizing:border-box;font-family:Inter,sans-serif;">'
  );

  // ── Header navy ─────────────────────────────────────────
  s.push(
    '<div style="background:' +
      NAVY +
      ';padding:22px ' +
      P +
      ' 18px;box-sizing:border-box;">'
  );
  s.push('<div style="display:table;width:100%;margin-bottom:14px;">');
  s.push('<div style="display:table-cell;vertical-align:middle;">');
  if (typeof logoBase64 !== 'undefined' && logoBase64) {
    s.push(
      '<img src="data:image/png;base64,' +
        logoBase64 +
        '" style="height:26px;display:block;" />'
    );
  } else {
    s.push(
      '<div style="font-size:13px;font-weight:900;color:' +
        RED +
        ';letter-spacing:2px;">ALTO</div>'
    );
  }
  s.push('</div>');
  s.push('<div style="display:table-cell;vertical-align:middle;text-align:right;">');
  s.push(
    '<div style="color:' +
      RED +
      ';font-size:8px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:3px;">' +
      typeLabel +
      '</div>'
  );
  s.push('<div style="color:' + MUTED + ';font-size:8px;">' + dateStr + '</div>');
  s.push('</div></div>');
  s.push(
    '<div style="height:1px;background:rgba(255,255,255,0.12);margin-bottom:12px;"></div>'
  );
  s.push(
    '<div style="color:#fff;font-size:19px;font-weight:800;line-height:1.25;word-wrap:break-word;">' +
      esc(r.title) +
      '</div>'
  );
  if (r.subtitle) {
    s.push(
      '<div style="color:#8192A7;font-size:10px;margin-top:5px;font-style:italic;word-wrap:break-word;">' +
        esc(r.subtitle) +
        '</div>'
    );
  }
  s.push('</div>');
  s.push('<div style="height:4px;background:' + RED + ';"></div>');

  // ── Two columns: Exec Summary + Key Messages | KPI stat boxes ─
  s.push(
    '<div style="display:table;width:100%;padding:18px ' + P + ' 0;box-sizing:border-box;">'
  );

  // Left column
  s.push('<div style="display:table-cell;width:57%;padding-right:14px;vertical-align:top;">');
  s.push(
    '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
      RED +
      ';font-weight:800;margin-bottom:7px;">Resumen Ejecutivo</div>'
  );
  s.push(
    '<div style="font-size:10px;color:' +
      BODY +
      ';line-height:1.65;font-style:italic;word-wrap:break-word;">' +
      esc(r.executive_summary || '') +
      '</div>'
  );

  const keyMsgs = (r.key_messages || []).slice(0, 3);
  if (keyMsgs.length) {
    s.push(
      '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
        NAVY +
        ';font-weight:800;margin:12px 0 7px;">Mensajes Clave</div>'
    );
    keyMsgs.forEach(m => {
      s.push('<div style="display:table;width:100%;margin-bottom:5px;">');
      s.push(
        '<div style="display:table-cell;width:14px;color:' +
          RED +
          ';font-weight:900;font-size:10px;vertical-align:top;padding-top:1px;">▸</div>'
      );
      s.push(
        '<div style="display:table-cell;font-size:9.5px;color:' +
          BODY +
          ';line-height:1.45;word-wrap:break-word;">' +
          esc(m) +
          '</div>'
      );
      s.push('</div>');
    });
  }
  s.push('</div>');

  // Right column: KPI stat boxes
  s.push('<div style="display:table-cell;width:43%;vertical-align:top;">');
  const kpis = (r.kpis || []).slice(0, 4);
  if (kpis.length) {
    s.push(
      '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
        NAVY +
        ';font-weight:800;margin-bottom:7px;">KPIs</div>'
    );
    kpis.forEach((k, i) => {
      const accent = i % 2 === 0 ? NAVY : RED;
      s.push(
        '<div style="background:' +
          LGRAY +
          ';border-left:3px solid ' +
          accent +
          ';padding:8px 10px;margin-bottom:6px;word-wrap:break-word;">'
      );
      s.push(
        '<div style="font-size:18px;font-weight:900;color:' +
          accent +
          ';line-height:1;">' +
          esc(k.value || k.metric || '—') +
          '</div>'
      );
      s.push(
        '<div style="font-size:8px;color:' +
          MUTED +
          ';margin-top:2px;">' +
          esc(k.label || k.name || k.metric || '') +
          '</div>'
      );
      if (k.trend || k.delta) {
        const t = k.trend || k.delta;
        s.push(
          '<div style="font-size:8px;font-weight:700;color:' +
            (String(t).startsWith('-') ? RED : '#16a34a') +
            ';margin-top:2px;">' +
            esc(t) +
            '</div>'
        );
      }
      s.push('</div>');
    });
  } else {
    const stats = [
      { v: String((r.findings || []).length), l: 'Hallazgos identificados', c: NAVY },
      { v: String((r.risks || []).length), l: 'Riesgos detectados', c: RED },
      { v: String((r.opportunities || []).length), l: 'Oportunidades', c: BLUE },
    ];
    stats.forEach(st => {
      s.push(
        '<div style="background:' +
          LGRAY +
          ';border-left:3px solid ' +
          st.c +
          ';padding:8px 10px;margin-bottom:6px;">'
      );
      s.push(
        '<div style="font-size:20px;font-weight:900;color:' + st.c + ';line-height:1;">' + st.v + '</div>'
      );
      s.push(
        '<div style="font-size:8px;color:' + MUTED + ';margin-top:2px;">' + st.l + '</div>'
      );
      s.push('</div>');
    });
  }
  s.push('</div>');
  s.push('</div>'); // end two-col

  // ── Top Findings ────────────────────────────────────────
  const findings = (r.findings || []).slice(0, 3);
  if (findings.length) {
    const colW =
      findings.length === 1 ? '100%' : findings.length === 2 ? '49.5%' : '32.5%';
    s.push('<div style="padding:16px ' + P + ' 0;box-sizing:border-box;">');
    s.push(
      '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
        NAVY +
        ';font-weight:800;margin-bottom:8px;">Hallazgos Principales</div>'
    );
    s.push(
      '<table style="width:100%;border-collapse:separate;border-spacing:5px 0;table-layout:fixed;"><tr style="vertical-align:top;">'
    );
    findings.forEach((f, i) => {
      const accent = i === 0 ? RED : NAVY;
      s.push(
        '<td style="width:' +
          colW +
          ';vertical-align:top;background:' +
          LGRAY +
          ';border-top:3px solid ' +
          accent +
          ';padding:10px;word-wrap:break-word;">'
      );
      s.push(
        '<div style="font-size:9px;font-weight:800;color:' + accent + ';margin-bottom:3px;">' + (i + 1) + '</div>'
      );
      s.push(
        '<div style="font-size:9px;font-weight:700;color:' +
          NAVY +
          ';margin-bottom:4px;line-height:1.35;word-wrap:break-word;">' +
          esc(f.finding || '') +
          '</div>'
      );
      if (f.business_implication) {
        s.push(
          '<div style="font-size:8px;color:' +
            MUTED +
            ';line-height:1.4;word-wrap:break-word;">' +
            esc(f.business_implication) +
            '</div>'
        );
      }
      s.push('</td>');
    });
    s.push('</tr></table></div>');
  }

  // ── Recommendations — 3 horizons ────────────────────────
  if (r.recommendations) {
    const horizons = [
      { key: 'short_term', label: 'Corto Plazo', color: RED },
      { key: 'medium_term', label: 'Mediano Plazo', color: NAVY },
      { key: 'long_term', label: 'Largo Plazo', color: BLUE },
    ];
    const hasRec = horizons.some(h => (r.recommendations[h.key] || []).length > 0);
    if (hasRec) {
      s.push('<div style="padding:16px ' + P + ' 0;box-sizing:border-box;">');
      s.push(
        '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
          NAVY +
          ';font-weight:800;margin-bottom:8px;">Recomendaciones Estratégicas</div>'
      );
      s.push(
        '<table style="width:100%;border-collapse:separate;border-spacing:5px 0;table-layout:fixed;"><tr style="vertical-align:top;">'
      );
      horizons.forEach(h => {
        const items = (r.recommendations[h.key] || []).slice(0, 2);
        if (!items.length) return;
        s.push('<td style="vertical-align:top;word-wrap:break-word;">');
        s.push(
          '<div style="background:' +
            h.color +
            ';color:#fff;font-size:7px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:4px 8px;margin-bottom:5px;">' +
            h.label +
            '</div>'
        );
        items.forEach((rec, i) => {
          s.push('<div style="display:table;width:100%;margin-bottom:4px;">');
          s.push('<div style="display:table-cell;width:16px;vertical-align:top;">');
          s.push(
            '<div style="background:' +
              h.color +
              ';color:#fff;font-size:8px;font-weight:800;text-align:center;width:14px;height:14px;line-height:14px;">' +
              (i + 1) +
              '</div>'
          );
          s.push('</div>');
          s.push(
            '<div style="display:table-cell;vertical-align:top;padding-left:5px;font-size:8.5px;color:' +
              BODY +
              ';line-height:1.4;word-wrap:break-word;">' +
              esc(rec.action || rec) +
              '</div>'
          );
          s.push('</div>');
        });
        s.push('</td>');
      });
      s.push('</tr></table></div>');
    }
  }

  // ── Conclusion ──────────────────────────────────────────
  const conclusion = r.conclusion || '';
  if (conclusion) {
    s.push('<div style="padding:16px ' + P + ' 0;box-sizing:border-box;">');
    s.push('<div style="display:table;width:100%;">');
    s.push(
      '<div style="display:table-cell;width:4px;background:' +
        NAVY +
        ';vertical-align:top;"> </div>'
    );
    s.push(
      '<div style="display:table-cell;background:' +
        LGRAY +
        ';padding:11px 14px;word-wrap:break-word;">'
    );
    s.push(
      '<div style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:' +
        NAVY +
        ';font-weight:800;margin-bottom:5px;">Conclusión Ejecutiva</div>'
    );
    s.push(
      '<div style="font-size:10px;color:' +
        NAVY +
        ';line-height:1.55;font-weight:600;font-style:italic;word-wrap:break-word;">' +
        esc(conclusion) +
        '</div>'
    );
    s.push('</div></div></div>');
  }

  // ── Footer ──────────────────────────────────────────────
  s.push(
    '<div style="margin-top:16px;padding:10px ' +
      P +
      ';background:' +
      NAVY +
      ';display:table;width:100%;box-sizing:border-box;">'
  );
  s.push('<div style="display:table-cell;vertical-align:middle;">');
  if (typeof logoBase64 !== 'undefined' && logoBase64) {
    s.push(
      '<img src="data:image/png;base64,' +
        logoBase64 +
        '" style="height:18px;display:block;opacity:0.8;" />'
    );
  } else {
    s.push(
      '<span style="font-size:10px;font-weight:900;color:#fff;letter-spacing:2px;">ALTO</span>'
    );
  }
  s.push('</div>');
  s.push(
    '<div style="display:table-cell;text-align:right;vertical-align:middle;font-size:8px;color:#8192A7;font-style:italic;">Confidencial · ' +
      typeLabel +
      '</div>'
  );
  s.push('</div>');

  s.push('</div>');
  return s.join('');
}

// ── Download Executive Brief as PDF ──────────────────────────
async function downloadBrief() {
  if (!result) return;
  showStatus('Generando Executive Brief...');
  try {
    await Promise.all([loadLib('html2canvas'), loadLib('jspdf')]);
    // Render inside an iframe with exact viewport so html2canvas sees full width
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:660px;height:2000px;border:none;';
    document.body.appendChild(iframe);
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    iDoc.open();
    iDoc.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
        '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#fff;width:660px;overflow:hidden}</style>' +
        '</head><body>' +
        buildBriefHTML(result) +
        '</body></html>'
    );
    iDoc.close();

    // Wait for fonts to load
    await new Promise(r => setTimeout(r, 600));

    // Measure real content height and resize iframe to fit exactly
    const contentH = iDoc.body.firstElementChild.offsetHeight;
    iframe.style.height = contentH + 2 + 'px';
    iDoc.body.style.height = contentH + 2 + 'px';
    iDoc.body.style.width = '660px';

    const canvas = await html2canvas(iDoc.body, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true,
      logging: false,
      width: 660,
      height: contentH + 2,
      windowWidth: 660,
      scrollX: 0,
      scrollY: 0,
    });
    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pxW = canvas.width,
      pxH = canvas.height;
    const pdfW = 210,
      pdfH = Math.round((pxH * pdfW) / pxW);
    const pdf = new jsPDF('p', 'mm', [pdfW, pdfH]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save('Brief_ALTO_' + new Date().toISOString().slice(0, 10) + '.pdf');
    flash('✓ Executive Brief descargado');
  } catch (err) {
    showError('Error Brief: ' + err.message);
  }
}

// ── Download DOCX (Word) ──────────────────────────────────────
async function downloadDocx() {
  if (!result) return;
  showStatus('Generando documento Word ALTO...');
  try {
    await loadLib('docx');
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      AlignmentType,
      BorderStyle,
      WidthType,
      ShadingType,
      Header,
      Footer,
      PageNumber,
      PageBreak,
      ImageRun,
    } = docx;

    const A = ALTO;
    const noBdr = { style: BorderStyle.NONE, size: 0, color: A.WHITE };
    const noBorders = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr };
    const children = [];
    const sp = n => new Paragraph({ spacing: { after: n || 120 }, children: [] });

    // ── Helper: navy left-bar box ──
    function govBox(t) {
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [200, 9160],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                shading: { fill: A.NAVY, type: ShadingType.CLEAR },
                width: { size: 200, type: WidthType.DXA },
                children: [new Paragraph({ children: [] })],
              }),
              new TableCell({
                borders: noBorders,
                shading: { fill: A.LGRAY, type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                width: { size: 9160, type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: t, font: 'Calibri', size: 21, bold: true, color: A.NAVY }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    // ── Helper: gray box with label ──
    function grayBox(l, t) {
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                shading: { fill: A.LGRAY, type: ShadingType.CLEAR },
                margins: { top: 160, bottom: 160, left: 200, right: 200 },
                width: { size: 9360, type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { after: 60 },
                    children: [
                      new TextRun({ text: l, font: 'Calibri', size: 16, bold: true, color: A.BLUE }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: t,
                        font: 'Calibri',
                        size: 22,
                        italics: true,
                        color: A.DGRAY,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    // ── Helper: section heading ──
    function secH(t) {
      return [
        new Paragraph({
          spacing: { before: 360, after: 100 },
          children: [
            new TextRun({
              text: t.toUpperCase(),
              font: 'Calibri',
              size: 24,
              bold: true,
              color: A.NAVY,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A.MGRAY, space: 1 } },
          children: [],
        }),
      ];
    }

    // ── Helper: bullet row ──
    function blt(t, c) {
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [360, 9000],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                width: { size: 360, type: WidthType.DXA },
                margins: { top: 40, bottom: 40, left: 80, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: '\u25B8', font: 'Calibri', size: 20, color: c || A.RED }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: noBorders,
                width: { size: 9000, type: WidthType.DXA },
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: A.DGRAY })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    // ── Helper: "So what?" box ──
    function swBox(t) {
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: A.RED },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: A.RED },
                  left: { style: BorderStyle.SINGLE, size: 4, color: A.RED },
                  right: { style: BorderStyle.SINGLE, size: 1, color: A.RED },
                },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
                width: { size: 9360, type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'So what?  ',
                        font: 'Calibri',
                        size: 20,
                        bold: true,
                        color: A.RED,
                      }),
                      new TextRun({ text: t, font: 'Calibri', size: 20, italics: true, color: A.SGRAY }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    // ── Helper: numbered step ──
    function numS(n, t) {
      return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 8760],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                shading: { fill: A.NAVY, type: ShadingType.CLEAR },
                width: { size: 600, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: String(n),
                        font: 'Calibri',
                        size: 22,
                        bold: true,
                        color: A.WHITE,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: noBorders,
                shading: { fill: A.LGRAY, type: ShadingType.CLEAR },
                width: { size: 8760, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: A.DGRAY })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    // ── Cover ──────────────────────────────────────────────
    children.push(sp(1200));
    if (logoBase64) {
      try {
        const logoBytes = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
        children.push(
          new Paragraph({
            children: [
              new ImageRun({ data: logoBytes, transformation: { width: 200, height: 79 }, type: 'png' }),
            ],
          })
        );
      } catch (e) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'ALTO', font: 'Calibri', size: 40, bold: true, color: A.RED })],
          })
        );
      }
    }
    children.push(sp(400));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: result.title, font: 'Calibri', size: 56, bold: true, color: A.NAVY }),
        ],
      })
    );
    if (result.subtitle) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: result.subtitle,
              font: 'Calibri',
              size: 28,
              italics: true,
              color: A.SGRAY,
            }),
          ],
        })
      );
    }
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: A.RED, space: 1 } },
        children: [],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'CONFIDENCIAL', font: 'Calibri', size: 18, bold: true, color: A.NAVY }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: new Date().toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            font: 'Calibri',
            size: 20,
            color: A.SGRAY,
          }),
        ],
      })
    );
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // ── Sections ───────────────────────────────────────────
    children.push(...secH('Resumen Ejecutivo'));
    children.push(grayBox('RESUMEN EJECUTIVO', result.executive_summary));
    children.push(sp(200));

    if (result.key_messages?.length) {
      children.push(...secH('Mensajes Clave'));
      result.key_messages.forEach(m => children.push(blt(m)));
      children.push(sp(200));
    }

    if (result.context) {
      children.push(...secH('Contexto y Objetivo'));
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: result.context, font: 'Calibri', size: 21, color: A.DGRAY })],
        })
      );
    }

    if (result.findings?.length) {
      children.push(...secH('Hallazgos Clave'));
      result.findings.forEach((f, i) => {
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 60 },
            children: [
              new TextRun({
                text: `${i + 1}. ${f.finding}`,
                font: 'Calibri',
                size: 22,
                bold: true,
                color: A.NAVY,
              }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: 'Evidencia: ', font: 'Calibri', size: 20, bold: true, color: A.SGRAY }),
              new TextRun({ text: f.evidence, font: 'Calibri', size: 20, color: A.SGRAY }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'Implicancia: ', font: 'Calibri', size: 20, bold: true, color: A.RED }),
              new TextRun({ text: f.business_implication, font: 'Calibri', size: 20, color: A.BODY }),
            ],
          })
        );
      });
      children.push(sp(200));
    }

    if (result.analysis_blocks?.length) {
      result.analysis_blocks.forEach((blk, i) => {
        children.push(...secH(`${i + 1}. ${blk.heading}`));
        if (blk.governing_thought) {
          children.push(govBox(blk.governing_thought));
          children.push(sp(160));
        }
        if (blk.content) {
          children.push(
            new Paragraph({
              spacing: { after: 160 },
              children: [new TextRun({ text: blk.content, font: 'Calibri', size: 21, color: A.DGRAY })],
            })
          );
        }
        if (blk.bullets?.length) {
          blk.bullets.forEach(b => children.push(blt(b)));
          children.push(sp(80));
        }
        if (blk.so_what) {
          children.push(swBox(blk.so_what));
          children.push(sp(200));
        }
      });
    }

    if (result.risks?.length) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(...secH('Riesgos'));
      result.risks.forEach(rk => {
        children.push(
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: {
                      top: noBdr,
                      bottom: noBdr,
                      left: { style: BorderStyle.SINGLE, size: 4, color: A.RED },
                      right: noBdr,
                    },
                    margins: { top: 100, bottom: 100, left: 160, right: 160 },
                    width: { size: 9360, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: rk.risk,
                            font: 'Calibri',
                            size: 21,
                            bold: true,
                            color: A.RED,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: rk.implication, font: 'Calibri', size: 20, color: A.SGRAY }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
        children.push(sp(100));
      });
      children.push(sp(200));
    }

    if (result.opportunities?.length) {
      children.push(...secH('Oportunidades'));
      result.opportunities.forEach(o => children.push(blt(o, '2E8B57')));
      children.push(sp(200));
    }

    if (result.recommendations) {
      children.push(...secH('Recomendaciones'));
      [
        { key: 'short_term', label: 'CORTO PLAZO' },
        { key: 'medium_term', label: 'MEDIANO PLAZO' },
        { key: 'long_term', label: 'LARGO PLAZO' },
      ].forEach(hz => {
        const items = result.recommendations[hz.key];
        if (!items?.length) return;
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: hz.label, font: 'Calibri', size: 20, bold: true, color: A.BLUE }),
            ],
          })
        );
        items.forEach((rec, i) => {
          children.push(numS(i + 1, rec.action));
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: rec.rationale,
                  font: 'Calibri',
                  size: 19,
                  color: A.SGRAY,
                  italics: true,
                }),
              ],
            })
          );
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              indent: { left: 720 },
              children: [
                new TextRun({ text: 'Impacto: ', font: 'Calibri', size: 19, bold: true, color: A.RED }),
                new TextRun({ text: rec.impact, font: 'Calibri', size: 19, color: A.BODY }),
              ],
            })
          );
        });
      });
      children.push(sp(200));
    }

    if (result.information_gaps?.length) {
      children.push(...secH('Información Faltante'));
      result.information_gaps.forEach(g => children.push(blt(g, '999999')));
      children.push(sp(200));
    }

    if (result.conclusion) {
      children.push(...secH('Conclusión Ejecutiva'));
      children.push(grayBox('CONCLUSIÓN', result.conclusion));
    }

    // ── Assemble document ───────────────────────────────────
    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A.RED, space: 4 } },
                  children: [
                    new TextRun({
                      text: 'CONFIDENCIAL  |  ',
                      font: 'Calibri',
                      size: 14,
                      color: '999999',
                    }),
                    new TextRun({ text: 'ALTO', font: 'Calibri', size: 14, bold: true, color: A.RED }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: { top: { style: BorderStyle.SINGLE, size: 1, color: A.MGRAY, space: 4 } },
                  children: [
                    new TextRun({ text: 'Página ', font: 'Calibri', size: 16, color: '999999' }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: 'Calibri',
                      size: 16,
                      color: '999999',
                    }),
                  ],
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Informe_ALTO_' + new Date().toISOString().slice(0, 10) + '.docx';
    a.click();
    URL.revokeObjectURL(url);
    flash('✓ Documento ALTO descargado');
  } catch (err) {
    console.error(err);
    showError('Error DOCX: ' + err.message);
  }
}
