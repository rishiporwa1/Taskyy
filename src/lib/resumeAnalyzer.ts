// Client-side ATS resume analyzer using pdfjs-dist
// Scores 0–100 based on heuristic rules — no backend required

import * as pdfjsLib from "pdfjs-dist";

// Point pdfjs to its bundled worker via CDN to avoid worker import issues in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ATSCriterion {
  name: string;
  passed: boolean;
  description: string;
}

export interface ResumeAnalysisResult {
  score: number;
  criteria: ATSCriterion[];
  wordCount: number;
  textLength: number;
}

// Normalize text: lowercase, collapse whitespace
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, re) => acc + (text.match(re) ? 1 : 0), 0);
}

export async function analyzeResume(pdfUrl: string): Promise<ResumeAnalysisResult> {
  // Fetch the PDF as ArrayBuffer
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to fetch resume: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  // Extract all text
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  const text = normalize(fullText);
  const words = fullText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const pageCount = pdf.numPages;

  // ── SCORING CRITERIA (each worth stated points, max 100) ──────────────────

  // 1. Contact section (email + phone presence) — 10 pts
  const hasEmail = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/.test(text);
  const hasPhone = /(\+?[\d\-\.\(\)\s]{7,15})/.test(text);
  const hasLinkedIn = /linkedin\.com|linkedin/.test(text);
  const contactScore = hasEmail && hasPhone ? 10 : hasEmail || hasPhone ? 5 : 0;
  const contactPassed = hasEmail && hasPhone;

  // 2. Summary / Objective section — 10 pts
  const hasSummary =
    /\b(summary|objective|profile|about me|professional summary|career objective)\b/.test(text);
  const summaryScore = hasSummary ? 10 : 0;

  // 3. Work Experience section — 20 pts
  const hasExperience =
    /\b(experience|work history|employment|professional experience|work experience|internship)\b/.test(
      text
    );
  // Bonus: has date ranges like 2018-2022 or Jan 2020 – Mar 2022
  const hasDateRanges =
    /(20\d{2}|19\d{2})\s*[\-–—]\s*(20\d{2}|19\d{2}|present|current)/i.test(fullText);
  const experienceScore = hasExperience ? (hasDateRanges ? 20 : 14) : 0;
  const experiencePassed = hasExperience;

  // 4. Education section — 10 pts
  const hasEducation =
    /\b(education|academic|university|college|bachelor|master|degree|b\.sc|m\.sc|b\.e|m\.e|b\.tech|m\.tech|phd|high school)\b/.test(
      text
    );
  const educationScore = hasEducation ? 10 : 0;

  // 5. Skills section — 15 pts
  const hasSkills = /\b(skills|technical skills|core competencies|competencies|tools|technologies|languages)\b/.test(text);
  // Check for real tech keywords as bonus validation
  const techKeywords = [
    /\b(javascript|python|java|typescript|react|node|sql|css|html|aws|azure|gcp|docker|kubernetes|git|figma|excel)\b/,
  ];
  const hasTechKeywords = techKeywords.some((re) => re.test(text));
  const skillsScore = hasSkills ? (hasTechKeywords ? 15 : 10) : hasTechKeywords ? 8 : 0;
  const skillsPassed = hasSkills || hasTechKeywords;

  // 6. Quantified achievements (numbers / % in context of results) — 15 pts
  const quantifiedPatterns = [
    /\d+\s*%/,
    /\$[\d,]+/,
    /increased|improved|reduced|grew|saved|delivered|led\s+\w+\s+\d+/i,
    /\d+\s*(users|clients|projects|teams|members|products|features|releases|sales)/i,
  ];
  const quantifiedCount = countMatches(text, quantifiedPatterns);
  const quantifiedScore = quantifiedCount >= 3 ? 15 : quantifiedCount === 2 ? 10 : quantifiedCount === 1 ? 5 : 0;
  const quantifiedPassed = quantifiedCount >= 2;

  // 7. Action verbs — 10 pts
  const actionVerbPatterns = [
    /\b(managed|led|developed|built|designed|implemented|created|delivered|launched|architected|coordinated|optimized|analyzed|negotiated|mentored|executed)\b/,
  ];
  const hasActionVerbs = actionVerbPatterns.some((re) => re.test(text));
  const actionScore = hasActionVerbs ? 10 : 0;

  // 8. Ideal length: 1–2 pages (≈ 300–1200 words) — 10 pts
  const lengthOk = wordCount >= 300 && wordCount <= 1200 && pageCount <= 2;
  const lengthTooShort = wordCount < 150;
  const lengthScore = lengthOk ? 10 : lengthTooShort ? 0 : 5;
  const lengthPassed = lengthOk;

  // ── TOTAL ─────────────────────────────────────────────────────────────────
  const rawScore =
    contactScore +
    summaryScore +
    experienceScore +
    educationScore +
    skillsScore +
    quantifiedScore +
    actionScore +
    lengthScore;

  // Clamp to 0–100
  const score = Math.min(100, Math.max(0, rawScore));

  const criteria: ATSCriterion[] = [
    {
      name: "Contact Info",
      passed: contactPassed,
      description: contactPassed
        ? `Email & phone present${hasLinkedIn ? " + LinkedIn" : ""}`
        : "Missing email or phone number",
    },
    {
      name: "Clear Structure",
      passed: hasEducation && hasExperience,
      description:
        hasEducation && hasExperience
          ? "Experience & education sections detected"
          : "Missing standard resume sections",
    },
    {
      name: "ATS Parsable",
      passed: skillsPassed && experiencePassed,
      description:
        skillsPassed && experiencePassed
          ? "Skills & experience keywords found"
          : "Weak keyword coverage for ATS scanners",
    },
    {
      name: "Impact-Driven",
      passed: quantifiedPassed,
      description: quantifiedPassed
        ? `${quantifiedCount} quantified achievements detected`
        : "No measurable results found — add numbers/percentages",
    },
  ];

  return { score, criteria, wordCount, textLength: fullText.length };
}
