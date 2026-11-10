import { Button } from "@/components/ui/button";
import Calendar from "@/components/Calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";

const MobileCalendarView = () => {
  const location = useLocation();
  const isMonthlyPlan = location.pathname.includes("/monthly/");

  return (
    <Sheet>
      <SheetTrigger asChild data-sheet-trigger="calendar">
        <Button 
          variant="outline" 
          size="sm" 
          className={
            isMonthlyPlan 
              ? "w-full mb-4 hidden" 
              : "w-full mb-6 md:hidden py-4 text-sm font-semibold border-primary/20 text-primary-dark shadow-sm bg-white/90 backdrop-blur-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          }
        >
          <CalendarIcon className="w-4 h-4 text-primary-dark" />
          Show Calendar
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] px-4 rounded-t-2xl">
        <SheetHeader className="pb-2 border-b border-gray-100">
          <SheetTitle className="text-left flex items-center gap-2 text-primary-dark font-medium">
            <CalendarIcon className="w-4 h-4 text-primary-dark" />
            Calendar
          </SheetTitle>
        </SheetHeader>
        <div className="mt-3 overflow-y-auto max-h-[calc(80vh-80px)] pb-6">
          <Calendar />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileCalendarView;
