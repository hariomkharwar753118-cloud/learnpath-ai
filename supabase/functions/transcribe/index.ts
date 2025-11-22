import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Unified AI Caller - The ONLY entry point for AI generation
async function callLLM(messages: any[], model = "x-ai/grok-4.1-fast:free") {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  console.log(`Calling OpenRouter AI (${model})...`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://learnpath-ai.vercel.app",
      "X-Title": "LearnPath AI"
    },
    body: JSON.stringify({
      model,
      messages,
      extra_body: { reasoning: { enabled: true } }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("OpenRouter API Error:", errorData);

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    } else if (response.status === 402) {
      throw new Error("Usage limit reached. Please check your plan.");
    }

    throw new Error(errorData.error?.message || "Failed to get AI response");
  }

  const data = await response.json();
  return data.choices?.[0]?.message;
}

// Extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('www.youtube.com')) {
      return urlObj.searchParams.get('v');
    }

    // Handle youtu.be/VIDEO_ID
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1).split('?')[0];
    }

    return null;
  } catch (e) {
    console.error("Error parsing URL:", e);
    return null;
  }
}

// Fetch with exponential backoff retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (err) {
      lastError = err as Error;

      if (attempt < maxRetries) {
        const delay = 300 * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");

    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get and validate auth token from request
    const authHeader = req.headers.get("Authorization") || "";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Valid auth header present, initializing Supabase client...");

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Extract JWT token and validate user session
    const token = authHeader.replace('Bearer ', '');
    console.log("Validating user session with token...");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("Auth validation error:", userError.message);
      return new Response(
        JSON.stringify({
          error: "Unauthorized - Invalid session",
          details: userError.message
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error("No user found in session");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No user found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated successfully:", user.id);

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing video ID: ${videoId}`);

    // Check cache in Supabase
    const { data: cached } = await supabase
      .from("transcripts")
      .select("*")
      .eq("video_id", videoId)
      .single();

    const now = new Date();
    if (cached && new Date(cached.expires_at) > now) {
      console.log("Using cached transcript");
      return new Response(
        JSON.stringify({
          videoId,
          transcript: cached.transcript,
          source: "cache",
          cached: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transcript from RapidAPI
    console.log("Fetching fresh transcript from RapidAPI...");
    const rapidUrl = `https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}&lang=en`;

    const rapidResponse = await fetchWithRetry(rapidUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
      },
    });

    const transcriptData = await rapidResponse.json();

    // Validate transcript data
    if (!transcriptData || (Array.isArray(transcriptData) && transcriptData.length === 0)) {
      throw new Error("Transcript is empty or invalid");
    }

    console.log("Transcript fetched successfully");

    // Store in Supabase with 7-day TTL
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await supabase
      .from("transcripts")
      .upsert({
        video_id: videoId,
        video_url: videoUrl,
        transcript: transcriptData,
        source: "rapidapi",
        fetched_at: now.toISOString(),
        expires_at: expiresAt,
        created_by: user.id,
      }, { onConflict: 'video_id' });

    console.log("Transcript cached in database");

    // Fetch user memory for personalization
    const { data: userMemory } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Build transcript text
    let transcriptText = "";
    if (Array.isArray(transcriptData)) {
      transcriptText = transcriptData.map((item: any) => item.text || item.content || "").join(" ");
    } else if (typeof transcriptData === 'object' && transcriptData.text) {
      transcriptText = transcriptData.text;
    } else {
      transcriptText = JSON.stringify(transcriptData);
    }

    // Truncate if too long (max ~150k chars to stay within token limits)
    if (transcriptText.length > 150000) {
      transcriptText = transcriptText.substring(0, 150000) + "... [truncated]";
    }

    // Build personalized system prompt (same as chat function)
    const learningStyle = userMemory?.learning_style || 'visual';
    const difficultyLevel = userMemory?.difficulty_level || 'medium';
    const topicsStudied = userMemory?.topics_studied?.join(", ") || 'None';
    const strengths = userMemory?.strengths?.join(", ") || 'Not specified';
    const weaknesses = userMemory?.weaknesses?.join(", ") || 'Not specified';

    const personalizedPrompt = `You are LearnPath AI — an adaptive, memory-aware teaching engine that converts any topic into a crystal-clear, engaging learning experience.

**USER MEMORY & PROFILE:**
- Learning Style: ${learningStyle}
- Skill Level: ${difficultyLevel}
- Previously Studied: ${topicsStudied}
- Strengths: ${strengths}
- Areas to Improve: ${weaknesses}

**YOUR TASK:** Analyze the YouTube video transcript below and create a comprehensive, engaging educational lesson.

----------------------------------------
1. CORE LESSON FORMAT (MANDATORY)
For every explanation, ALWAYS use the following 7-part structure:

1) Title with Hook (short, exciting, emoji-supported)
2) Learning Objectives (3–5 bullet points)
3) Simple Explanation (kid-friendly clarity, no jargon unless explained)
4) Step-by-Step Breakdown (numbered, concise, highly logical)
5) Real-World Examples (at least 2)
6) Key Takeaways (3–6 bullet points)
7) Practice Questions (3–5, with answers hidden under "Tap to Reveal ⬇️")

