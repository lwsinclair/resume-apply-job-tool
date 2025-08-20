import { readMarkdown, writeMarkdown, ensureDir } from "../util/fsx";
import * as path from "path";

interface CustomizeResumeArgs {
  base_template?: string;
  suggested_summary?: string;
  top_bullets?: string[];
  company: string;
  role: string;
}

interface CustomizationResult {
  resume_path: string;
  changes_made: string[];
  timestamp: string;
}

// Stub implementation for resume customization
export async function customizeResume(args: CustomizeResumeArgs) {
  const {
    base_template = "templates/base_resume.md",
    suggested_summary,
    top_bullets = [],
    company,
    role,
  } = args;

  console.error(`[customizeResume] Customizing resume for ${role} at ${company}`);

  try {
    // Load base template
    const templateContent = await readMarkdown(base_template);
    let customizedContent = templateContent;
    const changes: string[] = [];

    // Replace summary if provided
    if (suggested_summary) {
      const summaryRegex = /<!-- SUMMARY:START -->[\s\S]*?<!-- SUMMARY:END -->/;
      if (summaryRegex.test(customizedContent)) {
        customizedContent = customizedContent.replace(
          summaryRegex,
          `<!-- SUMMARY:START -->\n${suggested_summary}\n<!-- SUMMARY:END -->`
        );
        changes.push("Updated professional summary");
      }
    } else {
      // Default summary customization
      const defaultSummary = `Experienced DevOps/Cloud Engineer seeking ${role} position at ${company}. Bringing expertise in AWS, Kubernetes, and CI/CD pipelines.`;
      customizedContent = customizedContent.replace(
        /<!-- SUMMARY:START -->[\s\S]*?<!-- SUMMARY:END -->/,
        `<!-- SUMMARY:START -->\n${defaultSummary}\n<!-- SUMMARY:END -->`
      );
      changes.push("Generated targeted professional summary");
    }

    // Update highlights if provided
    if (top_bullets.length > 0) {
      const highlightsSection = top_bullets.map(bullet => `- ${bullet}`).join("\n");
      customizedContent = customizedContent.replace(
        /<!-- HIGHLIGHTS:START -->[\s\S]*?<!-- HIGHLIGHTS:END -->/,
        `<!-- HIGHLIGHTS:START -->\n${highlightsSection}\n<!-- HIGHLIGHTS:END -->`
      );
      changes.push(`Updated ${top_bullets.length} key highlights`);
    }

    // Save customized resume
    await ensureDir(path.join(process.cwd(), "artifacts"));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const safeCompany = company.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const safeRole = role.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const filename = `resume_${safeCompany}_${safeRole}_${timestamp}.md`;
    const resumePath = path.join(process.cwd(), "artifacts", filename);
    
    await writeMarkdown(resumePath, customizedContent);

    const result: CustomizationResult = {
      resume_path: resumePath,
      changes_made: changes,
      timestamp: new Date().toISOString(),
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
            message: `Failed to customize resume: ${errorMessage}`,
          }),
        },
      ],
    };
  }
}