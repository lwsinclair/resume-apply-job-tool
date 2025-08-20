import * as fs from "fs/promises";
import { Stats } from "fs";
import * as path from "path";

/**
 * Read a JSON file and parse it
 */
export async function readJSON(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write data to a JSON file
 */
export async function writeJSON(filePath: string, data: any): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Ensure a directory exists, create it if it doesn't
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Read a markdown file
 */
export async function readMarkdown(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      throw new Error(`Markdown file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write content to a markdown file
 */
export async function writeMarkdown(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a directory
 */
export async function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    if (extension) {
      return files.filter(file => file.endsWith(extension));
    }
    return files;
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  const destDir = path.dirname(destination);
  await ensureDir(destDir);
  await fs.copyFile(source, destination);
}

/**
 * Delete a file if it exists
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as any).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<Stats | null> {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}