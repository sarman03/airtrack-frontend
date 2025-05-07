import React, { useState } from 'react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How does AirTrack measure air quality?",
      answer: "AirTrack uses advanced sensors and real-time data from multiple sources to provide accurate air quality measurements along your travel route. We combine data from satellite imagery, ground stations, and weather patterns."
    },
    {
      question: "Can I get notifications about air quality changes?",
      answer: "Yes! AirTrack provides real-time notifications about air quality changes in your selected travel routes. You can customize notification thresholds and frequency according to your preferences."
    },
    {
      question: "Is the air quality data accurate for all locations?",
      answer: "Our air quality data is highly accurate for most urban and suburban areas. We maintain a vast network of sensors and partner with local environmental agencies to ensure data reliability."
    },
    {
      question: "How often is the air quality data updated?",
      answer: "AirTrack updates air quality data in real-time, with measurements refreshed every 15 minutes in most locations. This ensures you always have the most current information for your travel planning."
    },
    {
      question: "Can I compare air quality between different routes?",
      answer: "Absolutely! AirTrack allows you to compare air quality indices between different routes and times, helping you choose the healthiest travel options for your journey."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row">
          {/* Left side - FAQs */}
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-blue-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200">
                  <button
                    className="flex justify-between items-center w-full py-4 text-left"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="text-lg font-semibold text-gray-800">
                      {faq.question}
                    </span>
                    <span className={`transform transition-transform duration-200 ${activeIndex === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-200 overflow-hidden ${
                      activeIndex === index ? 'max-h-40 pb-4' : 'max-h-0'
                    }`}
                  >
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Empty for now */}
          <div className="md:w-1/2">
            {/* Content will be added later */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;