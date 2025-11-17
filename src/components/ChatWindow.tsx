import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow = ({ messages, isLoading }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground px-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">Start Learning</h3>
            <p className="text-base sm:text-lg">Upload a file or ask a question to begin</p>
          </div>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in px-1`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4 ${
              message.role === "user"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-foreground border border-primary/20"
            }`}
          >
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start animate-fade-in px-1">
          <div className="bg-primary/10 text-foreground border border-primary/20 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
