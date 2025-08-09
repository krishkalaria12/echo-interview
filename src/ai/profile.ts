import { Annotation, MemorySaver, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { nanoid } from "nanoid";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

function toDirectDriveDownload(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    const host = u.hostname;
    if (host.includes("drive.google.com")) {
      // Patterns: /file/d/<id>/view, /open?id=<id>
      const m1 = u.pathname.match(/\/file\/d\/([^/]+)/);
      const m2 = u.searchParams.get("id");
      const id = m1?.[1] || m2;
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
  } catch (_) {}
  return inputUrl;
}

async function tryLoadPdf(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/pdf,*/*" } });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const isPdf = contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf");
    if (!isPdf) return null;
    const ab = await res.arrayBuffer();
    const blob = new Blob([ab], { type: "application/pdf" });
    const loader = new WebPDFLoader(blob, { splitPages: false });
    const docs = await loader.load();
    const combined = docs.map((d) => d.pageContent).join("\n\n");
    return combined.replace(/\s+/g, " ").trim().slice(0, 20000);
  } catch {
    return null;
  }
}

// Loaders-based fetch: uses PDF loader for PDFs (including Google Drive) and Cheerio for HTML
async function fetchText(url?: string | null): Promise<string | null> {
  if (!url) return null;
  const normalized = toDirectDriveDownload(url);
  // First attempt PDF path
  const pdf = await tryLoadPdf(normalized);
  if (pdf) return pdf;
  // Fallback to HTML
  try {
    const loader = new CheerioWebBaseLoader(normalized, {
      selector: "main, article, p",
    });
    const docs = await loader.load();
    const combined = docs.map((d) => d.pageContent).join("\n\n");
    return combined.replace(/\s+/g, " ").trim().slice(0, 20000);
  } catch {
    return null;
  }
}

export type CandidateInputs = {
  resumeUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  position: string;
};

const ProfileState = Annotation.Root({
  // Inputs (so we can pass them into the graph state)
  resumeUrl: Annotation<string | null>(),
  githubUrl: Annotation<string | null>(),
  linkedinUrl: Annotation<string | null>(),
  portfolioUrl: Annotation<string | null>(),
  position: Annotation<string>(),
  // Derived
  resumeText: Annotation<string | null>(),
  githubText: Annotation<string | null>(),
  linkedinText: Annotation<string | null>(),
  portfolioText: Annotation<string | null>(),
  profileMarkdown: Annotation<string | null>(),
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
});
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
});

async function fetchAll(state: typeof ProfileState.State) {
  const [resumeText, githubText, linkedinText, portfolioText] = await Promise.all([
    fetchText(state.resumeUrl),
    fetchText(state.githubUrl),
    fetchText(state.linkedinUrl),
    fetchText(state.portfolioUrl),
  ]);
  console.log("resumeText", resumeText);
  return { resumeText, githubText, linkedinText, portfolioText };
}

async function synthesizeProfile(state: typeof ProfileState.State) {
  const { resumeText, githubText, linkedinText, portfolioText, position } = state as any;
  const rawSegments: Array<{ source: string; text: string }> = [
    { source: "resume", text: resumeText || "" },
    { source: "github", text: githubText || "" },
    { source: "linkedin", text: linkedinText || "" },
    { source: "portfolio", text: portfolioText || "" },
  ].filter((s) => s.text && s.text.length > 0);

  // Build RAG corpus in-memory
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 150 });
  const docs: Document[] = [];
  for (const seg of rawSegments) {
    const parts = await splitter.splitDocuments([
      new Document({ pageContent: seg.text, metadata: { source: seg.source } }),
    ]);
    docs.push(...parts);
  }
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  const query = `Distill candidate information relevant to the position: ${position}. Focus on concrete skills, projects, impact, seniority signals.`;
  const topk = await store.similaritySearch(query, 12);
  const context = topk
    .map((d) => `Source: ${d.metadata?.source}\n${d.pageContent}`)
    .join("\n\n---\n\n");

  const prompt = `You are building a concise candidate profile to guide an AI interviewer.
Return Markdown with sections: Summary, Skills, Projects, Experience, Signals.
Focus on relevance to the role: ${position}. Be accurate and avoid speculation.
Use only the CONTEXT provided.

CONTEXT:
${context}`;

  const response = await model.invoke(prompt);
  const md = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  return { profileMarkdown: md };
}

export async function buildProfile(inputs: CandidateInputs): Promise<string | null> {
  const graph = new StateGraph(ProfileState)
    .addNode("fetchAll", fetchAll)
    .addNode("synthesizeProfile", synthesizeProfile)
    .addEdge(START, "fetchAll")
    .addEdge("fetchAll", "synthesizeProfile")
    .addEdge("synthesizeProfile", END)
    .compile({ checkpointer: new MemorySaver() });

  const initialState = {
    resumeUrl: inputs.resumeUrl ?? null,
    githubUrl: inputs.githubUrl ?? null,
    linkedinUrl: inputs.linkedinUrl ?? null,
    portfolioUrl: inputs.portfolioUrl ?? null,
    position: inputs.position,
  } as Partial<typeof ProfileState.State> as any;

  const output = await graph.invoke(initialState, { configurable: { thread_id: nanoid() } });
  return output.profileMarkdown ?? null;
}

