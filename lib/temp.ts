export async function generateSummary(repoData: any) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Analyze this GitHub repository.

Repository:
${repoData.owner}/${repoData.repo}

Project Name:
${repoData.projectInfo?.name}

Total Files:
${repoData.totalFiles}

Dependencies:
${repoData.projectInfo?.dependencies?.join(", ")}

README:
${repoData.readmePreview}

Return ONLY valid JSON.

{
  "overview": "",
  "difficulty": "",
  "documentationScore": 0,
  "organizationScore": 0,
  "beginnerFriendliness": 0,
  "technologies": [],
  "roadmap": []
  "interviewQuestions": []
}
Generate 5 interview questions that someone might be asked after working on or studying this repository.

Questions should be specific to the technologies and architecture used. 

Do not include markdown.
Do not wrap in code blocks.
Return raw JSON only.
`,
              },
            ],
          },
        ],
      }),
    }
  );

  
  const data = await response.json();
  if (!response.ok) {
  console.error("Gemini Error:", data);
  return `Gemini Error: ${JSON.stringify(data)}`;
}

console.log(
  "GEMINI RESPONSE:",
  JSON.stringify(data, null, 2)
);



  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No summary generated."
  );
}