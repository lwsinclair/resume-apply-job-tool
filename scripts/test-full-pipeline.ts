#!/usr/bin/env ts-node

import { searchJobs } from '../src/tools/searchJobs.js';
import { analyzeMatch } from '../src/tools/analyzeMatch.js';
import { customizeResume } from '../src/tools/customizeResume.js';
import { generateCoverLetter } from '../src/tools/generateCoverLetter.js';
import { trackApplication } from '../src/tools/trackApplication.js';

async function testFullPipeline() {
  console.log('🚀 Testing Full Pipeline with REAL Data\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Search for REAL jobs
    console.log('\n📍 Step 1: Searching for DevOps Engineer jobs...');
    const searchResult = await searchJobs({
      query: "DevOps Engineer",
      location: "Remote",
      limit: 3
    });
    
    const searchData = JSON.parse(searchResult.content[0].text);
    console.log(`✅ Found ${searchData.results_count} jobs from ${searchData.source}`);
    
    if (searchData.jobs.length === 0) {
      console.error('❌ No jobs found to analyze');
      return;
    }
    
    // Take the first job for full pipeline test
    const job = searchData.jobs[0];
    console.log(`\n📋 Selected Job:`);
    console.log(`  Title: ${job.title}`);
    console.log(`  Company: ${job.company}`);
    console.log(`  URL: ${job.url}`);
    console.log(`  Source: ${job.source}`);
    
    // Step 2: Analyze match with REAL resume
    console.log('\n📍 Step 2: Analyzing match with Kumar\'s actual resume...');
    const matchResult = await analyzeMatch({
      job: {
        title: job.title,
        description: job.description
      }
      // resume_path is not provided, so it will auto-select best resume
    });
    
    const matchData = JSON.parse(matchResult.content[0].text);
    console.log(`✅ Match Analysis Complete:`);
    console.log(`  Score: ${matchData.score}%`);
    console.log(`  Resume Used: ${matchData.resume_used}`);
    console.log(`  Total Skills in Resume: ${matchData.total_skills_in_resume}`);
    console.log(`  Matched Keywords: ${matchData.matched_keywords.length}`);
    console.log(`  Top Matches: ${matchData.matched_keywords.slice(0, 5).join(', ')}`);
    
    if (matchData.recommendations && matchData.recommendations.length > 0) {
      console.log(`  Recommendations:`);
      matchData.recommendations.slice(0, 3).forEach((rec: string) => {
        console.log(`    - ${rec}`);
      });
    }
    
    // Step 3: Customize resume if good match
    if (matchData.score >= 60) {
      console.log('\n📍 Step 3: Customizing resume for this position...');
      
      const customResult = await customizeResume({
        company: job.company,
        role: job.title,
        suggested_summary: `Experienced DevOps Engineer with ${matchData.total_skills_in_resume}+ technical skills, seeking ${job.title} position at ${job.company}.`,
        top_bullets: matchData.matched_keywords.slice(0, 5).map((skill: string) => 
          `Expert-level proficiency in ${skill} with proven track record in production environments`
        )
      });
      
      const customData = JSON.parse(customResult.content[0].text);
      console.log(`✅ Resume Customized:`);
      console.log(`  Output Path: ${customData.resume_path}`);
      console.log(`  Changes Made: ${customData.changes_made.length}`);
      customData.changes_made.forEach((change: string) => {
        console.log(`    - ${change}`);
      });
      
      // Step 4: Generate cover letter
      console.log('\n📍 Step 4: Generating cover letter...');
      
      const coverResult = await generateCoverLetter({
        company: job.company,
        role: job.title,
        jd_keywords: matchData.matched_keywords.slice(0, 5),
        resume_win: "Architected and deployed Kubernetes infrastructure supporting 10M+ users with 99.99% uptime"
      });
      
      const coverData = JSON.parse(coverResult.content[0].text);
      console.log(`✅ Cover Letter Generated:`);
      console.log(`  Output Path: ${coverData.cover_letter_path}`);
      
      // Step 5: Track application
      console.log('\n📍 Step 5: Tracking application...');
      
      const trackResult = await trackApplication({
        company: job.company,
        role: job.title,
        source: job.source,
        url: job.url,
        score: matchData.score,
        resume_path: customData.resume_path,
        cover_letter_path: coverData.cover_letter_path,
        status: "interested"
      });
      
      const trackData = JSON.parse(trackResult.content[0].text);
      console.log(`✅ Application Tracked:`);
      console.log(`  Application ID: ${trackData.application_id}`);
      console.log(`  Saved to: ${trackData.saved_path}`);
      if (trackData.stats) {
        console.log(`  Total Applications: ${trackData.stats.total_applications}`);
      }
      
      // Final summary
      console.log('\n' + '=' .repeat(60));
      console.log('📊 PIPELINE COMPLETE - Ready for Kumar to Apply!\n');
      console.log('Summary:');
      console.log(`  ✅ Job Found: ${job.title} at ${job.company}`);
      console.log(`  ✅ Match Score: ${matchData.score}%`);
      console.log(`  ✅ Resume Customized: ${customData.resume_path}`);
      console.log(`  ✅ Cover Letter Ready: ${coverData.cover_letter_path}`);
      console.log(`  ✅ Application Tracked: ID ${trackData.application_id}`);
      console.log(`\n  🔗 Apply Here: ${job.url}`);
      
    } else {
      console.log(`\n⚠️ Match score too low (${matchData.score}%) - skipping customization`);
      console.log('Consider applying to jobs with better skill alignment.');
    }
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error);
  }
  
  console.log('\n✨ Full Pipeline Test Complete!\n');
}

// Run the test
testFullPipeline().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});