/**
 * LocationPicker component for Admin Panel using plain Leaflet
 */
const LocationPicker = ({ lat, lng, onChange }) => {
    const mapRef = React.useRef(null);
    const mapInstance = React.useRef(null);
    const markerInstance = React.useRef(null);
    const [address, setAddress] = React.useState('');
    const [loadingAddress, setLoadingAddress] = React.useState(false);

    // Default to Lules if no coordinates
    const defaultLat = -26.9248;
    const defaultLng = -65.3421;
    const centerLat = lat || defaultLat;
    const centerLng = lng || defaultLng;

    React.useEffect(() => {
        if (!mapRef.current) return;

        // Initialize Map
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([centerLat, centerLng], lat ? 16 : 12);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            if (lat && lng) {
                markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current);
            }

            mapInstance.current.on('click', (e) => {
                const newLat = e.latlng.lat;
                const newLng = e.latlng.lng;
                
                if (markerInstance.current) {
                    markerInstance.current.setLatLng([newLat, newLng]);
                } else {
                    markerInstance.current = L.marker([newLat, newLng]).addTo(mapInstance.current);
                }
                
                if (onChange) {
                    onChange(newLat, newLng);
                }
            });
        }
    }, []);

    // Update marker when props change from outside
    React.useEffect(() => {
        if (mapInstance.current && lat && lng) {
            if (markerInstance.current) {
                markerInstance.current.setLatLng([lat, lng]);
            } else {
                markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current);
            }
            mapInstance.current.flyTo([lat, lng], 16);
        }
    }, [lat, lng]);

    // Reverse geocoding
    React.useEffect(() => {
        if (!lat || !lng) {
            setAddress('');
            return;
        }
        
        const fetchAddress = async () => {
            setLoadingAddress(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                if (data && data.display_name) {
                    const parts = data.display_name.split(',').slice(0, 3).join(', ');
                    setAddress(parts);
                }
            } catch (e) {
                setAddress('Dirección no disponible');
            } finally {
                setLoadingAddress(false);
            }
        };

        const timeoutId = setTimeout(fetchAddress, 1000);
        return () => clearTimeout(timeoutId);
    }, [lat, lng]);

    return (
        <div className="rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm flex flex-col">
            <div ref={mapRef} style={{ height: '250px', width: '100%', minHeight: '250px' }}></div>
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Haz clic en el mapa para ubicar el comercio</p>
                {lat && lng && (
                    <div className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded inline-block">
                        {loadingAddress ? 'Buscando dirección...' : (address || `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`)}
                    </div>
                )}
            </div>
        </div>
    );
};
