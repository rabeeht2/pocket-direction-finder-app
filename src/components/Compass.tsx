import React, { useState, useEffect } from 'react';
import { Crosshair, MapPin } from 'lucide-react';

interface CompassProps {
  heading?: number;
}

const Compass: React.FC<CompassProps> = ({ heading = 0 }) => {
  const [currentHeading, setCurrentHeading] = useState(heading);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request device orientation and location permissions
  useEffect(() => {
    const requestPermissions = async () => {
      // Request location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.log('Location access denied:', error);
          }
        );
      }

      // Request device orientation for iOS
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setPermissionGranted(true);
          }
        } catch (error) {
          console.log('Device orientation permission denied:', error);
        }
      } else {
        setPermissionGranted(true);
      }
    };

    requestPermissions();
  }, []);

  // Listen for device orientation changes
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // Convert to 0-360 degrees and adjust for magnetic declination
        let newHeading = 360 - event.alpha;
        if (newHeading >= 360) newHeading -= 360;
        if (newHeading < 0) newHeading += 360;
        setCurrentHeading(newHeading);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [permissionGranted]);

  // Generate degree markings
  const generateMarkings = () => {
    const markings = [];
    for (let i = 0; i < 360; i += 10) {
      const isMainDirection = i % 90 === 0;
      const isMinorDirection = i % 30 === 0;
      const rotation = i;
      const length = isMainDirection ? 20 : isMinorDirection ? 15 : 10;
      
      markings.push(
        <div
          key={i}
          className="absolute w-0.5 bg-compass-accent origin-bottom"
          style={{
            height: `${length}px`,
            transform: `rotate(${rotation}deg) translateX(-50%)`,
            left: '50%',
            top: '20px',
          }}
        />
      );
    }
    return markings;
  };

  // Generate cardinal direction labels
  const directions = [
    { label: 'N', angle: 0, color: 'text-compass-north' },
    { label: 'E', angle: 90, color: 'text-compass-text' },
    { label: 'S', angle: 180, color: 'text-compass-text' },
    { label: 'W', angle: 270, color: 'text-compass-text' },
  ];

  const getDirectionName = (heading: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-compass-bg p-4">
      {/* Main compass container */}
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        {/* Outer ring */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-compass-ring shadow-2xl"
          style={{ background: 'var(--gradient-compass)' }}
        >
          {/* Degree markings */}
          <div className="absolute inset-0 rounded-full">
            {generateMarkings()}
          </div>

          {/* Cardinal directions */}
          {directions.map(({ label, angle, color }) => (
            <div
              key={label}
              className={`absolute text-2xl font-bold ${color}`}
              style={{
                transform: `rotate(${angle}deg) translateY(-140px) rotate(-${angle}deg)`,
                left: '50%',
                top: '50%',
                marginLeft: '-0.5rem',
                marginTop: '-0.5rem',
              }}
            >
              {label}
            </div>
          ))}

          {/* Compass needle */}
          <div 
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${currentHeading}deg)` }}
          >
            {/* North pointer (red) */}
            <div 
              className="absolute w-1 bg-compass-north origin-bottom shadow-lg"
              style={{
                height: '120px',
                left: '50%',
                top: '50%',
                marginLeft: '-2px',
                marginTop: '-120px',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
            {/* South pointer (white) */}
            <div 
              className="absolute w-1 bg-compass-needle origin-top shadow-lg"
              style={{
                height: '80px',
                left: '50%',
                top: '50%',
                marginLeft: '-2px',
                clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
              }}
            />
          </div>

          {/* Center dot */}
          <div className="absolute w-4 h-4 bg-compass-center rounded-full border-2 border-compass-needle shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-1 bg-compass-needle rounded-full"></div>
          </div>
        </div>

        {/* Crosshair indicator at top */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <Crosshair className="w-6 h-6 text-compass-north" />
        </div>
      </div>

      {/* Digital heading display */}
      <div className="mt-8 text-center space-y-4">
        <div className="bg-compass-center rounded-lg p-4 shadow-lg border border-compass-ring">
          <div className="text-4xl font-mono font-bold text-compass-text">
            {Math.round(currentHeading)}°
          </div>
          <div className="text-lg text-compass-accent font-medium">
            {getDirectionName(currentHeading)}
          </div>
        </div>

        {/* Location display */}
        {location && (
          <div className="bg-compass-center rounded-lg p-3 shadow-lg border border-compass-ring flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-compass-north" />
            <div className="text-sm text-compass-accent font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        )}

        {/* Permission prompt */}
        {!permissionGranted && (
          <div className="text-center text-compass-accent text-sm">
            Tap to enable device orientation
          </div>
        )}
      </div>
    </div>
  );
};

export default Compass;