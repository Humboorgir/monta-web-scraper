import * as fs from "fs";
import * as path from "path";

interface QuestionData {
  P: {
    id: string;
    question: string;
    choiceDescription1: string;
    choiceDescription2: string;
    choiceDescription3: string;
    choiceDescription4: string;
    answer: string;
    difficultyLevelId: string;
    answerId: string;
    choiceId1: string;
    choiceId2: string;
    choiceId3: string;
    choiceId4: string;
  };
}

interface ProcessedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
}

// Function to remove HTML tags but preserve LaTeX expressions
function removeHtmlPreserveLatex(html: string): string {
  // First, protect LaTeX expressions by replacing them with temporary placeholders
  const latexRegex = /(\$[^$]+\$)/g;
  const latexMatches = html.match(latexRegex) || [];

  // Replace LaTeX with placeholders
  let tempHtml = html;
  const latexPlaceholders: string[] = [];
  latexMatches.forEach((latex, index) => {
    const placeholder = `%%LATEX${index}%%`;
    latexPlaceholders.push(latex);
    tempHtml = tempHtml.replace(latex, placeholder);
  });

  // Remove all HTML tags
  const withoutHtml = tempHtml.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const decoded = withoutHtml
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Restore LaTeX expressions
  let finalText = decoded;
  latexPlaceholders.forEach((latex, index) => {
    finalText = finalText.replace(`%%LATEX${index}%%`, latex);
  });

  return finalText;
}

// Function to process the raw data
function processQuestions(data: any[]): ProcessedQuestion[] {
  const processed: ProcessedQuestion[] = [];

  for (const item of data) {
    // Skip non-question items and items with images
    if (!item.P || item.P.question.includes("<img")) {
      continue;
    }

    const questionData = item.P;

    // Determine correct answer index
    let correctAnswer = -1;
    if (questionData.answerId === questionData.choiceId1) correctAnswer = 0;
    else if (questionData.answerId === questionData.choiceId2) correctAnswer = 1;
    else if (questionData.answerId === questionData.choiceId3) correctAnswer = 2;
    else if (questionData.answerId === questionData.choiceId4) correctAnswer = 3;

    // Map difficulty level
    let difficulty = "";
    switch (questionData.difficultyLevelId) {
      case "10":
        difficulty = "easy";
        break;
      case "20":
        difficulty = "medium";
        break;
      case "30":
        difficulty = "hard";
        break;
      case "40":
        difficulty = "very_hard";
        break;
      default:
        difficulty = "unknown";
    }

    // Process text content
    const question = removeHtmlPreserveLatex(questionData.question);
    const options = [
      removeHtmlPreserveLatex(questionData.choiceDescription1),
      removeHtmlPreserveLatex(questionData.choiceDescription2),
      removeHtmlPreserveLatex(questionData.choiceDescription3),
      removeHtmlPreserveLatex(questionData.choiceDescription4),
    ];
    const explanation = removeHtmlPreserveLatex(questionData.answer);

    processed.push({
      id: parseInt(questionData.id, 10),
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
    });
  }

  return processed;
}

// Main function
function main() {
  try {
    // Read and parse the input file
    const inputPath = path.join(__dirname, "scraped-data.json");
    const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

    // Process the questions
    const processedQuestions = processQuestions(rawData);

    // Write the output file
    const outputPath = path.join(__dirname, "processed-questions.json");
    fs.writeFileSync(outputPath, JSON.stringify(processedQuestions, null, 2), "utf8");

    console.log(`Successfully processed ${processedQuestions.length} questions`);
    console.log(`Output written to ${outputPath}`);
  } catch (error) {
    console.error("Error processing questions:", error);
  }
}

// Run the script
main();
