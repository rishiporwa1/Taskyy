
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <CalendarIcon className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-medium text-primary-dark">
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
};

export default Calendar;
