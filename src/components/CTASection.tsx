import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="w-full bg-background px-8 md:px-16 lg:px-24 py-20 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
          <h2 className="text-foreground max-w-2xl">
            Turn any topic into visuals.
          </h2>
          
          <Button size="lg" className="mt-4">
            Start learning for free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
