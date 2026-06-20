"use client";

import { useState } from "react";


export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
const [aiData, setAiData] = useState<any>(null);

  

  async function analyzeRepo() {
    try {
      setLoading(true);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

     const data = await res.json();

console.log("ANALYZE DATA:", data);
console.log("TREE:", data.tree);

const summaryRes = await fetch("/api/summary", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

const summaryData = await summaryRes.json();



try {
  const parsed = JSON.parse(summaryData.summary);
  setAiData(parsed);
} catch (err) {
  console.error("JSON Parse Error:", err);
}

      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

const folders =
  result?.tree
    ?.filter((path: string) => path.includes("/"))
    .map((path: string) => path.split("/")[0]);

const uniqueFolders = [...new Set(folders)];

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
          className="w-full mt-4 p-4 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
        >
          {loading
            ? "Analyzing..."
            : "Analyze Repository"}
        </button>
      

{aiData && (
  <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">

    <h2 className="text-3xl font-bold mb-6">
      Repository Analysis
    </h2>
    <div className="bg-zinc-800 p-5 rounded-xl mt-6 mb-6">
  <h3 className="font-bold text-xl mb-2">
    Overview
  </h3>

  <p className="text-zinc-300">
    {aiData.overview}
  </p>
</div>
    
    <div className="text-center mb-8">
  <div className="text-7xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
    {aiData.overallScore}
  </div>

  <p className="text-zinc-400 mt-2">
    Repository Score
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

    <span className="bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
  Difficulty: {aiData.difficulty}
</span>

<p className="text-zinc-400 mt-4">
  {aiData.difficultyReason}
</p>

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

    <button
  onClick={() =>
    navigator.clipboard.writeText(
      aiData.roadmap.join("\n")
    )
  }
  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mb-4"
>
  📋 Copy Roadmap
</button>

    <h3 className="text-2xl font-bold mt-10 mb-4">
      Learning Roadmap
    </h3>

    <div className="space-y-3">
      {aiData.roadmap?.map(
        (step: string, index: number) => (
          <div
            key={index}
            className="bg-zinc-800 p-4 rounded-xl"
          >
            Step {index + 1} → {step}
          </div>
        )
      )}
    </div>
    <h3 className="text-2xl font-bold mt-10 mb-4">
  Interview Questions
</h3>

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
          <div className="mt-10 bg-zinc-900 rounded-xl p-6 border border-zinc-800">


            <h2 className="text-3xl font-bold">
              {result.projectInfo?.name ||
                `${result.owner}/${result.repo}`}
            </h2>

            <div className="mt-4 space-y-2 text-zinc-300">
              <p>
                <strong>Repository:</strong>{" "}
                {result.owner}/{result.repo}
              </p>

              <p>
                <strong>Total Files:</strong>{" "}
                {result.totalFiles?.toLocaleString()}
              </p>

              <p>
                <strong>Package Manager:</strong>{" "}
                {result.projectInfo?.packageManager ||
                  "Unknown"}
              </p>

              <p>
                <strong>Version:</strong>{" "}
                {result.projectInfo?.version ||
                  "Unknown"}
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">
              Important Files
            </h3>

            <div className="grid gap-2">
              {result.importantFiles?.map(
                (file: any) => (
                  <div
                    key={file.path}
                    className="bg-zinc-800 p-3 rounded-lg"
                  >
                    {file.path}
                  </div>
                )
              )}
            </div>
       
            <h3 className="text-xl font-semibold mt-8 mb-3">
              Top Dependencies
            </h3>

            <div className="flex flex-wrap gap-2">
              {result.projectInfo?.devDependencies?.map(
                (dep: string) => (
                  <span
                    key={dep}
                    className="bg-zinc-800 px-3 py-1 rounded-full text-sm"
                  >
                    {dep}
                  </span>
                )
              )}
            </div>
            <h3 className="text-2xl font-bold mt-10 mb-4">
  Architecture
</h3>

<div className="bg-black rounded-xl p-4 border border-zinc-800">
  <pre className="text-green-400">
{uniqueFolders?.map(folder => `📁 ${folder}`).join("\n")}
  </pre>
</div>

            <h3 className="text-xl font-semibold mt-8 mb-3">
              README Preview
            </h3>

            <pre className="bg-black text-green-400 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap text-sm">
              {result.readmePreview}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}