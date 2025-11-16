import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import FileUpload from "@/components/FileUpload";
import VisualPanel from "@/components/VisualPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<{
    file: File;
    content: string;
    type: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
            fileContent: currentFile?.content,
            fileType: currentFile?.type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Clear file after successful processing
      setCurrentFile(null);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    await streamChat(content);
  };

  const handleFileSelect = (file: File, content: string, type: string) => {
    setCurrentFile({ file, content, type });
    toast({
      title: "File uploaded",
      description: `${file.name} is ready. Ask a question to analyze it.`,
    });
  };

  const latestAssistantMessage = messages
    .filter(m => m.role === "assistant")
    .pop()?.content || "";

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <div className="border-t border-border p-4 bg-background">
            <div className="max-w-4xl mx-auto space-y-4">
              <FileUpload onFileSelect={handleFileSelect} />
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Right: Visual Panel */}
        <div className="w-[400px] border-l border-border p-6 bg-muted/30">
          <VisualPanel
            content={latestAssistantMessage}
            isVisible={messages.length > 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
