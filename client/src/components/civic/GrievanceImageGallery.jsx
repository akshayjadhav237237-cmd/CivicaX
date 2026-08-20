import { useState, useEffect } from 'react';

export function GrievanceImageGallery({ images = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (!images || images.length === 0) return null;

  // Handle keyboard navigation for the lightbox
  useEffect(() => {
    if (selectedIdx === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedIdx(null);
      if (e.key === 'ArrowRight') {
        setSelectedIdx((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, images.length]);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Scrollable Thumbnail Strip */}
      <div className="flex gap-3 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-300">
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200"
          >
            <img
              src={img}
              alt={`Grievance attachment ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // simple fallback in case image fails to load
                e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {selectedIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center select-none"
          onClick={() => setSelectedIdx(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedIdx(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 text-3xl font-light p-2 transition-colors focus:outline-none"
            aria-label="Close Lightbox"
          >
            &times;
          </button>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-4 text-white hover:text-slate-300 text-4xl p-4 transition-colors focus:outline-none"
                aria-label="Previous Image"
              >
                &#8249;
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-4 text-white hover:text-slate-300 text-4xl p-4 transition-colors focus:outline-none"
                aria-label="Next Image"
              >
                &#8250;
              </button>
            </>
          )}

          {/* Centered Image Container */}
          <div
            className="max-w-[85%] max-h-[80%] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIdx]}
              alt={`Grievance attachment large ${selectedIdx + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {/* Info and Counter */}
            <div className="text-white text-sm bg-black/60 px-4 py-1.5 rounded-full">
              Image {selectedIdx + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GrievanceImageGallery;
