import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Configure the default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const Navigation = () => {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [averageAqi, setAverageAqi] = useState(null);
  const [originalDistance, setOriginalDistance] = useState(null);
  const [shortestRouteAqi, setShortestRouteAqi] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const searchCity = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      if (response.data && response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching city:', error);
      return null;
    }
  };

  const handleStartCityChange = async (value) => {
    setStartCity(value);
    if (value.length >= 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`
        );
        setStartSuggestions(response.data.map(item => ({
          id: item.place_id,
          name: item.display_name,
          country: item.address?.country || ''
        })));
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setStartSuggestions([]);
      }
    } else {
      setStartSuggestions([]);
    }
  };

  const handleEndCityChange = async (value) => {
    setEndCity(value);
    if (value.length >= 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`
        );
        setEndSuggestions(response.data.map(item => ({
          id: item.place_id,
          name: item.display_name,
          country: item.address?.country || ''
        })));
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setEndSuggestions([]);
      }
    } else {
      setEndSuggestions([]);
    }
  };

  const handleCitySelect = (city, isStart) => {
    if (isStart) {
      setStartCity(city.name);
      setStartSuggestions([]);
    } else {
      setEndCity(city.name);
      setEndSuggestions([]);
    }
  };

  const fetchAqi = async (lat, lng) => {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm10,pm2_5,carbon_monoxide,ozone,sulphur_dioxide,nitrogen_dioxide`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch AQI data');
      }
      const data = await response.json();
      const pm25 = data.hourly.pm2_5[0];

      let aqi;
      if (pm25 <= 12) aqi = 1;
      else if (pm25 <= 35.4) aqi = 2;
      else if (pm25 <= 55.4) aqi = 3;
      else if (pm25 <= 150.4) aqi = 4;
      else aqi = 5;

      return aqi;
    } catch (error) {
      console.error('Error fetching AQI:', error);
      return null;
    }
  };

  // Helper function to generate alternative routes by adding via points
  const generateAlternativeRoutes = async (startPoint, endPoint) => {
    try {
      // Format coordinates with fixed decimal places
      const startCoords = `${startPoint.lng.toFixed(6)},${startPoint.lat.toFixed(6)}`;
      const endCoords = `${endPoint.lng.toFixed(6)},${endPoint.lat.toFixed(6)}`;
      
      // Request multiple alternative routes (up to 3)
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords};${endCoords}?overview=full&geometries=geojson&alternatives=3`;
      
      const response = await axios.get(routeUrl);
      
      if (response.data.code !== 'Ok') {
        throw new Error('Failed to fetch routes');
      }
  
      const routes = response.data.routes;
      console.log(`Found ${routes.length} alternative routes`);
      
      // If we got no routes, throw an error
      if (routes.length === 0) {
        throw new Error('No routes found between these points');
      }
  
      return routes;
    } catch (error) {
      console.error('Error generating alternative routes:', error);
      throw error;
    }
  };

  const fetchCleanestRoute = async (startPoint, endPoint) => {
    setCalculating(true);
    setDebugInfo(null);
    const debugData = {
      routeInfo: [],
      samplingPoints: {},
      selectedRouteIndex: null
    };
    
    try {
      // Get direct route and generate alternatives
      const routes = await generateAlternativeRoutes(startPoint, endPoint);
      
      debugData.totalRoutes = routes.length;
      
      console.log(`Number of routes: ${routes.length}`);
      if (routes.length <= 1) {
        console.log("Warning: Only one route found. Consider using cities that are farther apart.");
      }
      
      console.log(`Route distances: ${routes.map(r => (r.distance/1000).toFixed(2))} km`);
      
      let cleanestRoute = null;
      let lowestAvgAqi = Infinity;
      let bestAverageAqi = 0;

      if (routes.length > 0) {
        // Store shortest route and its coordinates
        const shortestRoute = routes[0];
        setOriginalDistance((shortestRoute.distance / 1000).toFixed(2));
        const shortestCoords = shortestRoute.geometry.coordinates.map(point => [point[1], point[0]]);
        
        // Increased sampling points for more accurate AQI
        const shortestSampledCoords = [
          shortestRoute.geometry.coordinates[0],
          shortestRoute.geometry.coordinates[Math.floor(shortestRoute.geometry.coordinates.length * 0.16)],
          shortestRoute.geometry.coordinates[Math.floor(shortestRoute.geometry.coordinates.length * 0.33)],
          shortestRoute.geometry.coordinates[Math.floor(shortestRoute.geometry.coordinates.length * 0.5)],
          shortestRoute.geometry.coordinates[Math.floor(shortestRoute.geometry.coordinates.length * 0.66)],
          shortestRoute.geometry.coordinates[Math.floor(shortestRoute.geometry.coordinates.length * 0.83)],
          shortestRoute.geometry.coordinates[shortestRoute.geometry.coordinates.length - 1]
        ];

        let shortestTotalAqi = 0;
        let shortestValidReadings = 0;
        const shortestAqiPromises = shortestSampledCoords.map(([lng, lat]) => fetchAqi(lat, lng));
        const shortestAqiValues = await Promise.all(shortestAqiPromises);

        debugData.samplingPoints.shortest = shortestSampledCoords.map(([lng, lat], index) => ({
          lat,
          lng,
          aqi: shortestAqiValues[index]
        }));

        shortestAqiValues.forEach(aqi => {
          if (aqi !== null) {
            shortestTotalAqi += aqi;
            shortestValidReadings++;
          }
        });

        if (shortestValidReadings > 0) {
          const calculatedShortestAqi = shortestTotalAqi / shortestValidReadings;
          setShortestRouteAqi(calculatedShortestAqi);
          
          // Initialize the cleanest route with the shortest route
          cleanestRoute = shortestRoute;
          lowestAvgAqi = calculatedShortestAqi;
          bestAverageAqi = calculatedShortestAqi;
          
          debugData.routeInfo.push({
            index: 0,
            distance: (shortestRoute.distance / 1000).toFixed(2),
            aqi: calculatedShortestAqi.toFixed(2),
            isShortestRoute: true,
            isSelected: true
          });
          debugData.selectedRouteIndex = 0;
        }
      }

      // Check all alternative routes
      for (let i = 1; i < routes.length; i++) {
        const route = routes[i];
        const coordinates = route.geometry.coordinates;
        
        // Increased sampling points for alternatives too
        const sampledCoords = [
          coordinates[0],
          coordinates[Math.floor(coordinates.length * 0.16)],
          coordinates[Math.floor(coordinates.length * 0.33)],
          coordinates[Math.floor(coordinates.length * 0.5)],
          coordinates[Math.floor(coordinates.length * 0.66)],
          coordinates[Math.floor(coordinates.length * 0.83)],
          coordinates[coordinates.length - 1]
        ];

        let totalAqi = 0;
        let validReadings = 0;
        const aqiPromises = sampledCoords.map(([lng, lat]) => fetchAqi(lat, lng));
        const aqiValues = await Promise.all(aqiPromises);

        debugData.samplingPoints[`route${i}`] = sampledCoords.map(([lng, lat], index) => ({
          lat,
          lng,
          aqi: aqiValues[index]
        }));

        aqiValues.forEach(aqi => {
          if (aqi !== null) {
            totalAqi += aqi;
            validReadings++;
          }
        });

        if (validReadings > 0) {
          const avgAqi = totalAqi / validReadings;
          // Reduced the threshold to 5% better air quality
          const routeDistance = route.distance / 1000;
          const shortestDistance = parseFloat(originalDistance);
          const distanceIncrease = (routeDistance - shortestDistance) / shortestDistance;
          
          const routeInfo = {
            index: i,
            distance: routeDistance.toFixed(2),
            aqi: avgAqi.toFixed(2),
            distanceIncrease: (distanceIncrease * 100).toFixed(1),
            aqiImprovement: ((lowestAvgAqi - avgAqi) / lowestAvgAqi * 100).toFixed(1),
            isSelected: false
          };
          
          debugData.routeInfo.push(routeInfo);
          
          console.log(`Route ${i}: Distance=${routeDistance.toFixed(2)}km, AQI=${avgAqi.toFixed(2)}, Increase=${(distanceIncrease*100).toFixed(1)}%, AQI Improvement=${((lowestAvgAqi-avgAqi)/lowestAvgAqi*100).toFixed(1)}%`);
          
          // Reduced threshold from 0.9 to 0.95 (5% improvement instead of 10%)
          if (avgAqi < lowestAvgAqi * 0.95 && distanceIncrease <= 0.3) {
            lowestAvgAqi = avgAqi;
            cleanestRoute = route;
            bestAverageAqi = avgAqi;
            
            // Update debug info for selected route
            debugData.routeInfo[debugData.routeInfo.length - 1].isSelected = true;
            if (debugData.selectedRouteIndex !== null) {
              debugData.routeInfo[debugData.selectedRouteIndex].isSelected = false;
            }
            debugData.selectedRouteIndex = debugData.routeInfo.length - 1;
            
            console.log(`New cleanest route selected: Route ${i}`);
          }
        }
      }

      if (cleanestRoute) {
        const coords = cleanestRoute.geometry.coordinates.map(point => [point[1], point[0]]);
        setRouteCoords(coords);
        setAverageAqi(bestAverageAqi);
        setDistance((cleanestRoute.distance / 1000).toFixed(2));
      }
      
      setDebugInfo(debugData);
      
    } catch (error) {
      console.error('Error finding cleanest route:', error);
      alert('Error finding the cleanest route. Please try again.');
      setDebugInfo({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startCoords = await searchCity(startCity);
      const endCoords = await searchCity(endCity);

      if (startCoords && endCoords) {
        setStart(startCoords);
        setEnd(endCoords);
        await fetchCleanestRoute(startCoords, endCoords);
      } else {
        alert('Could not find one or both cities. Please try again.');
      }
    } catch (error) {
      console.error('Error in search:', error);
      setDebugInfo({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const getAqiColor = (aqi) => {
    if (!aqi) return 'text-gray-500';
    if (aqi <= 1.5) return 'text-green-600';
    if (aqi <= 2.5) return 'text-green-500';
    if (aqi <= 3.5) return 'text-yellow-500';
    if (aqi <= 4.5) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Navigation</h2>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b relative z-50">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px] relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start City
                </label>
                <input
                  type="text"
                  value={startCity}
                  onChange={(e) => handleStartCityChange(e.target.value)}
                  placeholder="Enter start city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {startSuggestions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    {startSuggestions.map((city) => (
                      <div
                        key={city.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCitySelect(city, true)}
                      >
                        {city.name}, {city.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-[200px] relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End City
                </label>
                <input
                  type="text"
                  value={endCity}
                  onChange={(e) => handleEndCityChange(e.target.value)}
                  placeholder="Enter end city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {endSuggestions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    {endSuggestions.map((city) => (
                      <div
                        key={city.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCitySelect(city, false)}
                      >
                        {city.name}, {city.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Searching...' : 'Find Route'}
              </button>
            </form>

            {distance && (
              <div className="mt-4 space-y-2">
                <div className="text-gray-700">
                  <p><strong>Cleanest Route:</strong></p>
                  <p>Distance: {distance} km</p>
                  {averageAqi && (
                    <p>Average AQI: <span className={getAqiColor(averageAqi)}>{averageAqi.toFixed(2)}</span></p>
                  )}
                </div>

                {originalDistance !== distance && (
                  <p className="text-sm text-gray-500 italic">
                    The cleanest route is {((distance - originalDistance) / originalDistance * 100).toFixed(1)}% longer 
                    but has {((shortestRouteAqi - averageAqi) / shortestRouteAqi * 100).toFixed(1)}% better air quality
                  </p>
                )}
              </div>
            )}

            {averageAqi && (
              <div className="mt-2 text-gray-700">
                Average Air Quality Index (AQI) along route: <span className={getAqiColor(averageAqi)}>{averageAqi.toFixed(2)}</span>
                <p className="text-xs text-gray-500 mt-1">
                  AQI Scale: 1-2 Good, 2-3 Moderate, 3-4 Unhealthy for Sensitive Groups, 4-5 Unhealthy, 5+ Very Unhealthy
                </p>
              </div>
            )}
          </div>

          <div className="h-[600px] relative">
            {start && end ? (
              <MapContainer
                center={[(start.lat + end.lat) / 2, (start.lng + end.lng) / 2]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[start.lat, start.lng]} icon={defaultIcon} />
                <Marker position={[end.lat, end.lng]} icon={defaultIcon} />
                {routeCoords.length > 0 && (
                  <Polyline positions={routeCoords} color="blue" />
                )}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Select start and end cities to view the map</p>
              </div>
            )}
          </div>

          {debugInfo && (
            <div className="p-4 border-t">
              <details>
                <summary className="font-medium text-blue-600 cursor-pointer">Debug Information</summary>
                <div className="mt-3 bg-gray-50 p-3 rounded-md">
                  {debugInfo.error ? (
                    <div className="text-red-600">
                      <p><strong>Error:</strong> {debugInfo.error}</p>
                    </div>
                  ) : debugInfo.routeInfo && debugInfo.routeInfo.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-700 mb-2">Total routes found: {debugInfo.totalRoutes}</p>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg AQI</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance Increase</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AQI Improvement</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {debugInfo.routeInfo.map((route, index) => (
                              <tr key={index} className={route.isSelected ? "bg-blue-50" : ""}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {index === 0 ? "Route 1 (Shortest)" : `Route ${index + 1}`}
                                  {route.isSelected && index !== 0 && " (Selected)"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{route.distance}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={getAqiColor(parseFloat(route.aqi))}>{route.aqi}</span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {index === 0 ? "0%" : `+${route.distanceIncrease}%`}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {index === 0 ? "0%" : `${route.aqiImprovement}%`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {debugInfo.totalRoutes <= 1 && (
                        <p className="text-sm text-yellow-600 mt-2">
                          Only one route found. Try searching for cities that are farther apart for more alternative routes.
                        </p>
                      )}
                      
                      {debugInfo.totalRoutes > 1 && debugInfo.selectedRouteIndex === 0 && (
                        <p className="text-sm text-yellow-600 mt-2">
                          No alternative route had at least 5% better air quality without being more than 30% longer.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>No route information available</p>
                  )}
                </div>
              </details>
            </div>
          )}

          {(calculating || loading) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-700">
                  {calculating ? 'Finding the cleanest route...' : 'Searching cities...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;