import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const BASE_DIR = '/Users/hector/Documents/BTS/Legal Chile';

const FILES = [
  {
    input: path.join(BASE_DIR, 'MANUAL_CL_USUARIO_COMPLETO.md'),
    output: path.join(BASE_DIR, 'Manual_usuario_Legal_Chile.docx'),
    coverTitle: 'Manual de Usuario',
    subtitle: 'Modulo Legal Chile (CL)',
    documentType: 'Manual operativo para usuarios del expediente legal',
    summary:
      'Documento operativo que consolida el uso real del modulo Legal Chile, incluyendo navegacion, prerequisitos, validaciones, excepciones y buenas practicas para gestionar el expediente sin perder consistencia funcional.',
    introBoxes: [
      { label: 'Objetivo', match: /^1\.\s+Objetivo$/i },
      { label: 'Publico objetivo', match: /^2\.\s+Publico objetivo$/i },
      { label: 'Alcance', match: /^3\.\s+Alcance$/i },
    ],
    criticalRules: [
      'Buscar siempre antes de crear un imputado nuevo.',
      'TRR no es equivalente a imputado desconocido; cada opcion activa una logica distinta.',
      'Las audiencias normales requieren al menos un imputado conocido.',
      'El modo TRR habilita un flujo alternativo para tareas y audiencias.',
      'Guardar antes de cerrar paneles laterales, especialmente en marcas y formularios parametrizados.',
      'Los conflictos por duplicado deben revisarse como posible vinculacion, no solo como error.',
    ],
  },
  {
    input: path.join(BASE_DIR, 'MANUAL_CL_CAPACITADOR_COMPLETO.md'),
    output: path.join(BASE_DIR, 'Manual_Capacitador_Legal_Chile.docx'),
    coverTitle: 'Manual para Capacitador',
    subtitle: 'Modulo Legal Chile (CL)',
    documentType: 'Guia de facilitacion para sesiones de capacitacion e induccion',
    summary:
      'Guia para relatores y facilitadores que necesitan explicar el modulo Legal Chile con foco operativo, distinguiendo claramente los puntos que suelen generar errores funcionales durante la adopcion del sistema.',
    introBoxes: [
      { label: 'Objetivo de la capacitacion', match: /^1\.\s+Objetivo de la capacitacion$/i },
      {
        label: 'Preparacion previa',
        match: /^2\.\s+Recomendaciones previas para el capacitador$/i,
      },
      { label: 'Estructura sugerida', match: /^3\.\s+Estructura sugerida de la sesion$/i },
    ],
    criticalRules: [
      'Repetir al menos una vez que buscar antes de crear imputado es una practica obligatoria.',
      'Explicar TRR e imputado desconocido como decisiones funcionales distintas, no como sinonimos.',
      'Mostrar que Tareas depende de como se resolvio la situacion de Imputados.',
      'Usar demos separadas para caso con imputado conocido, imputado desconocido y caso TRR.',
      'Anticipar que una descarga de querella visible puede fallar y requerir reintento o soporte.',
      'Recordar que parte del modulo es parametrico y puede variar por cuenta o configuracion.',
    ],
  },
];

