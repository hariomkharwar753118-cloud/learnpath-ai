import { Card, CardContent } from "./ui/card";
import { Lightbulb, BookOpen, TrendingUp } from "lucide-react";

interface VisualPanelProps {
  content: string;
  isVisible: boolean;
}

const VisualPanel = ({ content, isVisible }: VisualPanelProps) => {
  if (!isVisible || !content) {
    return (
      <Card className="h-full border-2 border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Lightbulb className="w-12 h-12 text-primary/40" />
              <BookOpen className="w-12 h-12 text-primary/40" />
              <TrendingUp className="w-12 h-12 text-primary/40" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Visual Learning</h3>
              <p className="text-muted-foreground">
                Diagrams and visual explanations will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-2 border-primary/20 shadow-soft animate-fade-in">
      <CardContent className="p-6 h-full overflow-y-auto">
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualPanel;
