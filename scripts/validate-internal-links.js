#!/usr/bin/env node

/**
 * Internal link validation for EarnProof frontend
 * 
 * This script scans the codebase for internal navigation links and
 * validates that they point to existing routes.
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..');

// Get route manifest
const manifest = require('./generate-route-manifest').generateRouteManifest();
const validRoutes = new Set(manifest.map(route => route.route));

// Patterns to match internal links
const LINK_PATTERNS = [
  // Next.js Link component
  /<Link[^>]*href=["']([^"']+)["'][^>]*>/g,
  // next/navigation useRouter
  /router\.push\(["']([^"']+)["']\)/g,
  /router\.replace\(["']([^"']+)["']\)/g,
  // next/navigation redirect
  /redirect\(["']([^"']+)["']\)/g,
  // Anchor tags with internal paths (starting with /)
  /<a[^>]*href=["'](\/[^"']*)["'][^>]*>/g,
];

// Exclude patterns (external URLs, fragments, etc.)
const EXCLUDE_PATTERNS = [
  /^http/,
  /^mailto:/,
  /^tel:/,
  /^#/,
  /^\?/,
  /^javascript:/,
];

function isExternalLink(href) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(href));
}

function normalizeRoute(route) {
  // Remove query strings and fragments
  const normalized = route.split('?')[0].split('#')[0];
  // Remove leading slash for comparison with manifest
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.substring(1) : normalized;
  // Convert to forward slashes for consistency (Windows paths use backslashes)
  return withoutLeadingSlash.replace(/\\/g, '/');
}

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

function extractLinksFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [];
  
  for (const pattern of LINK_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const href = match[1];
      if (!isExternalLink(href)) {
        links.push({
          href: normalizeRoute(href),
          file: path.relative(APP_ROOT, filePath),
          line: getLineNumber(content, match.index)
        });
      }
    }
  }
  
  return links;
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

function validateLinks() {
  console.log('Scanning for internal links...');
  
  const sourceFiles = findFiles(path.join(APP_ROOT, 'app'))
    .concat(findFiles(path.join(APP_ROOT, 'components')))
    .concat(findFiles(path.join(APP_ROOT, 'lib')));
  
  console.log(`Scanning ${sourceFiles.length} source files...`);
  
  const allLinks = [];
  sourceFiles.forEach(file => {
    allLinks.push(...extractLinksFromFile(file));
  });
  
  console.log(`Found ${allLinks.length} internal links`);
  
  const errors = [];
  const warnings = [];
  
  for (const link of allLinks) {
    const { href, file, line } = link;
    
    if (href === '' || href === '/') {
      continue; // Root path is always valid
    }
    
    // Check if route exists in manifest
    if (!validRoutes.has(href)) {
      // Check if it's a dynamic route pattern
      const isDynamicRoute = href.includes('[') && href.includes(']');
      
      if (isDynamicRoute) {
        warnings.push(`[DYNAMIC_ROUTE] ${file}:${line} - Dynamic route "${href}" cannot be statically validated`);
      } else {
        errors.push(`[MISSING_ROUTE] ${file}:${line} - Link to "${href}" points to non-existent route`);
      }
    }
  }
  
  return { errors, warnings, links: allLinks };
}

function main() {
  const { errors, warnings, links } = validateLinks();
  
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('\nValidation errors found:');
    errors.forEach(error => console.error(`  ${error}`));
    
    // Print summary of valid routes for reference
    console.log('\nValid routes (normalized):');
    Array.from(validRoutes).sort().forEach(route => {
      console.log(`  /${route}`);
    });
    
    process.exit(1);
  } else {
    console.log('\nAll internal link validations passed!');
    console.log(`Checked ${links.length} links against ${validRoutes.size} valid routes`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateLinks,
  findFiles,
  extractLinksFromFile
};