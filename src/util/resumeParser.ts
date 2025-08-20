import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import * as fs from 'fs/promises';
import * as path from 'path';
import { readJSON, writeJSON } from './fsx';

interface ParsedResume {
  text: string;
  skills: string[];
  fileName: string;
  parseTime: string;
}

/**
 * Parse a resume file (PDF or DOCX) and extract text and skills
 */
export async function parseResume(filePath: string): Promise<ParsedResume> {
  console.error(`[resumeParser] Parsing resume: ${filePath}`);
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  let text = '';
  
  try {
    if (ext === '.docx') {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      console.error(`[resumeParser] Extracted ${text.length} characters from DOCX`);
    } else if (ext === '.pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
      console.error(`[resumeParser] Extracted ${text.length} characters from PDF`);
    } else if (ext === '.md') {
      // Support markdown resumes
      text = await fs.readFile(filePath, 'utf-8');
      console.error(`[resumeParser] Read ${text.length} characters from Markdown`);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
    
    // Load skills configuration
    const skillsPath = path.join(process.cwd(), 'config', 'skills.json');
    const skillsList: string[] = await readJSON(skillsPath);
    
    // Extract skills found in resume
    const foundSkills = new Set<string>();
    const textLower = text.toLowerCase();
    
    for (const skill of skillsList) {
      const skillLower = skill.toLowerCase();
      // Check for word boundaries to avoid false matches
      const regex = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');
      if (regex.test(textLower)) {
        foundSkills.add(skill);
      }
    }
    
    // Also extract common patterns
    const patterns = {
      yearsExperience: /(\d+\+?)\s*years?\s+(?:of\s+)?experience/gi,
      certifications: /certified\s+[\w\s]+|[\w\s]+\s+certification/gi,
      education: /bachelor|master|phd|degree|b\.s\.|m\.s\.|b\.tech|m\.tech/gi,
    };
    
    const experienceMatches = text.match(patterns.yearsExperience);
    const certMatches = text.match(patterns.certifications);
    const educationMatches = text.match(patterns.education);
    
    console.error(`[resumeParser] Found ${foundSkills.size} skills`);
    if (experienceMatches) {
      console.error(`[resumeParser] Experience mentions: ${experienceMatches.join(', ')}`);
    }
    if (certMatches) {
      console.error(`[resumeParser] Certifications: ${certMatches.slice(0, 3).join(', ')}`);
    }
    
    // Cache the parsed resume for future use
    const cacheDir = path.join(process.cwd(), 'data', 'resume_cache');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cacheFile = path.join(cacheDir, `${fileName}.json`);
    const cacheData = {
      fileName,
      filePath,
      parseTime: new Date().toISOString(),
      textLength: text.length,
      skillsCount: foundSkills.size,
      skills: Array.from(foundSkills),
    };
    
    await writeJSON(cacheFile, cacheData);
    console.error(`[resumeParser] Cached parse results to ${cacheFile}`);
    
    return {
      text,
      skills: Array.from(foundSkills),
      fileName,
      parseTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[resumeParser] Error parsing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get all available resume files in the current directory
 */
export async function listResumeFiles(): Promise<string[]> {
  const files = await fs.readdir(process.cwd());
  const resumeFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const isResumeFormat = ['.pdf', '.docx', '.doc'].includes(ext);
    const looksLikeResume = file.toLowerCase().includes('resume') || 
                           file.toLowerCase().includes('cv') ||
                           file.includes('Kumar');
    return isResumeFormat && looksLikeResume;
  });
  
  console.error(`[resumeParser] Found ${resumeFiles.length} resume files`);
  return resumeFiles.map(f => path.join(process.cwd(), f));
}

/**
 * Parse the best available resume (most recent or highest skill match)
 */
export async function parseBestResume(): Promise<ParsedResume> {
  const resumeFiles = await listResumeFiles();
  
  if (resumeFiles.length === 0) {
    // Fall back to template
    const templatePath = path.join(process.cwd(), 'templates', 'base_resume.md');
    console.error('[resumeParser] No resume files found, using template');
    return parseResume(templatePath);
  }
  
  // Try to find the most recent or comprehensive resume
  const priority = [
    '2025-updated',
    'DevOps',
    'Engineer',
    'Updated'
  ];
  
  let bestFile = resumeFiles[0];
  for (const keyword of priority) {
    const match = resumeFiles.find(f => f.includes(keyword));
    if (match) {
      bestFile = match;
      break;
    }
  }
  
  console.error(`[resumeParser] Selected best resume: ${bestFile}`);
  return parseResume(bestFile);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}