#!/usr/bin/env node

/**
 * Browser API audit script
 * 
 * Scans the codebase for browser API usage and verifies:
 * 1. Browser APIs are only used in client components
 * 2. Client components have "use client" directive
 * 3. No time/locale/randomness in server components
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..');

// Browser APIs that should only be used in client components
const BROWSER_APIS = [
  'window.',
  'document.',
  'navigator.',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'crypto.',
  'Date.now()',
  'new Date()',
  'Math.random()',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'IntersectionObserver',
  'ResizeObserver',
  'MutationObserver',
];

// Time/locale APIs that can cause hydration mismatches
const NON_DETERMINISTIC_APIS = [
  'Date.now()',
  'new Date()',
  'Math.random()',
  'crypto.randomUUID()',
  'Intl.DateTimeFormat',
  'toLocaleString',
  'toLocaleDateString',
  'toLocaleTimeString',
];

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .git, and other non-source directories
      if (entry.name === 'node_modules' || entry.name === '.git' || 
          entry.name.startsWith('.') || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

function hasUseClient(content) {
  return /^['"]use client['"]/m.test(content);
}

function isServerComponentFile(filePath) {
  // Check if it's in app directory and not a client component
  const relativePath = path.relative(APP_ROOT, filePath);
  return relativePath.startsWith('app/') && !relativePath.includes('__tests__');
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(APP_ROOT, filePath);
  const issues = [];
  
  const isClientComponent = hasUseClient(content);
  const isServerComponent = isServerComponentFile(filePath) && !isClientComponent;
  
  // Check for browser API usage
  BROWSER_APIS.forEach(api => {
    const regex = new RegExp(`\\b${api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    const matches = content.match(regex);
    
    if (matches && matches.length > 0) {
      if (isServerComponent) {
        issues.push({
          type: 'BROWSER_API_IN_SERVER_COMPONENT',
          message: `Server component uses browser API: ${api}`,
          count: matches.length,
          api,
        });
      } else if (!isClientComponent && !isServerComponent) {
        // Could be a utility file - check if it's client-only
        issues.push({
          type: 'BROWSER_API_WITHOUT_CLIENT_DIRECTIVE',
          message: `File uses browser API without "use client": ${api}`,
          count: matches.length,
          api,
        });
      }
    }
  });
  
  // Check for non-deterministic APIs in server components
  if (isServerComponent) {
    NON_DETERMINISTIC_APIS.forEach(api => {
      const regex = new RegExp(`\\b${api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        issues.push({
          type: 'NON_DETERMINISTIC_API',
          message: `Server component uses non-deterministic API: ${api}`,
          count: matches.length,
          api,
        });
      }
    });
  }
  
  return {
    file: relativePath,
    isClientComponent,
    isServerComponent,
    issues,
    issueCount: issues.length,
  };
}

function main() {
  console.log('🔍 Auditing browser API usage...\n');
  
  const sourceFiles = findFiles(path.join(APP_ROOT, 'app'))
    .concat(findFiles(path.join(APP_ROOT, 'components')))
    .concat(findFiles(path.join(APP_ROOT, 'lib')));
  
  console.log(`Scanning ${sourceFiles.length} source files...\n`);
  
  const results = [];
  let totalIssues = 0;
  
  sourceFiles.forEach(file => {
    const audit = auditFile(file);
    if (audit.issueCount > 0) {
      results.push(audit);
      totalIssues += audit.issueCount;
    }
  });
  
  // Print results
  if (results.length === 0) {
    console.log('✅ No browser API issues found!');
    process.exit(0);
  }
  
  console.log(`Found ${totalIssues} issues across ${results.length} files:\n`);
  
  results.forEach(result => {
    console.log(`📄 ${result.file}`);
    console.log(`   Type: ${result.isClientComponent ? 'Client Component' : result.isServerComponent ? 'Server Component' : 'Utility'}`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ❌ ${issue.type}: ${issue.message} (${issue.count} occurrence${issue.count > 1 ? 's' : ''})`);
      });
    }
    
    console.log('');
  });
  
  // Summary by issue type
  const issueTypes = {};
  results.forEach(result => {
    result.issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + issue.count;
    });
  });
  
  console.log('📊 Summary by issue type:');
  Object.entries(issueTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} occurrence${count > 1 ? 's' : ''}`);
  });
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Add "use client" directive to components using browser APIs');
  console.log('   2. Move browser API calls to useEffect or event handlers');
  console.log('   3. Use deterministic values for initial server render');
  console.log('   4. Consider using stable IDs instead of random values');
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  auditFile,
  findFiles,
  BROWSER_APIS,
  NON_DETERMINISTIC_APIS,
};