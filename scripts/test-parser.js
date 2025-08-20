#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const resumeParser_js_1 = require("../src/util/resumeParser.js");
const path = __importStar(require("path"));
async function testParser() {
    console.log('🔍 Testing Resume Parser with Actual Files\n');
    console.log('='.repeat(60));
    // Test specific resume files
    const testFiles = [
        './Kumar Madala - DevOps Engineer.pdf',
        './Kumar Madala Resume 2025-updated.docx',
        './Kumar Madala - AWS DevOps Engineer Resume.pdf',
        './templates/base_resume.md', // Also test the markdown template
    ];
    for (const file of testFiles) {
        console.log(`\n📄 Testing: ${path.basename(file)}`);
        console.log('-'.repeat(40));
        try {
            const startTime = Date.now();
            const result = await (0, resumeParser_js_1.parseResume)(file);
            const elapsed = Date.now() - startTime;
            console.log(`✅ Successfully parsed in ${elapsed}ms`);
            console.log(`📊 Text length: ${result.text.length} characters`);
            console.log(`🔧 Skills found: ${result.skills.length}`);
            // Show top skills
            if (result.skills.length > 0) {
                console.log(`📌 Top skills: ${result.skills.slice(0, 15).join(', ')}`);
            }
            // Show a snippet of the extracted text
            const snippet = result.text.substring(0, 200).replace(/\n/g, ' ').trim();
            console.log(`📝 Text snippet: "${snippet}..."`);
        }
        catch (error) {
            console.error(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Test listing all resume files
    console.log('\n\n📁 All Resume Files Found:');
    console.log('='.repeat(60));
    const allResumes = await (0, resumeParser_js_1.listResumeFiles)();
    allResumes.forEach((file, i) => {
        console.log(`  ${i + 1}. ${path.basename(file)}`);
    });
    // Test selecting the best resume
    console.log('\n\n🏆 Best Resume Selection:');
    console.log('='.repeat(60));
    try {
        const best = await (0, resumeParser_js_1.parseBestResume)();
        console.log(`Selected: ${best.fileName}`);
        console.log(`Skills: ${best.skills.length}`);
        console.log(`Top skills: ${best.skills.slice(0, 10).join(', ')}`);
    }
    catch (error) {
        console.error(`Failed to select best resume: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log('\n✨ Resume Parser Test Complete!\n');
}
// Run the test
testParser().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-parser.js.map