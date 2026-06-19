
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Home = () => {
  const [api, setApi] = useState<CarouselApi>();
  const isMobile = useIsMobile();
  
  const features = [
    "Track your yearly goals",
    "Plan your months effectively",
    "Manage daily tasks",
    "Schedule your day",
  ];

  const images = [
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
  ];

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <Carousel setApi={setApi} className="w-full max-w-4xl mx-auto">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <img
                  src={`${image}?w=1200&h=400&fit=crop&auto=format`}
                  alt={`Study environment ${index + 1}`}
                  className="w-full h-[200px] sm:h-[250px] md:h-[300px] object-cover rounded-lg"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-950">
              Welcome to Study Planner
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Your personal task manager for achieving goals and staying organized.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-dark" />
                <span className="text-sm sm:text-base text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <Button asChild className="bg-gray-500 hover:bg-gray-400 text-white text-sm sm:text-base font-normal">
              <Link to="/yearly-goals">
                Start Planning <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-in mt-4 md:mt-0 hidden md:block" style={{ animationDelay: "0.3s" }}>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Home;
