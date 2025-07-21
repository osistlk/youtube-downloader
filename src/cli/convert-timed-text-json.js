// simple script to convert timed text JSON from YouTube to a SRT file
const fs = require("fs");
const path = require("path");

// Get the file path from command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Error: Please provide a path to the timed text JSON file");
  console.error("Usage: node convert-timed-text-json.js <path-to-json-file>");
  process.exit(1);
}

const inputFilePath = args[0];

// Validate that the file exists
if (!fs.existsSync(inputFilePath)) {
  console.error(`Error: File not found: ${inputFilePath}`);
  process.exit(1);
}

// Validate that it's a JSON file
if (path.extname(inputFilePath).toLowerCase() !== ".json") {
  console.error("Error: Input file must be a JSON file");
  process.exit(1);
}

// Function to convert milliseconds to SRT timestamp format (HH:MM:SS,mmm)
function msToSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
}

// Function to extract text from segments
function extractTextFromSegments(segs) {
  if (!segs || !Array.isArray(segs)) return "";

  return segs
    .filter((seg) => seg.utf8 && seg.utf8.trim() !== "\n")
    .map((seg) => seg.utf8)
    .join("")
    .trim();
}

// Function to convert timed text JSON to SRT
function convertToSrt(jsonData) {
  const events = jsonData.events || [];
  const srtEntries = [];
  let entryNumber = 1;

  for (const event of events) {
    // Skip events without timing or text segments
    if (!event.tStartMs || !event.segs) continue;

    const text = extractTextFromSegments(event.segs);

    // Skip empty text or newline-only content
    if (!text || text === "") continue;

    const startTime = event.tStartMs;
    const duration = event.dDurationMs || 3000; // Default 3 seconds if no duration
    const endTime = startTime + duration;

    const startTimestamp = msToSrtTime(startTime);
    const endTimestamp = msToSrtTime(endTime);

    srtEntries.push({
      number: entryNumber++,
      startTime: startTimestamp,
      endTime: endTimestamp,
      text: text,
    });
  }

  return srtEntries;
}

// Function to format SRT entries as text
function formatSrtEntries(entries) {
  return entries
    .map(
      (entry) =>
        `${entry.number}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`,
    )
    .join("\n");
}

// Main conversion process
try {
  console.log(`Reading file: ${inputFilePath}`);

  // Read and parse JSON file
  const jsonContent = fs.readFileSync(inputFilePath, "utf8");
  const jsonData = JSON.parse(jsonContent);

  // Convert to SRT entries
  const srtEntries = convertToSrt(jsonData);

  if (srtEntries.length === 0) {
    console.warn("No text content found in the timed text file");
    process.exit(1);
  }

  // Format as SRT content
  const srtContent = formatSrtEntries(srtEntries);

  // Generate output filename
  const inputDir = path.dirname(inputFilePath);
  const inputName = path.basename(inputFilePath, ".json");
  const outputFilePath = path.join(inputDir, `${inputName}.srt`);

  // Write SRT file
  fs.writeFileSync(outputFilePath, srtContent, "utf8");

  console.log(`Successfully converted to SRT format`);
  console.log(`Input: ${inputFilePath}`);
  console.log(`Output: ${outputFilePath}`);
  console.log(`Entries: ${srtEntries.length}`);
} catch (error) {
  console.error("Error during conversion:", error.message);
  process.exit(1);
}
