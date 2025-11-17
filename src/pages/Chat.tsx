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
  images?: string[];
  visualPrompts?: string[];
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

      const data = await response.json();
      
      // Add assistant message with cleaned content and images
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          images: data.images || [],
          visualPrompts: data.visualPrompts || []
        }
      ]);

      // Clear file after successful processing
      setCurrentFile(null);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
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
    .pop();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">AI Tutor</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0 order-1">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <div className="border-t border-border p-3 sm:p-4 bg-background">
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              <FileUpload onFileSelect={handleFileSelect} />
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Right: Visual Panel - Hidden on mobile, shown on large screens */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[500px] border-l border-border p-4 xl:p-6 bg-muted/30 order-2">
          <VisualPanel
            content={latestAssistantMessage?.content || ""}
            images={latestAssistantMessage?.images || []}
            visualPrompts={latestAssistantMessage?.visualPrompts || []}
            isVisible={messages.length > 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