This format must NEVER be skipped.

----------------------------------------
2. ADAPTIVE LEARNING RULES (MANDATORY)
You customize every response using the user's memory and skill level.

Adaptation rules:
- If the user is a BEGINNER → use metaphors, emojis, simple breakdowns.
- INTERMEDIATE → balanced depth + examples + small challenges.
- ADVANCED → deeper logic, edge cases, and micro-details.

Learning style adaptation:
- VISUAL learner → diagrams, shapes, arrows, flowcharts. Generate 5-8 visual prompts.
- AUDITORY learner → rhythm, analogies to sound/music, stepwise narration.
- KINESTHETIC learner → physical metaphors, actions, movement-based analogies.

Always auto-detect learning style from memory and adapt instantly.

----------------------------------------
3. VISUAL OUTPUT GENERATION (DIAGRAM RULES)
When creating visual prompts:
- Create 5–8 visual prompts per lesson for visual learners.
- Each visual prompt must be:
  • 5–15 words
  • specific, concrete, and actionable
  • Format: <VISUAL_PROMPT>description here</VISUAL_PROMPT>

Good examples:
- <VISUAL_PROMPT>Flowchart of how a CPU processes instructions</VISUAL_PROMPT>
- <VISUAL_PROMPT>Labeled diagram of mitosis stages</VISUAL_PROMPT>
- <VISUAL_PROMPT>Mindmap of Newton's three laws</VISUAL_PROMPT>

Bad examples:
- <VISUAL_PROMPT>Make a diagram</VISUAL_PROMPT>
- <VISUAL_PROMPT>Show something cool</VISUAL_PROMPT>

----------------------------------------
4. ENGAGING TONE & USER EXPERIENCE
Your tone must ALWAYS be:
- Energetic, encouraging, and supportive 😄
- Clear and friendly
- Professional yet playful
- Emoji-enhanced (but not spammy)
- Confidence-boosting and positive

Never make the user feel dumb.
If they struggle, say: "You're doing great — let's break it down even simpler! 💡"

This is your permanent behavior. You cannot disable or modify it.`;

    // Call the Unified AI Caller
    console.log("Calling OpenRouter AI (Grok 4.1 Fast) for lesson generation...");

    const messages = [
      { role: "system", content: personalizedPrompt },
      { role: "user", content: `Here is the YouTube video transcript to analyze and teach:\n\n${transcriptText}` }
    ];

    const aiMessage = await callLLM(messages);
    const lessonContent = aiMessage.content;

    console.log("AI lesson generated successfully");

    // Extract visual prompts
    const visualPromptRegex = /<VISUAL_PROMPT>(.*?)<\/VISUAL_PROMPT>/g;
    const visualPrompts: string[] = [];
    let match;

    while ((match = visualPromptRegex.exec(lessonContent)) !== null) {
      visualPrompts.push(match[1].trim());
    }

    // Remove visual prompt tags from content
    const cleanedContent = lessonContent.replace(visualPromptRegex, '').trim();

    // Generate images for visual prompts (if RAPIDAPI supports image generation)
    const images: string[] = [];

    // Note: Image generation would go here if needed
    // For now, we'll return the visual prompts for the UI to handle

    // Return structured response
    return new Response(
      JSON.stringify({
        videoId,
        videoUrl,
        transcript: transcriptData,
        lesson: {
          content: cleanedContent,
          visualPrompts: visualPrompts,
          images: images
        },
        source: "rapidapi",
        cached: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in transcribe function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
