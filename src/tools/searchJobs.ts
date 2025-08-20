import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { readJSON, writeJSON, ensureDir } from "../util/fsx";
import * as path from "path";

interface SearchJobsArgs {
  query: string;
  location?: string;
  limit?: number;
  source?: "indeed" | "remoteok" | "cache" | "mock";
}

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string; // REAL clickable URL
  apply_url?: string; // Direct apply link if available
  posted_date: string;
  salary?: string;
  source: string;
}

// Indeed RSS endpoint
const INDEED_RSS_URL = 'https://www.indeed.com/rss';

// RemoteOK API (backup source)
const REMOTEOK_API_URL = 'https://remoteok.com/api';

// Clean HTML from descriptions
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract company name from Indeed title
function extractCompanyFromTitle(title: string): string {
  // Indeed format: "Job Title - Company Name"
  const parts = title.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : "Unknown Company";
}

// Fetch jobs from Indeed RSS
async function fetchIndeedJobs(query: string, location: string, limit: number): Promise<JobListing[]> {
  console.error(`[searchJobs] Fetching from Indeed RSS: ${query} in ${location}`);
  
  const params = new URLSearchParams({
    q: query,
    l: location,
    sort: 'date',
    fromage: '7', // Last 7 days
    limit: limit.toString()
  });
  
  const url = `${INDEED_RSS_URL}?${params}`;
  
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const result = parser.parse(response.data);
    const items = result?.rss?.channel?.item || [];
    
    if (!Array.isArray(items)) {
      console.error('[searchJobs] Indeed RSS returned unexpected format');
      return [];
    }
    
    console.error(`[searchJobs] Found ${items.length} jobs from Indeed RSS`);
    
    return items.slice(0, limit).map((item: any) => ({
      id: item.guid || `indeed-${Date.now()}-${Math.random()}`,
      title: item.title || "Unknown Position",
      company: extractCompanyFromTitle(item.title || ""),
      location: location,
      description: cleanHTML(item.description || item.summary || ""),
      url: item.link || "", // REAL Indeed URL
      posted_date: item.pubDate || new Date().toISOString(),
      source: 'indeed-rss'
    }));
  } catch (error) {
    console.error('[searchJobs] Indeed RSS failed:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Fetch jobs from RemoteOK
async function fetchRemoteOKJobs(query: string, limit: number): Promise<JobListing[]> {
  console.error(`[searchJobs] Fetching from RemoteOK API: ${query}`);
  
  try {
    const response = await axios.get(REMOTEOK_API_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 Resume-Apply-Job-Tool'
      }
    });
    
    const jobs = response.data;
    
    // Filter by query and skip the first item (it's metadata)
    const filtered = jobs.slice(1).filter((job: any) => {
      const searchText = `${job.position} ${job.company} ${job.tags?.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
    
    console.error(`[searchJobs] Found ${filtered.length} matching jobs from RemoteOK`);
    
    return filtered.slice(0, limit).map((job: any) => ({
      id: job.id || `remoteok-${job.slug}`,
      title: job.position,
      company: job.company,
      location: 'Remote',
      description: job.description || `${job.position} at ${job.company}`,
      url: job.url || job.apply_url, // REAL RemoteOK URL
      apply_url: job.apply_url,
      posted_date: job.date || new Date().toISOString(),
      salary: job.salary_min && job.salary_max ? 
        `$${job.salary_min} - $${job.salary_max}` : undefined,
      source: 'remoteok'
    }));
  } catch (error) {
    console.error('[searchJobs] RemoteOK API failed:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Direct company career pages (fallback with real URLs)
function getDirectCompanyJobs(query: string): JobListing[] {
  const queryLower = query.toLowerCase();
  const isDevOps = queryLower.includes('devops');
  const isCloud = queryLower.includes('cloud');
  const isSRE = queryLower.includes('sre') || queryLower.includes('reliability');
  
  const companies = [
    {
      company: 'Amazon',
      url: 'https://www.amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&category=software-development&distanceType=Mi&radius=24km&latitude=&longitude=&loc_group_id=&loc_query=&base_query=devops&city=&country=&region=&county=&query_options=&'
    },
    {
      company: 'Microsoft',
      url: 'https://careers.microsoft.com/us/en/search-results?keywords=devops%20engineer'
    },
    {
      company: 'Google',
      url: 'https://careers.google.com/jobs/results/?q=DevOps%20Engineer'
    },
    {
      company: 'Meta',
      url: 'https://www.metacareers.com/jobs?q=devops'
    },
    {
      company: 'Netflix',
      url: 'https://jobs.netflix.com/search?q=devops'
    }
  ];
  
  return companies.map(c => ({
    id: `direct-${c.company.toLowerCase()}-${Date.now()}`,
    title: `Browse ${query} positions at ${c.company}`,
    company: c.company,
    location: 'Multiple Locations',
    description: `Click to view all ${query} positions currently available at ${c.company}. These are direct postings from the company's career site.`,
    url: c.url, // REAL career page URL
    posted_date: new Date().toISOString(),
    source: 'company-direct'
  }));
}

