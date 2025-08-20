import { readMarkdown, writeMarkdown, ensureDir } from "../util/fsx";
import * as path from "path";

interface GenerateCoverLetterArgs {
  template?: string;
  company: string;
  role: string;
  jd_keywords?: string[];
  resume_win?: string;
}

interface CoverLetterResult {
  cover_letter_path: string;
  timestamp: string;
}

// Generate cover letter from template
export async function generateCoverLetter(args: GenerateCoverLetterArgs) {
  const {
    template = "templates/cover_letter.md",
    company,
    role,
    jd_keywords = [],
    resume_win,
  } = args;

  console.error(`[generateCoverLetter] Generating cover letter for ${role} at ${company}`);

  try {
    // Load template
    const templateContent = await readMarkdown(template);
    
    // Prepare replacements
    const keySkills = jd_keywords.length > 0 
      ? jd_keywords.slice(0, 3).join(", ")
      : "cloud infrastructure, automation, and DevOps practices";
    
    const achievement = resume_win || 
      "architected and deployed a Kubernetes-based platform that reduced deployment time by 60% while improving system reliability";
    
    const hook = jd_keywords.length > 0
      ? `With my extensive experience in ${jd_keywords[0]} and ${jd_keywords[1] || "cloud technologies"}, I am confident I can make an immediate impact in this role.`
      : "I am excited about the opportunity to bring my DevOps expertise to your team.";
    
    const align1 = `I have extensive hands-on experience with ${jd_keywords[0] || "cloud infrastructure"}, having implemented and managed enterprise-scale solutions`;
    const align2 = `my proficiency in ${jd_keywords[1] || "automation"} and ${jd_keywords[2] || "CI/CD"} has enabled me to deliver robust, scalable solutions`;
    
    // Replace variables in template
    let coverLetter = templateContent;
    const replacements: Record<string, string> = {
      "${COMPANY}": company,
      "${ROLE}": role,
      "${HOOK}": hook,
      "${ALIGN_1}": align1,
      "${ALIGN_2}": align2,
      "${RESUME_WIN}": achievement,
      "${CONTRIBUTION}": "make an immediate impact by leveraging my expertise in cloud infrastructure and DevOps practices",
      "${COMPANY_INTEREST}": "your commitment to technical excellence and innovation",
      "${RELEVANT_SKILL}": keySkills,
      "${VALUE_PROPOSITION}": "make meaningful contributions to your infrastructure and help drive continuous improvement initiatives",
      "${ADDITIONAL_POINT}": "I thrive in collaborative environments and look forward to working with cross-functional teams to deliver exceptional results.",
      "${KEY_STRENGTH}": keySkills,
      "${TEAM_GOAL}": "your team's infrastructure objectives",
      "${SIGNOFF}": "I look forward to discussing how I can contribute to your team's success.",
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      coverLetter = coverLetter.replace(new RegExp(escapeRegex(key), "g"), value);
    }
    
    // Save cover letter
    await ensureDir(path.join(process.cwd(), "artifacts"));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const safeCompany = company.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const safeRole = role.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const filename = `cover_letter_${safeCompany}_${safeRole}_${timestamp}.md`;
    const coverLetterPath = path.join(process.cwd(), "artifacts", filename);
    
    await writeMarkdown(coverLetterPath, coverLetter);
    
    const result: CoverLetterResult = {
      cover_letter_path: coverLetterPath,
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
            message: `Failed to generate cover letter: ${errorMessage}`,
          }),
        },
      ],
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}