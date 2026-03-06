require('dotenv').config({ path: "../.env" });
const smbClient = require('../utils/smbClient');
const fs = require('fs');
const path = require('path');

async function runTest() {
    const testFile = 'connection_test.txt';
    const localPath = path.join(__dirname, testFile);

    console.log('--- STARTING SMBv1 NATIVE TEST ---');
    console.log('Environment Debug:');
    console.log(`- HOST: "${process.env.SMB_HOST}"`);
    console.log(`- SHARE: "${process.env.SMB_SHARE}"`);
    console.log(`- USER: "${process.env.SMB_USER}"`);
    console.log(`- BASE: "${process.env.SMB_BASE_PATH}"`);

    // Create dummy local file
    fs.writeFileSync(localPath, 'SMBv1 Native Test Content ' + new Date().toISOString());
    console.log('1. Created local dummy file.');

    try {
        console.log(`2. Testing connection...`);
        const connResult = await smbClient.testConnection();
        if (!connResult.success) {
            throw new Error(`Connection failed: ${connResult.message}`);
        }
        console.log('   Connection test successful.');

        console.log(`3. Uploading test file...`);
        const uploadedPath = await smbClient.uploadFile(localPath, testFile);
        console.log('   Upload success. UNC Path:', uploadedPath);

        console.log('4. Attempting to read that file back...');
        const data = await smbClient.getFileBuffer(testFile);
        console.log('   Read success. Content retrieved:', data.toString());

        console.log('5. Cleaning up (deleting remote file)...');
        await smbClient.deleteFile(testFile);
        console.log('   Delete success.');

        console.log('\n--- ALL SMBv1 OPERATIONS SUCCESSFUL ---');
    } catch (err) {
        console.error('\n--- TEST FAILED ---');
        console.error('Error details:', err.message);
    } finally {
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log('6. Local dummy file removed.');
        }
    }
}

runTest();
