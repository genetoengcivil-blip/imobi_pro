import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform transition-transform group-hover:scale-110 duration-300"
      >
        {/* Lado Esquerdo - Azul mais escuro para dar profundidade */}
        <path
          d="M50 15L15 85H40L50 65L50 15Z"
          fill="#010b80"
        />
        {/* Lado Direito - O seu novo Azul Vibrante */}
        <path
          d="M50 15L85 85H60L50 65L50 15Z"
          fill="#0217ff"
        />
      </svg>
    </div>
  );
};