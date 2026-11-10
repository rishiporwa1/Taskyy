import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Info, ListTodo } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ImageCarousel from "@/components/ImageCarousel";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function DailyPlan() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching tasks",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!user) return;
    if (newTask.trim()) {
      try {
        const { data, error } = await supabase.from('daily_tasks').insert([{
          title: newTask,
          completed: false,
          user_id: user.id
        }]).select().single();
        if (error) throw error;
        setTasks([...tasks, data]);
        setNewTask("");
        toast({
          title: "Task added",
          description: "Your task has been added successfully."
        });
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
    if (!user) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const { error } = await supabase.from('daily_tasks').update({
        completed: !task.completed
      }).eq('id', taskId).eq('user_id', user.id);
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

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId).eq('user_id', user.id);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <ImageCarousel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl text-slate-950 font-bold sm:text-4xl">Daily Plan</h1>
            <p className="text-sm sm:text-base text-gray-600">Plan your tasks for today</p>
            <p className="text-sm italic font-serif border-l-2 border-amber-500 pl-3 py-0.5 mt-2 text-amber-700 bg-amber-50/60 rounded-r-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "Plan your day, own your life."
            </p>
          </div>

          <Card className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 shadow-2xs">
            <CardContent className="p-4 flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                Your tasks will automatically reset at 1:00 AM every day, giving you a fresh start each morning.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950 font-bold">Add Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="New Task"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addTask()}
                  className="bg-white text-sm sm:text-base border-slate-200"
                />
                <Button
                  onClick={addTask}
                  className="sm:w-auto w-full bg-gray-500 hover:bg-gray-400 text-white font-normal text-xs cursor-pointer px-5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950 font-bold">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-sm sm:text-base text-gray-500 py-6">Loading tasks...</p>
                ) : (
                  <>
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-gray-200/80 hover:bg-gray-50/80 transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="cursor-pointer h-4 w-4"
                          />
                          <span className={`text-xs sm:text-sm select-none break-words ${task.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                            {task.title}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer h-8 w-8 shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-sm sm:text-base text-gray-500 py-6">No tasks for today</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block">
          <Calendar />
        </div>
      </div>
    </div>
  );
}
