import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface ImageCarouselProps {
  className?: string;
}

interface CarouselSlide {
  id: string;
  url: string;
  tag: string;
  alt: string;
}

// Curated library of 50 aesthetic productivity, workspace, architecture, and focus environment images
const IMAGE_LIBRARY: CarouselSlide[] = [
  // Coding & Technology Setups
  {
    id: "code-1",
    url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    tag: "Deep Coding",
    alt: "Code editor and modern development workspace",
  },
  {
    id: "code-2",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    tag: "Software Engineering",
    alt: "Dual monitor dark code workspace",
  },
  {
    id: "code-3",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    tag: "Cyber Architecture",
    alt: "Matrix of digital code",
  },
  {
    id: "code-4",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    tag: "Algorithm Design",
    alt: "Colorful code editor interface",
  },
  {
    id: "code-5",
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
    tag: "System Thinking",
    alt: "Developer writing code on laptop",
  },
  {
    id: "code-6",
    url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12",
    tag: "UI Architecture",
    alt: "Wireframing and web design flow",
  },
  {
    id: "code-7",
    url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    tag: "Core Logic",
    alt: "Monochrome syntax highlighting on screen",
  },
  {
    id: "code-8",
    url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd",
    tag: "Fullstack Focus",
    alt: "Developer dual screens workstation",
  },

  // Minimalist Workspaces & Desks
  {
    id: "desk-1",
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    tag: "Focused Workflow",
    alt: "Person typing on MacBook on wooden desk",
  },
  {
    id: "desk-2",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
    tag: "Morning Routine",
    alt: "Notebook, coffee cup and laptop desk",
  },
  {
    id: "desk-3",
    url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
    tag: "Clean Horizon",
    alt: "Ultra minimal white workspace",
  },
  {
    id: "desk-4",
    url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8",
    tag: "Creative Studio",
    alt: "Modern ergonomic workspace setup",
  },
  {
    id: "desk-5",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    tag: "Team Synergy",
    alt: "Creative collaboration at table",
  },
  {
    id: "desk-6",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    tag: "Productive Flow",
    alt: "Clean coffee and laptop setup",
  },
  {
    id: "desk-7",
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    tag: "Design Sprint",
    alt: "Team strategy session at desk",
  },
  {
    id: "desk-8",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    tag: "Digital Strategy",
    alt: "Laptop analytics dashboard view",
  },

  // Hardware, Innovation & Engineering Labs
  {
    id: "tech-1",
    url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    tag: "Hardware Systems",
    alt: "Modern technology and components",
  },
  {
    id: "tech-2",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    tag: "Innovation Lab",
    alt: "Tech research lab environment",
  },
  {
    id: "tech-3",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    tag: "Micro-Circuits",
    alt: "Precision electronic motherboard",
  },
  {
    id: "tech-4",
    url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
    tag: "Next-Gen Tech",
    alt: "Futuristic illuminated laptop",
  },
  {
    id: "tech-5",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    tag: "Tech Space",
    alt: "High performance workspace lighting",
  },

  // Libraries, Knowledge & Deep Study
  {
    id: "study-1",
    url: "https://images.unsplash.com/photo-1507842229451-79731fe8274b",
    tag: "Library Sanctuaries",
    alt: "Atmospheric library book shelves",
  },
  {
    id: "study-2",
    url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8",
    tag: "Lifelong Mastery",
    alt: "Books open with warm reading light",
  },
  {
    id: "study-3",
    url: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a",
    tag: "Deep Knowledge",
    alt: "Stack of notebooks and reading glasses",
  },
  {
    id: "study-4",
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
    tag: "Curated Thought",
    alt: "Neat modern book collection",
  },
  {
    id: "study-5",
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6",
    tag: "Study Momentum",
    alt: "Textbooks arranged with precision",
  },

  // Modern Architecture & Inspiring Structures
  {
    id: "arch-1",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    tag: "Modern Ambition",
    alt: "Glass corporate skyscraper looking up",
  },
  {
    id: "arch-2",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f",
    tag: "Clean Space",
    alt: "Minimalist concrete architecture",
  },
  {
    id: "arch-3",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    tag: "Executive Strategy",
    alt: "Spacious modern boardroom office",
  },
  {
    id: "arch-4",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
    tag: "Contemporary Office",
    alt: "Sunlit corporate headquarters interior",
  },
  {
    id: "arch-5",
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
    tag: "Focus Haven",
    alt: "Modern quiet office booth",
  },

  // Serene Nature & Clarity
  {
    id: "nature-1",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    tag: "Clarity & Calm",
    alt: "Serene alpine lake at dawn",
  },
  {
    id: "nature-2",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    tag: "Infinite Horizons",
    alt: "Misty mountain peaks above clouds",
  },
  {
    id: "nature-3",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    tag: "Stargazing Focus",
    alt: "Starry night sky over mountains",
  },
  {
    id: "nature-4",
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    tag: "Fresh Perspective",
    alt: "Green rolling hills under sunny sky",
  },
  {
    id: "nature-5",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    tag: "Quiet Reflection",
    alt: "Lake surrounded by evergreen pine trees",
  },
  {
    id: "nature-6",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    tag: "Deep Forest",
    alt: "Sunlight filtering through forest trees",
  },
  {
    id: "nature-7",
    url: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd",
    tag: "Mountain Vista",
    alt: "Snowcapped mountain peaks against dawn sky",
  },
];

