const fs = require('fs');
const { detectPhone } = require('../lib/detectorManager');

const imagePath = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\9ca986db-0625-4f05-aaef-86d1aa61566d\\person_holding_phone_1784376307981.png';

const imgBuffer = fs.readFileSync(imagePath);
const base64Image = `data:image/png;base64,${imgBuffer.toString('base64')}`;

console.log('Spawning detector and polling every 2 seconds...');

const poll = () => {
  detectPhone(base64Image)
    .then(result => {
      console.log('Poll result:', result);
      if (result.status !== 'skipped') {
        console.log('YOLO detection complete! Success.');
        process.exit(0);
      } else {
        setTimeout(poll, 2000);
      }
    })
    .catch(err => {
      console.error('Error during poll:', err);
      process.exit(1);
    });
};

poll();
