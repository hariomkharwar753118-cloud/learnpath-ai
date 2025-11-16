import { Card, CardContent } from "./ui/card";
import { Lightbulb, BookOpen, TrendingUp } from "lucide-react";

interface VisualPanelProps {
  content: string;
  images: string[];
  visualPrompts: string[];
  isVisible: boolean;
}

const VisualPanel = ({ content, images, visualPrompts, isVisible }: VisualPanelProps) => {
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
        <div className="space-y-6">
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Visual Explanations</h3>
              <div className="grid grid-cols-1 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    {visualPrompts[index] && (
                      <p className="text-sm text-muted-foreground italic">
                        {visualPrompts[index]}
                      </p>
                    )}
                    <img 
                      src={image} 
                      alt={visualPrompts[index] || `Visual ${index + 1}`}
                      className="w-full rounded-lg border border-border shadow-sm"
                      onError={(e) => {
                        console.error("Image failed to load:", image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualPanel;
