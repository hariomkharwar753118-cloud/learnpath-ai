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
        const dataType = url.searchParams.get("type"); // profile, memory, or documents

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

        let responseData;

        switch (dataType) {
            case "profile": {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                if (error) throw error;
                responseData = data;
                break;
            }

            case "memory": {
                const { data, error } = await supabase
                    .from("user_memory")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();
                if (error) throw error;
                responseData = data;
                break;
            }

            case "documents": {
                const { data, error } = await supabase
                    .from("user_documents")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                if (error) throw error;
                responseData = data;
                break;
            }

            default:
                throw new Error("Invalid data type requested");
        }

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in user-data function:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
