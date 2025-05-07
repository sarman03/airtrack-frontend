import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: import('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: import('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: import('leaflet/dist/images/marker-shadow.png').default,
});

const Heatmap = () => {
  const [aqiData, setAqiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400'; // Good
    if (aqi <= 100) return '#ffff00'; // Moderate
    if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return '#ff0000'; // Unhealthy
    if (aqi <= 300) return '#99004c'; // Very Unhealthy
    return '#7e0023'; // Hazardous
  };

  const createCustomIcon = (aqi) => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="
        background-color: ${getAQIColor(aqi)};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      ">${aqi}</div>`,
    });
  };

  useEffect(() => {
    const fetchAQIData = async () => {
      try {
        const response = await fetch('https://api.waqi.info/v2/map/bounds?latlng=8.4,68.7,37.6,97.25&token=c7c704784d74f6a9520499ee5de90feea211e985');
        const data = await response.json();
        
        if (data && data.status === 'ok' && data.data) {
          const processedData = await Promise.all(data.data.map(async (station, index) => {
            // Fetch detailed station data for each location
            try {
              const detailResponse = await fetch(`https://api.waqi.info/feed/@${station.uid}/?token=c7c704784d74f6a9520499ee5de90feea211e985`);
              const detailData = await detailResponse.json();
              
              return {
                id: index,
                lat: station.lat,
                lng: station.lon,
                aqi: station.aqi,
                location: station.station.name,
                pollutants: {
                  pm25: detailData.data?.iaqi?.pm25?.v || 'N/A',
                  pm10: detailData.data?.iaqi?.pm10?.v || 'N/A',
                  no2: detailData.data?.iaqi?.no2?.v || 'N/A',
                },
              };
            } catch (error) {
              console.error(`Error fetching details for station ${station.uid}:`, error);
              return {
                id: index,
                lat: station.lat,
                lng: station.lon,
                aqi: station.aqi,
                location: station.station.name,
                pollutants: {
                  pm25: 'N/A',
                  pm10: 'N/A',
                  no2: 'N/A',
                },
              };
            }
          }));
          setAqiData(processedData);
        } else {
          setError('Invalid data format received from API');
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch AQI data. Please check your API token.');
        setLoading(false);
      }
    };

    fetchAQIData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Real-Time Air Quality Map</h2>

      {loading && <p>Loading AQI data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {aqiData.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lng]}
                  icon={createCustomIcon(station.aqi)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{station.location}</h3>
                      <p className="text-lg">
                        AQI: <span style={{ color: getAQIColor(station.aqi) }}>{station.aqi}</span>
                      </p>
                      <div className="mt-2">
                        <h4 className="font-semibold">Pollutants:</h4>
                        <ul className="text-sm">
                          <li>PM2.5: {station.pollutants.pm25} µg/m³</li>
                          <li>PM10: {station.pollutants.pm10} µg/m³</li>
                          <li>NO₂: {station.pollutants.no2} ppb</li>
                        </ul>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">AQI Legend</h3>
            <div className="grid grid-cols-6 gap-2">
              {[
                { range: '0-50', label: 'Good', color: '#00e400' },
                { range: '51-100', label: 'Moderate', color: '#ffff00' },
                { range: '101-150', label: 'Unhealthy for Sensitive Groups', color: '#ff7e00' },
                { range: '151-200', label: 'Unhealthy', color: '#ff0000' },
                { range: '201-300', label: 'Very Unhealthy', color: '#99004c' },
                { range: '300+', label: 'Hazardous', color: '#7e0023' },
              ].map((item) => (
                <div key={item.range} className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Heatmap;
