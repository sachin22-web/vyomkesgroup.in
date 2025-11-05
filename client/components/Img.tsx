import React from "react";

const DEFAULT_PLACEHOLDER = "/images/placeholder.svg";

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallbackSrc?: string; // Optional custom fallback
};

export function Img({ src, fallbackSrc = DEFAULT_PLACEHOLDER, onError, ...rest }: ImgProps) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [hasFailed, setHasFailed] = React.useState(false);

  // Reset state if the original src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasFailed(false);
  }, [src]);

  const handleError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasFailed) {
      setCurrentSrc(fallbackSrc);
      setHasFailed(true);
    }
    onError?.(e);
  }, [fallbackSrc, hasFailed, onError]);

  return (
    <img
      {...rest}
      src={currentSrc}
      onError={handleError}
    />
  );
}
