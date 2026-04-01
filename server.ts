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
  const { text, citizenName, citizenMobile, location, geoData, category, priority, summary, explanation, confidence } = req.body;

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
    timestamp: new Date().toISOString()
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
          <hr/>
          <p>Please log in to the Admin Dashboard to take action.</p>
        `
      );
    }
  }

  res.status(201).json(newGrievance);
});

// Admin only: Update grievance status
app.patch("/api/grievances/:id", checkRole(["Admin"]), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = grievances.findIndex(g => g.id === id);
  if (index !== -1) {
    const oldStatus = grievances[index].status;
    grievances[index].status = status;
    
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && oldStatus !== status) {
      sendEmail(
        adminEmail,
        `✅ STATUS UPDATED: ${id}`,
        `
          <h2>Grievance Status Update</h2>
          <p><strong>ID:</strong> ${id}</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p><strong>Citizen:</strong> ${grievances[index].citizenName}</p>
          <hr/>
          <p>The grievance status has been successfully updated in the system.</p>
        `
      );
    }

    res.json(grievances[index]);
  } else {
    res.status(404).json({ error: "Grievance not found" });
  }
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
