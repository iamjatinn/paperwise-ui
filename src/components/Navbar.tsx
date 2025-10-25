import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { FileText, LogOut, FileStack } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            DocAI
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/upload" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/upload") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Upload
              </Link>
              <Link 
                to="/multi-qa" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/multi-qa") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-1">
                  <FileStack className="w-4 h-4" />
                  Multi-Doc Q&A
                </span>
              </Link>
              {/* <Link 
                to="/comparison" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/comparison") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Compare
              </Link> */}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button 
              onClick={logout}
              variant="ghost"
              className="text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              className="gradient-primary text-white border-0 hover:opacity-90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}