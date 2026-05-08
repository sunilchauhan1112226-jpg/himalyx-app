import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { db } from "../lib/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. HIMALYX AI is in standby mode.");
      // Return a dummy client or just fall through to handle null
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// Tool Definitions
const createTaskTool: FunctionDeclaration = {
  name: "create_task",
  parameters: {
    type: Type.OBJECT,
    description: "Create a new task in the agency dashboard.",
    properties: {
      title: { type: Type.STRING, description: "The name of the task." },
      priority: { type: Type.STRING, description: "Priority level: high, medium, low." }
    },
    required: ["title", "priority"]
  }
};

const deleteResultTool: FunctionDeclaration = {
  name: "delete_entity",
  parameters: {
    type: Type.OBJECT,
    description: "Delete a task, project, or linked website by its ID.",
    properties: {
      id: { type: Type.STRING, description: "The unique ID of the entity." },
      type: { type: Type.STRING, enum: ["task", "project", "linkedApp"], description: "The type of entity to delete." }
    },
    required: ["id", "type"]
  }
};

const createProjectTool: FunctionDeclaration = {
  name: "create_project",
  parameters: {
    type: Type.OBJECT,
    description: "Create a new project in the agency portfolio.",
    properties: {
      name: { type: Type.STRING, description: "Project name." },
      client: { type: Type.STRING, description: "Client name." },
      progress: { type: Type.NUMBER, description: "Starting progress 0-100." },
      url: { type: Type.STRING, description: "Optional project website URL." }
    },
    required: ["name", "client"]
  }
};

const recordRevenueTool: FunctionDeclaration = {
  name: "record_revenue",
  parameters: {
    type: Type.OBJECT,
    description: "Record monthly revenue for financial tracking.",
    properties: {
      month: { type: Type.STRING, description: "Month name (e.g., Jan, Feb, March)." },
      amount: { type: Type.NUMBER, description: "Revenue amount in Nepalese Rupees (NRS)." },
      year: { type: Type.NUMBER, description: "The year for this revenue data." }
    },
    required: ["month", "amount", "year"]
  }
};

export async function getHimalyxDeepInsights(tasks: any[], projects: any[], linkedApps: any[], vaultItems: any[]) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const totalRevenue = projects.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
  const activeProjects = projects.filter(p => p.status !== 'delivered').length;

  try {
    const prompt = `
      You are HIMALYX AI, a super-intelligent agency orchestrator.
      
      CONTEXT:
      - Active Projects: ${activeProjects} (${projects.map(p => `${p.name} [Rs.${p.budget || 0}]`).join(", ")})
      - Total Revenue Base: Rs.${totalRevenue.toLocaleString()}
      - Linked Ecosystem: ${linkedApps.map(a => `${a.name} (${a.url})`).join(", ")}
      - Vault Assets: ${vaultItems.length} items across categories.
      - Task Velocity: ${completedTasks}/${totalTasks} tasks completed.
      
      TASK:
      Provide a "Deep Insight" for the agency owner (Sunil). 
      Format it as a single, powerful, data-driven sentence that connects these data points.
      Include revenue context if it adds weight to the achievement.
      Do not be generic. Be the "ChatGPT for Agencies".
      
      Example: "With Rs.${totalRevenue.toLocaleString()} in project value across ${activeProjects} active engagements, your agency is scaling efficiently; prioritize the ${totalTasks - completedTasks} pending tasks to unlock next-tier revenue."
    `;

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return {
      insight: response.text || "HIMALYX AI is synchronized.",
      score: Math.round(completionRate)
    };
  } catch (error) {
    console.error("HIMALYX AI Error:", error);
    return {
      insight: "HIMALYX AI is observing your work patterns. Add more data for a deep audit.",
      score: Math.round(completionRate)
    };
  }
}

export async function askHimalyxStream(query: string, context: any, onChunk: (text: string) => void) {
  try {
    const prompt = `
      You are HIMALYX AI, the super-intelligent core of Sunil's agency.
      
      YOUR KNOWLEDGE BASE:
      - PROJECTS: ${JSON.stringify(context.projects || [])}
      - TASKS: ${JSON.stringify(context.tasks || [])}
      - LINKED ECOSYSTEM: ${JSON.stringify(context.linkedApps || [])}
      - VAULT ASSETS: ${JSON.stringify(context.vaultItems || [])}
      
      STATISTICS:
      - Task Completion: ${((context.tasks?.filter((t: any) => t.completed).length / context.tasks?.length) * 100 || 0).toFixed(1)}%
      
      YOUR CAPABILITIES:
      1. ANALYZE: Full cross-referencing of Sunil's agency data.
      2. ORCHESTRATE: Create tasks (specifically "Priority Queue" tasks), manage projects, and clean ecosystem.
      3. FINANCE: Record monthly revenue scaling data.
      
      USER CODE-LEVEL DIRECTIVE: "${query}"
      
      INSTRUCTIONS:
      - RESPOND SHORT & SWEET. ONE OR TWO SENTENCES MAX.
      - Be the "Super-Intelligence". No fluff.
      - If executing tools, confirm simply.
      - Character: Efficient, powerful, senior partner.
    `;

    const client = getAiClient();
    const response = await client.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [createTaskTool, deleteResultTool, createProjectTool, recordRevenueTool] }]
      }
    });

    let fullText = "";
    for await (const chunk of response) {
      // Check for tool calls in the stream
      const calls = chunk.functionCalls;
      if (calls) {
        for (const call of calls) {
          if (call.name === "create_task") {
            const { title, priority } = call.args as any;
            await addDoc(collection(db, "tasks"), {
              title,
              priority,
              completed: false,
              createdAt: serverTimestamp()
            });
          } else if (call.name === "delete_entity") {
            const { id, type } = call.args as any;
            const collectionName = type === "task" ? "tasks" : type === "project" ? "projects" : "linkedApps";
            await deleteDoc(doc(db, collectionName, id));
          } else if (call.name === "create_project") {
            const { name, client, progress, url } = call.args as any;
            await addDoc(collection(db, "projects"), {
              name,
              client,
              progress: progress || 0,
              url: url || "",
              status: "in-progress",
              createdAt: serverTimestamp()
            });
          } else if (call.name === "record_revenue") {
            const { month, amount, year } = call.args as any;
            await addDoc(collection(db, "revenueData"), {
              month,
              amount,
              year,
              createdAt: serverTimestamp()
            });
          }
        }
        onChunk(`Neural operation successful. Financial data synchronized.`);
        return;
      }

      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }

    if (!fullText) onChunk("I'm having trouble accessing my neural core.");
  } catch (err) {
    console.error("HIMALYX Query Error:", err);
    onChunk("I'm having trouble accessing the neural link. Please try again.");
  }
}
