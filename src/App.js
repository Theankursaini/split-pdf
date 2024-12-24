import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSZip from "jszip";  // Import JSZip

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [fileNames, setFileNames] = useState([]);

  const handlePdfChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleExcelChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const processFiles = async () => {
    if (!pdfFile || !excelFile) {
      alert("Please upload both PDF and Excel files.");
      return;
    }

    try {
      // Read the PDF file
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();

      // Log the total number of pages in the PDF
      console.log(`Total pages in PDF: ${totalPages}`);

      // Read the Excel file
      const excelData = await excelFile.arrayBuffer();
      const workbook = XLSX.read(excelData, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Extract the "Name" column from Excel
      const names = sheetData.map((row) => row["Name"]); // Ensure column header is "Name"

      // Log the number of names in the Excel sheet
      console.log(`Total names in Excel: ${names.length}`);

      // Ensure there are enough names for all pages, if not, default to "Page-X"
      if (names.length < totalPages) {
        alert("Excel file does not have enough names for all PDF pages.");
        console.log("Using default page names for missing names.");
      }

      // Create a new zip instance
      const zip = new JSZip();

      for (let i = 0; i < totalPages; i++) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const newPdfBytes = await newPdfDoc.save();
        const fileName = names[i] || `Page-${i + 1}`; // Use name from Excel or default to "Page-X"

        // Add each PDF to the zip file
        zip.file(`${fileName}.pdf`, newPdfBytes);
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Trigger the download of the zip file
      saveAs(zipBlob, "pdfs.zip");

      alert("All PDFs have been downloaded in a single zip file!");
    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("Failed to split and download PDFs.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Split PDF</h1>
      <div style={{ marginBottom: "20px" }}>
        <label>Upload PDF: </label>
        <input type="file" accept="application/pdf" onChange={handlePdfChange} />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label>Upload Excel: </label>
        <input type="file" accept=".xls,.xlsx" onChange={handleExcelChange} />
      </div>
      <button onClick={processFiles}>Split and Download PDFs </button>
    </div>
  );
}

export default App;
