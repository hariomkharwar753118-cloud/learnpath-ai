import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="w-full bg-background px-4 sm:px-8 md:px-16 lg:px-24 py-16 sm:py-20 md:py-32">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 animate-fade-in">
          <h2 className="text-foreground max-w-2xl text-2xl sm:text-3xl md:text-4xl px-4">
            Turn any topic into visuals.
          </h2>
          
          <Button size="lg" className="mt-2 sm:mt-4" onClick={() => navigate("/chat")}>
            Start learning for free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
