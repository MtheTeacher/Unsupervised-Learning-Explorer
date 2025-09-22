import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="relative w-full p-8 flex flex-col justify-center items-center text-center border-b border-white/20">
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          Unsupervised Learning Explorer
        </h1>
        <p className="mt-2 text-base text-gray-300">
          An interactive journey into clustering, embeddings, and representation learning.
        </p>
      </div>
    </header>
  );
};
