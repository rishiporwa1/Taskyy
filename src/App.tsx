
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Schedule from "@/pages/Schedule";
import YearlyGoals from "@/pages/YearlyGoals";
import DailyPlan from "@/pages/DailyPlan";
import MonthlyPlan from "@/pages/MonthlyPlan";
import NotFound from "@/pages/NotFound";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCalendarView from "@/components/MobileCalendarView";
import { useLocation } from "react-router-dom";

function CalendarWrapper() {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Don't show the mobile calendar on the profile page
  const shouldShowCalendar = isMobile && !location.pathname.startsWith('/profile');
  
  return shouldShowCalendar ? <MobileCalendarView /> : null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/10">
          <Navbar />
          <main className="container mx-auto px-4 py-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedule" 
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/yearly-goals" 
                element={
                  <ProtectedRoute>
                    <YearlyGoals />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/monthly/:goalId" 
                element={
                  <ProtectedRoute>
                    <MonthlyPlan />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/daily-plan" 
                element={
                  <ProtectedRoute>
                    <DailyPlan />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CalendarWrapper />
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
