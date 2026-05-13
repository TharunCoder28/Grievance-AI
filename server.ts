import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- EMAIL UTILITY ---
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
      console.warn("Email configuration is missing. Notifications will be skipped.");
      return null;
    }
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT),
      secure: parseInt(EMAIL_PORT) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  try {
    await mailTransporter.sendMail({
      from: `"Police Grievance System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

// --- TYPES ---
interface AuditLog {
  id: string;
  grievanceId: string;
  adminId: string;
  action: string;
  details: string;
  timestamp: string;
}

interface Grievance {
  id: string;
  citizenName: string;
  citizenMobile: string;
  location: string;
  geoData?: { lat: number; lng: number; address?: string };
  text: string;
  category: string;
  priority: string;
  status: string;
  timestamp: string;
  summary?: string;
  explanation?: string;
  confidence?: string;
  keywords?: string[];
  media?: { type: "photo" | "video"; url: string; name?: string }[];
  aiFeedback?: {
    accurate: boolean | null;
    comment: string;
  };
}

// In-memory store for grievances (Prototype only)
let grievances: Grievance[] = [
  {
    id: "GRV-1001",
    citizenName: "Arun Kumar",
    citizenMobile: "9876543210",
    location: "T-Nagar, Chennai",
    geoData: { lat: 13.0418, lng: 80.2341 },
    text: "Heavy water logging near the main bus stand. It's causing major traffic delays.",
    category: "Sanitation",
    priority: "Medium",
    status: "In Progress",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    summary: "Water logging at T-Nagar bus stand.",
    explanation: "Detected keywords: water, delay → Medium Priority",
    confidence: "88%",
    keywords: ["water logging", "traffic delays"]
  },
  {
    id: "GRV-1002",
    citizenName: "Priya S.",
    citizenMobile: "9876543211",
    location: "Anna Nagar, Chennai",
    geoData: { lat: 13.0850, lng: 80.2101 },
    text: "I witnessed a theft at the local store. The thief was wearing a red jacket and fled on a bike.",
    category: "Crime",
    priority: "High",
    status: "Pending",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    summary: "Theft reported at Anna Nagar store.",
    explanation: "Detected keywords: theft → High Priority",
    confidence: "95%",
    keywords: ["theft", "thief"]
  },
  {
    id: "GRV-1003",
    citizenName: "Rajesh V.",
    citizenMobile: "9876543212",
    location: "Tambaram, Chennai",
    geoData: { lat: 12.9249, lng: 80.1277 },
    text: "Large pothole in the middle of the road near the railway station. It's very dangerous for bikers.",
    category: "Roads",
    priority: "High",
    status: "Pending",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    summary: "Dangerous pothole at Tambaram station.",
    explanation: "Detected keywords: pothole, dangerous → High Priority",
    confidence: "92%",
    keywords: ["pothole", "dangerous"]
  },
  {
    id: "GRV-1004",
    citizenName: "Meena K.",
    citizenMobile: "9876543213",
    location: "Velachery, Chennai",
    geoData: { lat: 12.9791, lng: 80.2185 },
    text: "Street lights are not working for the past three days in our street. It's unsafe at night.",
    category: "Electricity",
    priority: "Medium",
    status: "Pending",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    summary: "Street lights out in Velachery.",
    explanation: "Detected keywords: street lights, unsafe → Medium Priority",
    confidence: "85%",
    keywords: ["Street lights", "unsafe"]
  },
  {
    id: "GRV-1005",
    citizenName: "Suresh M.",
    citizenMobile: "9876543214",
    location: "Adyar, Chennai",
    geoData: { lat: 13.0067, lng: 80.2578 },
    text: "Garbage pile-up near the park entrance. It's attracting stray dogs and smells bad.",
    category: "Sanitation",
    priority: "Low",
    status: "Resolved",
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    summary: "Garbage accumulation in Adyar.",
    explanation: "Detected keywords: garbage, smell → Low Priority",
    confidence: "90%",
    keywords: ["Garbage", "smells bad"]
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "LOG-1",
    grievanceId: "GRV-1001",
    adminId: "ADMIN-01",
    action: "Status Update",
    details: "Changed status from Pending to In Progress",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

// Simple OTP Store
const otps: { [mobile: string]: string } = {};

// AI Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// --- AI LOGIC ---
const mockTranslate = (text: string) => {
  const mapping: { [key: string]: string } = {
    "விபத்து": "accident",
    "திருட்டு": "theft",
    "பிரச்சனை": "problem",
    "தண்ணீர்": "water",
    "குப்பை": "garbage",
    "காயம்": "injured",
    "அவசரம்": "emergency"
  };
  let translated = text;
  Object.keys(mapping).forEach(tamil => {
    translated = translated.replace(new RegExp(tamil, 'g'), mapping[tamil]);
  });
  return translated;
};

const classifyGrievance = (text: string) => {
  const translatedText = mockTranslate(text);
  const lowerText = translatedText.toLowerCase();
  
  const keywords = {
    high: ["accident", "injured", "theft", "stolen", "emergency", "blood", "weapon", "fire", "death", "hit and run"],
    medium: ["issue", "problem", "delay", "broken", "leak", "noise", "garbage", "water", "logging"],
  };

  let priority = "Low";
  let detectedKeywords: string[] = [];

  for (const k of keywords.high) {
    if (lowerText.includes(k)) {
      priority = "High";
      detectedKeywords.push(k);
    }
  }

  if (priority === "Low") {
    for (const k of keywords.medium) {
      if (lowerText.includes(k)) {
        priority = "Medium";
        detectedKeywords.push(k);
      }
    }
  }

  const categories = ["Traffic", "Crime", "Sanitation", "Emergency", "Infrastructure"];
  let category = "General";
  
  if (lowerText.includes("traffic") || lowerText.includes("accident") || lowerText.includes("road")) category = "Traffic";
  else if (lowerText.includes("theft") || lowerText.includes("stolen") || lowerText.includes("crime")) category = "Crime";
  else if (lowerText.includes("garbage") || lowerText.includes("water") || lowerText.includes("sanitation")) category = "Sanitation";
  else if (lowerText.includes("emergency") || lowerText.includes("injured") || lowerText.includes("fire")) category = "Emergency";
  else if (lowerText.includes("broken") || lowerText.includes("infrastructure") || lowerText.includes("leak")) category = "Infrastructure";

  return {
    category,
    priority,
    confidence: (85 + Math.floor(Math.random() * 10)) + "%",
    explanation: detectedKeywords.length > 0 
      ? `Detected keywords: ${detectedKeywords.join(", ")} → ${priority} Priority`
      : "No critical keywords detected. Defaulting to Low Priority.",
    keywords: detectedKeywords
  };
};

// --- ROLE MANAGEMENT MIDDLEWARE ---
const checkRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers["x-user-role"] as string;
    
    if (!userRole) {
      return res.status(401).json({ error: "Authentication required. Please provide a role." });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }

    next();
  };
};

// API Routes

// OTP Auth
app.post("/api/auth/otp/send", (req, res) => {
  const { mobile } = req.body;
  if (!mobile || mobile.length < 10) return res.status(400).json({ error: "Invalid mobile number" });
  
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otps[mobile] = otp;
  
  console.log(`[OTP] Sent to ${mobile}: ${otp}`); // In real app, send via SMS
  res.json({ message: "OTP sent successfully", otp }); // Sending OTP back for demo purposes
});

app.post("/api/auth/otp/verify", (req, res) => {
  const { mobile, otp } = req.body;
  if (otps[mobile] === otp) {
    delete otps[mobile];
    res.json({ message: "OTP verified", token: `citizen-${mobile}` });
  } else {
    res.status(400).json({ error: "Invalid OTP" });
  }
});

// Admin only: View all grievances
app.get("/api/grievances", checkRole(["Admin", "Citizen"]), (req, res) => {
  const userRole = req.headers["x-user-role"];
  const userMobile = req.headers["x-user-mobile"];

  if (userRole === "Admin") {
    res.json(grievances);
  } else {
    // Filter for citizens
    const filtered = grievances.filter(g => g.citizenMobile === userMobile);
    res.json(filtered);
  }
});

// Everyone: Predict category/priority (Citizen tool)
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `
          You are an AI assistant for the Police Grievance AI Platform. 
          Your goal is to help citizens report grievances, check status, and understand police procedures.
          Be professional, empathetic, and clear. 
          If asked about emergencies, always tell them to call 100 immediately.
          Handle both English and Tamil if the user uses them.
          Keep responses relatively concise.
        `,
      },
      history: history || [],
    });

    const response = await chat.sendMessage({ message });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to connect to AI assistant" });
  }
});

app.post("/api/predict", async (req, res) => {
  const { complaint_text } = req.body;
  if (!complaint_text) return res.status(400).json({ error: "complaint_text is required" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze the following police grievance and return a JSON object with:
        1. category: (One of: Theft, Assault, Traffic, Cybercrime, Harassment, Fraud, Other)
        2. priority: (High, Medium, or Low)
        3. summary: (Short 1-sentence summary)
        4. keywords: (An array of specific words or short phrases from the original text that led to this classification and priority)

        Grievance: "${complaint_text}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            summary: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["category", "priority", "summary", "keywords"]
        }
      }
    });

    const aiResult = JSON.parse(response.text || "{}");
    const localResult = classifyGrievance(complaint_text);
    
    res.json({
      ...aiResult,
      confidence: localResult.confidence,
      explanation: localResult.explanation
    });
  } catch (error) {
    console.error("AI Prediction Error:", error);
    const localResult = classifyGrievance(complaint_text);
    res.json({
      ...localResult,
      summary: complaint_text.substring(0, 50) + "..."
    });
  }
});

app.post("/api/grievances", checkRole(["Citizen"]), async (req, res) => {
  const { 
    text, 
    citizenName, 
    citizenMobile, 
    location, 
    geoData, 
    category, 
    priority, 
    summary, 
    explanation, 
    confidence,
    media,
    aiFeedback
  } = req.body;

  if (!citizenMobile) return res.status(400).json({ error: "citizenMobile is required" });

  const newGrievance: Grievance = {
    id: `GRV-${1000 + grievances.length + 1}`,
    text: text,
    category: category || "Other",
    priority: priority || "Low",
    summary: summary || text.substring(0, 50),
    citizenName: citizenName || "Anonymous",
    citizenMobile: citizenMobile,
    location: location || "Unknown",
    geoData,
    explanation,
    confidence,
    status: "Pending",
    timestamp: new Date().toISOString(),
    media: media || [],
    aiFeedback
  };

  grievances.unshift(newGrievance);
  
  // Trigger email for high-priority grievances
  if (newGrievance.priority === "High") {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail(
        adminEmail,
        `🚨 HIGH PRIORITY GRIEVANCE: ${newGrievance.id}`,
        `
          <h2>New High Priority Grievance Received</h2>
          <p><strong>ID:</strong> ${newGrievance.id}</p>
          <p><strong>Citizen:</strong> ${newGrievance.citizenName}</p>
          <p><strong>Category:</strong> ${newGrievance.category}</p>
          <p><strong>Location:</strong> ${newGrievance.location}</p>
          <p><strong>Summary:</strong> ${newGrievance.summary}</p>
          <p><strong>AI Explanation:</strong> ${newGrievance.explanation}</p>
          <p><strong>Media Attached:</strong> ${newGrievance.media && newGrievance.media.length > 0 ? `${newGrievance.media.length} items (Check Dashboard)` : "None"}</p>
          <hr/>
          <p>Please log in to the Admin Dashboard to take action.</p>
        `
      );
    }
  }

  res.status(201).json(newGrievance);
});

// Admin only: Update grievance status or category with audit logging
app.patch("/api/grievances/:id", checkRole(["Admin"]), (req, res) => {
  const { id } = req.params;
  const { status, category } = req.body;
  const index = grievances.findIndex(g => g.id === id);
  
  if (index !== -1) {
    const grievance = grievances[index];
    const changes: string[] = [];

    if (status && grievance.status !== status) {
      changes.push(`status from ${grievance.status} to ${status}`);
      grievance.status = status;
    }

    if (category && grievance.category !== category) {
      changes.push(`category from ${grievance.category} to ${category}`);
      grievance.category = category;
    }

    if (changes.length > 0) {
      const logEntry: AuditLog = {
        id: `LOG-${auditLogs.length + 1}`,
        grievanceId: id,
        adminId: "ADMIN-SYS", // In a real app, this would be the actual logged-in admin's ID
        action: "Administrative Update",
        details: `Updated ${changes.join(" and ")}`,
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(logEntry);

      // Trigger email for status updates
      if (status) {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          sendEmail(
            adminEmail,
            `✅ UPDATE RECORDED: ${id}`,
            `
              <h2>Grievance Update Logged</h2>
              <p><strong>ID:</strong> ${id}</p>
              <p><strong>Action:</strong> ${logEntry.details}</p>
              <p><strong>Admin:</strong> ${logEntry.adminId}</p>
              <hr/>
              <p>The administrative action has been recorded in the audit trail.</p>
            `
          );
        }
      }
    }

    res.json(grievance);
  } else {
    res.status(404).json({ error: "Grievance not found" });
  }
});

// Admin only: Bulk update grievances
app.post("/api/admin/grievances/bulk-update", checkRole(["Admin"]), (req, res) => {
  const { ids, updates } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required" });
  }

  const updatedGrievances: Grievance[] = [];
  const logs: AuditLog[] = [];

  ids.forEach(id => {
    const index = grievances.findIndex(g => g.id === id);
    if (index !== -1) {
      const grievance = grievances[index];
      const changes: string[] = [];

      if (updates.status && grievance.status !== updates.status) {
        changes.push(`status from ${grievance.status} to ${updates.status}`);
        grievance.status = updates.status;
      }

      if (updates.category && grievance.category !== updates.category) {
        changes.push(`category from ${grievance.category} to ${updates.category}`);
        grievance.category = updates.category;
      }

      if (changes.length > 0) {
        const logEntry: AuditLog = {
          id: `LOG-${auditLogs.length + logs.length + 1}`,
          grievanceId: id,
          adminId: "ADMIN-SYS",
          action: "Bulk Update",
          details: `Updated ${changes.join(" and ")} as part of bulk action`,
          timestamp: new Date().toISOString()
        };
        logs.push(logEntry);
        updatedGrievances.push(grievance);
      }
    }
  });

  if (logs.length > 0) {
    auditLogs.unshift(...logs);
    
    // Send one summary email for bulk updates
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail(
        adminEmail,
        `📦 BULK UPDATE EXECUTED: ${ids.length} items`,
        `
          <h2>Bulk Update Performance</h2>
          <p><strong>Processed:</strong> ${ids.length} grievances</p>
          <p><strong>Updated:</strong> ${updatedGrievances.length} grievances</p>
          <p><strong>Action Type:</strong> Admin Bulk Update</p>
          <hr/>
          <p>Check the Audit Log for individual change details.</p>
        `
      );
    }
  }

  res.json({ message: "Bulk update complete", count: updatedGrievances.length });
});

// Admin only: View Audit Logs
app.get("/api/admin/audit-logs", checkRole(["Admin"]), (req, res) => {
  res.json(auditLogs);
});

// Admin only: View stats
app.get("/api/stats", checkRole(["Admin"]), (req, res) => {
  const stats = {
    total: grievances.length,
    high: grievances.filter(g => g.priority === "High").length,
    medium: grievances.filter(g => g.priority === "Medium").length,
    low: grievances.filter(g => g.priority === "Low").length,
    pending: grievances.filter(g => g.status === "Pending").length,
    resolved: grievances.filter(g => g.status === "Resolved").length,
    byCategory: grievances.reduce((acc: any, g) => {
      acc[g.category] = (acc[g.category] || 0) + 1;
      return acc;
    }, {})
  };
  res.json(stats);
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
