const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const buf = fs.readFileSync('C:/Users/luizh/engeserv-inspector/qa/pdf/laudo-real.pdf');
PDFDocument.load(buf).then(pdf => {
  const pages = pdf.getPages();
  console.log('Pages:', pages.length);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    console.log('Page ' + (i+1) + ':', width.toFixed(0) + 'x' + height.toFixed(0));
  }
});