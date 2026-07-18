const { spawn } = require('child_process');
const path = require('path');

let pythonProcess = null;
let isReady = false;
let requestQueue = [];
let isProcessing = false;
let currentRequest = null;

// Path to the python script
const scriptPath = path.resolve(__dirname, 'phone_detector.py');

function initPythonProcess() {
  if (pythonProcess) return;

  console.log('Spawning Python phone detector process...');
  // Spawn Python
  pythonProcess = spawn('python', ['-u', scriptPath]);

  // Track stdout buffer
  let stdoutBuffer = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutBuffer += data.toString();
    
    // Process line-by-line
    let lineEndIndex;
    while ((lineEndIndex = stdoutBuffer.indexOf('\n')) !== -1) {
      const line = stdoutBuffer.substring(0, lineEndIndex).trim();
      stdoutBuffer = stdoutBuffer.substring(lineEndIndex + 1);

      if (!line) continue;

      try {
        const parsed = JSON.parse(line);
        if (parsed.status === 'ready') {
          console.log('Python phone detector is ready and loaded!');
          isReady = true;
          processQueue();
        } else if (parsed.status === 'PONG') {
          // Internal ping pong
        } else {
          // It's a detection result
          handleDetectionResult(parsed);
        }
      } catch (err) {
        console.error('Error parsing JSON from Python stdout:', err, 'Raw line:', line);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Python STDERR:', data.toString().trim());
  });

  pythonProcess.on('close', (code) => {
    console.warn(`Python process exited with code ${code}. Restarting...`);
    pythonProcess = null;
    isReady = false;
    isProcessing = false;
    
    // Reject all currently queued requests
    const failedQueue = [...requestQueue];
    requestQueue = [];
    failedQueue.forEach(item => item.reject(new Error('Python detector process closed unexpectedly.')));
    
    if (currentRequest) {
      currentRequest.reject(new Error('Python detector process closed during execution.'));
      currentRequest = null;
    }
    
    // Re-initialize after delay
    setTimeout(initPythonProcess, 3000);
  });
}

function handleDetectionResult(result) {
  if (currentRequest) {
    currentRequest.resolve(result);
    currentRequest = null;
  }
  isProcessing = false;
  processQueue();
}

function processQueue() {
  if (isProcessing || requestQueue.length === 0 || !isReady) return;

  isProcessing = true;
  currentRequest = requestQueue.shift();

  try {
    // Write frame to standard input
    pythonProcess.stdin.write(currentRequest.frame + '\n');
  } catch (err) {
    console.error('Failed to write to Python stdin:', err);
    currentRequest.reject(err);
    currentRequest = null;
    isProcessing = false;
    processQueue();
  }
}

function detectPhone(base64Frame) {
  return new Promise((resolve, reject) => {
    // Lazy initialization
    if (!pythonProcess) {
      initPythonProcess();
    }

    // If detector is not ready yet, or is already busy processing a frame,
    // do not queue. Instead, resolve immediately to avoid a queuing backlog.
    if (!isReady || isProcessing) {
      return resolve({ phone_detected: false, confidence: 0, status: 'skipped' });
    }

    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,")
    let cleanFrame = base64Frame;
    if (base64Frame.startsWith('data:')) {
      const parts = base64Frame.split(',');
      if (parts.length > 1) {
        cleanFrame = parts[1];
      }
    }
    // Remove newlines or spaces
    cleanFrame = cleanFrame.replace(/\s/g, '');

    requestQueue.push({ frame: cleanFrame, resolve, reject });
    processQueue();
  });
}

module.exports = {
  detectPhone
};
