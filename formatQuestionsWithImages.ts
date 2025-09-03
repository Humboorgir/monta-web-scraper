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
  attachedImageUrl: string;
}

function removeHtmlPreserveLatex(html: string): string {
  const latexRegex = /(\$[^$]+\$)/g;
  const latexMatches = html.match(latexRegex) || [];

  let tempHtml = html;
  const latexPlaceholders: string[] = [];
  latexMatches.forEach((latex, index) => {
    const placeholder = `%%LATEX${index}%%`;
    latexPlaceholders.push(latex);
    tempHtml = tempHtml.replace(latex, placeholder);
  });

  const withoutHtml = tempHtml.replace(/<[^>]*>/g, "");

  const decoded = withoutHtml
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  let finalText = decoded;
  latexPlaceholders.forEach((latex, index) => {
    finalText = finalText.replace(`%%LATEX${index}%%`, latex);
  });

  return finalText;
}

function extractImageId(questionText: string): { imageId: string | null; cleanedText: string } {
  const imgRegex = /<img[^>]+src="https:\/\/www\.monta\.ir\/render\?id=(\d+)"[^>]*>/g;
  const matches = [];
  let match;

  // Find all image matches
  while ((match = imgRegex.exec(questionText)) !== null) {
    matches.push(match);
  }

  // If there's not exactly one image, return null
  if (matches.length !== 1) {
    return { imageId: null, cleanedText: questionText };
  }

  // Extract the image ID and clean the text
  const imageId = matches[0][1];
  let cleanedText = questionText;

  // Remove all image tags from the text
  for (const imgMatch of matches) {
    cleanedText = cleanedText.replace(imgMatch[0], "");
  }

  return { imageId, cleanedText };
}

function processQuestionsWithImages(data: any[]): ProcessedQuestion[] {
  const processed: ProcessedQuestion[] = [];

  for (const item of data) {
    if (!item.P) continue;

    const questionData = item.P;
    const questionText = questionData.question;

    if (!questionText.includes("<img")) continue;

    const { imageId, cleanedText } = extractImageId(questionText);

    // Skip questions with no image or multiple images
    if (!imageId) continue;

    let correctAnswer = -1;
    if (questionData.answerId === questionData.choice极Id1) correctAnswer = 0;
    else if (questionData.answerId === questionData.choiceId2) correctAnswer = 1;
    else if (questionData.answerId === questionData.choiceId3) correctAnswer = 2;
    else if (questionData.answerId === questionData.choiceId4) correctAnswer = 3;

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

    const question = removeHtmlPreserveLatex(cleanedText);
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
      attachedImageUrl: `/images/${imageId}.svg`,
    });
  }

  return processed;
}

function main() {
  try {
    const inputPath = path.join(__dirname, "scraped-data.json");
    const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const processedQuestions = processQuestionsWithImages(rawData);
    const outputPath = path.join(__dirname, "questions-with-images.json");
    fs.writeFileSync(outputPath, JSON.stringify(processedQuestions, null, 2));
    console.log(
      `Processed ${processedQuestions.length} questions with exactly one image. Output saved to ${outputPath}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
