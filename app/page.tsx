"use client";

import { useEffect, useRef, useState } from "react";

const loadingMessages = [
  "🔍 Scanning repository...",
  "📂 Mapping architecture...",
  "🧠 Understanding codebase...",
  "📚 Generating roadmap...",
  "🎤 Creating interview questions...",
];

export default function Home() {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const [copied, setCopied] = useState(false);
  const [copiedInterview, setCopiedInterview] = useState(false);
  const [sharedSummary, setSharedSummary] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {

    useEffect(() => {
  chatEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages, chatLoading]);

    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [loading]);

  const folders =
    result?.tree
      ?.filter((path: string) => path.includes("/"))
      .map((path: string) => path.split("/")[0]) ?? [];

  const uniqueFolders = Array.from(new Set(folders)) as string[];

  const topDependencies = Array.from(
    new Set([
      ...(result?.projectInfo?.dependencies ?? []),
      ...(result?.projectInfo?.devDependencies ?? []),
    ])
  ) as string[];

  const scoreColor =
    aiData?.overallScore >= 80
      ? "text-green-400"
      : aiData?.overallScore >= 60
      ? "text-yellow-400"
      : "text-red-400";

  function copyRoadmap() {
    if (!aiData?.roadmap) return;

    const roadmapText = aiData.roadmap
      .map((step: string, index: number) => `Step ${index + 1}: ${step}`)
      .join("\n");

    navigator.clipboard.writeText(roadmapText);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function copyInterviewQuestions() {
    if (!aiData?.interviewQuestions) return;

    const questionsText = aiData.interviewQuestions
      .map((question: string, index: number) => `Q${index + 1}. ${question}`)
      .join("\n\n");

    navigator.clipboard.writeText(questionsText);

    setCopiedInterview(true);

    setTimeout(() => {
      setCopiedInterview(false);
    }, 2000);
  }

  async function shareAnalysisSummary() {
    if (!aiData || !result) return;

    const summaryText = `
CodeAtlas Repository Analysis

Repository: ${result.owner}/${result.repo}

Repository Score: ${aiData.overallScore}/100
Difficulty: ${aiData.difficulty}

Overview:
${aiData.overview}

Scores:
Documentation: ${aiData.documentationScore}/100
Organization: ${aiData.organizationScore}/100
Beginner Friendly: ${aiData.beginnerFriendliness}/100

Technologies:
${aiData.technologies?.join(", ")}

Learning Roadmap:
${aiData.roadmap
  ?.map((step: string, index: number) => `Step ${index + 1}: ${step}`)
  .join("\n")}

Interview Questions:
${aiData.interviewQuestions
  ?.map((question: string, index: number) => `Q${index + 1}. ${question}`)
  .join("\n")}
`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "CodeAtlas Repository Analysis",
          text: summaryText,
        });
      } else {
        await navigator.clipboard.writeText(summaryText);
      }

      setSharedSummary(true);

      setTimeout(() => {
        setSharedSummary(false);
      }, 2000);
    } catch (error) {
      console.error("Share failed:", error);
    }
  }

  async function sendChatMessage() {
    const question = chatInput.trim();

    if (!question || !result) return;

    const userMessage = {
      role: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoData: result,
          question,
        }),
      });

      const data = await res.json();

      const botMessage = {
        role: "bot",
        text: data.success
          ? data.answer
          : data.error || "Failed to answer question.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Something went wrong while asking CodeAtlas.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function analyzeRepo() {
    try {
      setLoading(true);
      setError("");
      setAiData(null);
      setResult(null);
      setLoadingMessageIndex(0);
      setCopied(false);
      setCopiedInterview(false);
      setSharedSummary(false);
      setMessages([]);
      setChatInput("");
      setChatLoading(false);
      setChatOpen(false);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to analyze repository.");
        return;
      }

      const summaryRes = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const summaryData = await summaryRes.json();

      if (!summaryData.success) {
        setError(summaryData.error || "Failed to generate AI summary.");
        return;
      }

      try {
        const cleanedSummary = summaryData.summary
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleanedSummary);
        setAiData(parsed);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        setError("AI returned an invalid response. Please try again.");
      }

      setResult(data);

      setMessages([
        {
          role: "bot",
          text: `I've scanned ${data.owner}/${data.repo}. Ask me anything about the architecture, files, tech stack, roadmap, or improvements.`,
        },
      ]);
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please check the repo URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mt-20">
        <h1 className="text-7xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          CodeAtlas
        </h1>

        <p className="text-zinc-400 text-center mt-4 mb-10">
          Turn repositories into roadmaps.
        </p>

        <input
          type="text"
          placeholder="https://github.com/vercel/next.js"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full p-4 rounded-lg bg-zinc-900 border border-zinc-700 outline-none"
        />

        <button
          onClick={analyzeRepo}
          disabled={loading}
          className="w-full mt-4 p-4 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition disabled:opacity-70"
        >
          {loading ? loadingMessages[loadingMessageIndex] : "Analyze Repository"}
        </button>

        {error && (
          <div className="mt-4 bg-red-950 border border-red-800 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        {aiData && (
          <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h2 className="text-3xl font-bold mb-6">
              Repository Analysis
            </h2>

            <div className="text-center mb-6">
              <div className={`text-7xl font-bold ${scoreColor}`}>
                {aiData.overallScore}
              </div>

              <p className="text-zinc-400 mt-2">
                Repository Score
              </p>
            </div>

            <button
              onClick={shareAnalysisSummary}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg mb-6 transition font-semibold"
            >
              {sharedSummary ? "✅ Shared / Copied!" : "🔗 Share Analysis Summary"}
            </button>

            <div className="bg-zinc-800 p-5 rounded-xl mb-6">
              <h3 className="font-bold text-xl mb-2">
                Overview
              </h3>

              <p className="text-zinc-300 leading-relaxed">
                {aiData.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-zinc-800 p-4 rounded-xl">
                <p className="text-zinc-400 text-sm">
                  Documentation
                </p>

                <h3 className="text-3xl font-bold mt-2">
                  {aiData.documentationScore}
                </h3>
              </div>

              <div className="bg-zinc-800 p-4 rounded-xl">
                <p className="text-zinc-400 text-sm">
                  Organization
                </p>

                <h3 className="text-3xl font-bold mt-2">
                  {aiData.organizationScore}
                </h3>
              </div>

              <div className="bg-zinc-800 p-4 rounded-xl">
                <p className="text-zinc-400 text-sm">
                  Beginner Friendly
                </p>

                <h3 className="text-3xl font-bold mt-2">
                  {aiData.beginnerFriendliness}
                </h3>
              </div>
            </div>

            <div className="mt-6">
              <span className="bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
                Difficulty: {aiData.difficulty}
              </span>
            </div>

            {aiData.difficultyReason && (
              <p className="text-zinc-400 mt-4">
                {aiData.difficultyReason}
              </p>
            )}

            <h3 className="text-2xl font-bold mt-10 mb-4">
              Technologies
            </h3>

            <div className="flex flex-wrap gap-2">
              {aiData.technologies?.map((tech: string) => (
                <span
                  key={tech}
                  className="bg-zinc-800 px-4 py-2 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center mt-10 mb-4">
              <h3 className="text-2xl font-bold">
                Learning Roadmap
              </h3>

              <button
                onClick={copyRoadmap}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm font-semibold"
              >
                {copied ? "✅ Copied!" : "📋 Copy Roadmap"}
              </button>
            </div>

            <div className="space-y-3">
              {aiData.roadmap?.map((step: string, index: number) => (
                <div
                  key={index}
                  className="bg-zinc-800 p-4 rounded-xl"
                >
                  Step {index + 1} → {step}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-10 mb-4">
              <h3 className="text-2xl font-bold">
                Interview Questions
              </h3>

              <button
                onClick={copyInterviewQuestions}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm font-semibold"
              >
                {copiedInterview ? "✅ Copied!" : "📋 Copy Questions"}
              </button>
            </div>

            <div className="space-y-3">
              {aiData.interviewQuestions?.map(
                (question: string, index: number) => (
                  <div
                    key={index}
                    className="bg-zinc-800 p-4 rounded-xl border border-zinc-700"
                  >
                    <span className="font-semibold">
                      Q{index + 1}.
                    </span>{" "}
                    {question}
                  </div>
                )
              )}
            </div>
          </div>
        )}

       {result && (
  <div className="fixed bottom-6 right-6 z-50">
    {!chatOpen && (
      <button
  onClick={() => setChatOpen(true)}
  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 text-white px-6 py-4 rounded-full shadow-2xl font-bold transition flex items-center gap-2 border border-white/10"
>
  🤖 Ask Atlas AI
</button>
    )}

    {chatOpen && (
      <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">
              Atlas AI Bot
            </h2>
            <p className="text-blue-100 text-xs">
              Ask about this repository
            </p>
          </div>

          <button
            onClick={() => setChatOpen(false)}
            className="text-white text-xl font-bold hover:opacity-80"
          >
            −
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-400 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2">
                 <span className="animate-pulse">●</span>
                  <span>Atlas is thinking...</span>
               </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-zinc-800 p-3 bg-zinc-950">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 p-3 rounded-lg bg-zinc-900 border border-zinc-700 outline-none text-white text-sm"
            />

            <button
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 rounded-lg font-semibold transition"
            >
              ➤
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
  {[
    "What files should I read first?",
    "Explain the architecture.",
    "How can this be improved?",
  ].map((question) => (
    <button
      key={question}
      onClick={() => setChatInput(question)}
      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-2 rounded-full text-xs transition"
    >
      {question}
    </button>
  ))}
</div>
        </div>
      </div>
    )}
  </div>
)}

        {result && (
          <div className="mt-10 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-3xl font-bold">
              {result.projectInfo?.name || `${result.owner}/${result.repo}`}
            </h2>

            <div className="mt-4 space-y-2 text-zinc-300">
              <p>
                <strong>Repository:</strong> {result.owner}/{result.repo}
              </p>

              <p>
                <strong>Total Files:</strong>{" "}
                {result.totalFiles?.toLocaleString()}
              </p>

              <p>
                <strong>Package Manager:</strong>{" "}
                {result.projectInfo?.packageManager || "Unknown"}
              </p>

              <p>
                <strong>Version:</strong>{" "}
                {result.projectInfo?.version || "Unknown"}
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">
              Important Files
            </h3>

            <div className="grid gap-2">
              {result.importantFiles?.map((file: any) => (
                <div
                  key={file.path}
                  className="bg-zinc-800 p-3 rounded-lg"
                >
                  {file.path}
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">
              Top Dependencies
            </h3>

            <div className="flex flex-wrap gap-2">
              {topDependencies.length > 0 ? (
                topDependencies.map((dep: string) => (
                  <span
                    key={dep}
                    className="bg-zinc-800 px-3 py-1 rounded-full text-sm"
                  >
                    {dep}
                  </span>
                ))
              ) : (
                <p className="text-zinc-400">
                  No dependencies found.
                </p>
              )}
            </div>

            <h3 className="text-2xl font-bold mt-10 mb-4">
              Architecture
            </h3>

            <div className="bg-black rounded-xl p-4 border border-zinc-800">
              <pre className="text-green-400 whitespace-pre-wrap text-sm">
{uniqueFolders.length > 0
  ? uniqueFolders.map((folder) => `📁 ${folder}`).join("\n")
  : "No architecture data found."}
              </pre>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">
              README Preview
            </h3>

            <pre className="bg-black text-green-400 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap text-sm">
              {result.readmePreview || "No README found."}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}