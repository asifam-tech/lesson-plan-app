
// //  module.exports = { generateLessonPlanDraft, AIServiceError };
// // MANDATORY: Use this specific model version for the current environment
// const MODEL = 'gemini-2.5-flash';
// const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// class AIServiceError extends Error {
//   constructor(message, status = 502) {
//     super(message);
//     this.status = status;
//   }
// }

// /**
//  * Detect lesson plan language from subject
//  */
// function getLanguage(subject) {
//   if (!subject) return "English";

//   const subjectName = subject.toLowerCase();

//   if (
//     subjectName.includes("amharic") ||
//     subjectName.includes("አማርኛ")
//   ) {
//     return "Amharic (አማርኛ)";
//   }

//   if (
//     subjectName.includes("afan") ||
//     subjectName.includes("afaan") ||
//     subjectName.includes("oromo") ||
//     subjectName.includes("oromoo")
//   ) {
//     return "Afaan Oromoo";
//   }

//   return "English";
// }

// /**
//  * Build AI prompt
//  */
// function buildPrompt({ subject, gradeLevel, topic, duration, notes }) {
//   const language = getLanguage(subject);

//   return `
// You are an experienced curriculum designer.

// Generate a professional lesson plan in ${language}.

// Subject: ${subject}
// Grade Level: ${gradeLevel || ""}
// Topic: ${topic}
// Lesson Duration: ${duration || ""}
// Additional Notes: ${notes || "None"}

// IMPORTANT:
// - Write the ENTIRE lesson plan in ${language}.
// - Do NOT mix languages.
// - Make the lesson plan suitable for Ethiopian schools.
// - Return ONLY valid JSON (no markdown, no backticks).

// {
//   "title": "",
//   "objective": "",
//   "content": ""
// }
// `;
// }

// async function generateLessonPlanDraft({
//   subject,
//   gradeLevel,
//   topic,
//   duration,
//   notes
// }) {
//   const apiKey = process.env.GEMINI_API_KEY;

//   if (!apiKey) {
//     throw new AIServiceError("Missing GEMINI_API_KEY.", 503);
//   }

//   if (!subject || !topic) {
//     throw new AIServiceError("Subject and topic required.", 400);
//   }

//   const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       contents: [
//         {
//           role: "user",
//           parts: [
//             {
//               text: buildPrompt({
//                 subject,
//                 gradeLevel,
//                 topic,
//                 duration,
//                 notes
//               })
//             }
//           ]
//         }
//       ],
//       generationConfig: {
//         temperature: 0.7,
//         maxOutputTokens: 4096,
//         responseMimeType: "application/json"
//       }
//     })
//   });

//   if (!response.ok) {
//     const errBody = await response.json().catch(() => ({}));

//     throw new AIServiceError(
//       errBody?.error?.message || "Gemini API request failed.",
//       502
//     );
//   }

//   const data = await response.json();

//   let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

//   console.log("Gemini Response:");
//   console.log(text);

//   if (!text) {
//     throw new AIServiceError("Empty response from Gemini.", 502);
//   }

//   // FIX: Remove possible markdown formatting from Gemini
//    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

//   try {
//     return JSON.parse(text);
//   } catch (err) {
//     console.error("Invalid JSON from Gemini:", text);
//     throw new AIServiceError("Failed to parse AI JSON response.", 502);
//   }
// }

// module.exports = {
//   generateLessonPlanDraft,
//   AIServiceError
// };
const MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

class AIServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

/**
 * Detect language from subject
 */
function getLanguage(subject) {
  if (!subject) return "English";

  const s = subject.toLowerCase();

  if (s.includes("amharic") || s.includes("አማርኛ")) {
    return "Amharic (አማርኛ)";
  }

  if (
    s.includes("afan") ||
    s.includes("afaan") ||
    s.includes("oromo") ||
    s.includes("oromoo")
  ) {
    return "Afaan Oromoo";
  }

  return "English";
}

/**
 * Build prompt
 */
function buildPrompt({
  subject,
  gradeLevel,
  topic,
  duration,
  notes,
  syllabus
}) {
  const language = getLanguage(subject);

  return `
You are an expert curriculum designer for Ethiopian schools.

Generate a complete lesson plan.

IMPORTANT RULES:
- Write ONLY in ${language}
- Follow the curriculum strictly if provided
- Do NOT mix languages
- Return ONLY valid JSON (no markdown, no backticks)
- Keep content complete and not cut

CURRICULUM / SYLLABUS:
${syllabus || "No curriculum provided. Use general knowledge."}

LESSON DETAILS:
Subject: ${subject}
Grade Level: ${gradeLevel || ""}
Topic: ${topic}
Duration: ${duration || ""}
Additional Notes: ${notes || "None"}

OUTPUT FORMAT:
{
  "title": "",
  "objective": "",
  "content": ""
}
`;
}

async function generateLessonPlanDraft({
  subject,
  gradeLevel,
  topic,
  duration,
  notes,
  syllabus
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("Missing GEMINI_API_KEY", 503);
  }

  if (!subject || !topic) {
    throw new AIServiceError("Subject and topic required", 400);
  }

  const response = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildPrompt({
                  subject,
                  gradeLevel,
                  topic,
                  duration,
                  notes,
                  syllabus
                })
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new AIServiceError(
      err?.error?.message || "Gemini API failed",
      502
    );
  }

  const data = await response.json();

  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log("Gemini Response:");
  console.log(text);

  if (!text) {
    throw new AIServiceError("Empty response from Gemini", 502);
  }

  // Clean markdown if Gemini adds it
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON from Gemini:", text);
    throw new AIServiceError(
      "AI returned invalid JSON (try again or reduce syllabus size)",
      502
    );
  }
}

module.exports = {
  generateLessonPlanDraft,
  AIServiceError
};