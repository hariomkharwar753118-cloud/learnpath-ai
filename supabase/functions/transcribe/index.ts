import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with proper auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { 
          headers: { 
            Authorization: authHeader 
          } 
        },
      }
    );

    // Validate session and get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Build personalized system prompt
    let personalizedPrompt = `You are the **Visual AI Tutor**, a highly specialized and encouraging educational assistant.

**USER LEARNING PROFILE:**
- Learning Style: ${userMemory?.learning_style || 'visual'}
- Difficulty Level: ${userMemory?.difficulty_level || 'medium'}
- Preferred Format: ${userMemory?.preferred_format || 'diagrams'}`;

    if (userMemory?.topics_studied && userMemory.topics_studied.length > 0) {
      personalizedPrompt += `\n- Previously Studied Topics: ${userMemory.topics_studied.join(", ")}`;
    }

    if (userMemory?.strengths && userMemory.strengths.length > 0) {
      personalizedPrompt += `\n- User Strengths: ${userMemory.strengths.join(", ")}`;
    }

    if (userMemory?.weaknesses && userMemory.weaknesses.length > 0) {
      personalizedPrompt += `\n- Areas to Focus On: ${userMemory.weaknesses.join(", ")}`;
    }

    personalizedPrompt += `

**YOUR TASK:**
Analyze the YouTube video transcript below and create a comprehensive, kid-friendly educational lesson.

**MANDATORY OUTPUT STRUCTURE:**

# [Video Topic Title]

## Simple Explanation
[2-3 sentences explaining the main concept in simple terms, suitable for a 10-year-old]

## Key Points
- [Point 1]
- [Point 2]
- [Point 3]
<VISUAL_PROMPT>[5-15 word description for a diagram showing key points]</VISUAL_PROMPT>

## Step-by-Step Breakdown
1. **[Step Name]**: [Explanation]
   <VISUAL_PROMPT>[diagram description for this step]</VISUAL_PROMPT>

2. **[Step Name]**: [Explanation]
   <VISUAL_PROMPT>[diagram description for this step]</VISUAL_PROMPT>

[Continue for 3-5 steps as needed]

## Real-Life Example
[Concrete, relatable example that demonstrates the concept]
<VISUAL_PROMPT>[diagram showing the real-life example]</VISUAL_PROMPT>

## Quick Quiz (Test Your Knowledge)
1. **Question 1**: [Question text]
   - A) [Option A]
   - B) [Option B]
   - C) [Option C]
   - D) [Option D]
   *Answer: [Correct answer letter and brief explanation]*

2. **Question 2**: [Question text]
   - A) [Option A]
   - B) [Option B]
   - C) [Option C]
   - D) [Option D]
   *Answer: [Correct answer letter and brief explanation]*

3. **Question 3**: [Question text]
   - A) [Option A]
   - B) [Option B]
   - C) [Option C]
   - D) [Option D]
   *Answer: [Correct answer letter and brief explanation]*

## Follow-Up Question
[Ask an engaging question to check understanding and encourage deeper thinking]

**IMPORTANT RULES:**
- Use age-appropriate language (10-year-old level)
- Include visual descriptions in <VISUAL_PROMPT> tags
- Make it engaging and fun
- Connect to real-world applications
- Always follow the structure above`;

    // Call Lovable AI (Gemini)
    console.log("Calling Lovable AI for lesson generation...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: personalizedPrompt },
          { role: "user", content: `Here is the YouTube video transcript to analyze and teach:\n\n${transcriptText}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error("AI Gateway Error:", errorData);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (aiResponse.status === 402) {
        throw new Error("Usage limit reached. Please check your plan.");
      }
      
      throw new Error(errorData.error?.message || "Failed to get AI response");
    }

    const aiData = await aiResponse.json();
    const lessonContent = aiData.choices[0].message.content;

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