// Hash function to turn date string into deterministic seed
function hashDateString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded pseudorandom generator (Park-Miller LCG)
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Deterministically picks 5 unique images for the current date
function getDailySlides(date = new Date(), count = 5): CarouselSlide[] {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seed = hashDateString(dateKey);
  const rng = createSeededRandom(seed);

  const pool = [...IMAGE_LIBRARY];
  // Seeded Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export default function ImageCarousel({ className = "" }: ImageCarouselProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(() => getDailySlides(new Date(), 5));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const todayFormatted = format(new Date(), "MMM d");

  // Automatically refresh slides if midnight passes and the calendar day advances
  useEffect(() => {
    let lastDateKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

    const checkMidnight = setInterval(() => {
      const currentDateKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
      if (currentDateKey !== lastDateKey) {
        lastDateKey = currentDateKey;
        setSlides(getDailySlides(new Date(), 5));
        if (api) {
          api.scrollTo(0);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMidnight);
  }, [api]);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, slides]);

  // Autoplay with pause on hover
  useEffect(() => {
    if (!api || isPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4500);

    return () => clearInterval(interval);
  }, [api, isPaused]);

  return (
    <div
      className={`relative w-full group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={`${slide.id}-${index}`} className="pl-0">
              <div className="relative w-full overflow-hidden rounded-2xl shadow-md border border-slate-200/80 bg-slate-950">
                <img
                  src={`${slide.url}?w=1600&h=700&fit=crop&auto=format&q=85`}
                  alt={slide.alt}
                  className="w-full h-[220px] sm:h-[300px] md:h-[380px] lg:h-[440px] object-cover transition-all duration-700 group-hover:scale-[1.01]"
                  loading={index === 0 ? "eager" : "lazy"}
                />

                {/* Subtle cinematic gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 pointer-events-none" />

                {/* Left: Category / Tag Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{slide.tag}</span>
                </div>

                {/* Right: Daily Edition Badge */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Daily Edition • {todayFormatted}</span>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hidden sm:flex left-4 bg-white/90 hover:bg-white text-slate-800 shadow-md border-slate-200 cursor-pointer h-10 w-10 transition-transform hover:scale-105" />
        <CarouselNext className="hidden sm:flex right-4 bg-white/90 hover:bg-white text-slate-800 shadow-md border-slate-200 cursor-pointer h-10 w-10 transition-transform hover:scale-105" />
      </Carousel>

      {/* Pagination Dot Indicators (Exact 5 dots) */}
      {count > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xs">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                current === index
                  ? "w-7 bg-white shadow-xs"
                  : "w-2 bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
