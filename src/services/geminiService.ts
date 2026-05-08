import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { db } from "../lib/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.error("CRITICAL: GEMINI_API_KEY is missing or empty.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Tool Definitions
const createTaskTool: FunctionDeclaration = {
  name: "create_task",
  description: "Create a new priority task for the agency.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The name of the task." },
      priority: { type: Type.STRING, enum: ["urgent", "high", "normal"], description: "Priority level." }
    },
    required: ["title", "priority"]
  }
};

const deleteEntityTool: FunctionDeclaration = {
  name: "delete_entity",
  description: "Delete an entity from the dashboard.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID to delete." },
      type: { type: Type.STRING, enum: ["task", "project", "linkedApp"], description: "Entity type." }
    },
    required: ["id", "type"]
  }
};

const createProjectTool: FunctionDeclaration = {
  name: "create_project",
  description: "Initialize a new project.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      client: { type: Type.STRING },
      progress: { type: Type.NUMBER }
    },
    required: ["name", "client"]
  }
};

const recordRevenueTool: FunctionDeclaration = {
  name: "record_revenue",
  description: "Log financial data.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      month: { type: Type.STRING },
      amount: { type: Type.NUMBER },
      year: { type: Type.NUMBER }
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
      CONTEXT: Active Projects: ${activeProjects}, Total Revenue Base: Rs.${totalRevenue.toLocaleString()}, Linked Ecosystem: ${linkedApps.length} apps, Task Velocity: ${completedTasks}/${totalTasks}.
      TASK: Provide a "Deep Insight" for Sunil. One powerful, data-driven sentence.
    `;

    const ai = getAiClient();
    if (!ai) throw new Error("API_KEY_MISSING");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return {
      insight: response.text || "HIMALYX AI is synchronized.",
      score: Math.round(completionRate)
    };
  } catch (error) {
    console.error("Himalyx Insight Error:", error);
    return {
      insight: "HIMALYX AI is observing your work patterns.",
      score: Math.round(completionRate)
    };
  }
}

export async function askHimalyxStream(query: string, context: any, onChunk: (text: string) => void) {
  try {
    const prompt = `
      You are HIMALYX AI, the super-intelligent core of Sunil's agency.
      KNOWLEDGE: Projects: ${context.projects?.length || 0}, Tasks: ${context.tasks?.length || 0}, Apps: ${context.linkedApps?.length || 0}.
      DIRECTIVE: "${query}"
      INSTRUCTIONS: Short responses. Confirm tasks simply.
    `;

    const ai = getAiClient();
    if (!ai) throw new Error("API_KEY_MISSING");

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [createTaskTool, deleteEntityTool, createProjectTool, recordRevenueTool] }]
      }
    });

    let fullText = "";
    for await (const chunk of response) {
      // Access functionCalls directly from chunk
      const calls = chunk.functionCalls;
      
      if (calls && calls.length > 0) {
        console.log("HIMALYX AI executing tools:", calls);
        for (const call of calls) {
          try {
            if (call.name === "create_task") {
              const { title, priority } = call.args as any;
              await addDoc(collection(db, "tasks"), {
                title,
                priority: priority || "normal",
                completed: false,
                createdAt: serverTimestamp()
              });
            } else if (call.name === "delete_entity") {
              const { id, type } = call.args as any;
              const collectionName = type === "task" ? "tasks" : type === "project" ? "projects" : "linkedApps";
              await deleteDoc(doc(db, collectionName, id));
            } else if (call.name === "create_project") {
              const { name, client, progress } = call.args as any;
              await addDoc(collection(db, "projects"), {
                name,
                client,
                progress: progress || 0,
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
          } catch (fireErr) {
            console.error("Firestore operation failed:", fireErr);
            throw fireErr; // Re-throw to be caught by outer catch
          }
        }
        onChunk(`Neural operation successful. Dashboard synchronized.`);
        return;
      }

      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }

    if (!fullText) onChunk("HIMALYX AI is online and analyzing your patterns.");
  } catch (err: any) {
    console.error("HIMALYX SDK Error:", err);
    let errorMsg = "I'm having trouble accessing the neural link. Please try again.";
    if (err.message?.includes("permission")) {
      errorMsg = "Authentication Required: Please ensure you are logged in as Sunil to modify data.";
    }
    onChunk(errorMsg);
  }
}
