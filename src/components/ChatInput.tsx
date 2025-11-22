import { useState, KeyboardEvent, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Youtube } from "lucide-react";
import { detectYouTubeUrl } from "@/utils/youtubeDetector";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTranscribeYouTube?: (url: string) => void;
  disabled: boolean;
}

const ChatInput = ({ onSendMessage, onTranscribeYouTube, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [youtubeInfo, setYoutubeInfo] = useState<{ isYouTubeUrl: boolean; url: string | null }>({
    isYouTubeUrl: false,
    url: null,
  });

  useEffect(() => {
    const detected = detectYouTubeUrl(input);
    setYoutubeInfo({
      isYouTubeUrl: detected.isYouTubeUrl,
      url: detected.url,
    });
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Auto-trigger YouTube transcription if YouTube URL detected
      if (youtubeInfo.isYouTubeUrl && youtubeInfo.url && onTranscribeYouTube) {
        onTranscribeYouTube(youtubeInfo.url);
        setInput("");
      } else {
        handleSend();
      }
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {youtubeInfo.isYouTubeUrl && youtubeInfo.url && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-full border border-primary/20 bg-primary/5 text-primary w-fit animate-fade-in">
            <Youtube className="w-4 h-4" />
            <span className="font-medium">YouTube video detected • Press Enter to transcribe</span>
          </div>
        )}
        <div className="flex gap-2 sm:gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or paste a YouTube URL..."
            className="resize-none min-h-[50px] sm:min-h-[60px] max-h-[200px] rounded-xl sm:rounded-2xl text-sm sm:text-base"
            disabled={disabled}
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            size="icon"
            className="h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] shrink-0 rounded-xl sm:rounded-2xl"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
