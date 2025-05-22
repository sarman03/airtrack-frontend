import React, { useEffect, useState } from 'react';
import useDebounce from '../hooks/useDebounce';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Aqi = () => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const searchCities = async (searchText) => {
    if (searchText.length < 2) return;
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'b922a4c79bmsh5a16723461a1540p1f91cfjsn14befb3e2711',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        'Accept': 'application/json'
      }
    };

    try {
      const response = await fetch(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(searchText)}&limit=5&offset=0&types=CITY`,
        options
      );
      
      if (response.status === 403) {
        console.error('API subscription error. Please check your RapidAPI subscription status.');
        throw new Error('API subscription error');
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch cities');
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data && data.data) {
        setSuggestions(data.data.map(city => ({
          id: city.id,
          name: city.city || city.name,
          country: city.country,
          latitude: city.latitude,
          longitude: city.longitude
        })));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setSuggestions([]);
    }
  };

  // Add new state for chart data
  const [chartData, setChartData] = useState(null);

  // Modify getAirQuality function to prepare chart data
  const getAirQuality = async (lat, lon) => {
    setLoading(true);
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,ozone,sulphur_dioxide,nitrogen_dioxide`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      setAqiData(data.hourly);
      
      // Prepare chart data
      const times = data.hourly.time.slice(0, 24).map(time => {
        const date = new Date(time);
        return date.getHours() + ':00';
      });

      setChartData({
        labels: times,
        datasets: [
          {
            label: 'PM2.5',
            data: data.hourly.pm2_5.slice(0, 24),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'PM10',
            data: data.hourly.pm10.slice(0, 24),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching air quality:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '24-Hour Air Quality Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Concentration (µg/m³)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchCities(debouncedSearch);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleCitySelect = (city) => {
    setSearch(city.name);
    setSuggestions([]);
    getAirQuality(city.latitude, city.longitude);
  };

  const calculateAQICategory = (pollutant, value) => {
    // AQI breakpoints and categories based on WHO guidelines
    const categories = {
      pm2_5: [
        { range: [0, 12], category: 'Good', color: 'bg-green-100 text-green-800' },
        { range: [12.1, 35.4], category: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
        { range: [35.5, 55.4], category: 'Unhealthy for Sensitive Groups', color: 'bg-orange-100 text-orange-800' },
        { range: [55.5, 150.4], category: 'Unhealthy', color: 'bg-red-100 text-red-800' },
        { range: [150.5, 250.4], category: 'Very Unhealthy', color: 'bg-purple-100 text-purple-800' },
        { range: [250.5, Infinity], category: 'Hazardous', color: 'bg-gray-900 text-white' }
      ],
      pm10: [
        { range: [0, 54], category: 'Good', color: 'bg-green-100 text-green-800' },
        { range: [55, 154], category: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
        { range: [155, 254], category: 'Unhealthy for Sensitive Groups', color: 'bg-orange-100 text-orange-800' },
        { range: [255, 354], category: 'Unhealthy', color: 'bg-red-100 text-red-800' },
        { range: [355, 424], category: 'Very Unhealthy', color: 'bg-purple-100 text-purple-800' },
        { range: [425, Infinity], category: 'Hazardous', color: 'bg-gray-900 text-white' }
      ]
    };

    const pollutantCategories = categories[pollutant];
    if (!pollutantCategories) return { category: 'N/A', color: 'bg-gray-100 text-gray-800' };

    for (const cat of pollutantCategories) {
      if (value >= cat.range[0] && value <= cat.range[1]) {
        return cat;
      }
    }
    return { category: 'N/A', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Air Quality Index</h2>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for a city..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {suggestions.map((city) => (
                <div
                  key={city.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCitySelect(city)}
                >
                  {city.name}, {city.country}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading air quality data...</p>
          </div>
        )}

        {/* AQI Data Display */}
        {aqiData && !loading && (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Air Quality Data for {search}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">PM2.5</p>
                  <p className="text-lg">{aqiData.pm2_5[0]} µg/m³</p>
                  <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${calculateAQICategory('pm2_5', aqiData.pm2_5[0]).color}`}>
                    {calculateAQICategory('pm2_5', aqiData.pm2_5[0]).category}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">PM10</p>
                  <p className="text-lg">{aqiData.pm10[0]} µg/m³</p>
                  <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${calculateAQICategory('pm10', aqiData.pm10[0]).color}`}>
                    {calculateAQICategory('pm10', aqiData.pm10[0]).category}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">Carbon Monoxide</p>
                  <p className="text-lg">{aqiData.carbon_monoxide[0]} µg/m³</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">Ozone</p>
                  <p className="text-lg">{aqiData.ozone[0]} µg/m³</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">Sulphur Dioxide</p>
                  <p className="text-lg">{aqiData.sulphur_dioxide[0]} µg/m³</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">Nitrogen Dioxide</p>
                  <p className="text-lg">{aqiData.nitrogen_dioxide[0]} µg/m³</p>
                </div>
              </div>
            </div>
            
            {/* Add Chart Display */}
            {chartData && (
              <div className="bg-white p-6 rounded-lg shadow mt-6">
                <h3 className="text-xl font-semibold mb-4">Air Quality Trend</h3>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Aqi;
