import React from 'react';

const Hero = () => {
  return (
    <div className="relative h-[70vh]">
      {/* Background image with opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/hero-pic.png")',
          opacity: 0.6
        }}
      ></div>
      
      {/* Content container with full opacity */}
      <div className="relative pl-30 h-full container mx-auto px-6 flex items-center z-10">
        {/* Left side content */}
        <div className="flex flex-col items-start max-w-xl">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 leading-tight mb-6">
            Breathe Better, Travel Smarter
          </h1>
          <p className="text-xl text-blue-800 mb-4">
            Discover the cleanest, healthiest paths with real-time air quality insights.
          </p>
          <p className="text-lg text-blue-700 font-semibold mb-8">
            Your journey to cleaner air starts here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;