import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFDocument from "pdfkit";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const transcriptFile = formData.get("transcriptFile") as File | null;
    const imageEntries = formData.getAll("images") as File[];

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please set up the GEMINI_API_KEY environment variable." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let transcript = "";
    if (transcriptFile) {
      transcript = await transcriptFile.text();
    } else {
      return new Response(
        JSON.stringify({ error: "Transcript file is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageDescriptions: string[] = [];

    if (imageEntries && imageEntries.length > 0) {
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      for (const file of imageEntries) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = (file.type || "image/png") as string;

        try {
          const visionResult = await visionModel.generateContent([
            "Describe this image in 2-3 sentences focusing on style, colors, mood, and key visual elements. This will be used to style-match a value proposition document.",
            { inlineData: { data: base64, mimeType } },
          ]);
          imageDescriptions.push(visionResult.response.text() || "No description available");
        } catch (err) {
          imageDescriptions.push("Image provided but could not be analyzed");
        }
      }
    }

    const styleContext =
      imageDescriptions.length > 0
        ? `\n\nThe client provided ${imageDescriptions.length} reference image(s) with these visual characteristics:\n${imageDescriptions.map((d, i) => `Image ${i + 1}: ${d}`).join("\n")}\n\nMatch the tone and energy of these visuals in your writing style.`
        : "";

    const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `System Role: You are an Expert Brand Strategist, Master Copywriter, and Visual Art Director. Your goal is to distill raw conversations and visual assets into a cohesive, highly authentic brand identity.

Objective:
Analyze a provided discussion transcript and reference images to generate two specific deliverables:
1. A single, highly evocative "iconic image" prompt representing the brand/product.
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
${styleContext}`;

    const completion = await textModel.generateContent([
      systemPrompt,
      `Analyze this transcript and these visual descriptions to produce the brand package:\n\n${transcript}`,
    ]);

    const generatedContent = completion.response.text() || "Content generation failed";
    const sections = parseBrandPackage(generatedContent);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Brand Synthesis - Signal Killer Content Engine",
        Author: "Signal AI",
      },
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
    doc.fontSize(12).fillColor("#00e5ff").font("Courier").text("SIGNAL // BRAND SYNTHESIZER v1.0", 50, 35);
    doc.fontSize(10).fillColor("#555555").text("AUTHENTIC BRAND PACKAGE", 50, 55);
    doc
      .fontSize(7)
      .fillColor("#00e5ff")
      .font("Courier-Bold")
      .text("PRODUCED BY SIGNAL // AI_CORE_v1.0", doc.page.width - 250, 35, { align: "right", width: 200 });
    doc.moveTo(50, 75).lineTo(doc.page.width - 50, 75).strokeColor("#00e5ff").lineWidth(1).stroke();

    let y = 140;

    if (sections.audience) {
      doc.fontSize(11).fillColor("#00e5ff").font("Courier-Bold").text("TARGET AUDIENCE PROFILE", 50, y);
      y += 20;
      doc.fontSize(14).fillColor("#333333").font("Helvetica").text(sections.audience, 50, y, { width: pageWidth, lineGap: 4 });
      y = doc.y + 40;
    }

    if (sections.pitch) {
      doc.fontSize(11).fillColor("#00e5ff").font("Courier-Bold").text("THE PITCH", 50, y);
      y += 20;
      doc.fontSize(14).fillColor("#0a0a0a").font("Helvetica").text(sections.pitch, 50, y, { width: pageWidth, lineGap: 6 });
      y = doc.y + 50;
    }

    if (sections.imagePrompt) {
      try {
        console.log("Generating image with Gemini...");
        const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const imageResult = await imageModel.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Highly evocative, authentic brand image: ${sections.imagePrompt.split(/[.!?]/)[0]}. Industrial, dystopian tech aesthetic, cyan accents, professional photography, studio lighting, sharp focus.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"] as any,
          },
        } as any);

        const parts = imageResult.response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (imagePart?.inlineData?.data) {
          const imgBuffer = Buffer.from(imagePart.inlineData.data, "base64");

          const imgWidth = pageWidth * 0.85;
          const imgHeight = imgWidth * (9 / 16);

          const availableSpace = pageBottom - y;
          const totalComponentHeight = imgHeight + 15 + 40;
          const verticalOffset = (availableSpace - totalComponentHeight) / 2;
          const imageY = y + verticalOffset;
          const xOffset = 50 + (pageWidth - imgWidth) / 2;

          doc.image(imgBuffer, xOffset, imageY, {
            width: imgWidth,
            height: imgHeight,
          });

          const descY = imageY + imgHeight + 15;
          doc.rect(45, descY, pageWidth + 5, 40).fill("#f0fafe");
          doc.fontSize(9).fillColor("#00e5ff").font("Courier-Bold").text("ICONIC IMAGE CONCEPT", 58, descY + 8);
          doc
            .fontSize(10)
            .fillColor("#444444")
            .font("Helvetica-Oblique")
            .text(sections.imagePrompt.split(/[.!?]/)[0] + ".", 58, descY + 20, { width: pageWidth - 20 });
        }
      } catch (err) {
        console.error("Gemini image generation failed:", err);
        if (sections.imagePrompt) {
          doc.rect(45, y, pageWidth + 5, 60).fill("#f0fafe");
          doc.fontSize(9).fillColor("#00e5ff").font("Courier-Bold").text("ICONIC IMAGE CONCEPT", 58, y + 8);
          doc
            .fontSize(10)
            .fillColor("#444444")
            .font("Helvetica-Oblique")
            .text(sections.imagePrompt.split(/[.!?]/)[0] + ".", 58, y + 20, { width: pageWidth - 20 });
        }
      }
    }

    doc.end();

    const pdfBuffer = await pdfReady;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="killer-content-proposition.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating content:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate content" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
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

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
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

    const cleanLine = line
      .replace(/^#+\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .replace(/\*+/g, "")
      .trim();
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

export const config = {
  path: "/api/generate-content",
};
