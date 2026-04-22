import { readFileSync, writeFileSync, existsSync } from "fs";
import mupdf from "mupdf";

function extractLogoSVG(pdfPath, outputPath) {
  const data = readFileSync(pdfPath);
  const buffer = new Uint8Array(data);
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const page = doc.loadPage(0);
  const bounds = page.getBounds();
  const writer = new mupdf.DocumentWriter(outputPath, "svg", "");
  const device = writer.beginPage(bounds);
  page.run(device, mupdf.Matrix.identity);
  writer.endPage(device);
  writer.close();
  console.log(`OK: ${outputPath}`);
}

const pdf1 = process.argv[2];
const pdf2 = process.argv[3];

if (!pdf1 || !pdf2) {
  console.error("Uso: node scripts/extract-logos.mjs <pdf-logo1> <pdf-logo2>");
  console.error("Exemplo: node scripts/extract-logos.mjs C:/Downloads/logo1.pdf C:/Downloads/logo2.pdf");
  process.exit(1);
}

if (!existsSync(pdf1)) {
  console.error(`Arquivo não encontrado: ${pdf1}`);
  process.exit(1);
}

if (!existsSync(pdf2)) {
  console.error(`Arquivo não encontrado: ${pdf2}`);
  process.exit(1);
}

try {
  extractLogoSVG(pdf1, "public/logo-modelo1.svg");
  extractLogoSVG(pdf2, "public/logo-modelo2.svg");
  console.log("Logos extraídos com sucesso.");
} catch (err) {
  console.error("Erro na extração:", err.message);
  process.exit(1);
}
