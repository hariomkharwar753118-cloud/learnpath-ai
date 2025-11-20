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
        const headers = await this.getHeaders();
        const response = await fetch(`${FUNCTIONS_URL}/conversations`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title }),
        });

        if (!response.ok) throw new Error("Failed to create conversation");
        return response.json();
    }

    static async getConversations() {
        const headers = await this.getHeaders();
        const response = await fetch(`${FUNCTIONS_URL}/conversations`, {
            method: "GET",
            headers,
        });

        if (!response.ok) throw new Error("Failed to fetch conversations");
        return response.json();
    }

    static async getMessages(conversationId: string) {
        const headers = await this.getHeaders();
        const response = await fetch(`${FUNCTIONS_URL}/conversations?id=${conversationId}`, {
            method: "GET",
            headers,
        });

        if (!response.ok) throw new Error("Failed to fetch messages");
        return response.json();
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
                message, // Changed from messages array to single message string
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
