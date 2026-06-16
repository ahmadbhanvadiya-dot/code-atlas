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
${repoData.projectInfo?.devDependencies?.join(", ")}

README:
${repoData.readmePreview}

Explain:

1. What this project does
2. Main technologies used
3. Folder architecture overview
4. Learning roadmap for a beginner

Keep the answer concise.
`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No summary generated."
  );
}