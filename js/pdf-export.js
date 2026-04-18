// ============================================================
// PDF + MARKDOWN EXPORT
// Depends on: state.js, lib-loader.js (loadLib), ui-helpers.js, preview.js
// ============================================================

// ============================================================
// EXPORT: MARKDOWN
// ============================================================
function copyMarkdown() {
  if (!result) return;
  let md = `# ${result.title}\n*${result.subtitle || ''}*\n\n---\n\n## Resumen Ejecutivo\n\n> ${result.executive_summary}\n\n`;
  if (result.key_messages?.length) {
    md += `### Mensajes Clave\n\n`;
    result.key_messages.forEach(m => {
      md += `- ${m}\n`;
    });
    md += `\n`;
  }
  if (result.context) md += `## Contexto\n\n${result.context}\n\n`;
  if (result.findings?.length) {
    md += `## Hallazgos\n\n`;
    result.findings.forEach((f, i) => {
      md += `### ${i + 1}. ${f.finding}\n- **Evidencia:** ${f.evidence}\n- **Implicancia:** ${f.business_implication}\n\n`;
    });
  }
  if (result.analysis_blocks?.length) {
    result.analysis_blocks.forEach((s, i) => {
      md += `## ${i + 1}. ${s.heading}\n\n`;
      if (s.governing_thought) md += `**${s.governing_thought}**\n\n`;
      if (s.content) md += `${s.content}\n\n`;
      s.bullets?.forEach(b => {
        md += `- ${b}\n`;
      });
      if (s.so_what) md += `\n> **So what?** *${s.so_what}*\n`;
      md += `\n`;
    });
  }
  if (result.risks?.length) {
    md += `## Riesgos\n\n`;
    result.risks.forEach(r => {
      md += `- **${r.risk}**: ${r.implication}\n`;
    });
    md += `\n`;
  }
  if (result.opportunities?.length) {
    md += `## Oportunidades\n\n`;
    result.opportunities.forEach(o => {
      md += `- ${o}\n`;
    });
    md += `\n`;
  }
  if (result.recommendations) {
    md += `## Recomendaciones\n\n`;
    ['short_term', 'medium_term', 'long_term'].forEach(h => {
      const l = { short_term: 'Corto', medium_term: 'Mediano', long_term: 'Largo' }[h];
      const items = result.recommendations[h];
      if (!items?.length) return;
      md += `### ${l} Plazo\n\n`;
      items.forEach((r, i) => {
        md += `${i + 1}. **${r.action}** — ${r.rationale} *(${r.impact})*\n`;
      });
      md += `\n`;
    });
  }
  if (result.conclusion) md += `---\n\n## Conclusión\n\n${result.conclusion}\n`;
  navigator.clipboard.writeText(md);
  flash('✓ Markdown copiado');
}

