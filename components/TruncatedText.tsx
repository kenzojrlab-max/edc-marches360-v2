import React, { useRef, useState, useEffect } from 'react';

interface Props {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'h3' | 'h2' | 'div';
}

/**
 * Composant qui affiche un tooltip uniquement si le texte est tronqué
 */
export const TruncatedText: React.FC<Props> = ({ text, className = '', as: Component = 'span' }) => {
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (ref.current) {
        // Vérifie si le texte dépasse le conteneur (scrollWidth > clientWidth pour horizontal)
        // ou si la hauteur dépasse (scrollHeight > clientHeight pour line-clamp)
        const isHorizontallyTruncated = ref.current.scrollWidth > ref.current.clientWidth;
        const isVerticallyTruncated = ref.current.scrollHeight > ref.current.clientHeight;
        setIsTruncated(isHorizontallyTruncated || isVerticallyTruncated);
      }
    };

    checkTruncation();

    // Revérifier lors du redimensionnement
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]);

  return (
    <Component
      ref={ref as any}
      className={className}
      title={isTruncated ? text : undefined}
    >
      {text}
    </Component>
  );
};
