import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const Comparison = () => {
  const [city, setCity] = useState('');
  const [year1, setYear1] = useState('');
  const [year2, setYear2] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debouncedCity = useDebounce(city, 500);

  useEffect(() => {
    const searchCity = async () => {
      if (debouncedCity.length >= 2) {
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedCity)}&format=json&limit=5`
          );
          setCitySuggestions(response.data.map(item => ({
            id: item.place_id,
            name: item.display_name,
            country: item.address?.country || ''
          })));
        } catch (error) {
          console.error('Error fetching city suggestions:', error);
          setCitySuggestions([]);
        }
      } else {
        setCitySuggestions([]);
      }
    };

    searchCity();
  }, [debouncedCity]);

  const handleCityChange = (value) => {
    setCity(value);
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity.name);
    setCitySuggestions([]);
  };

  const fetchAqiData = async (lat, lng, year) => {
    try {
      // Check if year is within valid range (2022 onwards)
      const currentYear = new Date().getFullYear();
      if (year < 2022 || year > currentYear) {
        throw new Error(`Data only available from 2022 to ${currentYear}`);
      }

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm10,pm2_5,carbon_monoxide,ozone,sulphur_dioxide,nitrogen_dioxide&start_date=${startDate}&end_date=${endDate}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.reason || 'Failed to fetch AQI data');
      }
      
      const data = await response.json();
      
      // Calculate average PM2.5 for the year
      const pm25Values = data.hourly.pm2_5.filter(val => val !== null);
      if (pm25Values.length === 0) {
        throw new Error('No PM2.5 data available for this location and time period');
      }
      
      const averagePM25 = pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length;
      
      // Convert to AQI scale
      let aqi;
      if (averagePM25 <= 12) aqi = { value: 1, category: 'Good' };
      else if (averagePM25 <= 35.4) aqi = { value: 2, category: 'Moderate' };
      else if (averagePM25 <= 55.4) aqi = { value: 3, category: 'Unhealthy for Sensitive Groups' };
      else if (averagePM25 <= 150.4) aqi = { value: 4, category: 'Unhealthy' };
      else aqi = { value: 5, category: 'Hazardous' };

      return {
        year,
        averagePM25: averagePM25.toFixed(2),
        aqi: aqi.value,
        category: aqi.category
      };
    } catch (error) {
      throw new Error(`Error for year ${year}: ${error.message}`);
    }
  };

  const handleCompare = async () => {
    if (!city || !year1 || !year2) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Get city coordinates
      const cityResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      );

      if (cityResponse.data.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon: lng } = cityResponse.data[0];
      
      // Fetch AQI data for both years
      const [data1, data2] = await Promise.all([
        fetchAqiData(lat, lng, year1),
        fetchAqiData(lat, lng, year2)
      ]);

      setComparisonData({ data1, data2 });
    } catch (error) {
      setError(error.message || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 1) return '#00e400';
    if (aqi <= 2) return '#ffff00';
    if (aqi <= 3) return '#ff7e00';
    if (aqi <= 4) return '#ff0000';
    return '#7e0023';
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">AQI Year Comparison</h2>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">Note: Air quality data is only available from 2022 onwards.</p>
      </div>

      <div className="flex flex-col gap-4 max-w-md mb-6">
        <div className="relative w-full">
          <input
            type="text"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="Enter city name"
            className="w-full p-2 border rounded"
          />
          {citySuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border rounded-b mt-1 max-h-60 overflow-auto">
              {citySuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleCitySelect(suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            value={year1}
            onChange={(e) => setYear1(e.target.value)}
            placeholder="First year"
            min="2022"
            max={new Date().getFullYear()}
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={year2}
            onChange={(e) => setYear2(e.target.value)}
            placeholder="Second year"
            min="2022"
            max={new Date().getFullYear()}
            className="p-2 border rounded"
          />
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Comparing...' : 'Compare'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {comparisonData && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart Visualization */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Line
              data={{
                labels: ['PM2.5 Level'],
                datasets: [
                  {
                    label: `${year1}`,
                    data: [parseFloat(comparisonData.data1.averagePM25)],
                    backgroundColor: getAQIColor(comparisonData.data1.aqi),
                    borderColor: getAQIColor(comparisonData.data1.aqi),
                    borderWidth: 2
                  },
                  {
                    label: `${year2}`,
                    data: [parseFloat(comparisonData.data2.averagePM25)],
                    backgroundColor: getAQIColor(comparisonData.data2.aqi),
                    borderColor: getAQIColor(comparisonData.data2.aqi),
                    borderWidth: 2
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'PM2.5 Level Comparison'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(
                      parseFloat(comparisonData.data1.averagePM25),
                      parseFloat(comparisonData.data2.averagePM25)
                    ) * 0.95,
                    suggestedMax: Math.max(
                      parseFloat(comparisonData.data1.averagePM25),
                      parseFloat(comparisonData.data2.averagePM25)
                    ) * 1.05,
                    title: {
                      display: true,
                      text: 'PM2.5 Concentration (µg/m³)'
                    }
                  }
                }
              }}
            />
          </div>

          {/* Existing Comparison Results */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Comparison Results for {city}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded ${getAQIColor(comparisonData.data1.aqi).replace('#', 'bg-')}`}>
                <h4 className="font-semibold">{year1}</h4>
                <p>Average PM2.5: {comparisonData.data1.averagePM25} µg/m³</p>
                <p>Category: {comparisonData.data1.category}</p>
              </div>
              <div className={`p-4 rounded ${getAQIColor(comparisonData.data2.aqi).replace('#', 'bg-')}`}>
                <h4 className="font-semibold">{year2}</h4>
                <p>Average PM2.5: {comparisonData.data2.averagePM25} µg/m³</p>
                <p>Category: {comparisonData.data2.category}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparison;