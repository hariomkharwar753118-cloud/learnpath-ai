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
        const url = new URL(req.url);
        const conversationId = url.searchParams.get("id");

        // Get and validate auth token
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

        if (req.method === "GET") {
            if (conversationId) {
                // Fetch messages for a specific conversation
                const { data: messages, error } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conversationId)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                return new Response(JSON.stringify(messages), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } else {
                // List conversations
                const { data: conversations, error } = await supabase
                    .from("conversations")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("updated_at", { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify(conversations), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        if (req.method === "POST") {
            // Create new conversation
            const { title } = await req.json();
            const { data, error } = await supabase
                .from("conversations")
                .insert({ user_id: user.id, title: title || "New Chat" })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        throw new Error("Method not allowed");

    } catch (error) {
        console.error("Error in conversations function:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
