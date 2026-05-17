import React, { useState } from 'react';

const HomeImage = ({ src, alt, className = '', loading = 'lazy' }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`home-real-image ${className} ${hasError ? 'home-real-image-fallback' : ''}`}>
      {hasError ? (
        <span>Imagem indisponivel</span>
      ) : (
        <img src={src} alt={alt} loading={loading} onError={() => setHasError(true)} />
      )}
    </div>
  );
};

export default HomeImage;