const A = {
  NAVY: '041627',
  RED: 'BB0014',
  BLUE: '4279B0',
  LGRAY: 'F2F4F6',
  MGRAY: 'E0E3E5',
  DGRAY: '44474C',
  SGRAY: '74777D',
  WHITE: 'FFFFFF',
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: A.WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cleanLine(value) {
  return value.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
}

function plainTextFromNode(node) {
  const values = [];

  for (const block of node.blocks) {
    if (block.type === 'paragraph' || block.type === 'quote') {
      values.push(block.text);
    }

    if (block.type === 'list') {
      values.push(...block.items);
    }
  }

  return values.join(' ');
}

function summarizeNode(node) {
  const text = plainTextFromNode(node);
  if (!text) return '';
  if (text.length <= 320) return text;

  const slice = text.slice(0, 317);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : slice.length)}...`;
}

function normalizeHeading(raw) {
  return raw.replace(/^\d+(?:\.\d+)*\s+/, '').trim();
}

function parseMarkdown(text) {
  const root = { title: '', level: 0, blocks: [], children: [] };
  const stack = [root];
  let currentParagraph = [];
  let currentList = null;

  function currentNode() {
    return stack[stack.length - 1];
  }

  function flushParagraph() {
    if (!currentParagraph.length) return;
    currentNode().blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
    currentParagraph = [];
  }

  function flushList() {
    if (!currentList) return;
    currentNode().blocks.push(currentList);
    currentList = null;
  }

  function pushHeading(mdLevel, rawTitle) {
    const title = cleanLine(rawTitle);
    const numbered = title.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
    const level = numbered ? numbered[1].split('.').length : Math.max(1, mdLevel - 1);
    const node = { title, level, blocks: [], children: [] };

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();

      if (headingMatch[1].length === 1 && !root.title) {
        root.title = cleanLine(headingMatch[2]);
        continue;
      }

      pushHeading(headingMatch[1].length, headingMatch[2]);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { type: 'list', ordered: true, items: [] };
      }
      currentList.items.push(cleanLine(numberedMatch[2]));
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { type: 'list', ordered: false, items: [] };
      }
      currentList.items.push(cleanLine(bulletMatch[1]));
      continue;
    }

    const quoteMatch = trimmed.match(/^`(.+)`$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      currentNode().blocks.push({ type: 'quote', text: cleanLine(quoteMatch[1]) });
      continue;
    }

    flushList();
    currentParagraph.push(cleanLine(trimmed));
  }

  flushParagraph();
  flushList();
  return root;
}

function findNode(nodes, matcher) {
  for (const node of nodes) {
    if (matcher.test(node.title)) return node;
    const nested = findNode(node.children, matcher);
    if (nested) return nested;
  }
  return null;
}

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after ?? 100, before: options.before ?? 0 },
    indent: options.indent ? { left: options.indent } : undefined,
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: options.size ?? 21,
        color: options.color ?? A.DGRAY,
        bold: options.bold ?? false,
        italics: options.italics ?? false,
      }),
    ],
  });
}

function spacer(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function sectionHeader(text) {
  return [
    new Paragraph({
      spacing: { before: 340, after: 100 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: 'Calibri',
          size: 24,
          bold: true,
          color: A.NAVY,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A.MGRAY, space: 1 } },
      children: [],
    }),
  ];
}

function infoBox(label, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: A.LGRAY, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 220, right: 220 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: label,
                    font: 'Calibri',
                    size: 18,
                    bold: true,
                    color: A.BLUE,
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text, font: 'Calibri', size: 21, color: A.DGRAY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function criticalBox(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [260, 9100],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: A.RED, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            borders: noBorders,
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [paragraph(text, { after: 0 })],
          }),
        ],
      }),
    ],
  });
}

function bulletRow(text, color = A.RED) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [360, 9000],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '•', font: 'Calibri', size: 24, color })],
              }),
            ],
          }),
          new TableCell({
            borders: noBorders,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [paragraph(text, { after: 0 })],
          }),
        ],
      }),
    ],
  });
}

function stepRow(index, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [700, 8660],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: A.NAVY, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: String(index),
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
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [paragraph(text, { after: 0 })],
          }),
        ],
      }),
    ],
  });
}

function quoteBox(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: A.BLUE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: A.BLUE },
              left: { style: BorderStyle.SINGLE, size: 3, color: A.BLUE },
              right: { style: BorderStyle.SINGLE, size: 1, color: A.BLUE },
            },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [paragraph(text, { after: 0, italics: true, color: A.SGRAY })],
          }),
        ],
      }),
    ],
  });
}

function titleForDepth(node) {
  return node.level > 1 ? node.title : normalizeHeading(node.title);
}

function renderNode(node, children) {
  const title = titleForDepth(node);

  if (node.level === 1) {
    children.push(...sectionHeader(title));
  } else if (node.level === 2) {
    children.push(
      new Paragraph({
        spacing: { before: 220, after: 80 },
        children: [
          new TextRun({ text: title, font: 'Calibri', size: 22, bold: true, color: A.NAVY }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: title, font: 'Calibri', size: 20, bold: true, color: A.RED }),
        ],
      })
    );
  }

  for (const block of node.blocks) {
    if (block.type === 'paragraph') {
      children.push(paragraph(block.text));
      continue;
    }

    if (block.type === 'quote') {
      children.push(quoteBox(block.text));
      children.push(spacer(80));
      continue;
    }

    if (block.type === 'list') {
      block.items.forEach((item, index) => {
        children.push(
          block.ordered
            ? stepRow(index + 1, item)
            : bulletRow(item, node.level === 1 ? A.RED : A.BLUE)
        );
      });
      children.push(spacer(80));
    }
  }

  node.children.forEach(child => renderNode(child, children));
}

function buildDocument(root, config) {
  const children = [];
  const contentNodes = root.children.filter(node => !/^Modulo Legal Chile/i.test(node.title));

  children.push(spacer(1200));
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: 'ALTO', font: 'Calibri', size: 40, bold: true, color: A.RED }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: config.coverTitle,
          font: 'Calibri',
          size: 54,
          bold: true,
          color: A.NAVY,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 90 },
      children: [
        new TextRun({
          text: config.subtitle,
          font: 'Calibri',
          size: 28,
          italics: true,
          color: A.SGRAY,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({ text: config.documentType, font: 'Calibri', size: 22, color: A.DGRAY }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 180 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: A.RED, space: 1 } },
      children: [],
    })
  );
  children.push(paragraph('CONFIDENCIAL', { size: 18, bold: true, color: A.NAVY, after: 80 }));
  children.push(
    paragraph(
      new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
      { size: 19, color: A.SGRAY, after: 520 }
    )
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));

  children.push(...sectionHeader('Resumen Ejecutivo'));
  children.push(infoBox('RESUMEN', config.summary));
  children.push(spacer(200));

  if (config.introBoxes.length) {
    children.push(...sectionHeader('Ficha Inicial'));
    for (const box of config.introBoxes) {
      const node = findNode(contentNodes, box.match);
      if (!node) continue;
      children.push(infoBox(box.label.toUpperCase(), summarizeNode(node)));
      children.push(spacer(100));
    }
  }

  children.push(...sectionHeader('Reglas Criticas'));
  config.criticalRules.forEach(rule => {
    children.push(criticalBox(rule));
    children.push(spacer(90));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(...sectionHeader('Contenido Desarrollado'));

  contentNodes.forEach(node => renderNode(node, children));

  return new Document({
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
                  new TextRun({
                    text: 'ALTO',
                    font: 'Calibri',
                    size: 14,
                    bold: true,
                    color: A.RED,
                  }),
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
                  new TextRun({ text: 'Pagina ', font: 'Calibri', size: 16, color: '999999' }),
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
}

async function generateOne(config) {
  const source = await readFile(config.input, 'utf8');
  const parsed = parseMarkdown(source);
  const doc = buildDocument(parsed, config);
  const buffer = await Packer.toBuffer(doc);
  await writeFile(config.output, buffer);
}

async function main() {
  for (const config of FILES) {
    await generateOne(config);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
