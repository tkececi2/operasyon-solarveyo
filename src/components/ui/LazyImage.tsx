import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  loading?: 'lazy' | 'eager';
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '/placeholder.jpg',
  onLoad,
  onError,
  fallback = '',
  loading = 'lazy'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Direkt yükle - lazy loading sorunları için
    loadImage();
    
    // IntersectionObserver ile lazy loading (fallback)
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '100px', // 100px önceden yüklemeye başla
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    }
  }, [src]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoading(false);
      setError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setImageLoading(false);
      if (fallback) {
        setImageSrc(fallback);
      }
      onError?.();
    };

    img.src = src;
  };

  const handleImageError = () => {
    setError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  if (error && !fallback) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        loading={loading}
      />
    </div>
  );
};

export default LazyImage;