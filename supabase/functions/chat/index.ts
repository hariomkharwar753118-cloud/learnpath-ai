import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, fileContent, fileType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages array with system prompt
    const systemPrompt = `You are an expert AI tutor specializing in visual learning. Your role is to:

1. Break down complex topics into simple, step-by-step explanations
2. Create visual representations (diagrams, flowcharts, labeled illustrations)
3. Use analogies and real-world examples
4. Encourage curiosity and deeper understanding
5. Remember previous context in the conversation

When explaining:
- Start with a simple summary
- Provide key points in bullet format
- Describe visual diagrams that would help (e.g., "Imagine a diagram showing...")
- Use clear, student-friendly language
- Always be encouraging and patient

If a file is provided, analyze it thoroughly and extract the main concepts for teaching.`;

    const chatMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // If file content is provided, add it to the last user message
    if (fileContent && fileType) {
      const lastUserMsgIndex = chatMessages.length - 1;
      if (chatMessages[lastUserMsgIndex]?.role === "user") {
        if (fileType.startsWith("image/")) {
          // For images, use vision capabilities
          chatMessages[lastUserMsgIndex].content = [
            { type: "text", text: chatMessages[lastUserMsgIndex].content },
            { type: "image_url", image_url: { url: fileContent } }
          ];
        } else {
          // For PDFs and text files, append content
          chatMessages[lastUserMsgIndex].content += `\n\nFile content:\n${fileContent}`;
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
