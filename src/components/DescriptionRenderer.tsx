import DOMPurify from 'dompurify';

interface DescriptionRendererProps {
  content: string;
  className?: string;
}

export const DescriptionRenderer = ({ 
  content, 
  className = '' 
}: DescriptionRendererProps) => {
  if (!content) {
    return <div className={className}>No description available</div>;
  }

  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div',
      'hr', 'a', 'img'
    ],
    ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel', 'src', 'alt'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div 
      className={`product-description max-w-3xl mx-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default DescriptionRenderer;
