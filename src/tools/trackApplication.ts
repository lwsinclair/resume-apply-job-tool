import { readJSON, writeJSON, ensureDir } from "../util/fsx";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import * as fs from "fs/promises";
import * as path from "path";

interface TrackApplicationArgs {
  company: string;
  role: string;
  source?: string;
  url?: string;
  score?: number;
  resume_path?: string;
  cover_letter_path?: string;
  status?: "interested" | "applied" | "interviewing" | "rejected" | "offer" | "accepted" | "declined";
}

interface ApplicationRecord {
  id: string;
  date: string;
  company: string;
  role: string;
  source: string;
  url: string;
  status: string;
  score: string;
  resume_path: string;
  cover_letter_path: string;
  notes: string;
}

interface TrackingResult {
  application_id: string;
  saved_path: string;
  message: string;
  stats: {
    total_applications: number;
    by_status: Record<string, number>;
    average_score: number;
  };
}

// Generate unique application ID
function generateApplicationId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `APP-${timestamp}-${random}`;
}

// Load existing applications from CSV
async function loadApplications(): Promise<ApplicationRecord[]> {
  const csvPath = path.join(process.cwd(), "data", "applications.csv");
  
  try {
    const fileContent = await fs.readFile(csvPath, "utf-8");
    
    if (!fileContent.trim()) {
      return [];
    }
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    return records as ApplicationRecord[];
  } catch (error) {
    // File doesn't exist, return empty array
    return [];
  }
}

// Save applications to CSV
async function saveApplications(applications: ApplicationRecord[]): Promise<void> {
  await ensureDir(path.join(process.cwd(), "data"));
  const csvPath = path.join(process.cwd(), "data", "applications.csv");
  
  const columns = [
    "id",
    "date",
    "company",
    "role",
    "source",
    "url",
    "status",
    "score",
    "resume_path",
    "cover_letter_path",
    "notes",
  ];
  
  const csvContent = stringify(applications, {
    header: true,
    columns: columns,
  });
  
  await fs.writeFile(csvPath, csvContent);
}

// Calculate statistics
function calculateStats(applications: ApplicationRecord[]): TrackingResult["stats"] {
  const stats = {
    total_applications: applications.length,
    by_status: {} as Record<string, number>,
    average_score: 0,
  };
  
  let totalScore = 0;
  let scoreCount = 0;
  
  for (const app of applications) {
    // Count by status
    stats.by_status[app.status] = (stats.by_status[app.status] || 0) + 1;
    
    // Calculate average score
    if (app.score) {
      const score = parseFloat(app.score);
      if (!isNaN(score)) {
        totalScore += score;
        scoreCount++;
      }
    }
  }
  
  if (scoreCount > 0) {
    stats.average_score = Math.round(totalScore / scoreCount);
  }
  
  return stats;
}

export async function trackApplication(args: TrackApplicationArgs) {
  const {
    company,
    role,
    source = "Manual",
    url = "",
    score = 0,
    resume_path = "",
    cover_letter_path = "",
    status = "applied",
  } = args;
  
  console.error(`[trackApplication] Tracking application for ${role} at ${company}`);
  
  try {
    // Load existing applications
    const applications = await loadApplications();
    
    // Check for duplicates
    const duplicate = applications.find(
      app => app.company === company && app.role === role && app.status !== "rejected"
    );
    
    if (duplicate) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              warning: "Duplicate application found",
              existing_id: duplicate.id,
              message: `Application for ${role} at ${company} already exists (ID: ${duplicate.id})`,
            }, null, 2),
          },
        ],
      };
    }
    
    // Create new application record
    const applicationId = generateApplicationId();
    const newRecord: ApplicationRecord = {
      id: applicationId,
      date: new Date().toISOString(),
      company,
      role,
      source,
      url,
      status,
      score: score.toString(),
      resume_path,
      cover_letter_path,
      notes: `Application tracked via MCP tool`,
    };
    
    // Add to applications
    applications.push(newRecord);
    
    // Save to CSV
    await saveApplications(applications);
    
    // Calculate statistics
    const stats = calculateStats(applications);
    
    const result: TrackingResult = {
      application_id: applicationId,
      saved_path: path.join(process.cwd(), "data", "applications.csv"),
      message: `Successfully tracked application for ${role} at ${company}`,
      stats,
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: `Failed to track application: ${errorMessage}`,
          }),
        },
      ],
    };
  }
}