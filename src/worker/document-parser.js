// ============================================================
// Document Parser — PDF and DOCX text extraction (no external libs)
// ============================================================

// ── Lightweight PDF text extraction ──────────────────────────
// Handles most text PDFs by parsing BT...ET blocks and stream content.
export function extractTextFromPDFBytes(bytes) {
  const str = new TextDecoder('latin1').decode(bytes);
  const texts = [];

  // Extract text between BT...ET blocks (PDF text objects)
  const btRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btRegex.exec(str)) !== null) {
    const block = match[1];

    // Tj operator: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tm;
    while ((tm = tjRegex.exec(block)) !== null) {
      texts.push(tm[1]);
    }

    // TJ array operator: [(text)(text)] TJ
    const tjArrRegex = /\[(.*?)\]\s*TJ/g;
    while ((tm = tjArrRegex.exec(block)) !== null) {
      const inner = tm[1];
      const parts = inner.match(/\(([^)]*)\)/g);
      if (parts) {
        texts.push(parts.map(p => p.slice(1, -1)).join(''));
      }
    }
  }

  // Also try readable ASCII text from stream content
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  while ((match = streamRegex.exec(str)) !== null) {
    const content = match[1];
    if (content.includes('BT') && content.includes('ET')) continue; // already handled
    const readable = content.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, '').trim();
    if (readable.length > 50) texts.push(readable);
  }

  return texts.join(' ').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
}

// ── Lightweight DOCX text extraction ─────────────────────────
// Reads word/document.xml from the ZIP archive (stored, not compressed).
export function extractTextFromDOCXBytes(bytes) {
  try {
    const target = 'word/document.xml';
    let offset = 0;
    const len = bytes.length;

    while (offset < len - 4) {
      // Local file header signature: 0x04034b50
      if (
        bytes[offset] === 0x50 &&
        bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x03 &&
        bytes[offset + 3] === 0x04
      ) {
        const fnLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const exLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
        const compMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
        const compSize =
          bytes[offset + 18] |
          (bytes[offset + 19] << 8) |
          (bytes[offset + 20] << 16) |
          (bytes[offset + 21] << 24);
        const fileName = new TextDecoder().decode(
          bytes.slice(offset + 30, offset + 30 + fnLen)
        );

        if (fileName === target && compMethod === 0) {
          // Stored (not compressed) — read directly
          const dataStart = offset + 30 + fnLen + exLen;
          const xml = new TextDecoder().decode(
            bytes.slice(dataStart, dataStart + compSize)
          );
          return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        offset += 30 + fnLen + exLen + compSize;
      } else {
        offset++;
      }
    }
    return '';
  } catch (e) {
    console.error('DOCX parse error:', e);
    return '';
  }
}

// ── Main extraction dispatcher ────────────────────────────────
export async function extractTextFromDocument(mediaUrl, mediaType, env) {
  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const docResp = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!docResp.ok) throw new Error('Cannot download document from Twilio');

    if (
      mediaType.includes('text/plain') ||
      mediaType.includes('text/csv') ||
      mediaType.includes('text/markdown')
    ) {
      return await docResp.text();
    }

    if (mediaType.includes('pdf')) {
      const buffer = await docResp.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const text = extractTextFromPDFBytes(bytes);
      return text || '[No se pudo extraer texto del PDF. Puede ser un PDF escaneado.]';
    }

    if (
      mediaType.includes('wordprocessingml') ||
      mediaType.includes('docx') ||
      mediaType.includes('msword')
    ) {
      const buffer = await docResp.arrayBuffer();
      const text = extractTextFromDOCXBytes(new Uint8Array(buffer));
      return text || '[No se pudo extraer texto del documento Word.]';
    }

    return '';
  } catch (e) {
    console.error('Document extraction error:', e);
    return '';
  }
}
