// Bagimsiz (bagimliliksiz) minimal XLSX ureteci.
// Store yontemli ZIP + inline string sheet. Excel, LibreOffice ve Google Sheets acar.

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function u16(n) {
  return [n & 0xff, (n >>> 8) & 0xff];
}

function u32(n) {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

function concat(chunks) {
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

// DOS tarih/saat: 2026-01-02 03:04
const DOS_TIME = u16((3 << 11) | (4 << 5) | 2);
const DOS_DATE = u16(((2026 - 1980) << 9) | (1 << 5) | 2);

function zipStore(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);

    const local = concat([
      Uint8Array.from(u32(0x04034b50)),
      Uint8Array.from(u16(20)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      DOS_TIME,
      DOS_DATE,
      Uint8Array.from(u32(crc)),
      Uint8Array.from(u32(file.data.length)),
      Uint8Array.from(u32(file.data.length)),
      Uint8Array.from(u16(nameBytes.length)),
      Uint8Array.from(u16(0)),
      nameBytes,
      file.data,
    ]);

    const central = concat([
      Uint8Array.from(u32(0x02014b50)),
      Uint8Array.from(u16(20)),
      Uint8Array.from(u16(20)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      DOS_TIME,
      DOS_DATE,
      Uint8Array.from(u32(crc)),
      Uint8Array.from(u32(file.data.length)),
      Uint8Array.from(u32(file.data.length)),
      Uint8Array.from(u16(nameBytes.length)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u16(0)),
      Uint8Array.from(u32(0)),
      Uint8Array.from(u32(offset)),
      nameBytes,
    ]);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralDir = concat(centrals);
  const eocd = concat([
    Uint8Array.from(u32(0x06054b50)),
    Uint8Array.from(u16(0)),
    Uint8Array.from(u16(0)),
    Uint8Array.from(u16(files.length)),
    Uint8Array.from(u16(files.length)),
    Uint8Array.from(u32(centralDir.length)),
    Uint8Array.from(u32(offset)),
    Uint8Array.from(u16(0)),
  ]);

  return concat([...locals, centralDir, eocd]);
}

function colName(index0) {
  let name = "";
  let n = index0 + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    name = String.fromCharCode(65 + r) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function xmlEscape(text) {
  return String(text)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sheetXml(rows) {
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          if (value === null || value === undefined || value === "") return "";
          const ref = `${colName(colIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
            value,
          )}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rowXml}</sheetData>` +
    "</worksheet>"
  );
}

/**
 * rows: string[][] — ilk satir baslik kabul edilir.
 * Donus: XLSX icerigi (Uint8Array).
 */
export function buildXlsx(sheetName, rows) {
  const enc = new TextEncoder();
  const safeName = String(sheetName || "Sheet1").replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet1";

  const parts = [
    {
      name: "[Content_Types].xml",
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          "</Types>",
      ),
    },
    {
      name: "_rels/.rels",
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          "</Relationships>",
      ),
    },
    {
      name: "xl/workbook.xml",
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          `<sheets><sheet name="${xmlEscape(safeName)}" sheetId="1" r:id="rId1"/></sheets>` +
          "</workbook>",
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          "</Relationships>",
      ),
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: enc.encode(sheetXml(rows)),
    },
  ];

  return zipStore(parts);
}
