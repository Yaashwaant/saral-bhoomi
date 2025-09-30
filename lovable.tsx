import React, { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, MapPin, FolderOpen, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SliderCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
}

const cards: SliderCard[] = [
  {
    icon: <FileText className="w-12 h-12 text-orange-600" />,
    title: "LAND RECORDS",
    description: "Access comprehensive land ownership records, historical data and property details with complete transparency.",
    category: "RECORDS"
  },
  {
    icon: <MapPin className="w-12 h-12 text-orange-600" />,
    title: "FIELD SURVEY",
    description: "Coordinate field surveys, track progress and upload geo-tagged evidence directly from mobile devices.",
    category: "SURVEY"
  },
  {
    icon: <FolderOpen className="w-12 h-12 text-orange-600" />,
    title: "DOCUMENTATION",
    description: "Manage all project documents, legal notices and compliance records in one centralized system.",
    category: "DOCUMENTS"
  },
  {
    icon: <IndianRupee className="w-12 h-12 text-orange-600" />,
    title: "COMPENSATION",
    description: "Track compensation calculations, payment status and beneficiary details with complete audit trails.",
    category: "FINANCE"
  }
];

const SimpleTestSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  // Calculate visible cards based on screen size
  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const visibleCards = getVisibleCards();
  const maxIndex = cards.length - visibleCards;

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
          Key Features
        </h3>
        <p className="text-sm text-muted-foreground">
          Explore the powerful capabilities of SARAL Bhoomi
        </p>
      </div>

      <div className="relative">
        {/* Navigation Arrows */}
        <Button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg disabled:opacity-50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg disabled:opacity-50"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Cards Container */}
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: `-${currentIndex * (100 / visibleCards)}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {cards.map((card, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="glass rounded-xl p-6 border border-white/30 shadow-card hover:shadow-glass transition-shadow h-full flex flex-col">
                  {/* Category Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700 w-fit mb-4">
                    <span className="text-xs font-medium">{card.category}</span>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h4 className="text-lg font-heading font-semibold text-foreground mb-3">
                    {card.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground flex-grow mb-4">
                    {card.description}
                  </p>

                  {/* Find Out More Link */}
                  <button
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-2 group"
                    aria-label={`Learn more about ${card.title}`}
                  >
                    FIND OUT MORE
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index
                  ? "w-8 bg-orange-600"
                  : "w-2 bg-orange-200 hover:bg-orange-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleTestSlider;
