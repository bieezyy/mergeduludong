"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertOfficeToPdf = convertOfficeToPdf;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_js_1 = require("../config.js");
/**
 * MDD-303: Convert Office files (docx, doc, odt, rtf) to PDF via Gotenberg LibreOffice endpoint
 */
async function convertOfficeToPdf(inputFilePath, outputPdfPath) {
    const form = new form_data_1.default();
    form.append("files", fs_1.default.createReadStream(inputFilePath), path_1.default.basename(inputFilePath));
    const url = `${config_js_1.config.gotenbergUrl}/forms/libreoffice/convert`;
    const response = await (0, node_fetch_1.default)(url, {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gotenberg conversion failed [${response.status}]: ${errText}`);
    }
    const fileStream = fs_1.default.createWriteStream(outputPdfPath);
    await new Promise((resolve, reject) => {
        if (!response.body)
            return reject(new Error("Empty response stream from Gotenberg"));
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", () => resolve());
    });
    return outputPdfPath;
}
