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
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">Start Learning</h3>
            <p className="text-lg">Upload a file or ask a question to begin</p>
          </div>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
        >
          <div
            className={`max-w-[80%] rounded-3xl px-6 py-4 ${
              message.role === "user"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-foreground border border-primary/20"
            }`}
          >
            <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-primary/10 text-foreground border border-primary/20 rounded-3xl px-6 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
