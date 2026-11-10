import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import ImageCarousel from "@/components/ImageCarousel";

const Home = () => {
  const features = [
    "Track your yearly goals",
    "Plan your months effectively",
    "Manage daily tasks",
    "Schedule your day",
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Full-width Carousel aligned with container edges */}
      <ImageCarousel />

      {/* Balanced 12-col grid: Left content 7 cols, Calendar 5 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-950">
              Welcome to Taskyy
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Your personal task manager for achieving goals and staying organized.
            </p>
            <p className="text-sm italic font-serif border-l-2 border-amber-500 pl-3 py-0.5 mt-2 text-amber-700 bg-amber-50/60 rounded-r-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
              "Organize your chaos, master your time."
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

          <div className="flex space-x-4 pt-1">
            <Button asChild className="bg-gray-500 hover:bg-gray-400 text-white text-sm sm:text-base font-normal cursor-pointer">
              <Link to="/yearly-goals">
                Start Planning <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 animate-fade-in mt-4 lg:mt-0 hidden md:flex md:justify-end" style={{ animationDelay: "0.3s" }}>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Home;
