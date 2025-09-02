import * as fs from "fs";

/**
 * Robust scraper + extractor
 * - Runs ITERATIONS times (56) with PAGE_SIZE = 5 (offset += 5 each iteration)
 * - Tries to locate arrays of question objects inside the server response
 * - Saves a diagnostic sample response to response-sample.json (iteration 1)
 * - Saves raw responses to responses-raw.json if no candidate found
 * - Writes collected question objects to questions.json at the end
 *
 * If the server truly returns only booleans (true), this script will save those
 * raw responses instead of silently appending them.
 */

// --- CONFIG ----
const URL = "https://app.monta.ir/gwt/gwtRequest";
const PAGE_SIZE = 5;
const ITERATIONS = 156; // 56 * 5 = 280 offsets attempted
const DELAY_MS = 3000; // 3s delay
const HEADERS = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  authorization:
    "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7ImlkIjozMzMyMzg4LCJuYW1lIjoi2KfbjNmE24zYpyDZgdi22YQg2KfZhNmE2YfbjCAgINiv2YjYp9iy2K_Zh9mFINix24zYp9i224wg2YXYr9ix2LPZhyDYtNmH2YrYryDYudmE2Yog2YXYrdmF2K_ZiiIsInR5cGVJZCI6MSwic3ViVHlwZUlkIjoxLCJhY2NvdW50c0NvdW50IjoxfSwiaWF0IjoxNzU2NzQ5ODkzLCJleHAiOjE3NTY4MzYyOTMsImp0aSI6IjcwOWY1NjIwLTMyNzQtNDc3YS1iMjZjLTYzNzdkZTA2ZTgzYSJ9.1CA9OB11oGgGljL-SfKb1p_pkJyOEXJNWd3qnYmsxXc",
  "content-type": "application/json; charset=UTF-8",
  debuguserid: "3332388",
  fingerprint: "dedcf269402704e72b7d3e4f6eccfd79",
  priority: "u=1, i",
  "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  tabid: "1756828711092",
  userid: "3332388",
  uuidv4: "null",
  "x-gwt-permutation": "925FBD58CE332E05F9B7C37987E05DAE",
  cookie:
    "accessToken=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7ImlkIjozMzMyMzg4LCJuYW1lIjoi2KfbjNmE24zYpyDZgdi22YQg2KfZhNmE2YfbjCAgINiv2YjYp9iy2K_Zh9mFINix24zYp9i224wg2YXYr9ix2LPZhyDYtNmH2YrYryDYudmE2Yog2YXYrdmF2K_ZiiIsInR5cGVJZCI6MSwic3ViVHlwZUlkIjoxLCJhY2NvdW50c0NvdW50IjoxfSwiaWF0IjoxNzU2NzQ5ODkzLCJleHAiOjE3NTY4MzYyOTMsImp0aSI6IjcwOWY1NjIwLTMyNzQtNDc3YS1iMjZjLTYzNzdkZTA2ZTgzYSJ9.1CA9OB11oGgGljL-SfKb1p_pkJyOEXJNWd3qnYmsxXc; refreshToken=b024c19a-18f6-4e11-af49-d358be6dbd9c; JSESSIONID=EBCEE05F355FE055A3CC70E4F9F2659D.worker1",
  Referer: "https://app.monta.ir/gwt/",
};

