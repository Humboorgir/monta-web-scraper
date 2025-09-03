import * as fs from "fs";
import * as path from "path";

function extractImageIds(questionText: string): string[] {
  const imgRegex = /<img[^>]+src="https:\/\/www\.monta\.ir\/render\?id=(\d+)"[^>]*>/g;
  const imageIds: string[] = [];
  let match;
  while ((match = imgRegex.exec(questionText)) !== null) {
    imageIds.push(match[1]);
  }
  return imageIds;
}

async function downloadImage(imageId: string): Promise<void> {
  const url = `https://www.monta.ir/render?id=${imageId}`;
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    cookie:
      "accessToken=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7ImlkIjozMzMyMzg4LCJuYW1lIjoi2KfbjNmE24zYpyDZgdi22YQg2KfZhNmE2YfbjCIsInR5cGVJZCI6MSwic3ViVHlwZUlkIjoxLCJhY2NvdW50c0NvdW50IjoxfSwiaWF0IjoxNzU2OTIxMDU0LCJleHAiOjE3NTcwMDc0NTQsImp0aSI6ImVjZjFiZTg1LTNhZDktNGM1MS1iMDAyLWIxYjk2MGJlMDBjYSJ9.g9FDgh2sW2iKNnV4NAyozoa7-moqZIvPAiLKIUOmQ-I; refreshToken=38fb7daf-376c-45c5-b361-bfc8aa3f63ac; JSESSIONID=084A2438F0DC3A85530D3553D94AD598.worker1",
  };

  try {
    const response = await fetch(url, { headers, method: "GET" });
    if (!response.ok) {
      throw new Error(`Failed to download image ${imageId}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const imagesDir = path.join(__dirname, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    const filePath = path.join(imagesDir, `${imageId}.svg`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Downloaded ${imageId}.svg`);
  } catch (error) {
    console.error(`Error downloading image ${imageId}:`, error);
  }
}

async function main() {
  try {
    const inputPath = path.join(__dirname, "scraped-data.json");
    const rawData: any[] = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const imageIds = new Set<string>();

    for (const item of rawData) {
      if (!item.P) continue;
      const questionText = item.P.question;
      if (questionText.includes("<img")) {
        const ids = extractImageIds(questionText);
        ids.forEach((id) => imageIds.add(id));
      }
    }

    console.log(`Found ${imageIds.size} images to download`);
    for (const imageId of imageIds) {
      await downloadImage(imageId);
    }
    console.log("Download completed");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
