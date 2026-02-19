import { useEffect, useMemo } from 'react';
import { memo } from 'react';
import { motion } from 'framer-motion';

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  content: string;
}

function PolicyLayout({ title, lastUpdated, content }: PolicyLayoutProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
    // Update page title for SEO
    document.title = `${title} | Pandiyin`;
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${title} for Pandiyin Nature In Pack`);
    }
  }, [title]);

  // Memoize content formatting to avoid recalculation
  const formattedSections = useMemo(() => {
    const sections = content.split('\n\n').map((section, index) => {
      const lines = section.split('\n');
      const firstLine = lines[0];
      const isHeading = /^\d+\.|^[A-Z]/.test(firstLine) && !firstLine.includes('.');
      const isMainTitle = index === 0 && firstLine === title;
      
      if (isMainTitle) return null;

      return (
        <div key={index} className="mb-6">
          {isHeading && /^\d+\./.test(firstLine) ? (
            <>
              <h2 className="text-xl font-bold mb-3 text-foreground">
                {firstLine}
              </h2>
              {lines.slice(1).map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">
                  {line}
                </p>
              ))}
            </>
          ) : /^[A-Z]\)/.test(firstLine) ? (
            <>
              <h3 className="font-semibold text-base mb-2 text-foreground">
                {firstLine}
              </h3>
              {lines.slice(1).map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">
                  {line}
                </p>
              ))}
            </>
          ) : lines[0].startsWith('-') ? (
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
              {lines.map((line, i) => (
                <li key={i} className="ml-2">
                  {line.replace(/^-\s*/, '')}
                </li>
              ))}
            </ul>
          ) : (
            <>
              {lines.map((line, i) => (
                line.trim() && (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">
                    {line}
                  </p>
                )
              ))}
            </>
          )}
        </div>
      );
    });

    return sections.filter(Boolean);
  }, [content, title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background pt-28 pb-16"
    >
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last Updated: {lastUpdated}
          </p>
        </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none prose-a:text-primary prose-a:underline">
          {formattedSections}
        </div>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-lg font-bold mb-4 text-foreground">Have Questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about this policy, please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Email:</strong> pandiyinnatureinpack@gmail.com
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Phone:</strong> 6383709933
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Address:</strong> 802, VPM House, Mandhaikaliamman Kovil Street, Krishnapuram Road, M. Kallupatti, Madurai District - 625535, Tamil Nadu, India
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(PolicyLayout);
