import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import { config } from "../config.js";

/**
 * MDD-303: Convert Office files (docx, doc, odt, rtf) to PDF via Gotenberg LibreOffice endpoint
 */
export async function convertOfficeToPdf(inputFilePath: string, outputPdfPath: string): Promise<string> {
  const form = new FormData();
  form.append("files", fs.createReadStream(inputFilePath), path.basename(inputFilePath));

  const url = `${config.gotenbergUrl}/forms/libreoffice/convert`;
  const response = await fetch(url, {
    method: "POST",
    body: form as any,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gotenberg conversion failed [${response.status}]: ${errText}`);
  }

  const fileStream = fs.createWriteStream(outputPdfPath);
  await new Promise<void>((resolve, reject) => {
    if (!response.body) return reject(new Error("Empty response stream from Gotenberg"));
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", () => resolve());
  });

  return outputPdfPath;
}
