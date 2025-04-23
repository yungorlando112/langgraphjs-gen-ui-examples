import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Calendar,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Define the Movie type
type Movie = {
  id: number;
  title: string;
  overview: string | null;
  original_language: string | null;
  original_title: string | null;
  runtime: number | null;
  revenue: number | null;
  release_date: string | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  budget: number | null;
  year: string | null;
  description: string | null;
  poster_url: string | null;
  pg_rating: string | null;
  imdb_url: string | null;
};

// Helper function to format currency
const formatCurrency = (amount: number | null) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};

// Helper function to format runtime
const formatRuntime = (minutes: number | null) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Movie Card component
const MovieCard = ({
  movie,
  isSelected,
}: {
  movie: Movie;
  isSelected: boolean;
}) => {
  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-8">
      {/* Movie Poster */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-64 h-96 shadow-2xl rounded-lg overflow-hidden"
      >
        <img
          src={movie.poster_url || "/placeholder.svg?height=500&width=300"}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Movie Details */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-md"
      >
        <Card className="p-6 bg-black/80 text-white border-none shadow-xl">
          <h2 className="text-2xl font-bold mb-3">{movie.title}</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {movie.pg_rating && (
              <Badge
                key="pg"
                variant="outline"
                className="border-white text-white"
              >
                {movie.pg_rating}
              </Badge>
            )}
            {movie.year && (
              <Badge
                key="year"
                variant="outline"
                className="border-white text-white"
              >
                {movie.year}
              </Badge>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>
                {movie.vote_average
                  ? `${movie.vote_average.toFixed(1)}/10`
                  : "Not Rated"}
              </span>
            </div>

            {movie.runtime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatRuntime(movie.runtime)}</span>
              </div>
            )}

            {movie.release_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(movie.release_date).toLocaleDateString()}</span>
              </div>
            )}

            {movie.revenue && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Revenue: {formatCurrency(movie.revenue)}</span>
              </div>
            )}
          </div>

          <p className="text-sm mb-4">
            {movie.overview || movie.description || "No description available."}
          </p>

          {movie.imdb_url && (
            <Button
              variant="outline"
              className="w-full border-white text-white hover:bg-white hover:text-black"
              onClick={() => window.open(movie.imdb_url!, "_blank")}
            >
              View on IMDb
            </Button>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

// Movie Indicator component
const MovieIndicators = ({
  movies,
  selectedIndex,
  setSelectedIndex,
}: {
  movies: Movie[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}) => {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {movies.map((_, index) => (
        <button
          key={index}
          className={`w-3 h-3 rounded-full transition-all ${
            index === selectedIndex ? "bg-white scale-125" : "bg-white/50"
          }`}
          onClick={() => setSelectedIndex(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

// Main Movie Carousel component
const SimpleMovieCarousel = ({ movies }: { movies: Movie[] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handlePrevious = () => {
    setDirection(-1);
    setSelectedIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handleNext = () => {
    setDirection(1);
    setSelectedIndex((prev) => (prev + 1) % movies.length);
  };

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 10000);

    return () => clearInterval(timer);
  }, [selectedIndex]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gradient-to-br from-gray-900 to-blue-900">
      {/* Background blur effect for the current movie */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20"
        style={{
          backgroundImage: `url(${movies[selectedIndex].poster_url || "/placeholder.svg"})`,
        }}
      />

      {/* Movie Title Header */}
      <motion.div
        className="absolute top-8 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        key={`title-${selectedIndex}`}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          {movies[selectedIndex].title}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          {movies[selectedIndex].pg_rating && (
            <Badge
              key="pg"
              variant="outline"
              className="bg-black/50 text-white border-white"
            >
              {movies[selectedIndex].pg_rating}
            </Badge>
          )}
          {movies[selectedIndex].vote_average && (
            <Badge
              key="rating"
              variant="outline"
              className="bg-black/50 text-white border-white"
            >
              <Star className="h-3 w-3 mr-1 text-yellow-400 inline" />
              {movies[selectedIndex].vote_average.toFixed(1)}
            </Badge>
          )}
          {movies[selectedIndex].year && (
            <Badge
              key="year"
              variant="outline"
              className="bg-black/50 text-white border-white"
            >
              {movies[selectedIndex].year}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-20">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={selectedIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <MovieCard movie={movies[selectedIndex]} isSelected={true} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="bg-black/50 text-white border-white hover:bg-white hover:text-black"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="bg-black/50 text-white border-white hover:bg-white hover:text-black"
          onClick={handleNext}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <MovieIndicators
          movies={movies}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </div>
    </div>
  );
};

export default SimpleMovieCarousel;
