import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Shield, FlaskConical, BadgeCheck, Star } from 'lucide-react';

const badges = [
  { icon: FlaskConical, text: '0% Preservatives', color: 'text-green-600' },
  { icon: Shield, text: 'Zero Chemicals', color: 'text-emerald-600' },
  { icon: Leaf, text: '100% Natural', color: 'text-green-700' },
  { icon: BadgeCheck, text: 'FSSAI Approved', color: 'text-teal-600' },
  { icon: Star, text: 'Quality Assured', color: 'text-green-600' },
];

export default function TrustBadges() {
  const [isPaused, setIsPaused] = useState(false);
  
  // Duplicate badges for seamless loop
  const duplicatedBadges = [...badges, ...badges, ...badges];

  return (
    <div style={{ perspective: '1200px' }} className="group">
      <section className="relative overflow-hidden bg-gradient-to-r from-green-50/80 via-amber-50/50 to-green-50/80 border-y border-green-100/50 transition-all duration-500 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.25)] group-hover:translate-y-[-8px]" style={{
        transform: 'rotateX(0deg) translateZ(0px)',
        transformStyle: 'preserve-3d',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
      }}>
        <div className="py-4 md:py-5" style={{ transform: 'translateZ(25px)' }}>
        {/* Scrolling Container */}
        <motion.div
          className="flex gap-8 md:gap-12"
          animate={{
            x: isPaused ? undefined : ['0%', '-33.333%'],
          }}
          transition={{
            duration: 25,
            ease: 'linear',
            repeat: Infinity,
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            width: 'max-content',
          }}
        >
          {duplicatedBadges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 px-4 group cursor-default"
            >
              {/* Icon */}
              <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <badge.icon className={`h-5 w-5 md:h-6 md:w-6 ${badge.color}`} strokeWidth={2} />
              </div>

              {/* Text */}
              <span className="text-sm md:text-base font-medium text-gray-700 whitespace-nowrap group-hover:text-gray-900 transition-colors duration-300">
                {badge.text}
              </span>

              {/* Divider Dot */}
              {index < duplicatedBadges.length - 1 && (
                <div className="flex-shrink-0 ml-4 md:ml-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-300/60" />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient Overlays for Edge Fade Effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-green-50/80 to-transparent pointer-events-none z-10" style={{ transform: 'translateZ(20px)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-green-50/80 to-transparent pointer-events-none z-10" style={{ transform: 'translateZ(20px)' }} />
      </section>
    </div>
  );
}
