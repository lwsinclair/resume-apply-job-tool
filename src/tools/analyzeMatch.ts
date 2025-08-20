import { readJSON } from "../util/fsx";
import { parseResume, parseBestResume, listResumeFiles } from "../util/resumeParser";
import * as path from "path";

interface Job {
  title?: string;
  description: string;
  requirements?: string[];
}

interface AnalyzeMatchArgs {
  job: Job;
  resume_path?: string;
}

interface MatchResult {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  must_have_matches: string[];
  must_have_missing: string[];
  recommendations: string[];
  resume_used: string;
  total_skills_in_resume: number;
  analysis_timestamp: string;
}

// Load skills configuration
async function loadSkills(): Promise<string[]> {
  const skillsPath = path.join(process.cwd(), "config", "skills.json");
  try {
    return await readJSON(skillsPath);
  } catch {
    // Return default skills if file doesn't exist
    return [
      "aws", "kubernetes", "docker", "terraform", "ansible",
      "jenkins", "gitlab", "github", "ci/cd", "python",
      "bash", "linux", "prometheus", "grafana", "elasticsearch"
    ];
  }
}

// Load must-have skills
async function loadMustHave(): Promise<string[]> {
  const mustHavePath = path.join(process.cwd(), "config", "must_have.json");
  try {
    return await readJSON(mustHavePath);
  } catch {
    return ["kubernetes", "aws", "terraform", "ci/cd", "docker"];
  }
}

// Extract keywords from text
function extractKeywords(text: string, skillsList: string[]): Set<string> {
  const normalized = text.toLowerCase();
  const found = new Set<string>();
  
  for (const skill of skillsList) {
    const skillLower = skill.toLowerCase();
    // Simple word boundary matching
    const regex = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, "i");
    if (regex.test(normalized)) {
      found.add(skill);
    }
  }
  
  return found;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Calculate match score
function calculateScore(
  jobKeywords: Set<string>,
  resumeKeywords: Set<string>,
  mustHaveList: string[]
): { score: number; mustHaveMatches: string[]; mustHaveMissing: string[] } {
  let score = 0;
  const mustHaveMatches: string[] = [];
  const mustHaveMissing: string[] = [];
  
  // Calculate keyword match percentage (50% of score)
  const matchedCount = Array.from(jobKeywords).filter(k => resumeKeywords.has(k)).length;
  const keywordScore = jobKeywords.size > 0 
    ? (matchedCount / jobKeywords.size) * 50 
    : 0;
  
  // Check must-have skills (50% of score)
  for (const mustHave of mustHaveList) {
    const mustHaveLower = mustHave.toLowerCase();
    const inJob = Array.from(jobKeywords).some(k => 
      k.toLowerCase().includes(mustHaveLower)
    );
    
    if (inJob) {
      const inResume = Array.from(resumeKeywords).some(k => 
        k.toLowerCase().includes(mustHaveLower)
      );
      
      if (inResume) {
        mustHaveMatches.push(mustHave);
        score += 10; // Each must-have is worth 10 points
      } else {
        mustHaveMissing.push(mustHave);
      }
    }
  }
  
  score += keywordScore;
  
  return {
    score: Math.min(100, Math.round(score)),
    mustHaveMatches,
    mustHaveMissing,
  };
}

