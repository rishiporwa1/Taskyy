
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Calendar, ListTodo, Menu, Target, User, X, NotebookPen } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAuthPage = location.pathname === "/auth";
  const searchParams = new URLSearchParams(location.search);
  const isSignUpMode = searchParams.get("mode") === "signup";

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <NotebookPen className="h-6 w-6 text-primary" />
            Taskyy
          </Link>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/yearly-goals">
                    <Target className="w-4 h-4 mr-2" />
                    Yearly Goals
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/daily-plan">
                    <ListTodo className="w-4 h-4 mr-2" />
                    Daily Plan
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/schedule">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="bg-gray-500 hover:bg-gray-400 text-white font-normal shadow-sm">
                {isAuthPage && !isSignUpMode ? (
                  <Link to="/auth?mode=signup">Sign Up</Link>
                ) : (
                  <Link to="/auth?mode=signin">Sign In</Link>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-3 border-t">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/yearly-goals">
                      <Target className="w-4 h-4 mr-2" />
                      Yearly Goals
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/daily-plan">
                      <ListTodo className="w-4 h-4 mr-2" />
                      Daily Plan
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/schedule">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full bg-gray-500 hover:bg-gray-400 text-white font-normal shadow-sm" onClick={() => setIsMenuOpen(false)}>
                  {isAuthPage && !isSignUpMode ? (
                    <Link to="/auth?mode=signup">Sign Up</Link>
                  ) : (
                    <Link to="/auth?mode=signin">Sign In</Link>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
