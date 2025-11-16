import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import peachBlob from "@/assets/peach-blob.png";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative w-full min-h-[85vh] px-8 md:px-16 lg:px-24 py-16 md:py-24 overflow-hidden">
      {/* Peach blob background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] -z-10 opacity-30 animate-float">
        <img 
          src={peachBlob} 
          alt="" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-foreground leading-[1.1]">
              Re-imagining learning for every student.
            </h1>
            
            <p className="text-foreground/80 max-w-xl">
              Your AI tutor that turns any topic into visual explanations, 
              diagrams, and simple step-by-step learning.
            </p>
            
            <a 
              href="#how-it-works" 
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors group"
            >
              <span className="text-lg">See how it works</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="gap-3" onClick={() => navigate("/chat")}>
                <Upload className="w-5 h-5" />
                Upload PDF
              </Button>
              
              <Button variant="outline" size="lg" onClick={() => navigate("/chat")}>
                Try it now
              </Button>
            </div>
          </div>
          
          {/* Right Column - PDF Card */}
          <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-md">
              <div className="bg-background border-2 border-primary/20 rounded-3xl p-8 shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-muted rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg 
                        className="w-6 h-6 text-primary"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">PDF</div>
                      <div className="text-sm font-medium text-foreground">
                        Newton's third law of motion
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full" size="sm" onClick={() => navigate("/chat")}>
                    Start learning
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
