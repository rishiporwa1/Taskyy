import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft, Target, ListTodo } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ImageCarousel from "@/components/ImageCarousel";

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
  const { goalId } = useParams();
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && goalId) {
      fetchGoal();
      fetchTasks();
    }
  }, [user, goalId]);

  const fetchGoal = async () => {
    if (!user || !goalId) return;
    try {
      const { data: goalData, error: goalError } = await supabase
        .from('yearly_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();
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
      const { data: tasksData, error: tasksError } = await supabase
        .from('monthly_tasks')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
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

  const addTask = async () => {
    if (!user || !goalId) return;
    if (newTask.trim()) {
      try {
        const { data, error } = await supabase
          .from('monthly_tasks')
          .insert([{
            title: newTask,
            completed: false,
            goal_id: goalId,
            user_id: user.id
          }])
          .select()
          .single();
        if (error) throw error;
        setTasks([...tasks, data]);
        setNewTask("");
        toast({
          title: "Task added",
          description: "Your monthly task has been added successfully."
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
      const { error } = await supabase
        .from('monthly_tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
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
      const { error } = await supabase
        .from('monthly_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
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

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <ImageCarousel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm" className="cursor-pointer -ml-2 text-gray-600 hover:text-black">
                <Link to="/yearly-goals">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Goals
                </Link>
              </Button>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl">
                {goal ? goal.title : "Loading..."}
              </h1>
              {goal?.description && (
                <p className="text-sm sm:text-base text-gray-600 mt-1">{goal.description}</p>
              )}
            </div>
          </div>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950 font-bold">Add Monthly Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="New Milestone Task"
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
              <CardTitle className="text-xl text-slate-950 font-bold">Monthly Tasks</CardTitle>
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
                      <p className="text-center text-sm sm:text-base text-gray-500 py-6">No monthly tasks for this goal</p>
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
