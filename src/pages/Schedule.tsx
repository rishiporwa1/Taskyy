import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

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
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
  const isMobile = useIsMobile();
  const images = ["https://images.unsplash.com/photo-1488590528505-98d2b5aba04b", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6", "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d", "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"];

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [user]);

  const fetchSchedule = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schedule_items').select('*').order('time', {
        ascending: true
      });
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
        const {
          data,
          error
        } = await supabase.from('schedule_items').insert([{
          time: newTime,
          activity: newActivity,
          completed: false,
          user_id: user.id
        }]).select().single();
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

  const toggleScheduleItem = async (itemId: string) => {
    try {
      const item = schedule.find(i => i.id === itemId);
      if (!item) return;
      const {
        error
      } = await supabase.from('schedule_items').update({
        completed: !item.completed
      }).eq('id', itemId);
      if (error) throw error;
      setSchedule(schedule.map(item => item.id === itemId ? {
        ...item,
        completed: !item.completed
      } : item));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating schedule item",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const deleteScheduleItem = async (itemId: string) => {
    try {
      const {
        error
      } = await supabase.from('schedule_items').delete().eq('id', itemId);
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

  return <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <Carousel setApi={setApi} className="w-full max-w-4xl mx-auto">
        <CarouselContent>
          {images.map((image, index) => <CarouselItem key={index}>
              <div className="p-1">
                <img src={`${image}?w=1200&h=400&fit=crop&auto=format`} alt={`Study environment ${index + 1}`} className="w-full h-[200px] sm:h-[250px] md:h-[300px] object-cover rounded-lg" />
              </div>
            </CarouselItem>)}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-4 sm:space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl">Daily Schedule</h1>
            <p className="text-sm sm:text-base text-gray-600">Plan your day hour by hour</p>
          </div>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Add Schedule Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-white w-full sm:w-32 text-sm sm:text-base" />
                <Input placeholder="Activity" value={newActivity} onChange={e => setNewActivity(e.target.value)} onKeyPress={e => e.key === "Enter" && addScheduleItem()} className="bg-white flex-1 text-sm sm:text-base" />
                <Button onClick={addScheduleItem} className="sm:w-auto w-full bg-gray-500 hover:bg-gray-400 font-normal text-xs">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex flex-col sm:flex-row items-start sm:items-center justify-between">
                Today's Schedule
                <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                  Drag items to reorder
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? <p className="text-center text-sm sm:text-base text-gray-500">Loading schedule...</p> : <>
                    {schedule.sort((a, b) => a.time.localeCompare(b.time)).map(item => <div key={item.id} draggable onDragStart={() => handleDragStart(item)} onDragOver={e => handleDragOver(e, item)} onDragEnd={handleDragEnd} className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-move ${isDragging ? 'opacity-50' : ''}`}>
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <span className="text-xs sm:text-sm text-primary-dark font-medium">
                              {item.time}
                            </span>
                            <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                              {item.activity}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteScheduleItem(item.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>)}
                    {schedule.length === 0 && <p className="text-center text-sm sm:text-base text-gray-500">No schedule items added yet</p>}
                  </>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Calendar />
        </div>
      </div>
    </div>;
};

export default Schedule;
