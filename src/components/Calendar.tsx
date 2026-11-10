import { useState } from "react";
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const resetToToday = () => {
    setDate(new Date());
  };

  return (
    <Card className="w-full max-w-[330px] sm:max-w-[350px] mx-auto lg:ml-auto bg-white/80 backdrop-blur-sm border border-gray-200/90 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-2 border-b border-gray-100/90">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-primary-dark" />
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-primary-dark">
              Calendar
            </CardTitle>
            <p className="text-[11px] text-gray-500 font-normal">
              {date ? format(date, "EEEE, MMM d, yyyy") : "Select a date"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToToday}
          className="h-7 px-2 text-xs text-primary-dark hover:bg-slate-100 font-normal cursor-pointer"
          title="Jump to Today"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Today
        </Button>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 flex justify-center">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border border-slate-200/70 bg-white/95 w-full p-2"
        />
      </CardContent>
    </Card>
  );
};

export default Calendar;
