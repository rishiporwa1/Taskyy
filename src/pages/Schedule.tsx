import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock, ArrowUpDown, CalendarDays } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCarousel from "@/components/ImageCarousel";

interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  completed: boolean;
}

const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [user]);

  const fetchSchedule = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });
      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching schedule",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const addScheduleItem = async () => {
    if (!user) return;
    if (newTime && newActivity.trim()) {
      try {
        const { data, error } = await supabase
          .from('schedule_items')
          .insert([{
            time: newTime,
            activity: newActivity,
            completed: false,
            user_id: user.id
          }])
          .select()
          .single();
        if (error) throw error;
        setSchedule([...schedule, data]);
        setNewTime("");
        setNewActivity("");
        toast({
          title: "Schedule item added",
          description: "Your schedule item has been added successfully."
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error adding schedule item",
          description: error instanceof Error ? error.message : "An error occurred"
        });
      }
    }
  };

  const deleteScheduleItem = async (itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', itemId).eq('user_id', user.id);
      if (error) throw error;
      setSchedule(schedule.filter(item => item.id !== itemId));
      toast({
        title: "Schedule item deleted",
        description: "Your schedule item has been deleted successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting schedule item",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const handleDragStart = (item: ScheduleItem) => {
    setIsDragging(true);
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, overItem: ScheduleItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === overItem.id) return;
    const newSchedule = [...schedule];
    const draggedIndex = newSchedule.findIndex(item => item.id === draggedItem.id);
    const overIndex = newSchedule.findIndex(item => item.id === overItem.id);
    const updatedSchedule = [...newSchedule];
    updatedSchedule.splice(draggedIndex, 1);
    updatedSchedule.splice(overIndex, 0, draggedItem);
    setSchedule(updatedSchedule);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <ImageCarousel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
        <div className="md:col-span-2 space-y-4 sm:space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl">Daily Schedule</h1>
            <p className="text-sm sm:text-base text-gray-600">Plan your day hour by hour</p>
            <p className="text-sm italic font-serif border-l-2 border-amber-500 pl-3 py-0.5 mt-2 text-amber-700 bg-amber-50/60 rounded-r-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "Schedule your priorities, don't prioritize your schedule."
            </p>
          </div>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950 font-bold">Add Schedule Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="bg-white w-full sm:w-32 text-sm sm:text-base border-slate-200"
                />
                <Input
                  placeholder="Activity"
                  value={newActivity}
                  onChange={e => setNewActivity(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addScheduleItem()}
                  className="bg-white flex-1 text-sm sm:text-base border-slate-200"
                />
                <Button
                  onClick={addScheduleItem}
                  className="sm:w-auto w-full bg-gray-500 hover:bg-gray-400 text-white font-normal text-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
                  <span className="sm:hidden">Add Timeblock</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-slate-950 font-bold">
                <span>Today's Schedule</span>
                <span className="text-xs text-gray-500 mt-1 sm:mt-0 font-normal">
                  Drag items to reorder
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-sm sm:text-base text-gray-500 py-6">Loading schedule...</p>
                ) : (
                  <>
                    {schedule.sort((a, b) => a.time.localeCompare(b.time)).map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item)}
                        onDragOver={e => handleDragOver(e, item)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between p-3 rounded-lg bg-white/80 border border-gray-200/80 hover:bg-gray-50/80 cursor-grab active:cursor-grabbing transition-all ${
                          isDragging && draggedItem?.id === item.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 pr-2">
                          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-xs sm:text-sm text-primary-dark shrink-0">
                            {item.time}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-700 truncate">{item.activity}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteScheduleItem(item.id)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer h-8 w-8 shrink-0"
                          title="Delete timeblock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {schedule.length === 0 && (
                      <p className="text-center text-sm sm:text-base text-gray-500 py-6">No schedule items added yet</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Schedule;