// --- body builder (keeps both offset occurrences updated) ---
function buildBody(currentOffset) {
  const newBody = `{\"F\":\"onlineducation.monta.shared.MainRequestFactory\",\"I\":[{\"O\":\"TmjkGiU1ZSJHAO6q14lG8nanvRc=\",\"P\":[{\"R\":\"1\",\"C\":17,\"T\":\"gRl05IYx3moB4se4ycbmywVYU_M=\"},true,false,false,\"60\",\"12\",false]}],\"O\":[{\"O\":\"PERSIST\",\"R\":\"1\",\"C\":17,\"T\":\"gRl05IYx3moB4se4ycbmywVYU_M=\",\"P\":{\"creatorWhiteList\":null,\"hasBug\":null,\"hasNote\":null,\"hasUnconfirmedComment\":null,\"hasVideo\":null,\"hasVideoRequest\":null,\"isComprehension\":false,\"isDescriptive\":false,\"isExamRequestWhiteList\":null,\"isExamTagIdsBlackList\":null,\"isParticipantWhiteList\":null,\"isQuestionTypeTagsBlackList\":null,\"isTagIdsBlackList\":null,\"isUsageDateLimitWhiteList\":null,\"showDisabled\":false,\"showObserved\":true,\"usageStrategy\":null,\"cellListTypes\":40,\"easyCount\":null,\"fromLeafNo\":null,\"fromTopicNo\":null,\"fromYear\":null,\"hardCount\":null,\"length\":5,\"normalCount\":null,\"offset\":${currentOffset},\"popularity_rounding\":null,\"toYear\":null,\"gradeId\":\"12\",\"majorId\":\"60\",\"schoolId\":null,\"sort_1_difficulty\":null,\"sort_1_discrimination_index\":null,\"sort_1_last_comment\":null,\"sort_1_most_media_requested\":null,\"sort_1_newest\":null,\"sort_1_popularity\":null,\"sort_1_question_order\":null,\"sort_1_total_use\":null,\"sort_2_difficulty\":null,\"sort_2_discrimination_index\":null,\"sort_2_last_comment\":null,\"sort_2_most_media_requested\":null,\"sort_2_newest\":null,\"sort_2_popularity\":null,\"sort_2_question_order\":null,\"sort_2_total_use\":null,\"keywords\":null,\"entryDate\":null,\"fromDate\":null,\"participantsDateLimit\":null,\"toDate\":null,\"usageFromDateLimit\":null,\"answerAuthorIds\":null,\"authorIds\":null,\"creatorIds\":null,\"difficultyIds\":null,\"examRequestIds\":null,\"examTagIds\":null,\"majorIds\":null,\"originExamNos\":null,\"originIds\":null,\"participantIds\":null,\"publisherBookIds\":null,\"questionIdBlackList\":null,\"questionIdWhileList\":[],\"questionTypeTagList\":null,\"readingChildNumbers\":null,\"submitedAnswerModeIds\":null,\"tagIds\":null,\"takingMonthIds\":null,\"modules_topics\":[{\"R\":\"1\",\"C\":18,\"T\":\"aRRlGiHdA4eJSGsk03iXO42xmFI=\"}]}},{\"O\":\"PERSIST\",\"R\":\"1\",\"C\":18,\"T\":\"aRRlGiHdA4eJSGsk03iXO42xmFI=\",\"P\":{\"id\":\"417\",\"extraInfo\":null,\"name\":\"23763\"}},{\"O\":\"PERSIST\",\"R\":\"1\",\"C\":17,\"T\":\"gRl05IYx3moB4se4ycbmywVYU_M=\",\"P\":{\"creatorWhiteList\":null,\"hasBug\":null,\"hasNote\":null,\"hasUnconfirmedComment\":null,\"hasVideo\":null,\"hasVideoRequest\":null,\"isComprehension\":false,\"isDescriptive\":false,\"isExamRequestWhiteList\":null,\"isExamTagIdsBlackList\":null,\"isParticipantWhiteList\":null,\"isQuestionTypeTagsBlackList\":null,\"isTagIdsBlackList\":null,\"isUsageDateLimitWhiteList\":null,\"showDisabled\":false,\"showObserved\":true,\"usageStrategy\":null,\"cellListTypes\":40,\"easyCount\":null,\"fromLeafNo\":null,\"fromTopicNo\":null,\"fromYear\":null,\"hardCount\":null,\"length\":5,\"normalCount\":null,\"offset\":${currentOffset},\"popularity_rounding\":null,\"toYear\":null,\"gradeId\":\"12\",\"majorId\":\"60\",\"schoolId\":null,\"sort_1_difficulty\":null,\"sort_1_discrimination_index\":null,\"sort_1_last_comment\":null,\"sort_1_most_media_requested\":null,\"sort_1_newest\":null,\"sort_1_popularity\":null,\"sort_1_question_order\":null,\"sort_1_total_use\":null,\"sort_2_difficulty\":null,\"sort_2_discrimination_index\":null,\"sort_2_last_comment\":null,\"sort_2_most_media_requested\":null,\"sort_2_newest\":null,\"sort_2_popularity\":null,\"sort_2_question_order\":null,\"sort_2_total_use\":null,\"keywords\":null,\"entryDate\":null,\"fromDate\":null,\"participantsDateLimit\":null,\"toDate\":null,\"usageFromDateLimit\":null,\"answerAuthorIds\":null,\"authorIds\":null,\"creatorIds\":null,\"difficultyIds\":null,\"examRequestIds\":null,\"examTagIds\":null,\"majorIds\":null,\"originExamNos\":null,\"originIds\":null,\"participantIds\":null,\"publisherBookIds\":null,\"questionIdBlackList\":null,\"questionIdWhileList\":[],\"questionTypeTagList\":null,\"readingChildNumbers\":null,\"submitedAnswerModeIds\":null,\"tagIds\":null,\"takingMonthIds\":null,\"modules_topics\":[{\"R\":\"1\",\"C\":18,\"T\":\"aRRlGiHdA4eJSGsk03iXO42xmFI=\"}]}},{\"O\":\"PERSIST\",\"R\":\"1\",\"C\":18,\"T\":\"aRRlGiHdA4eJSGsk03iXO42xmFI=\",\"P\":{\"id\":\"417\",\"extraInfo\":null,\"name\":\"23763\"}}]}`;

  return newBody;
}

// --- util: sleep ---
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- util: recursive scan for arrays & scoring ---
const LIKELY_QUESTION_KEYS = new Set([
  "id",
  "question",
  "text",
  "title",
  "stem",
  "options",
  "answers",
  "choices",
  "explanation",
  "correctAnswer",
  "rightAnswer",
  "body",
]);

