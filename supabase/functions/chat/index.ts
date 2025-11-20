import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, fileContent, fileType, fileName, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get and validate auth token from request
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized - Invalid session");
    }

    // 1. Fetch User Memory (Persistent)
    const { data: userMemory } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 2. Fetch Conversation History (Backend-side only)
    // We fetch the last 20 messages to provide context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content, images, visual_prompts")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // 3. Construct Global System Prompt
    let systemPrompt = `You are LearnPath AI — a friendly, fun, emoji-rich tutor who explains every topic like teaching a 10-year-old. You break complex ideas into simple mental models, visuals, analogies, and step-by-step logic. You always use emojis to make learning engaging. If the user has previously provided a YouTube link, always use the extracted transcript knowledge first before using general reasoning.
You remember the user’s preferences, past questions, and previous lessons so that your teaching improves over time.

**USER PROFILE & MEMORY:**
- Learning Style: ${userMemory?.learning_style || 'visual'}
- Difficulty: ${userMemory?.difficulty_level || 'beginner'}
- Interests: ${userMemory?.interests?.join(", ") || 'general'}
- Past Topics: ${userMemory?.topics_studied?.join(", ") || 'none'}
- Strengths: ${userMemory?.strengths?.join(", ") || 'none'}
- Weaknesses: ${userMemory?.weaknesses?.join(", ") || 'none'}

**STRICT OUTPUT RULES:**
- Use emojis in every paragraph 😀✨
- Explain as if to a 10-year-old
- Use short analogies
- Step-by-step breakdowns
- NO robotic language
- If a transcript/lesson exists in history, USE IT as the primary source.`;

    // 4. Prepare Messages for Gemini
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...(history?.map(msg => ({
        role: msg.role,
        content: msg.content + (msg.images?.length ? `\n[Images shown: ${msg.images.length}]` : "")
      })) || []),
      { role: "user", content: message }
    ];

    // Handle file attachment
    if (fileContent && fileType) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (fileType.startsWith("image/")) {
        lastMsg.content = [
          { type: "text", text: message },
          { type: "image_url", image_url: { url: fileContent } }
        ];
      } else {
        lastMsg.content = `${message}\n\nAttached File Content:\n${fileContent}`;
      }
    }

    // 5. Call Gemini
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: chatMessages,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.json();
      throw new Error(err.error?.message || "AI Gateway failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices[0].message.content;

    // 6. Process Response (Visual Prompts)
    const visualPromptRegex = /<VISUAL_PROMPT>(.*?)<\/VISUAL_PROMPT>/g;
    const visualPrompts: string[] = [];
    let match;
    while ((match = visualPromptRegex.exec(rawContent)) !== null) {
      visualPrompts.push(match[1].trim());
    }
    const cleanedContent = rawContent.replace(visualPromptRegex, '').trim();

    // 7. Generate Images (RapidAPI)
    const images: string[] = [];
    if (RAPIDAPI_KEY && visualPrompts.length > 0) {
      // Parallel image generation for speed
      await Promise.all(visualPrompts.slice(0, 2).map(async (prompt) => {
        try {
          const res = await fetch("https://ai-text-to-image-generator-api.p.rapidapi.com/realistic", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": "ai-text-to-image-generator-api.p.rapidapi.com",
            },
            body: JSON.stringify({ inputs: `educational illustration, cute style: ${prompt}` }),
          });
          if (res.ok) {
            const data = await res.json();
            const url = data.image || data.url || data.data;
            if (url) images.push(url);
          }
        } catch (e) {
          console.error("Image gen failed:", e);
        }
      }));
    }

    // 8. Save to Database (Persistence)
    // Save User Message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Save Assistant Message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: cleanedContent,
      images: images,
      visual_prompts: visualPrompts,
    });

    // Update Memory (Last Active)
    await supabase.from("user_memory").update({
      last_active: new Date().toISOString()
    }).eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        content: cleanedContent,
        images: images,
        visualPrompts: visualPrompts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
