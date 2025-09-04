[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/krm2831-resume-apply-job-tool-badge.png)](https://mseep.ai/app/krm2831-resume-apply-job-tool)

# Resume Apply Job Tool - MCP Server

An automated job application assistant built as an MCP (Model Context Protocol) server that helps streamline the job search and application process.

## Features

- **Job Search**: Search jobs from Indeed RSS, RemoteOK API, or cached data
- **Resume Analysis**: Calculate match scores between jobs and resumes
- **Resume Customization**: Generate tailored resumes for specific positions
- **Cover Letter Generation**: Create personalized cover letters
- **Application Tracking**: Track all applications in CSV format
- **Web Interface**: User-friendly UI for managing the entire process

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/resume-apply-job-tool.git
cd resume-apply-job-tool

# Install dependencies
npm install
```

### Running the Application

```bash
# Launch with web UI (recommended)
npm run launch

# Or run individual components:
npm run dev     # Development mode with hot reload
npm run api     # Start HTTP API server only
npm test        # Run end-to-end tests
```

The web interface will open automatically at http://localhost:3001/job_application_assistant_ui_single_file.html

## Project Structure

```
resume-apply-job-tool/
├── src/
│   ├── index.ts            # MCP server entry point
│   ├── http-server.ts      # HTTP API wrapper
│   ├── tools/              # Tool implementations
│   │   ├── searchJobs.ts
│   │   ├── analyzeMatch.ts
│   │   ├── customizeResume.ts
│   │   ├── generateCoverLetter.ts
│   │   └── trackApplication.ts
│   └── util/               # Utility functions
│       ├── fsx.ts          # File system utilities
│       └── resumeParser.ts # Resume parsing logic
├── templates/              # Resume and cover letter templates
│   ├── base_resume.md
│   └── cover_letter.md
├── config/                 # Configuration files
│   ├── skills.json         # Technical skills list
│   ├── titles.json         # Job title variations
│   └── must_have.json      # Critical skills
├── data/                   # Data storage (gitignored)
├── artifacts/              # Generated resumes/letters (gitignored)
├── scripts/                # Utility scripts
│   ├── e2e.ts             # End-to-end tests
│   └── launch.ts          # Application launcher
└── public/                 # Web UI files
```

## API Endpoints

The HTTP server exposes the following endpoints:

- `GET /api/health` - Health check
- `POST /api/search-jobs` - Search for job listings
- `POST /api/analyze-match` - Analyze job-resume match
- `POST /api/customize-resume` - Generate customized resume
- `POST /api/generate-cover-letter` - Create cover letter
- `POST /api/track-application` - Track job application

## Configuration

### Setting Up Your Resume

1. Add your resume to the `templates/` directory as `base_resume.md`
2. The system also supports PDF and DOCX files in the root directory

### Customizing Skills

Edit the configuration files in `config/`:
- `skills.json` - Add technical skills to track
- `must_have.json` - Define critical skills for scoring
- `titles.json` - Configure job title variations

## Usage Example

```javascript
// Search for jobs
const jobs = await fetch('/api/search-jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'DevOps Engineer',
    location: 'Remote',
    limit: 10
  })
});

// Analyze match with a job
const match = await fetch('/api/analyze-match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job: {
      description: 'Job description text...',
      title: 'Senior DevOps Engineer'
    }
  })
});
```

## MCP Server Integration

This tool implements the Model Context Protocol and can be integrated with MCP-compatible clients.

### Available Tools

1. **search_jobs** - Search job listings from various sources
2. **analyze_match** - Calculate job-resume match score
3. **customize_resume** - Generate tailored resumes
4. **generate_cover_letter** - Create personalized cover letters
5. **track_application** - Track job applications

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Start API server only
npm run api:dev
```

## Security Notes

- Personal resumes (PDF/DOCX) are gitignored by default
- Application data and generated artifacts are not committed
- Sensitive configuration should use environment variables

## Technologies Used

- **TypeScript** - Type-safe development
- **MCP SDK** - Model Context Protocol implementation
- **Express** - HTTP API server
- **Mammoth** - DOCX parsing
- **pdf-parse** - PDF text extraction
- **Axios** - HTTP client for job APIs
- **fast-xml-parser** - RSS feed parsing

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

Kumar Madala

## Acknowledgments

- Built with the Model Context Protocol SDK
- Job data sourced from Indeed RSS and RemoteOK API