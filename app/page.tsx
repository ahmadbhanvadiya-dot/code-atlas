"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  

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
      const summaryRes = await fetch("/api/summary", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

const summaryData = await summaryRes.json();
console.log("SUMMARY RECEIVED:", summaryData.summary);
console.log("TYPE:", typeof summaryData.summary);

console.log("SUMMARY DATA:", summaryData);


setSummary(summaryData.summary);

      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mt-20">
        <h1 className="text-6xl font-bold text-center">
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
        <div className="mt-4 p-4 bg-red-900 text-white rounded">
  Summary Length: {summary.length}
</div>

{summary && (
  <div className="mt-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
    <h2 className="text-2xl font-bold mb-4">
      AI Summary
    </h2>

  <div className="prose prose-invert max-w-none">
  <ReactMarkdown>
    {summary}
  </ReactMarkdown>
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
          <div className="text-red-500">
  Summary:
  {JSON.stringify(summary)}
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