function collectArrays(obj, path = []) {
  const results = [];
  function _rec(o, p) {
    if (o == null) return;
    if (Array.isArray(o)) {
      results.push({ path: p.slice(), array: o });
      // still traverse into array elements in case nested arrays of objects exist
      for (let i = 0; i < o.length; i++) {
        _rec(o[i], p.concat(`[${i}]`));
      }
      return;
    }
    if (typeof o === "object") {
      for (const k of Object.keys(o)) {
        _rec(o[k], p.concat(k));
      }
    }
  }
  _rec(obj, path);
  return results;
}

function scoreArrayCandidate(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  let objCount = 0;
  let keyMatchCount = 0;
  for (const el of arr) {
    if (el && typeof el === "object" && !Array.isArray(el)) {
      objCount++;
      // check presence of likely keys
      for (const key of Object.keys(el)) {
        if (LIKELY_QUESTION_KEYS.has(key)) {
          keyMatchCount++;
          break;
        }
      }
    }
  }
  // fraction of elements that are objects
  const fracObj = objCount / arr.length;
  // fraction of object elements that had at least one likely key
  const fracKeyMatched = objCount === 0 ? 0 : keyMatchCount / objCount;
  // combine scores; prefer arrays with many objects and some key matches
  return fracObj * 0.7 + fracKeyMatched * 0.3;
}

// --- MAIN ---
(async () => {
  const allQuestions = [];
  const rawResponses = []; // store raw JSON of iterations where we couldn't find a good candidate
  let offset = 0;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const pageNum = iter + 1;
    const body = buildBody(offset);
    console.log(`Fetching iteration ${pageNum}/${ITERATIONS} (offset=${offset})...`);

    let res;
    try {
      res = await fetch(URL, {
        method: "POST",
        headers: HEADERS,
        body,
        credentials: "include",
      });
    } catch (e) {
      console.error("Fetch error:", e);
      break;
    }

    if (!res.ok) {
      console.error(`HTTP ${res.status} on iteration ${pageNum}. Stopping.`);
      break;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("Failed to parse JSON on iteration", pageNum, e.message);
      // save raw text
      try {
        const txt = await res.text();
        fs.writeFileSync(`response-raw-iter-${pageNum}.txt`, txt, "utf-8");
        console.log("Wrote raw text to", `response-raw-iter-${pageNum}.txt`);
      } catch {}
      break;
    }

    // save the first iteration sample so you can inspect it
    if (iter === 0) {
      try {
        fs.writeFileSync("response-sample.json", JSON.stringify(json, null, 2), "utf-8");
        console.log("Saved response-sample.json (inspect this if extraction fails).");
      } catch (e) {
        console.warn("Failed to write response-sample.json:", e.message);
      }
    }

    // collect candidate arrays (deep)
    const candidates = collectArrays(json);
    // score them
    const scored = candidates.map((c) => {
      return {
        path: c.path.join("."),
        score: scoreArrayCandidate(c.array),
        length: c.array.length,
        array: c.array,
      };
    });

    // sort by score desc, then length desc
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.length - a.length;
    });

    if (scored.length > 0 && scored[0].score > 0.15 && scored[0].length > 0) {
      // treat this as the best candidate
      const chosen = scored[0];
      console.log(
        ` -> chosen candidate at path "${chosen.path}" (score=${chosen.score.toFixed(3)}, len=${
          chosen.length
        })`
      );
      // push objects only (ignore booleans, numbers)
      const objects = chosen.array.filter((el) => el && typeof el === "object" && !Array.isArray(el));
      if (objects.length > 0) {
        allQuestions.push(...objects);
      } else {
        // if array contains non-objects but is the best we've got, save raw
        rawResponses.push(json);
        console.log(" -> best array had no object elements; saved raw response instead.");
      }
    } else {
      // no good candidate found; save raw for later inspection
      rawResponses.push(json);
      console.log(
        ` -> no good candidate arrays found (top score=${
          scored[0] ? scored[0].score.toFixed(3) : "n/a"
        }). Saved raw response.`
      );
    }

    // polite delay and next offset
    offset += PAGE_SIZE;
    await sleep(DELAY_MS);
  }

  // write outputs
  try {
    fs.writeFileSync("questions.json", JSON.stringify(allQuestions, null, 2), "utf-8");
    console.log(`Wrote questions.json with ${allQuestions.length} extracted objects.`);
  } catch (e) {
    console.error("Failed to write questions.json:", e.message);
  }

  try {
    if (rawResponses.length > 0) {
      fs.writeFileSync("responses-raw.json", JSON.stringify(rawResponses, null, 2), "utf-8");
      console.log(`Wrote responses-raw.json with ${rawResponses.length} raw entries for inspection.`);
    }
  } catch (e) {
    console.error("Failed to write responses-raw.json:", e.message);
  }

  console.log("Done.");
})();
