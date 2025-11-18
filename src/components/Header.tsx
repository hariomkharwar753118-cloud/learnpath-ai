import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  return (
    <header className="w-full py-4 sm:py-6 px-4 sm:px-8 md:px-16 lg:px-24 bg-background">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="text-xl sm:text-2xl font-bold text-foreground">
          Learn Your Way
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/chat")} className="text-xs sm:text-sm">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-xs sm:text-sm">
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs sm:text-sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
