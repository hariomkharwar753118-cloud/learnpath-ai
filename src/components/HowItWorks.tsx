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
    <section id="how-it-works" className="w-full bg-muted/30 px-4 sm:px-8 md:px-16 lg:px-24 py-16 sm:py-20 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-center mb-12 sm:mb-16 md:mb-20 text-foreground text-2xl sm:text-3xl md:text-4xl px-4">
          How it works
        </h2>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-4 sm:space-y-6 animate-fade-in px-4"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {step.title}
              </h3>
              
              <p className="text-sm sm:text-base text-foreground/70 max-w-xs">
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
