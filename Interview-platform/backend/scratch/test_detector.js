const { detectPhone } = require('../lib/detectorManager');

// A tiny 1x1 black pixel GIF base64 string
const dummyFrame = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

console.log('Spawning process...');
detectPhone(dummyFrame); // Trigger initial lazy spawn

console.log('Waiting 5 seconds for YOLO model to load...');
setTimeout(() => {
  console.log('Sending frame to detect...');
  detectPhone(dummyFrame)
    .then(result => {
      console.log('Detection success result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Detection failed with error:', err);
      process.exit(1);
    });
}, 5000);
