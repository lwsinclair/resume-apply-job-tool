#!/usr/bin/env ts-node

import { searchJobs } from '../src/tools/searchJobs.js';

async function testRealJobSearch() {
  console.log('🔍 Testing REAL Job Search with Clickable URLs\n');
  console.log('=' .repeat(60));
  
  const testQueries = [
    { query: "DevOps Engineer", location: "Remote" },
    { query: "Cloud Architect", location: "Remote" },
    { query: "Site Reliability Engineer", location: "Remote" },
    { query: "Platform Engineer", location: "Remote" },
  ];
  
  for (const { query, location } of testQueries) {
    console.log(`\n📋 Search: "${query}" in "${location}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await searchJobs({ 
        query, 
        location, 
        limit: 5,
        source: "indeed" // Try Indeed first
      });
      
      const data = JSON.parse(result.content[0].text);
      
      console.log(`✅ Found ${data.results_count} jobs from ${data.source}`);
      console.log('\n🔗 REAL Job URLs:');
      
      data.jobs.forEach((job: any, i: number) => {
        console.log(`\n  ${i + 1}. ${job.title}`);
        console.log(`     Company: ${job.company}`);
        console.log(`     URL: ${job.url}`);
        console.log(`     Source: ${job.source}`);
        
        // Verify it's a real URL
        if (job.url.startsWith('http')) {
          console.log(`     ✅ CLICKABLE URL - Kumar can apply here!`);
        } else {
          console.log(`     ❌ Invalid URL`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n\n🎯 Testing Indeed RSS Directly:');
  console.log('=' .repeat(60));
  
  // Test Indeed RSS specifically
  try {
    const result = await searchJobs({
      query: "DevOps Engineer AWS",
      location: "United States",
      limit: 3,
      source: "indeed"
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`\nIndeed RSS Status: ${data.message}`);
    console.log(`Jobs found: ${data.results_count}`);
    
    if (data.jobs.length > 0) {
      console.log('\nSample Indeed job:');
      const job = data.jobs[0];
      console.log(`  Title: ${job.title}`);
      console.log(`  URL: ${job.url}`);
      console.log(`  Can Kumar click this? ${job.url.includes('indeed.com') ? 'YES ✅' : 'MAYBE ⚠️'}`);
    }
  } catch (error) {
    console.error('Indeed RSS test failed:', error);
  }
  
  console.log('\n✨ Real Job Search Test Complete!\n');
  console.log('Summary: Every job should have a clickable URL that Kumar can use to apply.\n');
}

// Run the test
testRealJobSearch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});