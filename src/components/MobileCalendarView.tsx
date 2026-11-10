import { Button } from "@/components/ui/button";
import Calendar from "@/components/Calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";

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
              : "w-full mb-6 md:hidden py-5 text-sm font-semibold border-primary/20 text-primary-dark shadow-sm bg-white/90 backdrop-blur-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
          }
        >
          Show Calendar
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] px-4">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">Calendar</SheetTitle>
        </SheetHeader>
        <div className="mt-2 overflow-y-auto h-[calc(75vh-90px)] pb-6">
          <Calendar />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileCalendarView;
