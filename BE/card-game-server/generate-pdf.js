const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  try {
    console.log('Starting PDF generation...');

    const inputFile = path.join(__dirname, 'API_DOCUMENTATION.md');
    const outputFile = path.join(__dirname, 'API_DOCUMENTATION.pdf');

    // Check if markdown file exists
    if (!fs.existsSync(inputFile)) {
      console.error('Error: API_DOCUMENTATION.md not found');
      process.exit(1);
    }

    // Generate PDF with custom options
    const pdf = await mdToPdf(
      { path: inputFile },
      {
        dest: outputFile,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          },
          printBackground: true
        },
        css: `
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #333;
}
h1 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-top: 30px;
}
h2 {
  color: #34495e;
  border-bottom: 2px solid #95a5a6;
  padding-bottom: 8px;
  margin-top: 25px;
}
h3 {
  color: #2c3e50;
  margin-top: 20px;
}
h4 {
  color: #555;
  margin-top: 15px;
}
h5 {
  color: #666;
  margin-top: 12px;
}
code {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 10pt;
  color: #e74c3c;
}
pre {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 9pt;
  line-height: 1.4;
}
pre code {
  background-color: transparent;
  color: #f8f8f2;
  padding: 0;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
  font-size: 10pt;
}
table th {
  background-color: #3498db;
  color: white;
  padding: 10px;
  text-align: left;
  border: 1px solid #2980b9;
}
table td {
  padding: 8px;
  border: 1px solid #ddd;
}
table tr:nth-child(even) {
  background-color: #f9f9f9;
}
blockquote {
  border-left: 4px solid #3498db;
  padding-left: 15px;
  margin-left: 0;
  color: #555;
  font-style: italic;
}
a {
  color: #3498db;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
.page-break {
  page-break-after: always;
}
strong {
  color: #2c3e50;
}
`
      }
    );

    console.log('PDF generated successfully!');
    console.log('Output file:', outputFile);
    console.log('File size:', (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2), 'MB');

  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

generatePDF();
