#!/usr/bin/env ts-node

import { searchJobs } from '../src/tools/searchJobs';

async function debugJobSearch() {
  console.log('🔍 Testing Job Search with Debug Info\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('\nTest 1: Search with source=indeed (should try real sources)');
    const result1 = await searchJobs({
      query: "DevOps Engineer",
      location: "Remote",
      limit: 3,
      source: "indeed"
    });
    
    const data1 = JSON.parse(result1.content[0].text);
    console.log(`Result: ${data1.results_count} jobs from ${data1.source}`);
    if (data1.jobs.length > 0) {
      console.log(`First job: ${data1.jobs[0].title} at ${data1.jobs[0].company}`);
      console.log(`URL: ${data1.jobs[0].url}`);
      console.log(`Is real URL? ${data1.jobs[0].url.includes('indeed.com') || data1.jobs[0].url.includes('remoteok.com')}`);
    }
    
    console.log('\n' + '-'.repeat(40));
    console.log('\nTest 2: Force RemoteOK by using cache first');
    
    // Clear any existing source preference
    const result2 = await searchJobs({
      query: "Engineer",
      location: "Remote", 
      limit: 5
    });
    
    const data2 = JSON.parse(result2.content[0].text);
    console.log(`Result: ${data2.results_count} jobs from ${data2.source}`);
    data2.jobs.forEach((job: any, i: number) => {
      console.log(`${i+1}. ${job.title} - ${job.url.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugJobSearch();