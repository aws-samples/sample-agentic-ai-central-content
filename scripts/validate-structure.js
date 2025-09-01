#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Validate the repository structure based on the rules:
 * - build/blueprints/[name]/ - Must have subdirectories containing .md and/or images
 * - discover/patterns/[name]/ - Must have subdirectories containing .md and/or images
 * - Other directories - Only .md files or images directly in subdirectories
 */
function validateStructure() {
    // Get staged files
    let stagedFiles = [];
    try {
        const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        stagedFiles = result.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        console.log('Warning: Could not get staged files, skipping structure validation');
        return 0;
    }

    const errors = [];
    const allowedExtensions = ['.md', '.svg', '.png', '.jpg', '.jpeg'];

    for (const filePath of stagedFiles) {
        // Skip if it's a config file or in root
        if (filePath.startsWith('.') || filePath.split('/').length <= 1) {
            continue;
        }

        const pathParts = filePath.split('/');
        const extension = path.extname(filePath);

        // Check build/blueprints structure
        if (pathParts[0] === 'build' && pathParts[1] === 'blueprints') {
            if (pathParts.length < 4) {
                errors.push(`❌ ${filePath}: Files in build/blueprints must be in a subdirectory`);
            } else {
                const dirPath = pathParts.slice(0, 3).join('/');
                if (!hasValidFiles(dirPath, allowedExtensions)) {
                    errors.push(`❌ ${filePath}: Directory ${dirPath} must contain .md and/or image files`);
                }
            }
        }
        // Check discover/patterns structure
        else if (pathParts[0] === 'discover' && pathParts[1] === 'patterns') {
            if (pathParts.length < 4) {
                errors.push(`❌ ${filePath}: Files in discover/patterns must be in a subdirectory`);
            } else {
                const dirPath = pathParts.slice(0, 3).join('/');
                if (!hasValidFiles(dirPath, allowedExtensions)) {
                    errors.push(`❌ ${filePath}: Directory ${dirPath} must contain .md and/or image files`);
                }
            }
        }
        // Check other directories (should only contain .md or images directly)
        else if (['discover', 'learn'].includes(pathParts[0])) {
            if (pathParts.length > 2) {
                errors.push(`❌ ${filePath}: Files in ${pathParts[0]} should be directly in subdirectories, not nested`);
            } else if (!allowedExtensions.includes(extension)) {
                errors.push(`❌ ${filePath}: Only .md and image files allowed in ${pathParts[0]}`);
            }
        }
    }

    if (errors.length > 0) {
        console.log('Repository structure validation failed:');
        errors.forEach(error => console.log(error));
        console.log('\nExpected structure:');
        console.log('├── build/blueprints/[name]/');
        console.log('│   ├── [name].md');
        console.log('│   └── [images]');
        console.log('├── discover/patterns/[name]/');
        console.log('│   ├── pattern.md');
        console.log('│   └── [images]');
        console.log('├── discover/services-frameworks/');
        console.log('│   └── [name].md');
        console.log('└── learn/[category]/');
        console.log('    └── [name].md');
        return 1;
    }

    console.log('✅ Repository structure validation passed');
    return 0;
}

/**
 * Check if a directory contains valid files with allowed extensions
 */
function hasValidFiles(dirPath, allowedExtensions) {
    try {
        const files = fs.readdirSync(dirPath);
        return files.some(file => {
            const extension = path.extname(file);
            return allowedExtensions.includes(extension);
        });
    } catch (error) {
        return false;
    }
}

// Run validation
process.exit(validateStructure()); 