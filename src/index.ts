#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { searchJobs } from "./tools/searchJobs.js";
import { analyzeMatch } from "./tools/analyzeMatch.js";
import { customizeResume } from "./tools/customizeResume.js";
import { generateCoverLetter } from "./tools/generateCoverLetter.js";
import { trackApplication } from "./tools/trackApplication.js";

// Server metadata
const SERVER_NAME = "resume-apply-job-tool";
const SERVER_VERSION = "1.0.0";

// Logging utility
function log(level: "info" | "error" | "debug", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (level === "error") {
    console.error(logMessage, data || "");
  } else {
    console.error(logMessage, data || ""); // Use stderr for all logs
  }
}

// Tool definitions with detailed schemas
const TOOLS: Tool[] = [
  {
    name: "search_jobs",
    description: "Search for job listings from various sources (Indeed RSS, local cache, or mock data)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Job search query (e.g., 'DevOps Engineer', 'Cloud Architect')",
        },
        location: {
          type: "string",
          description: "Job location (e.g., 'Remote', 'New York, NY')",
          default: "Remote",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10,
          minimum: 1,
          maximum: 50,
        },
        source: {
          type: "string",
          enum: ["indeed", "cache", "mock"],
          description: "Data source for job listings",
          default: "indeed",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "analyze_match",
    description: "Analyze how well a resume matches a job description and provide a match score",
    inputSchema: {
      type: "object",
      properties: {
        job: {
          type: "object",
          description: "Job details to analyze",
          properties: {
            title: {
              type: "string",
              description: "Job title",
            },
            description: {
              type: "string",
              description: "Full job description",
            },
            requirements: {
              type: "array",
              items: { type: "string" },
              description: "List of job requirements",
            },
          },
          required: ["description"],
        },
        resume_path: {
          type: "string",
          description: "Path to the resume file (markdown or PDF)",
          default: "templates/base_resume.md",
        },
      },
      required: ["job"],
    },
  },
  {
    name: "customize_resume",
    description: "Customize a resume template based on job requirements",
    inputSchema: {
      type: "object",
      properties: {
        base_template: {
          type: "string",
          description: "Path to the base resume template",
          default: "templates/base_resume.md",
        },
        suggested_summary: {
          type: "string",
          description: "Customized professional summary for the role",
        },
        top_bullets: {
          type: "array",
          items: { type: "string" },
          description: "Top experience bullets to highlight",
          maxItems: 6,
        },
        company: {
          type: "string",
          description: "Target company name",
        },
        role: {
          type: "string",
          description: "Target role/position",
        },
      },
      required: ["company", "role"],
    },
  },
  {
    name: "generate_cover_letter",
    description: "Generate a customized cover letter for a specific job application",
    inputSchema: {
      type: "object",
      properties: {
        template: {
          type: "string",
          description: "Path to cover letter template",
          default: "templates/cover_letter.md",
        },
        company: {
          type: "string",
          description: "Company name",
        },
        role: {
          type: "string",
          description: "Job title/role",
        },
        jd_keywords: {
          type: "array",
          items: { type: "string" },
          description: "Key skills/keywords from job description",
        },
        resume_win: {
          type: "string",
          description: "A key achievement from resume to highlight",
        },
      },
      required: ["company", "role"],
    },
  },
  {
    name: "track_application",
    description: "Track a job application in the application tracking system",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Company name",
        },
        role: {
          type: "string",
          description: "Job title/role",
        },
        source: {
          type: "string",
          description: "Where the job was found (e.g., 'Indeed', 'LinkedIn', 'Company Website')",
        },
        url: {
          type: "string",
          description: "Job posting URL",
        },
        score: {
          type: "number",
          description: "Match score (0-100)",
          minimum: 0,
          maximum: 100,
        },
        resume_path: {
          type: "string",
          description: "Path to the customized resume used",
        },
        cover_letter_path: {
          type: "string",
          description: "Path to the cover letter used",
        },
        status: {
          type: "string",
          enum: ["interested", "applied", "interviewing", "rejected", "offer", "accepted", "declined"],
          description: "Application status",
          default: "applied",
        },
      },
      required: ["company", "role"],
    },
  },
];

// Main server implementation
async function main() {
  log("info", `Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  // Create server instance
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    log("debug", "Handling list tools request");
    return { tools: TOOLS };
  });

  // Handle tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    log("info", `Executing tool: ${name}`, { args });

    try {
      let result;
      
      switch (name) {
        case "search_jobs": {
          const { query, location, limit, source } = args as any;
          result = await searchJobs({ query, location, limit, source });
          break;
        }
        
        case "analyze_match": {
          const { job, resume_path } = args as any;
          result = await analyzeMatch({ job, resume_path });
          break;
        }
        
        case "customize_resume": {
          const { base_template, suggested_summary, top_bullets, company, role } = args as any;
          result = await customizeResume({
            base_template,
            suggested_summary,
            top_bullets,
            company,
            role,
          });
          break;
        }
        
        case "generate_cover_letter": {
          const { template, company, role, jd_keywords, resume_win } = args as any;
          result = await generateCoverLetter({
            template,
            company,
            role,
            jd_keywords,
            resume_win,
          });
          break;
        }
        
        case "track_application": {
          const { company, role, source, url, score, resume_path, cover_letter_path, status } = args as any;
          result = await trackApplication({
            company,
            role,
            source,
            url,
            score,
            resume_path,
            cover_letter_path,
            status,
          });
          break;
        }
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
      
      log("info", `Tool ${name} executed successfully`);
      return result;
      
    } catch (error) {
      log("error", `Tool ${name} failed`, error);
      
      if (error instanceof McpError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              message: errorMessage,
              tool: name,
            }),
          },
        ],
      };
    }
  });

  // Start server on stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  log("info", `${SERVER_NAME} MCP server is running on stdio transport`);
  log("info", "Ready to accept connections");
}

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  log("error", "Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log("error", "Unhandled rejection", { reason, promise });
  process.exit(1);
});

// Start the server
main().catch((error) => {
  log("error", "Fatal error starting server", error);
  process.exit(1);
});