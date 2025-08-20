#!/usr/bin/env node
import { spawn } from 'child_process';

// Dynamic import for open (ESM module)
async function launch() {
  console.log(`
🚀 Launching Job Application Assistant...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Start the API server
  console.log('📡 Starting API server...\n');
  const server = spawn('npm', ['run', 'api'], { 
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Wait a moment for server to start, then open browser
  setTimeout(async () => {
    const url = 'http://localhost:3001/job_application_assistant_ui_single_file.html';
    console.log(`\n✨ Opening browser to: ${url}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 The Job Application Assistant is ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
      // Dynamic import for ESM module
      const open = (await import('open')).default;
      await open(url);
      console.log('✅ Browser opened successfully!');
    } catch (e) {
      console.log('⚠️  Could not open browser automatically.');
      console.log(`📌 Please open your browser manually to: ${url}`);
    }
    
    console.log('\n💡 Tips:');
    console.log('  • Search for "DevOps Engineer" or "Cloud Architect"');
    console.log('  • Click on job URLs to apply directly');
    console.log('  • Download customized resumes and cover letters');
    console.log('  • Press Ctrl+C to stop the server\n');
  }, 3000);

  // Handle exit gracefully
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Job Application Assistant...');
    server.kill();
    process.exit();
  });

  process.on('SIGTERM', () => {
    server.kill();
    process.exit();
  });

  // Keep the script running
  process.stdin.resume();
}

// Run the launcher
launch().catch(error => {
  console.error('❌ Failed to launch:', error);
  process.exit(1);
});