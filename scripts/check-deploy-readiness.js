const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, message) {
    console.log(`${color}${message}${RESET}`);
}

async function checkConnectivity() {
    log(YELLOW, 'Checking connectivity to Supabase...');
    return new Promise((resolve) => {
        exec('curl -I https://api.supabase.com --max-time 5', (error, stdout, stderr) => {
            if (error) {
                log(RED, '❌ Connectivity check failed: Unable to reach Supabase API.');
                log(RED, '   Note: You might be behind a firewall or have network issues.');
                resolve(false);
            } else {
                log(GREEN, '✅ Connectivity to Supabase confirmed.');
                resolve(true);
            }
        });
    });
}

function checkPermissions() {
    log(YELLOW, 'Checking node_modules permissions...');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log(YELLOW, '⚠️ node_modules not found. Skipping permission check (run npm install first).');
        return true;
    }

    try {
        const testFile = path.join(nodeModulesPath, '.perm_check');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        log(GREEN, '✅ node_modules write permissions confirmed.');
        return true;
    } catch (err) {
        if (err.code === 'EACCES' || err.code === 'EPERM') {
            log(RED, '❌ Permission check failed for node_modules.');
            log(RED, '   Error: EPERM/EACCES detected.');
            return false;
        }
        log(RED, `❌ Unexpected error checking permissions: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('Running Secure Admin Deployment Readiness Check...\n');

    const isOnline = await checkConnectivity();
    const hasPermissions = checkPermissions();

    console.log('\n----------------------------------------');

    if (isOnline && hasPermissions) {
        log(GREEN, 'SUCCESS: Environment is ready for deployment.');
        process.exit(0);
    } else {
        log(RED, 'FAILURE: Environment issues detected.');

        if (!isOnline) {
            log(YELLOW, '\n[Action Required] Network Issue:');
            console.log('1. Check your internet connection.');
            console.log('2. Verify if a VPN is needed to access Supabase.');
        }

        if (!hasPermissions) {
            log(YELLOW, '\n[Action Required] Permission Issue (EPERM):');
            console.log('Run the following commands to fix permissions:');
            console.log('sudo chown -R $(whoami) node_modules ~/.npm');
            console.log('rm -rf node_modules package-lock.json');
            console.log('npm install');
        }

        process.exit(1);
    }
}

main();
