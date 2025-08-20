#!/usr/bin/env ts-node

import { parseResume, listResumeFiles, parseBestResume } from '../src/util/resumeParser.js';
import * as path from 'path';

async function testParser() {
  console.log('🔍 Testing Resume Parser with Actual Files\n');
  console.log('=' .repeat(60));
  
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
      const result = await parseResume(file);
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
      
    } catch (error) {
      console.error(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Test listing all resume files
  console.log('\n\n📁 All Resume Files Found:');
  console.log('=' .repeat(60));
  const allResumes = await listResumeFiles();
  allResumes.forEach((file, i) => {
    console.log(`  ${i + 1}. ${path.basename(file)}`);
  });
  
  // Test selecting the best resume
  console.log('\n\n🏆 Best Resume Selection:');
  console.log('=' .repeat(60));
  try {
    const best = await parseBestResume();
    console.log(`Selected: ${best.fileName}`);
    console.log(`Skills: ${best.skills.length}`);
    console.log(`Top skills: ${best.skills.slice(0, 10).join(', ')}`);
  } catch (error) {
    console.error(`Failed to select best resume: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('\n✨ Resume Parser Test Complete!\n');
}

// Run the test
testParser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});