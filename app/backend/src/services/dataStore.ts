import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export interface Paper {
  id: number;
  title: string;
  authors: string;
  doi: string;
  date: string;
  url: string;
  abstract: string;
  summary: string;
}

let papers: Paper[] = [];

export function loadPapers(): Paper[] {
  if (papers.length) return papers;

  const csvPath = path.join(__dirname, "..", "..", "data", "papers.csv");
  const raw = fs.readFileSync(csvPath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  papers = records.map((r, i) => ({
    id: i,
    title: (r["Title"] || "").trim(),
    authors: (r["Authors"] || "").trim(),
    doi: (r["DOI"] || "").trim(),
    date: (r["Date"] || "").trim(),
    url: (r["Paper URL"] || "").trim(),
    abstract: (r["Abstract"] || "").trim(),
    summary: (r["Summary"] || "").trim(),
  })).filter(p => p.title && p.abstract);

  return papers;
}

export function getPapers(): Paper[] {
  return loadPapers();
}

export function getPaperById(id: number): Paper | undefined {
  return loadPapers()[id];
}
