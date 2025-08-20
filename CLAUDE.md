# Resume Apply Job Tool - MCP Server

## Day 1 MVP Scope
- Search jobs from Indeed RSS
- Analyze job-resume match with keyword scoring
- Customize resume using template swaps
- Generate cover letters
- Track applications in CSV

## Architecture
- TypeScript MCP server
- JSON file storage
- Template-based customization
- Simple keyword matching

## Available Tools

### 1. search_jobs
Search for jobs from Indeed RSS or local fallback
- Input: query, location, job_type
- Returns: Array of job listings with title, company, location, description, url

### 2. analyze_match
Calculate match score between job and resume
- Input: job_description, resume_text
- Returns: match_score (0-100), matched_keywords, missing_keywords, recommendations

### 3. customize_resume
Customize resume using template swaps based on job requirements
- Input: job_description, template_path
- Returns: customized_resume_path, changes_made

### 4. generate_cover_letter
Generate cover letter from template
- Input: job_title, company, job_description
- Returns: cover_letter_path

### 5. track_application
Track job applications in CSV
- Input: job_info, status, notes
- Returns: application_id, saved_path

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run e2e tests
npm test
```

## File Structure
```
resume-apply-job-tool/
├── src/
│   ├── index.ts            # MCP server entry point
│   ├── tools/              # Tool implementations
│   │   ├── searchJobs.ts
│   │   ├── analyzeMatch.ts
│   │   ├── customizeResume.ts
│   │   ├── generateCoverLetter.ts
│   │   └── trackApplication.ts
│   └── util/               # Utility functions
│       ├── storage.ts
│       ├── parser.ts
│       └── matcher.ts
├── templates/              # Resume and cover letter templates
│   ├── base_resume.md
│   └── cover_letter.md
├── config/                 # Configuration files
│   ├── skills.json
│   ├── titles.json
│   └── must_have.json
├── data/                   # Data storage
│   ├── applications.csv
│   └── jobs_cache.json
├── artifacts/              # Generated resumes and cover letters
└── scripts/                # Utility scripts
    └── e2e.ts

```

## Usage Example

```typescript
// Search for DevOps jobs
const jobs = await searchJobs({
  query: "DevOps Engineer",
  location: "Remote",
  job_type: "fulltime"
});

// Analyze match with first job
const match = await analyzeMatch({
  job_description: jobs[0].description,
  resume_text: readFileSync('templates/base_resume.md', 'utf-8')
});

// If good match, customize resume
if (match.score > 70) {
  const resume = await customizeResume({
    job_description: jobs[0].description,
    template_path: 'templates/base_resume.md'
  });
  
  // Generate cover letter
  const coverLetter = await generateCoverLetter({
    job_title: jobs[0].title,
    company: jobs[0].company,
    job_description: jobs[0].description
  });
  
  // Track application
  await trackApplication({
    job_info: jobs[0],
    status: 'applied',
    notes: `Match score: ${match.score}%`
  });
}
```

## Configuration

### skills.json
List of technical skills for keyword matching

### titles.json
Job title variations organized by category

### must_have.json
Critical skills that should always be highlighted

## Data Storage

### applications.csv
Tracks all job applications with columns:
- id
- date
- company
- title
- location
- url
- status
- match_score
- resume_path
- cover_letter_path
- notes

### jobs_cache.json
Caches job search results to avoid repeated API calls

## Development Notes

- Template customization uses marker-based replacement (<!-- SECTION:START --> markers)
- Match scoring uses keyword frequency and must-have requirements
- Cover letters use variable substitution (${VARIABLE} format)
- All artifacts are timestamped and stored in artifacts/ directory

## Testing

Run e2e tests to verify all tools are working:
```bash
npm test
```

This will:
1. Search for sample jobs
2. Analyze match scores
3. Generate customized resume
4. Create cover letter
5. Track application
6. Verify all outputs