// Generate recommendations
function generateRecommendations(
  score: number,
  mustHaveMissing: string[],
  missing: string[],
  matched: string[]
): string[] {
  const recommendations: string[] = [];
  
  if (score >= 80) {
    recommendations.push("✅ Excellent match! Your resume aligns very well with this position.");
    recommendations.push("Consider emphasizing your most relevant achievements in the cover letter.");
    if (matched.length > 0) {
      recommendations.push(`Strong matches: ${matched.slice(0, 5).join(", ")}`);
    }
  } else if (score >= 60) {
    recommendations.push("👍 Good match! Your profile fits many of the requirements.");
    if (mustHaveMissing.length > 0) {
      recommendations.push(`Highlight experience with: ${mustHaveMissing.join(", ")}`);
    }
    if (matched.length > 0) {
      recommendations.push(`Leverage your strengths in: ${matched.slice(0, 5).join(", ")}`);
    }
  } else if (score >= 40) {
    recommendations.push("⚠️ Moderate match. Consider emphasizing transferable skills.");
    recommendations.push(`Key skills to highlight: ${missing.slice(0, 5).join(", ")}`);
  } else {
    recommendations.push("❌ Limited match. Focus on transferable skills and learning potential.");
    recommendations.push("Consider gaining experience in the missing key areas.");
  }
  
  if (mustHaveMissing.length > 0) {
    recommendations.push(`Critical skills gap: ${mustHaveMissing.join(", ")}`);
  }
  
  // Add personalized recommendation based on Kumar's actual skills
  if (score >= 60) {
    recommendations.push("Your strong DevOps background with AWS and Kubernetes is highly relevant.");
  }
  
  return recommendations;
}

export async function analyzeMatch(args: AnalyzeMatchArgs) {
  const { job, resume_path } = args;
  
  console.error(`[analyzeMatch] Analyzing job match with resume: ${resume_path || 'auto-selected'}`);
  
  try {
    // Parse the resume using REAL parser
    let parsedResume;
    let resumeUsed: string;
    
    if (resume_path) {
      // Use specific resume if provided
      parsedResume = await parseResume(resume_path);
      resumeUsed = resume_path;
    } else {
      // Auto-select best resume (Kumar's most recent/comprehensive)
      parsedResume = await parseBestResume();
      resumeUsed = parsedResume.fileName;
    }
    
    console.error(`[analyzeMatch] Using resume: ${resumeUsed}`);
    console.error(`[analyzeMatch] Resume has ${parsedResume.skills.length} skills identified`);
    
    // Load configurations
    const allSkills = await loadSkills();
    const mustHaveList = await loadMustHave();
    
    // Combine job description and requirements
    let jobText = job.description;
    if (job.requirements && job.requirements.length > 0) {
      jobText += "\n" + job.requirements.join("\n");
    }
    if (job.title) {
      jobText = job.title + "\n" + jobText;
    }
    
    // Extract keywords from job
    const jobKeywords = extractKeywords(jobText, allSkills);
    
    // Use skills from parsed resume (REAL DATA!)
    const resumeKeywords = new Set(parsedResume.skills);
    
    // Also extract additional keywords from resume text
    const additionalKeywords = extractKeywords(parsedResume.text, allSkills);
    additionalKeywords.forEach(k => resumeKeywords.add(k));
    
    console.error(`[analyzeMatch] Job keywords: ${jobKeywords.size}, Resume keywords: ${resumeKeywords.size}`);
    
    // Calculate matches
    const matched = Array.from(jobKeywords).filter(k => resumeKeywords.has(k));
    const missing = Array.from(jobKeywords).filter(k => !resumeKeywords.has(k));
    
    // Calculate score
    const { score, mustHaveMatches, mustHaveMissing } = calculateScore(
      jobKeywords,
      resumeKeywords,
      mustHaveList
    );
    
    console.error(`[analyzeMatch] Match score: ${score}%, Matched: ${matched.length}, Missing: ${missing.length}`);
    
    // Generate recommendations
    const recommendations = generateRecommendations(score, mustHaveMissing, missing, matched);
    
    const result: MatchResult = {
      score,
      matched_keywords: matched,
      missing_keywords: missing,
      must_have_matches: mustHaveMatches,
      must_have_missing: mustHaveMissing,
      recommendations,
      resume_used: resumeUsed,
      total_skills_in_resume: resumeKeywords.size,
      analysis_timestamp: new Date().toISOString(),
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
    console.error(`[analyzeMatch] Error:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: `Failed to analyze match: ${errorMessage}`,
          }),
        },
      ],
    };
  }
}