const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","then","else","of","in","on","at","to","for",
  "by","with","from","is","are","was","were","be","been","being","this","that","these",
  "those","it","its","as","not","no","do","does","did","has","have","had","can","could",
  "would","should","may","might","will","shall","we","our","you","your","they","their",
  "he","she","his","her","i","me","my","also","than","such","into","over","under","more",
  "most","some","any","all","each","other","which","who","what","when","where","why","how",
  "between","among","within","via","using","used","use","based","study","studies","results",
  "abstract","paper","research","here","show","shows","showed","found","find","report","reports",
  "however","thus","therefore","further","additionally","including","include","included"
]);

export function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

export function splitSentences(text: string): string[] {
  if (!text) return [];
  // Remove the inline "Abstract" prefix some entries start with
  const cleaned = text.replace(/^Abstract\s*/i, "");
  return cleaned
    .split(/(?<=[\.\?\!])\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
}
