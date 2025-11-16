import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="w-full py-6 px-8 md:px-16 lg:px-24 bg-background">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="text-2xl font-bold text-foreground">
          Learn Your Way
        </div>
        
        <Button variant="outline" size="sm" onClick={() => navigate("/chat")}>
          Try it now
        </Button>
      </div>
    </header>
  );
};

export default Header;