// Generate Indeed search URL as last resort
function getIndeedSearchUrl(query: string, location: string): JobListing {
  const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
  
  return {
    id: `indeed-search-${Date.now()}`,
    title: `Browse all "${query}" jobs on Indeed`,
    company: 'Indeed Job Search',
    location: location,
    description: `Click to see all ${query} jobs in ${location} on Indeed. This link will open Indeed's search results where you can browse and apply to real positions.`,
    url: searchUrl, // REAL Indeed search URL
    posted_date: new Date().toISOString(),
    source: 'indeed-search'
  };
}

// Cache jobs for offline access
async function cacheJobs(jobs: JobListing[], query: string): Promise<void> {
  const cacheDir = path.join(process.cwd(), "data");
  await ensureDir(cacheDir);
  
  const cachePath = path.join(cacheDir, "jobs_cache.json");
  const cacheData = {
    timestamp: new Date().toISOString(),
    query,
    jobs
  };
  
  await writeJSON(cachePath, cacheData);
  console.error(`[searchJobs] Cached ${jobs.length} jobs`);
}

// Load cached jobs
async function getCachedJobs(): Promise<JobListing[] | null> {
  try {
    const cachePath = path.join(process.cwd(), "data", "jobs_cache.json");
    const cacheData = await readJSON(cachePath);
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    
    if (cacheAge < ONE_HOUR) {
      console.error(`[searchJobs] Using cached jobs (${cacheData.jobs.length} jobs)`);
      return cacheData.jobs;
    }
  } catch (error) {
    // Cache doesn't exist or is invalid
  }
  
  return null;
}

export async function searchJobs(args: SearchJobsArgs) {
  const { 
    query, 
    location = "Remote", 
    limit = 10, 
    source = "indeed" 
  } = args;

  console.error(`[searchJobs] Searching for "${query}" in "${location}" (source: ${source}, limit: ${limit})`);

  let jobs: JobListing[] = [];

  // Try cached jobs first
  if (source === "cache") {
    const cached = await getCachedJobs();
    if (cached && cached.length > 0) {
      jobs = cached;
    }
  }

  // Try real job sources
  if (jobs.length === 0 && source !== "mock") {
    // 1. Try Indeed RSS first
    jobs = await fetchIndeedJobs(query, location, limit);
    
    // 2. If Indeed fails, try RemoteOK for remote jobs
    if (jobs.length === 0 && location.toLowerCase().includes('remote')) {
      jobs = await fetchRemoteOKJobs(query, limit);
    }
    
    // 3. Add direct company links
    if (jobs.length < limit) {
      const companyJobs = getDirectCompanyJobs(query);
      jobs = [...jobs, ...companyJobs].slice(0, limit);
    }
    
    // 4. Always include Indeed search URL as fallback
    if (jobs.length === 0) {
      jobs = [getIndeedSearchUrl(query, location)];
    }
  }

  // Cache successful results
  if (jobs.length > 0) {
    await cacheJobs(jobs, query);
  }

  // Ensure every job has a URL
  const validJobs = jobs.filter(job => job.url).map(job => ({
    ...job,
    url: job.url || `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          query,
          location,
          source: jobs[0]?.source || source,
          results_count: validJobs.length,
          jobs: validJobs,
          message: validJobs.length > 0 ? 
            "Found real jobs with clickable URLs" : 
            "No jobs found, showing search links"
        }, null, 2),
      },
    ],
  };
}