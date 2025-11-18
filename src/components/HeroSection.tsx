import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import peachBlob from "@/assets/peach-blob.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTAClick = () => {
    navigate(user ? "/chat" : "/auth");
  };
  
  return (
    <section className="relative w-full min-h-[85vh] px-4 sm:px-8 md:px-16 lg:px-24 py-12 sm:py-16 md:py-24 overflow-hidden">
      {/* Peach blob background */}
      <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] -z-10 opacity-30 animate-float">
        <img 
          src={peachBlob} 
          alt="" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <h1 className="text-foreground leading-[1.1] text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              Re-imagining learning for every student.
            </h1>
            
            <p className="text-foreground/80 max-w-xl text-base sm:text-lg md:text-xl">
              Your AI tutor that turns any topic into visual explanations, 
              diagrams, and simple step-by-step learning.
            </p>
            
            <a 
              href="#how-it-works" 
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors group text-sm sm:text-base md:text-lg"
            >
              <span>See how it works</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button size="lg" className="gap-3" onClick={handleCTAClick}>
                <Upload className="w-5 h-5" />
                Upload PDF
              </Button>
              
              <Button variant="outline" size="lg" onClick={handleCTAClick}>
                Try it now
              </Button>
            </div>
          </div>
          
          {/* Right Column - PDF Card */}
          <div className="flex items-center justify-center animate-fade-in mt-8 md:mt-0" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-md">
              <div className="bg-background border-2 border-primary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-hover hover:shadow-soft transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-muted rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg 
                        className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
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
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">PDF</div>
                      <div className="text-sm font-medium text-foreground truncate">
                        Newton's third law of motion
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full text-sm sm:text-base" size="sm" onClick={handleCTAClick}>
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