// ============================================================
// PDF EXPORT
// ============================================================
async function downloadPdf() {
  if (!result) return;
  showStatus('Generando PDF...');
  try {
    await loadLib('jspdf');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const r = result;
    const W = 210,
      H = 297;
    const ML = 18,
      MR = 18,
      MT = 22,
      MB = 22;
    const CW = W - ML - MR;
    let y = 0;
    const NAVY = '#1A3350',
      RED = '#E74243',
      BLUE = '#4174B9',
      BODY = '#44474C',
      SGRAY = '#676766',
      LGRAY = '#F2F4F6',
      MGRAY = '#BFC4C5';
    const SIDEBAR_W = 52;
    const CONTENT_X = SIDEBAR_W + 14;
    const CONTENT_W = W - CONTENT_X - MR;

    // Track page where each analysis block starts (for TOC)
    const tocEntries = [];
    let currentPage = 1;

    function checkPage(need) {
      if (y + need > H - MB) {
        pdf.addPage();
        currentPage++;
        y = MT;
        return true;
      }
      return false;
    }
    function drawRect(x, ry, w, h, color) {
      pdf.setFillColor(color);
      pdf.rect(x, ry, w, h, 'F');
    }
    function wrapText(text, maxW) {
      return pdf.splitTextToSize(text || '', maxW);
    }
    function drawWrapped(text, x, maxW, fontSize, color, style, lineH) {
      lineH = lineH || 5.5;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', style || 'normal');
      pdf.setTextColor(color);
      const lines = wrapText(text, maxW);
      lines.forEach(line => {
        checkPage(lineH + 1);
        pdf.text(line, x, y);
        y += lineH;
      });
      return lines.length;
    }
    function sectionHeader(num, label) {
      checkPage(22);
      drawRect(ML, y, CW, 0.6, RED);
      y += 6;
      if (num !== null) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(RED);
        pdf.text(String(num).padStart(2, '0'), ML, y);
      }
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(NAVY);
      pdf.text(label, ML + (num !== null ? 10 : 0), y);
      y += 10;
    }

    const dateStr = new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const monthYear = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });

    // ================================================================
    // PAGE 1 — COVER
    // ================================================================
    // Navy sidebar
    drawRect(0, 0, SIDEBAR_W, H, NAVY);

    // Logo on sidebar
    if (typeof logoBase64 !== 'undefined' && logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', 10, 20, 32, 32);
      } catch (e) {
        console.warn('PDF logo embed failed:', e.message);
      }
    }

    // Sidebar bottom text
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#8899AA');
    pdf.text('ALTO Strategy', 10, H - 40);
    pdf.text(dateStr, 10, H - 34);

    // CONFIDENCIAL badge on sidebar
    drawRect(8, H - 26, 36, 8, RED);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#FFFFFF');
    pdf.text('CONFIDENCIAL', 10, H - 21);

    // Right side content
    const titleX = CONTENT_X;
    const titleW = CONTENT_W;

    // Red accent line
    drawRect(titleX, 80, 40, 1.2, RED);

    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(NAVY);
    const titleLines = wrapText(r.title, titleW);
    let ty = 92;
    titleLines.forEach(line => {
      pdf.text(line, titleX, ty);
      ty += 11;
    });

    // Subtitle
    if (r.subtitle) {
      ty += 4;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(SGRAY);
      const subLines = wrapText(r.subtitle, titleW);
      subLines.forEach(line => {
        pdf.text(line, titleX, ty);
        ty += 6;
      });
    }

    // Red accent line below subtitle
    ty += 8;
    drawRect(titleX, ty, 40, 1.2, RED);
    ty += 14;

    // Prepared by
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(SGRAY);
    pdf.text('Preparado por:', titleX, ty);
    ty += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(NAVY);
    pdf.text('ALTO Strategy', titleX, ty);
    ty += 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(SGRAY);
    pdf.text(dateStr, titleX, ty);

    // BORRADOR watermark
    pdf.setFontSize(50);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(RED);
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: 0.08 }));
    pdf.text('BORRADOR', W / 2 + 20, H / 2, { align: 'center', angle: 45 });
    pdf.restoreGraphicsState();

    // ================================================================
    // PAGE 2 — TABLE OF CONTENTS
    // ================================================================
    pdf.addPage();
    currentPage++;
    y = MT;

    // Header rule
    drawRect(0, 0, W, 1.2, NAVY);

    y = 35;
    drawRect(ML, y, 1.5, 8, RED);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(NAVY);
    pdf.text('CONTENIDO', ML + 6, y + 6);
    y += 22;

    // Build TOC entries - we'll fill page numbers later
    // For now, record sections and estimate
    const tocSections = [];
    let tocNum = 1;
    if (r.executive_summary) tocSections.push({ num: tocNum++, label: 'Resumen Ejecutivo' });
    if (r.key_messages?.length) tocSections.push({ num: tocNum++, label: 'Mensajes Clave' });
    if (r.context) tocSections.push({ num: tocNum++, label: 'Contexto' });
    if (r.analysis_blocks?.length) {
      r.analysis_blocks.forEach((s, i) => {
        tocSections.push({ num: tocNum++, label: s.heading });
      });
    }
    if (r.findings?.length) tocSections.push({ num: tocNum++, label: 'Hallazgos' });
    if (r.risks?.length) tocSections.push({ num: tocNum++, label: 'Riesgos' });
    if (r.opportunities?.length) tocSections.push({ num: tocNum++, label: 'Oportunidades' });
    if (r.recommendations) tocSections.push({ num: tocNum++, label: 'Recomendaciones' });
    if (r.information_gaps?.length)
      tocSections.push({ num: tocNum++, label: 'Brechas de Informacion' });
    if (r.conclusion) tocSections.push({ num: tocNum++, label: 'Conclusion' });

    tocSections.forEach((item, idx) => {
      const numStr = String(item.num).padStart(2, '0');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(RED);
      pdf.text(numStr, ML, y);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(NAVY);
      pdf.text(item.label, ML + 12, y);
      // Dotted leader line
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(MGRAY);
      const labelW = pdf.getTextWidth(item.label);
      const dotsX = ML + 12 + labelW + 3;
      const dotsEnd = W - MR - 8;
      let dots = '';
      pdf.setFontSize(8);
      while (pdf.getTextWidth(dots + '.') < dotsEnd - dotsX) {
        dots += ' .';
      }
      if (dots) pdf.text(dots, dotsX, y);
      y += 8;
    });

    // ================================================================
    // PAGE 3+ — CONTENT
    // ================================================================
    pdf.addPage();
    currentPage++;
    y = MT;

    let secNum = 1;

    // ── Executive Summary ──────────────────────────────────────
    if (r.executive_summary) {
      sectionHeader(null, 'RESUMEN EJECUTIVO');
      // Pre-measure
      pdf.setFontSize(10);
      const exLines = wrapText(r.executive_summary, CW - 16);
      const exH = 14 + exLines.length * 5.5 + 8;
      checkPage(exH);
      drawRect(ML, y - 4, 2, exH, RED);
      drawRect(ML + 2, y - 4, CW - 2, exH, LGRAY);
      // Label
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(RED);
      pdf.text('RESUMEN EJECUTIVO', ML + 8, y + 2);
      y += 10;
      // Body
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(NAVY);
      exLines.forEach(line => {
        checkPage(5.5);
        pdf.text(line, ML + 8, y);
        y += 5.5;
      });
      y += 14;
      secNum++;
    }

    // ── Key Messages ───────────────────────────────────────────
    if (r.key_messages?.length) {
      sectionHeader(secNum, 'MENSAJES CLAVE');
      secNum++;
      r.key_messages.forEach((m, idx) => {
        pdf.setFontSize(9);
        const mLines = wrapText(m, CW - 20);
        const cardH = mLines.length * 5 + 8;
        checkPage(cardH + 4);
        // Card background
        const accent = idx % 2 === 0 ? NAVY : RED;
        drawRect(ML, y - 3, 2, cardH, accent);
        drawRect(ML + 2, y - 3, CW - 2, cardH, LGRAY);
        // Number circle
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(accent);
        pdf.text(String(idx + 1), ML + 7, y + 2);
        // Message text
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(BODY);
        let my = y + 2;
        mLines.forEach(line => {
          pdf.text(line, ML + 14, my);
          my += 5;
        });
        y += cardH + 5;
      });
      y += 8;
    }

    // ── Context ────────────────────────────────────────────────
    if (r.context) {
      sectionHeader(secNum, 'CONTEXTO');
      secNum++;
      drawWrapped(r.context, ML, CW, 9.5, BODY, 'normal', 5.5);
      y += 12;
    }

    // ── Analysis Blocks ────────────────────────────────────────
    if (r.analysis_blocks?.length) {
      r.analysis_blocks.forEach((s, i) => {
        // Start each analysis block on a new page for clean layout
        if (i > 0 || y > MT + 20) {
          pdf.addPage();
          currentPage++;
          y = MT;
        }

        // Section header with number + red accent bar
        checkPage(24);
        drawRect(ML, y, CW, 0.6, RED);
        y += 6;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(RED);
        pdf.text(String(secNum).padStart(2, '0') + ' | ANALISIS', ML, y);
        secNum++;
        y += 4;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(NAVY);
        const hLines = wrapText(s.heading, CW - 4);
        hLines.forEach(line => {
          pdf.text(line, ML, y);
          y += 7;
        });
        y += 6;

        // Governing thought — navy background box with white text
        if (s.governing_thought) {
          checkPage(18);
          pdf.setFontSize(9);
          const gtLines = wrapText(s.governing_thought, CW - 16);
          const gtH = gtLines.length * 5 + 10;
          drawRect(ML, y - 3, CW, gtH, NAVY);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor('#FFFFFF');
          let gty = y + 2;
          gtLines.forEach(line => {
            pdf.text(line, ML + 8, gty);
            gty += 5;
          });
          y += gtH + 6;
        }

        // Content
        if (s.content) {
          checkPage(10);
          drawWrapped(s.content, ML, CW, 9.5, BODY, 'normal', 5.5);
          y += 8;
        }

        // Bullets with red arrow markers
        if (s.bullets?.length) {
          y += 2;
          s.bullets.forEach(b => {
            checkPage(8);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(RED);
            pdf.text('>', ML + 3, y);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(BODY);
            const bLines = wrapText(b, CW - 12);
            bLines.forEach(line => {
              checkPage(5);
              pdf.text(line, ML + 9, y);
              y += 5;
            });
            y += 3;
          });
          y += 4;
        }

        // SO WHAT box
        if (s.so_what) {
          y += 3;
          checkPage(16);
          pdf.setFontSize(9);
          const swLines = wrapText(s.so_what, CW - 18);
          const swH = swLines.length * 5 + 14;
          drawRect(ML, y - 3, 2.5, swH, RED);
          drawRect(ML + 2.5, y - 3, CW - 2.5, swH, '#FFF5F5');
          // Label
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(RED);
          pdf.text('SO WHAT?', ML + 8, y + 3);
          y += 10;
          // Text
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor('#475569');
          swLines.forEach(line => {
            checkPage(5);
            pdf.text(line, ML + 8, y);
            y += 5;
          });
          y += 12;
        }
      });
    }

    // ── Findings ───────────────────────────────────────────────
    if (r.findings?.length) {
      pdf.addPage();
      currentPage++;
      y = MT;
      sectionHeader(secNum, 'HALLAZGOS');
      secNum++;
      r.findings.forEach((f, i) => {
        // Pre-measure
        pdf.setFontSize(9);
        const fLines = wrapText(f.finding, CW - 18);
        let fH = fLines.length * 5 + 6;
        if (f.evidence) {
          pdf.setFontSize(8.5);
          fH += 8 + wrapText(f.evidence, CW - 18).length * 4.5;
        }
        if (f.business_implication) {
          pdf.setFontSize(8.5);
          fH += 8 + wrapText(f.business_implication, CW - 18).length * 4.5;
        }
        fH += 6;
        checkPage(fH + 6);

        const fX = ML + 10;
        // Number badge
        drawRect(ML, y - 3, 8, 8, NAVY);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#FFFFFF');
        pdf.text(String(i + 1), ML + 4, y + 2, { align: 'center' });
        // Card background
        drawRect(fX, y - 3, CW - 10, fH, LGRAY);
        drawRect(fX, y - 3 + fH - 0.5, CW - 10, 0.5, RED);

        // Finding text
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(NAVY);
        fLines.forEach(line => {
          pdf.text(line, fX + 4, y);
          y += 5;
        });
        y += 3;

        if (f.evidence) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(SGRAY);
          pdf.text('EVIDENCIA', fX + 4, y);
          y += 5;
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(BODY);
          const evLines = wrapText(f.evidence, CW - 18);
          evLines.forEach(line => {
            checkPage(4.5);
            pdf.text(line, fX + 4, y);
            y += 4.5;
          });
          y += 3;
        }
        if (f.business_implication) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(RED);
          pdf.text('IMPLICANCIA DE NEGOCIO', fX + 4, y);
          y += 5;
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(RED);
          const impLines = wrapText(f.business_implication, CW - 18);
          impLines.forEach(line => {
            checkPage(4.5);
            pdf.text(line, fX + 4, y);
            y += 4.5;
          });
        }
        y += 10;
      });
      y += 6;
    }

    // ── Risks ──────────────────────────────────────────────────
    if (r.risks?.length) {
      checkPage(30);
      sectionHeader(secNum, 'RIESGOS');
      secNum++;
      r.risks.forEach(rk => {
        pdf.setFontSize(9);
        const rkLines = wrapText(rk.risk, CW - 12);
        pdf.setFontSize(8.5);
        const impLines = wrapText(rk.implication || '', CW - 12);
        const boxH = rkLines.length * 5 + impLines.length * 5 + 14;
        checkPage(boxH + 4);
        drawRect(ML, y - 3, 2.5, boxH, RED);
        drawRect(ML + 2.5, y - 3, CW - 2.5, boxH, '#FFF5F5');
        // Risk title
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(RED);
        rkLines.forEach(line => {
          pdf.text(line, ML + 8, y);
          y += 5;
        });
        y += 4;
        // Implication
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(SGRAY);
        impLines.forEach(line => {
          checkPage(5);
          pdf.text(line, ML + 8, y);
          y += 5;
        });
        y += 8;
      });
      y += 6;
    }

    // ── Opportunities ──────────────────────────────────────────
    if (r.opportunities?.length) {
      checkPage(30);
      sectionHeader(secNum, 'OPORTUNIDADES');
      secNum++;
      r.opportunities.forEach((o, idx) => {
        checkPage(10);
        pdf.setFontSize(9);
        const oLines = wrapText(o, CW - 14);
        const oH = oLines.length * 5 + 6;
        drawRect(ML, y - 3, 2, oH, BLUE);
        drawRect(ML + 2, y - 3, CW - 2, oH, LGRAY);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(BLUE);
        pdf.text('>', ML + 6, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(BODY);
        oLines.forEach(line => {
          checkPage(5);
          pdf.text(line, ML + 11, y);
          y += 5;
        });
        y += 6;
      });
      y += 8;
    }

    // ── Recommendations ────────────────────────────────────────
    if (r.recommendations) {
      pdf.addPage();
      currentPage++;
      y = MT;
      sectionHeader(secNum, 'RECOMENDACIONES');
      secNum++;

      [
        { key: 'short_term', label: 'CORTO PLAZO', color: RED },
        { key: 'medium_term', label: 'MEDIANO PLAZO', color: NAVY },
        { key: 'long_term', label: 'LARGO PLAZO', color: BLUE },
      ].forEach(hz => {
        const items = r.recommendations[hz.key];
        if (!items?.length) return;
        checkPage(18);
        // Horizon badge
        drawRect(ML, y - 3, CW * 0.28, 7, hz.color);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#FFFFFF');
        pdf.text(hz.label, ML + 3, y + 1);
        y += 12;

        items.forEach((rec, idx) => {
          const rcX = ML + 10;
          // Pre-measure
          pdf.setFontSize(9);
          const aLines = wrapText(rec.action, CW - 18);
          pdf.setFontSize(8.5);
          const ratLines = rec.rationale ? wrapText(rec.rationale, CW - 18) : [];
          const impLines = rec.impact ? wrapText('Impacto: ' + rec.impact, CW - 18) : [];
          const recH = aLines.length * 5 + ratLines.length * 4.5 + impLines.length * 4.5 + 10;
          checkPage(recH + 6);
          // Number badge
          drawRect(ML, y - 3, 8, 8, hz.color);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor('#FFFFFF');
          pdf.text(String(idx + 1), ML + 4, y + 2, { align: 'center' });
          // Card background
          drawRect(rcX, y - 3, CW - 10, Math.max(8, recH), LGRAY);
          // Action
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(NAVY);
          aLines.forEach(line => {
            pdf.text(line, rcX + 4, y);
            y += 5;
          });
          y += 2;
          // Rationale
          if (ratLines.length) {
            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(SGRAY);
            ratLines.forEach(line => {
              checkPage(4.5);
              pdf.text(line, rcX + 4, y);
              y += 4.5;
            });
            y += 2;
          }
          // Impact
          if (impLines.length) {
            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(hz.color);
            impLines.forEach(line => {
              checkPage(4.5);
              pdf.text(line, rcX + 4, y);
              y += 4.5;
            });
          }
          y += 8;
        });
        y += 6;
      });
    }

    // ── Information Gaps ───────────────────────────────────────
    if (r.information_gaps?.length) {
      checkPage(30);
      sectionHeader(secNum, 'BRECHAS DE INFORMACION');
      secNum++;
      r.information_gaps.forEach((g, idx) => {
        checkPage(10);
        pdf.setFontSize(9);
        const gLines = wrapText(g, CW - 16);
        const gH = gLines.length * 5 + 6;
        drawRect(ML, y - 3, 2, gH, BLUE);
        drawRect(ML + 2, y - 3, CW - 2, gH, '#F0F4FA');
        // Info marker
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(BLUE);
        pdf.text('(i)', ML + 6, y);
        // Text
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(BODY);
        gLines.forEach(line => {
          checkPage(5);
          pdf.text(line, ML + 13, y);
          y += 5;
        });
        y += 6;
      });
      y += 8;
    }

    // ── Conclusion ─────────────────────────────────────────────
    if (r.conclusion) {
      checkPage(30);
      sectionHeader(secNum, 'CONCLUSION');
      secNum++;
      // Pre-measure
      pdf.setFontSize(10);
      const clLines = wrapText(r.conclusion, CW - 16);
      const clH = 14 + clLines.length * 5.5 + 8;
      checkPage(clH);
      drawRect(ML, y - 4, 2.5, clH, NAVY);
      drawRect(ML + 2.5, y - 4, CW - 2.5, clH, LGRAY);
      // Label
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(NAVY);
      pdf.text('CONCLUSION', ML + 8, y + 2);
      y += 10;
      // Body
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bolditalic');
      pdf.setTextColor(NAVY);
      clLines.forEach(line => {
        checkPage(5.5);
        pdf.text(line, ML + 8, y);
        y += 5.5;
      });
    }

    // ================================================================
    // HEADERS + FOOTERS on every page
    // ================================================================
    const pages = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      if (p === 1) {
        // Cover page — no header/footer, already styled
        continue;
      }
      // ── Header: thin navy top rule + ALTO branding ──
      drawRect(0, 0, W, 1.2, NAVY);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(SGRAY);
      pdf.text('ALTO', W - MR, 8, { align: 'right' });

      // ── Footer ──
      drawRect(ML, H - 14, CW, 0.3, MGRAY);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(SGRAY);
      pdf.text('CONFIDENCIAL  |  ALTO Strategy  |  ' + monthYear, ML, H - 10);
      // BORRADOR in red
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(RED);
      pdf.text('BORRADOR', W / 2 + 10, H - 10);
      // Page number
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(SGRAY);
      pdf.text(p + ' / ' + pages, W - MR, H - 10, { align: 'right' });
    }

    pdf.save('Informe_ALTO_' + new Date().toISOString().slice(0, 10) + '.pdf');
    flash('\u2713 PDF descargado');
  } catch (err) {
    showError('Error PDF: ' + err.message);
  }
}
