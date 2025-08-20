import express, { Request, Response } from 'express';
import cors from 'cors';
import { searchJobs } from './tools/searchJobs';
import { analyzeMatch } from './tools/analyzeMatch';
import { customizeResume } from './tools/customizeResume';
import { generateCoverLetter } from './tools/generateCoverLetter';
import { trackApplication } from './tools/trackApplication';
import * as path from 'path';
import * as fs from 'fs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from parent directory (where the UI file is located)
const uiPath = path.join(process.cwd(), '..');
console.log(`Serving UI from: ${uiPath}`);
app.use(express.static(uiPath));

// Serve artifacts directory for downloads
const artifactsPath = path.join(process.cwd(), 'artifacts');
app.use('/artifacts', express.static(artifactsPath));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    tools: [
      'search_jobs', 
      'analyze_match', 
      'customize_resume', 
      'generate_cover_letter', 
      'track_application'
    ],
    timestamp: new Date().toISOString()
  });
});

// Main tool endpoint
app.post('/api/tool', async (req: Request, res: Response) => {
  const { tool, arguments: args } = req.body;
  
  console.log(`[API] Calling tool: ${tool}`, args);
  
  try {
    let result;
    
    switch(tool) {
      case 'search_jobs':
        result = await searchJobs(args);
        break;
        
      case 'analyze_match':
        result = await analyzeMatch(args);
        break;
        
      case 'customize_resume':
        result = await customizeResume(args);
        break;
        
      case 'generate_cover_letter':
        result = await generateCoverLetter(args);
        break;
        
      case 'track_application':
        result = await trackApplication(args);
        break;
        
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    // Parse the result and return as JSON
    if (result && result.content && result.content[0]) {
      const parsed = JSON.parse(result.content[0].text);
      res.json({ 
        success: true, 
        tool,
        data: parsed 
      });
    } else {
      throw new Error('Invalid tool response format');
    }
    
  } catch (error) {
    console.error(`[API] Error calling ${tool}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      success: false, 
      tool,
      error: errorMessage 
    });
  }
});

// Batch operation endpoint (process multiple tools in sequence)
app.post('/api/batch', async (req: Request, res: Response) => {
  const { operations } = req.body;
  
  if (!Array.isArray(operations)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Operations must be an array' 
    });
  }
  
  const results = [];
  
  for (const op of operations) {
    try {
      let result;
      
      switch(op.tool) {
        case 'search_jobs':
          result = await searchJobs(op.arguments);
          break;
        case 'analyze_match':
          result = await analyzeMatch(op.arguments);
          break;
        case 'customize_resume':
          result = await customizeResume(op.arguments);
          break;
        case 'generate_cover_letter':
          result = await generateCoverLetter(op.arguments);
          break;
        case 'track_application':
          result = await trackApplication(op.arguments);
          break;
        default:
          throw new Error(`Unknown tool: ${op.tool}`);
      }
      
      const parsed = JSON.parse(result.content[0].text);
      results.push({
        tool: op.tool,
        success: true,
        data: parsed
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        tool: op.tool,
        success: false,
        error: errorMessage
      });
    }
  }
  
  res.json({ 
    success: true, 
    results 
  });
});

// Full pipeline endpoint - search, analyze, customize, generate cover letter
app.post('/api/pipeline', async (req: Request, res: Response) => {
  const { query, location = "Remote" } = req.body;
  
  try {
    console.log('[API] Running full pipeline for:', query);
    
    // Step 1: Search for jobs
    const searchResult = await searchJobs({ 
      query, 
      location, 
      limit: 5 
    });
    const searchData = JSON.parse(searchResult.content[0].text);
    
    if (!searchData.jobs || searchData.jobs.length === 0) {
      return res.json({
        success: false,
        message: 'No jobs found',
        searchData
      });
    }
    
    // Step 2: Analyze each job
    const analyzedJobs = [];
    
    for (const job of searchData.jobs.slice(0, 3)) { // Analyze top 3 jobs
      // Analyze match
      const matchResult = await analyzeMatch({
        job: {
          title: job.title,
          description: job.description
        }
      });
      const matchData = JSON.parse(matchResult.content[0].text);
      
      let customization = null;
      let coverLetter = null;
      
      // Only customize if good match (score > 60)
      if (matchData.score >= 60) {
        // Customize resume
        const customResult = await customizeResume({
          company: job.company,
          role: job.title,
          suggested_summary: `Experienced DevOps Engineer seeking ${job.title} position at ${job.company}.`,
          top_bullets: matchData.matched_keywords.slice(0, 5).map((skill: string) => 
            `Strong experience with ${skill} in production environments`
          )
        });
        customization = JSON.parse(customResult.content[0].text);
        
        // Generate cover letter
        const coverResult = await generateCoverLetter({
          company: job.company,
          role: job.title,
          jd_keywords: matchData.matched_keywords.slice(0, 5),
          resume_win: "Reduced deployment time by 60% through CI/CD automation"
        });
        coverLetter = JSON.parse(coverResult.content[0].text);
      }
      
      analyzedJobs.push({
        job,
        analysis: matchData,
        customization,
        coverLetter
      });
    }
    
    res.json({
      success: true,
      query,
      location,
      total_jobs_found: searchData.jobs.length,
      analyzed_jobs: analyzedJobs
    });
    
  } catch (error) {
    console.error('[API] Pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// Get list of available resumes
app.get('/api/resumes', async (req: Request, res: Response) => {
  try {
    const resumeDir = process.cwd();
    const files = fs.readdirSync(resumeDir);
    
    const resumes = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.pdf', '.docx'].includes(ext) && 
             (file.includes('Kumar') || file.toLowerCase().includes('resume'));
    });
    
    res.json({
      success: true,
      resumes: resumes.map(file => ({
        filename: file,
        path: path.join(resumeDir, file),
        type: path.extname(file).substring(1).toUpperCase()
      }))
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🖥️  UI available at: http://localhost:${PORT}/job_application_assistant_ui_single_file.html`);
  console.log(`\n📌 Available API endpoints:`);
  console.log(`  POST /api/tool - Call individual tools`);
  console.log(`  POST /api/batch - Call multiple tools`);
  console.log(`  POST /api/pipeline - Run full job application pipeline`);
  console.log(`  GET /api/resumes - List available resume files`);
  console.log(`  GET /api/health - Health check`);
});