const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { mockQuery } = require('./mockData');

// Resolve configuration and executable paths
const coralBinPath = path.resolve(
  __dirname,
  process.env.CORAL_BIN_PATH || '../.coral-bin/coral.exe'
);
const coralConfigDir = path.resolve(
  __dirname,
  process.env.CORAL_CONFIG_DIR || '../.coral-config'
);

/**
 * Checks if the Coral CLI binary exists at the configured path
 * @returns {boolean}
 */
function isCoralCliAvailable() {
  // Check for .exe on Windows or general file existence
  const actualPath = process.platform === 'win32' && !coralBinPath.endsWith('.exe')
    ? coralBinPath + '.exe'
    : coralBinPath;
  return fs.existsSync(actualPath);
}

/**
 * Executes a SQL query against Coral or falls back to Mock mode if bypassed.
 * @param {string} sql The SQL query to run
 * @returns {Promise<Array<object>>} Resolves to an array of rows
 */
function executeQuery(sql) {
  return new Promise((resolve) => {
    const isMockBypass = process.env.MOCK_MODE === 'true';

    // 1. Force Mock Mode if set or if Coral binary is unavailable
    if (isMockBypass || !isCoralCliAvailable()) {
      const reason = isMockBypass ? 'MOCK_MODE=true is set' : 'Coral CLI binary not found';
      console.log(`💡 [Coral Service] Bypassing query execution (${reason}). Using High-Fidelity Mock Fallback.`);
      console.log(`   SQL: ${sql.trim().replace(/\s+/g, ' ')}`);
      
      const mockResult = mockQuery(sql);
      return resolve(mockResult);
    }

    // 2. Prepare Environment variables for the Coral CLI
    // Inject API tokens so Coral can authenticate seamlessly on demand
    const execEnv = {
      ...process.env,
      CORAL_CONFIG_DIR: coralConfigDir,
      // Coral maps variables straight to source configurations
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      SLACK_TOKEN: process.env.SLACK_TOKEN || '',
      PAGERDUTY_API_TOKEN: process.env.PAGERDUTY_API_TOKEN || '',
      SENTRY_TOKEN: process.env.SENTRY_TOKEN || '',
      SENTRY_ORG: process.env.SENTRY_ORG || ''
    };

    console.log(`⚡ [Coral Service] Executing Coral SQL: ${sql.trim().replace(/\s+/g, ' ')}`);

    // 3. Execute Coral CLI: coral sql "<SQL>" --format json
    execFile(
      coralBinPath,
      ['sql', sql, '--format', 'json'],
      { env: execEnv },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(`⚠️ [Coral Service] Execution failed. Falling back to Mock Mode.`);
          console.warn(`   Stderr: ${stderr || error.message}`);
          
          // Return mock data fallback
          const mockResult = mockQuery(sql);
          return resolve(mockResult);
        }

        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch (parseError) {
          console.error(`❌ [Coral Service] Failed to parse JSON output. Falling back to Mock Mode.`);
          console.error(`   Output: ${stdout}`);
          
          const mockResult = mockQuery(sql);
          return resolve(mockResult);
        }
      }
    );
  });
}

module.exports = {
  executeQuery,
  isCoralCliAvailable,
  coralBinPath,
  coralConfigDir
};
