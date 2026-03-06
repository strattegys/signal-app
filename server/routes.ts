import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import PDFDocument from "pdfkit";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/generate-content", upload.fields([{ name: "transcriptFile", maxCount: 1 }, { name: "images", maxCount: 3 }]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const transcriptFile = files?.["transcriptFile"]?.[0];
      const imageFiles = files?.["images"];

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "AI service is not configured. Please set up the OpenAI integration." });
      }

      let transcript = "";
      if (transcriptFile) {
        transcript = transcriptFile.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Transcript file is required" });
      }

      const imageDescriptions: string[] = [];
      const imageBuffers: Buffer[] = [];

      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          imageBuffers.push(file.buffer);
          const base64 = file.buffer.toString("base64");
          const mimeType = file.mimetype || "image/png";

          try {
            const visionResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: "Describe this image in 2-3 sentences focusing on style, colors, mood, and key visual elements. This will be used to style-match a value proposition document." },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
              }],
              max_tokens: 200,
            });
            imageDescriptions.push(visionResponse.choices[0]?.message?.content || "No description available");
          } catch (err) {
            imageDescriptions.push("Image provided but could not be analyzed");
          }
        }
      }

      const styleContext = imageDescriptions.length > 0 
        ? `\n\nThe client provided ${imageDescriptions.length} reference image(s) with these visual characteristics:\n${imageDescriptions.map((d, i) => `Image ${i+1}: ${d}`).join("\n")}\n\nMatch the tone and energy of these visuals in your writing style.`
        : "";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `System Role: You are an Expert Brand Strategist, Master Copywriter, and Visual Art Director. Your goal is to distill raw conversations and visual assets into a cohesive, highly authentic brand identity.

Objective:
Analyze a provided discussion transcript and three reference images to generate two specific deliverables:
1. A single, highly evocative "iconic image" (either generated or intricately prompted) representing the brand/product.
2. A short, impactful pitch statement conveying the core value and benefit.

Step-by-Step Instructions:
1. Analyze Context, Tone, and Audience:
   - Transcript Review: Read the provided transcript to understand the core offering.
   - Tone Matching: Extract the exact tone, vocabulary, and energy.
   - Audience Deduction: Deduce the exact target audience, their pain points, and what they value.

2. Visual Synthesis:
   - Image Review: Analyze provided reference images for color, texture, and emotion.
   - Conceptual Blending: Merge visual themes with the narrative to create a single, unified visual concept.

3. Copywriting the Pitch Statement:
   - Framework: 2-3 sentences max articulating unique value proposition and direct benefit.
   - Rules: Authenticity First (no jargon/hype), Speak to Needs, Mirror the Voice.

4. Generate Deliverables:
Produce the final output strictly in the following format:
Target Audience Profile:
(1-2 sentences identifying who this is for and what they deeply need.)

The Pitch:
(Your 2-3 sentence honest, value-driven pitch statement.)

Iconic Image Prompt:
(Provide a highly detailed, evocative prompt that an image generator could use to create this single iconic brand image, blending the reference images and the transcript's vibe.)

${styleContext}`
          },
          {
            role: "user",
            content: `Analyze this transcript and these visual descriptions to produce the brand package:\n\n${transcript}`
          }
        ],
        max_tokens: 1500,
      });

      const generatedContent = completion.choices[0]?.message?.content || "Content generation failed";

      const sections = parseBrandPackage(generatedContent);

      const doc = new PDFDocument({ 
        size: "A4", 
        margin: 50,
        info: {
          Title: "Brand Synthesis - Signal Killer Content Engine",
          Author: "Signal AI",
        }
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const pdfReady = new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      const pageWidth = doc.page.width - 100;
      const pageBottom = doc.page.height - 60;

      doc.rect(0, 0, doc.page.width, 120).fill("#0a0a0a");
      doc.fontSize(12).fillColor("#00e5ff").font("Courier")
        .text("SIGNAL // BRAND SYNTHESIZER v1.0", 50, 35);
      doc.fontSize(10).fillColor("#555555")
        .text("AUTHENTIC BRAND PACKAGE", 50, 55);
      doc.fontSize(7).fillColor("#00e5ff").font("Courier-Bold")
        .text("PRODUCED BY SIGNAL // AI_CORE_v1.0", doc.page.width - 250, 35, { align: "right", width: 200 });
      doc.moveTo(50, 75).lineTo(doc.page.width - 50, 75).strokeColor("#00e5ff").lineWidth(1).stroke();

      let y = 140;

      if (sections.audience) {
        doc.fontSize(11).fillColor("#00e5ff").font("Courier-Bold")
          .text("TARGET AUDIENCE PROFILE", 50, y);
        y += 20;
        doc.fontSize(14).fillColor("#333333").font("Helvetica")
          .text(sections.audience, 50, y, { width: pageWidth, lineGap: 4 });
        y = doc.y + 40;
      }

      if (sections.pitch) {
        doc.fontSize(11).fillColor("#00e5ff").font("Courier-Bold")
          .text("THE PITCH", 50, y);
        y += 20;
        doc.fontSize(14).fillColor("#0a0a0a").font("Helvetica")
          .text(sections.pitch, 50, y, { width: pageWidth, lineGap: 6 });
        y = doc.y + 50;
      }

      if (sections.imagePrompt) {
        try {
          console.log("Generating image with prompt:", sections.imagePrompt.split(/[.!?]/)[0]);
          const imageResponse = await openai.images.generate({
            model: "gpt-image-1",
            prompt: `Highly evocative, authentic brand image: ${sections.imagePrompt.split(/[.!?]/)[0]}. Industrial, dystopian tech aesthetic, cyan accents, professional photography, studio lighting, sharp focus.`,
            n: 1,
            size: "1024x1024",
          });

          const imageUrl = imageResponse.data?.[0]?.url;
          const imageBase64 = imageResponse.data?.[0]?.b64_json;
          
          if (imageUrl || imageBase64) {
            let imgBuffer: Buffer;
            if (imageBase64) {
              console.log("Image generated successfully (base64)");
              imgBuffer = Buffer.from(imageBase64, 'base64');
            } else {
              console.log("Image generated successfully (url):", imageUrl);
              const imgRes = await fetch(imageUrl!);
              const arrayBuffer = await imgRes.arrayBuffer();
              imgBuffer = Buffer.from(arrayBuffer);
            }
            
            // Fill exactly 85 percent of the bottom width while maintaining 16:9 ratio
            const imgWidth = pageWidth * 0.85; 
            const imgHeight = imgWidth * (9 / 16);

            // Calculate vertical center between the pitch text and the description box
            // Pitch end: y (from pitch section)
            // Description height: 40
            // Footer height: ~30
            // Available space for image + description: pageBottom - y
            const availableSpace = pageBottom - y;
            const totalComponentHeight = imgHeight + 15 + 40; // image + gap + desc box
            
            const verticalOffset = (availableSpace - totalComponentHeight) / 2;
            const imageY = y + verticalOffset;
            const xOffset = 50 + (pageWidth - imgWidth) / 2;

            doc.image(imgBuffer, xOffset, imageY, { 
              width: imgWidth,
              height: imgHeight
            });
            
            const descY = imageY + imgHeight + 15;
            doc.rect(45, descY, pageWidth + 5, 40).fill("#f0fafe");
            doc.fontSize(9).fillColor("#00e5ff").font("Courier-Bold")
              .text("ICONIC IMAGE CONCEPT", 58, descY + 8);
            doc.fontSize(10).fillColor("#444444").font("Helvetica-Oblique")
              .text(sections.imagePrompt.split(/[.!?]/)[0] + ".", 58, descY + 20, { width: pageWidth - 20 });
          }
        } catch (err) {
          console.error("DALL-E generation failed:", err);
        }
      }

      doc.end();

      const pdfBuffer = await pdfReady;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="killer-content-proposition.pdf"');
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);

    } catch (error: any) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  return httpServer;
}

function parseBrandPackage(text: string): {
  audience: string;
  pitch: string;
  imagePrompt: string;
} {
  const result = {
    audience: "",
    pitch: "",
    imagePrompt: "",
  };

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  let currentSection = "";

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (upper.includes("TARGET AUDIENCE PROFILE")) {
      currentSection = "audience";
      continue;
    }
    if (upper.includes("THE PITCH")) {
      currentSection = "pitch";
      continue;
    }
    if (upper.includes("ICONIC IMAGE PROMPT") || upper.includes("ICONIC IMAGE CONCEPT")) {
      currentSection = "image";
      continue;
    }

    const cleanLine = line.replace(/^#+\s*/, "").replace(/^\d+\.\s*/, "").replace(/\*+/g, "").trim();
    if (!cleanLine) continue;

    switch (currentSection) {
      case "audience":
        result.audience += (result.audience ? " " : "") + cleanLine;
        break;
      case "pitch":
        result.pitch += (result.pitch ? " " : "") + cleanLine;
        break;
      case "image":
        result.imagePrompt += (result.imagePrompt ? " " : "") + cleanLine;
        break;
    }
  }

  return result;
}
