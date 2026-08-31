const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractText() {
  const files = ['teste-a-pequeno.pdf', 'teste-b-medio.pdf', 'teste-c-grande.pdf', 'teste-d-extremo.pdf'];
  for (const f of files) {
    const buf = fs.readFileSync('qa/pdf/' + f);
    const data = await pdfParse(buf);
    console.log('=== ' + f + ' ===');
    console.log(data.text.substring(0, 2000));
    console.log('...');
    console.log('');
  }
}
extractText().catch(console.error);