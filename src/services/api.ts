import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

export class ApiService {
    private static async getHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");

        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        };
    }

    static async createConversation(title: string = "New Chat") {
        // We'll use the existing Supabase client for this simple operation 
        // to avoid creating a new Edge Function just for this, 
        // BUT we wrap it here so the UI doesn't know about Supabase.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        const { data, error } = await supabase
            .from("conversations")
            .insert({ user_id: user.id, title })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async sendMessage(
        message: string,
        conversationId: string,
        file?: { content: string; type: string; name: string }
    ) {
        const headers = await this.getHeaders();

        const response = await fetch(`${FUNCTIONS_URL}/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                messages: [{ role: "user", content: message }],
                conversationId,
                fileContent: file?.content,
                fileType: file?.type,
                fileName: file?.name,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to send message");
        }

        return response.json();
    }

    static async transcribeVideo(videoUrl: string, conversationId?: string) {
        const headers = await this.getHeaders();

        const response = await fetch(`${FUNCTIONS_URL}/transcribe`, {
            method: "POST",
            headers,
            body: JSON.stringify({ videoUrl, conversationId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to transcribe video");
        }

        return response.json();
    }
}
