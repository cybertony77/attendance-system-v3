import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Send WhatsApp message using Python Selenium script
 * @param {string} phoneNumber - Phone number with country code
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Result object with success status
 */
export function sendWhatsAppMessage(phoneNumber, message) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'whatsapp.py');
    
    // Prepare command line arguments
    const args = [
      pythonScript,
      '--phone', phoneNumber,
      '--message', message,
      '--quiet'
    ];
    
    console.log(`🐍 Executing Python script: python ${args.join(' ')}`);
    console.log(`📁 Script path: ${pythonScript}`);
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`💬 Message length: ${message.length} characters`);
    
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`🐍 Python stdout: ${data.toString().trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`🐍 Python stderr: ${data.toString().trim()}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python process exited with code: ${code}`);
      
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          console.log(`✅ Python script succeeded:`, result);
          resolve(result);
        } catch (error) {
          console.error(`❌ Failed to parse Python output: ${stdout}`);
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      } else {
        console.error(`❌ Python script failed with code ${code}`);
        console.error(`❌ stderr: ${stderr}`);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`❌ Failed to start Python process: ${error.message}`);
      console.error(`❌ This might mean Python is not installed or not in PATH`);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Send WhatsApp messages to multiple phone numbers
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} message - Message content
 * @returns {Promise<Array>} - Array of results for each message
 */
export function sendBulkWhatsAppMessages(phoneNumbers, message) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'whatsapp.py');
    
    // Prepare command line arguments
    const args = [
      pythonScript,
      '--phones', JSON.stringify(phoneNumbers),
      '--bulk-message', message,
      '--quiet'
    ];
    
    console.log(`🐍 Executing Python script for bulk messages`);
    
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const results = JSON.parse(stdout.trim());
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Setup WhatsApp Web for initial authentication
 * @returns {Promise<Object>} - Setup result
 */
export function setupWhatsAppWeb() {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'whatsapp.py');
    
    // Prepare command line arguments for setup
    const args = [
      pythonScript,
      '--setup',
      '--quiet'
    ];
    
    console.log(`🐍 Setting up WhatsApp Web: python ${args.join(' ')}`);
    
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`🐍 Python stdout: ${data.toString().trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`🐍 Python stderr: ${data.toString().trim()}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python setup process exited with code: ${code}`);
      
      if (code === 0) {
        console.log(`✅ WhatsApp Web setup completed successfully`);
        resolve({ success: true, message: 'WhatsApp Web setup completed' });
      } else {
        console.error(`❌ WhatsApp Web setup failed with code ${code}`);
        console.error(`❌ stderr: ${stderr}`);
        reject(new Error(`WhatsApp Web setup failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`❌ Failed to start Python setup process: ${error.message}`);
      reject(new Error(`Failed to start Python setup process: ${error.message}`));
    });
  });
}

/**
 * Test the Python WhatsApp script
 * @returns {Promise<Object>} - Test result
 */
export function testWhatsAppScript() {
  return sendWhatsAppMessage('+201234567890', 'Test message from TopPhysics system');
} 