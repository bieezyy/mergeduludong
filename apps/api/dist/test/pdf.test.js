"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const pdf_lib_1 = require("pdf-lib");
(0, node_test_1.describe)("MDD-601: PDF Manipulation Core Engine", () => {
    (0, node_test_1.it)("should create a valid PDF document with multiple pages", async () => {
        const doc = await pdf_lib_1.PDFDocument.create();
        const page1 = doc.addPage([595, 842]); // A4
        const page2 = doc.addPage([595, 842]);
        node_assert_1.default.strictEqual(doc.getPageCount(), 2);
        const pdfBytes = await doc.save();
        node_assert_1.default.ok(pdfBytes.length > 0);
    });
    (0, node_test_1.it)("should merge two distinct PDF documents together", async () => {
        // Generate doc 1
        const doc1 = await pdf_lib_1.PDFDocument.create();
        doc1.addPage([500, 500]);
        const bytes1 = await doc1.save();
        // Generate doc 2
        const doc2 = await pdf_lib_1.PDFDocument.create();
        doc2.addPage([600, 600]);
        const bytes2 = await doc2.save();
        // Merge them into mergedDoc
        const mergedDoc = await pdf_lib_1.PDFDocument.create();
        const loaded1 = await pdf_lib_1.PDFDocument.load(bytes1);
        const loaded2 = await pdf_lib_1.PDFDocument.load(bytes2);
        const [pageA] = await mergedDoc.copyPages(loaded1, [0]);
        const [pageB] = await mergedDoc.copyPages(loaded2, [0]);
        mergedDoc.addPage(pageA);
        mergedDoc.addPage(pageB);
        node_assert_1.default.strictEqual(mergedDoc.getPageCount(), 2);
    });
});
