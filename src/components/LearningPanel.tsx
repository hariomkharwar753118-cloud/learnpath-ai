import { Card } from "./ui/card";
import { CheckCircle2, Lightbulb, BookOpen, Target, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LearningPanelProps {
  content: string;
  visualPrompts?: string[];
  images?: string[];
}

const LearningPanel = ({ content, visualPrompts = [], images = [] }: LearningPanelProps) => {
  // Parse sections from markdown content
  const sections = content.split(/\n##\s+/);
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="prose prose-sm sm:prose-base max-w-none">
        {/* Main Title */}
        {content.match(/^#\s+(.+)$/m) && (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              {content.match(/^#\s+(.+)$/m)?.[1]}
            </h1>
          </div>
        )}

        {/* Render each section with icons */}
        {sections.map((section, idx) => {
          if (idx === 0) return null; // Skip the title section
          
          const lines = section.trim().split('\n');
          const sectionTitle = lines[0];
          const sectionContent = lines.slice(1).join('\n');
          
          let icon = null;
          let cardClass = "";
          
          // Assign icons based on section titles
          if (sectionTitle.toLowerCase().includes('simple explanation')) {
            icon = <Lightbulb className="w-5 h-5 text-yellow-500" />;
            cardClass = "border-yellow-200 bg-yellow-50/50";
          } else if (sectionTitle.toLowerCase().includes('key points')) {
            icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
            cardClass = "border-green-200 bg-green-50/50";
          } else if (sectionTitle.toLowerCase().includes('breakdown') || sectionTitle.toLowerCase().includes('steps')) {
            icon = <Target className="w-5 h-5 text-blue-500" />;
            cardClass = "border-blue-200 bg-blue-50/50";
          } else if (sectionTitle.toLowerCase().includes('quiz') || sectionTitle.toLowerCase().includes('test')) {
            icon = <HelpCircle className="w-5 h-5 text-purple-500" />;
            cardClass = "border-purple-200 bg-purple-50/50";
          } else if (sectionTitle.toLowerCase().includes('example')) {
            icon = <BookOpen className="w-5 h-5 text-orange-500" />;
            cardClass = "border-orange-200 bg-orange-50/50";
          }
          
          return (
            <Card key={idx} className={`p-4 sm:p-6 mb-4 ${cardClass}`}>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2 text-foreground">
                {icon}
                {sectionTitle}
              </h2>
              <div className="text-sm sm:text-base text-foreground/90">
                <ReactMarkdown
                  components={{
                    // Custom styling for list items
                    li: ({ children }) => (
                      <li className="mb-2 ml-4">{children}</li>
                    ),
                    // Custom styling for paragraphs
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed">{children}</p>
                    ),
                    // Custom styling for strong/bold text
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                  }}
                >
                  {sectionContent}
                </ReactMarkdown>
              </div>
            </Card>
          );
        })}

        {/* Visual Prompts Section */}
        {visualPrompts.length > 0 && (
          <Card className="p-4 sm:p-6 border-indigo-200 bg-indigo-50/50">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Target className="w-5 h-5 text-indigo-500" />
              Visual Concepts
            </h2>
            <div className="space-y-2">
              {visualPrompts.map((prompt, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-mono text-xs bg-indigo-100 px-2 py-1 rounded">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{prompt}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Diagram ${idx + 1}`}
                className="rounded-lg border border-border w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPanel;
