
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface MonthlyTask {
  id: string;
  title: string;
  completed: boolean;
  goal_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function MonthlyPlan() {
  const {
    goalId
  } = useParams();
  const {
    user
  } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(true);
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
    if (user && goalId) {
      fetchGoal();
      fetchTasks();
    }
  }, [user, goalId]);

  const fetchGoal = async () => {
    if (!user || !goalId) return;
    try {
      const {
        data: goalData,
        error: goalError
      } = await supabase.from('yearly_goals').select('*').eq('id', goalId).eq('user_id', user.id).single();
      if (goalError) throw goalError;
      setGoal(goalData);
      setLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching goal",
        description: error instanceof Error ? error.message : "An error occurred"
      });
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user || !goalId) return;
    try {
      const {
        data: tasksData,
        error: tasksError
      } = await supabase.from('monthly_tasks').select('*').eq('goal_id', goalId).eq('user_id', user.id).order('created_at', {
        ascending: true
      });
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching tasks",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const {
        error
      } = await supabase.from('monthly_tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Your monthly task has been deleted successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const addTask = async () => {
    if (!user || !goalId) return;
    if (newTask.trim()) {
      try {
        const {
          data,
          error
        } = await supabase.from('monthly_tasks').insert([{
          title: newTask,
          completed: false,
          goal_id: goalId,
          user_id: user.id
        }]).select().single();
        if (error) throw error;
        if (data) {
          setTasks([...tasks, data]);
          setNewTask("");
          toast({
            title: "Task added",
            description: "Your monthly task has been added successfully."
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error adding task",
          description: error instanceof Error ? error.message : "An error occurred"
        });
      }
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const {
        error
      } = await supabase.from('monthly_tasks').update({
        completed: !task.completed
      }).eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.map(task => task.id === taskId ? {
        ...task,
        completed: !task.completed
      } : task));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
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
      
      {/* Mobile Calendar Button - Moved below carousel */}
      {isMobile && (
        <Button variant="outline" size="sm" className="w-full mb-4" onClick={() => {
          document.querySelector('[data-sheet-trigger="calendar"]')?.dispatchEvent(
            new MouseEvent('click', { bubbles: true })
          );
        }}>
          Show Calendar
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl">Monthly Plan</h1>
            <p className="text-sm italic text-indigo-600/80 dark:text-indigo-400/80 border-l-2 border-indigo-400 pl-3 py-0.5 mt-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "Focus on the step in front of you, not the whole staircase."
            </p>
            {goal && <div className="mt-4">
                <h2 className="text-lg sm:text-xl font-semibold text-primary-dark">{goal.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600">{goal.description}</p>
              </div>}
          </div>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-slate-950 font-bold">Add Monthly Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input placeholder="New Task" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyPress={e => e.key === "Enter" && addTask()} className="bg-white text-sm sm:text-base" />
                <Button onClick={addTask} className="sm:w-auto w-full bg-gray-500 hover:bg-gray-400 text-white font-normal text-xs">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-slate-950 font-bold">Monthly Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? <p className="text-center text-sm sm:text-base text-gray-500">Loading tasks...</p> : <>
                    {tasks.map(task => <div key={task.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                          <span className={`text-xs sm:text-sm ${task.completed ? "line-through text-gray-400" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>)}
                    {tasks.length === 0 && <p className="text-center text-sm sm:text-base text-gray-500">No tasks added yet</p>}
                  </>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block">
          <Calendar />
        </div>
      </div>
    </div>;
}
