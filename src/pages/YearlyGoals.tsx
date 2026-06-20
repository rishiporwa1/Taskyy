import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface Goal {
  id: string;
  title: string;
  description: string;
}

export default function YearlyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: ""
  });
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const images = ["https://images.unsplash.com/photo-1488590528505-98d2b5aba04b", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6", "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d", "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"];

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      const {
        error: monthlyTasksError
      } = await supabase.from('monthly_tasks').delete().eq('goal_id', goalId);
      if (monthlyTasksError) throw monthlyTasksError;
      const {
        error: goalError
      } = await supabase.from('yearly_goals').delete().eq('id', goalId);
      if (goalError) throw goalError;
      setGoals(goals.filter(goal => goal.id !== goalId));
      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting goal",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('yearly_goals').select('id, title, description').order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching goals",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!user) return;
    if (newGoal.title.trim()) {
      try {
        const {
          data,
          error
        } = await supabase.from('yearly_goals').insert([{
          title: newGoal.title,
          description: newGoal.description,
          user_id: user.id
        }]).select().single();
        if (error) throw error;
        setGoals([...goals, data]);
        setNewGoal({
          title: "",
          description: ""
        });
        toast({
          title: "Goal added",
          description: "Your goal has been added successfully."
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error adding goal",
          description: error instanceof Error ? error.message : "An error occurred"
        });
      }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl">Yearly Goals</h1>
            <p className="text-sm sm:text-base text-gray-600">Plan your achievements for the year</p>
            <p className="text-sm italic text-indigo-600/80 dark:text-indigo-400/80 border-l-2 border-indigo-400 pl-3 py-0.5 mt-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "The secret of getting ahead is getting started."
            </p>
          </div>

          <Card className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-slate-950 font-bold">Add New Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Goal Title" value={newGoal.title} onChange={e => setNewGoal({
              ...newGoal,
              title: e.target.value
            })} className="bg-white text-sm sm:text-base" />
              <Input placeholder="Description" value={newGoal.description} onChange={e => setNewGoal({
              ...newGoal,
              description: e.target.value
            })} className="bg-white text-sm sm:text-base" />
              <Button onClick={addGoal} className="w-full bg-gray-500 hover:bg-gray-400 text-white font-normal text-sm sm:text-base">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Add Goal
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? <div className="sm:col-span-2 text-center py-8">
                <p className="text-gray-500">Loading goals...</p>
              </div> : <>
                {goals.map(goal => <Card key={goal.id} className="bg-white/50 backdrop-blur-sm border border-gray-200/80 shadow-sm group hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-xl font-bold text-slate-950">{goal.title}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} className="text-gray-400 hover:text-red-500 -mt-2 -mr-2">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                      <p className="text-xs sm:text-sm text-gray-600">{goal.description}</p>
                      <Button asChild variant="outline" className="w-full bg-white group-hover:bg-primary-dark group-hover:text-white group-hover:border-transparent transition-all text-xs sm:text-sm font-normal">
                        <Link to={`/monthly/${goal.id}`}>
                          Monthly Plan <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>)}
                {goals.length === 0 && <div className="sm:col-span-2">
                    <p className="text-center text-sm sm:text-base text-gray-500">No goals added yet</p>
                  </div>}
              </>}
          </div>
        </div>

        <div className="hidden md:block">
          <Calendar />
        </div>
      </div>
    </div>;
}
