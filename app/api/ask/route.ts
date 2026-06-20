import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { repoData, question } = await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required",
        },
        { status: 400 }
      );
    }

    const importantFilesText =
      repoData.importantFileContents
        ?.filter((file: any) => file.content)
        .map(
          (file: any) => `
FILE: ${file.path}

${file.content}
`
        )
        .join("\n\n")
        .slice(0, 25000) || "";

    const prompt = `
You are CodeAtlas, an AI codebase assistant.

Answer the user's question directly and conversationally.

Rules:
- Start with the direct answer first.
- Do not say phrases like "The repository information indicates", "Based on the repository", or "According to the files" unless necessary.
- Keep answers concise unless the user asks for detail.
- Mention file names only when they are useful.
- Use bullet points only when they improve readability.
- If the user asks about UI, design, color, layout, or styling, summarize the visual style in simple language first.
- If the answer is not available in the provided files, say that clearly.

Repository:
${repoData.owner}/${repoData.repo}

README:
${repoData.readmePreview}

Project Info:
${JSON.stringify(repoData.projectInfo, null, 2)}

Important Files:
${importantFilesText}

User Question:
${question}
`;
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
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || "Failed to answer question",
        },
        { status: 500 }
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer generated.";

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to ask repository question",
      },
      { status: 500 }
    );
  }
}