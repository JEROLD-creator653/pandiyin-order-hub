import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DescriptionRenderer from './DescriptionRenderer';

interface ProductDescriptionCollapsibleProps {
  content: string;
  imageHeight?: number;
  className?: string;
}

export default function ProductDescriptionCollapsible({
  content,
  imageHeight = 400,
  className = 'text-muted-foreground',
}: ProductDescriptionCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      // Only show read more if content exceeds image height
      setShouldCollapse(height > imageHeight);
    }
  }, [content, imageHeight]);

  const collapsedHeight = Math.min(imageHeight, contentHeight);

  return (
    <div className="relative flex flex-col">
      {/* Description Content - expand into page (no inner scrollbar) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isExpanded ? 'expanded' : 'collapsed'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={isExpanded ? 'overflow-visible' : 'overflow-hidden'}
          style={{
            height: isExpanded ? 'auto' : collapsedHeight,
          }}
        >
          <div ref={contentRef} className={`${className} pb-4`}>
            <DescriptionRenderer content={content} className="prose prose-sm max-w-none" />
          </div>

          {/* Fade gradient overlay when collapsed */}
          {shouldCollapse && !isExpanded && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Read More / Show Less Button - Centered with Arrow */}
      {shouldCollapse && (
        <motion.div
          className="flex justify-center pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = !isExpanded;
              setIsExpanded(next);
              if (next) {
                // ensure the top of the description is visible so expansion grows downward
                setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
              }
            }}
            className="gap-2 text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            {isExpanded ? (
              <>
                Show less
                <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
              </>
            ) : (
              <>
                Read more
                <ChevronDown className="h-4 w-4 transition-transform" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
