import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useUserDocuments } from "@/hooks/useUserProfile";
import { ApiService } from "@/services/api";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import FileUpload from "@/components/FileUpload";
import VisualPanel from "@/components/VisualPanel";
import WelcomeScreen from "@/components/WelcomeScreen";
import TranscriptPanel from "@/components/TranscriptPanel";
import LearningPanel from "@/components/LearningPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  visualPrompts?: string[];
}

const Chat = () => {
  const { conversationId: urlConversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(urlConversationId || null);
  const [currentFile, setCurrentFile] = useState<{
    file: File;
    content: string;
    type: string;
  } | null>(null);
  const [transcriptState, setTranscriptState] = useState<{
    isTranscribing: boolean;
    videoId: string | null;
    videoUrl: string | null;
    lesson: { content: string; visualPrompts: string[]; images: string[] } | null;
    cached: boolean;
  }>({
    isTranscribing: false,
    videoId: null,
    videoUrl: null,
    lesson: null,
    cached: false,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: documents } = useUserDocuments();

  // Initialize Chat: Fetch history or create new
  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      if (urlConversationId) {
        setConversationId(urlConversationId);
        setIsLoading(true);
        try {
          // Fetch history from backend
          const history = await ApiService.getMessages(urlConversationId);
          // Map backend messages to UI format
          const formattedMessages = history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            images: msg.images,
            visualPrompts: msg.visual_prompts
          }));
          setMessages(formattedMessages);
        } catch (error) {
          console.error("Error fetching history:", error);
          toast({
            title: "Error",
            description: "Failed to load chat history.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // Create new conversation if no ID in URL
        try {
          const data = await ApiService.createConversation();
          setConversationId(data.id);
          // Update URL without reloading
          navigate(`/chat/${data.id}`, { replace: true });
        } catch (error) {
          console.error("Error creating conversation:", error);
          toast({
            title: "Connection Error",
            description: "Failed to initialize chat. Please refresh.",
            variant: "destructive",
          });
        }
      }
    };

    initChat();
  }, [user, urlConversationId, navigate, toast]);

  const streamChat = async (userMessage: string) => {
    if (!conversationId) return;

    setIsLoading(true);

    try {
      const data = await ApiService.sendMessage(userMessage, conversationId, currentFile ? {
        content: currentFile.content,
        type: currentFile.type,
        name: currentFile.file.name
      } : undefined);

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

  const handleTranscribeYouTube = async (videoUrl: string) => {
    if (!user) return;

    setTranscriptState({
      isTranscribing: true,
      videoId: null,
      videoUrl: videoUrl,
      lesson: null,
      cached: false,
    });

    try {
      // This calls our backend which calls RapidAPI FIRST, then Gemini
      const data = await ApiService.transcribeVideo(videoUrl, conversationId || undefined);

      // Update transcript state with results
      setTranscriptState({
        isTranscribing: false,
        videoId: data.videoId,
        videoUrl: data.videoUrl,
        lesson: data.lesson,
        cached: data.cached || false,
      });

      // Add to messages
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: `Transcribe and explain: ${videoUrl}`,
        },
        {
          role: "assistant",
          content: data.lesson.content,
          images: data.lesson.images || [],
          visualPrompts: data.lesson.visualPrompts || [],
        },
      ]);

      toast({
        title: "Transcript ready!",
        description: "Your personalized lesson has been generated.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscriptState({
        isTranscribing: false,
        videoId: null,
        videoUrl: null,
        lesson: null,
        cached: false,
      });
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "Please try again or check the URL.",
        variant: "destructive",
      });
    }
  };

  const latestAssistantMessage = messages
    .filter(m => m.role === "assistant")
    .pop();

  const lastTopic = documents?.[0]?.topic || "your studies";

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
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Continue learning about {lastTopic}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0 order-1">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <ChatWindow messages={messages} isLoading={isLoading} />
          )}
          <div className="border-t border-border p-3 sm:p-4 bg-background">
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              <FileUpload onFileSelect={handleFileSelect} />
              <ChatInput
                onSendMessage={handleSendMessage}
                onTranscribeYouTube={handleTranscribeYouTube}
                disabled={isLoading || transcriptState.isTranscribing}
              />
            </div>
          </div>
        </div>

        {/* Right: Visual Panel - Hidden on mobile, shown on large screens */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[500px] border-l border-border bg-muted/30 order-2 overflow-y-auto">
          {transcriptState.isTranscribing && transcriptState.videoId && transcriptState.videoUrl ? (
            <div className="p-4 xl:p-6">
              <TranscriptPanel
                videoId={transcriptState.videoId}
                videoUrl={transcriptState.videoUrl}
                isLoading={transcriptState.isTranscribing}
                cached={transcriptState.cached}
              />
            </div>
          ) : transcriptState.lesson ? (
            <LearningPanel
              content={transcriptState.lesson.content}
              visualPrompts={transcriptState.lesson.visualPrompts}
              images={transcriptState.lesson.images}
            />
          ) : (
            <div className="p-4 xl:p-6">
              <VisualPanel
                content={latestAssistantMessage?.content || ""}
                images={latestAssistantMessage?.images || []}
                visualPrompts={latestAssistantMessage?.visualPrompts || []}
                isVisible={messages.length > 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
