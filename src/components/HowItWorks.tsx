import { Upload, Sparkles, BookOpen } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your content",
    description: "Drop any PDF, topic, or question you want to learn about.",
  },
  {
    icon: Sparkles,
    title: "AI creates visuals",
    description: "Our AI breaks it down into diagrams, charts, and simple explanations.",
  },
  {
    icon: BookOpen,
    title: "Learn at your pace",
    description: "Interactive step-by-step lessons designed just for you.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="w-full bg-muted/30 px-8 md:px-16 lg:px-24 py-20 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-center mb-16 md:mb-20 text-foreground">
          How it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground">
                {step.title}
              </h3>
              
              <p className="text-base text-foreground/70 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
