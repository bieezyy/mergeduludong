import { describe, it } from "node:test";
import assert from "node:assert";
import { PDFDocument } from "pdf-lib";

describe("MDD-601: PDF Manipulation Core Engine", () => {
  it("should create a valid PDF document with multiple pages", async () => {
    const doc = await PDFDocument.create();
    const page1 = doc.addPage([595, 842]); // A4
    const page2 = doc.addPage([595, 842]);

    assert.strictEqual(doc.getPageCount(), 2);
    const pdfBytes = await doc.save();
    assert.ok(pdfBytes.length > 0);
  });

  it("should merge two distinct PDF documents together", async () => {
    // Generate doc 1
    const doc1 = await PDFDocument.create();
    doc1.addPage([500, 500]);
    const bytes1 = await doc1.save();

    // Generate doc 2
    const doc2 = await PDFDocument.create();
    doc2.addPage([600, 600]);
    const bytes2 = await doc2.save();

    // Merge them into mergedDoc
    const mergedDoc = await PDFDocument.create();
    const loaded1 = await PDFDocument.load(bytes1);
    const loaded2 = await PDFDocument.load(bytes2);

    const [pageA] = await mergedDoc.copyPages(loaded1, [0]);
    const [pageB] = await mergedDoc.copyPages(loaded2, [0]);
    mergedDoc.addPage(pageA);
    mergedDoc.addPage(pageB);

    assert.strictEqual(mergedDoc.getPageCount(), 2);
  });
});
