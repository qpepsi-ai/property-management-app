import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = [
  "Mortgage",
  "Insurance",
  "Property tax",
  "Repairs & maintenance",
  "Utilities",
  "HOA fees",
  "Management fees",
  "Other",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { imageBase64, mediaType } = await request.json();

  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  if (imageBase64.length > MAX_IMAGE_BYTES * 1.4) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Extract the following fields from this receipt image and respond with ONLY a JSON object, no other text:
{
  "vendor": string,
  "date": string (YYYY-MM-DD, your best guess if unclear),
  "amount": number (the total, no currency symbol),
  "category": one of ${JSON.stringify(CATEGORIES)} (pick the closest match),
  "confidence": "high" | "medium" | "low" (your confidence in this extraction)
}
If a field can't be determined, use null for that field.`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    const detail = err instanceof Anthropic.APIError ? err.message : "Unknown error";
    return NextResponse.json({ error: `Claude API error: ${detail}` }, { status: 502 });
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from model" }, { status: 502 });
  }

  try {
    const extracted = JSON.parse(textBlock.text);
    return NextResponse.json({ extracted, rawText: textBlock.text });
  } catch {
    return NextResponse.json({ error: "Could not parse extraction" }, { status: 502 });
  }
}
