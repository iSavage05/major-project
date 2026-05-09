import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { ArrowLeft, Smartphone, Camera, Box, Info, Upload, Check } from 'lucide-react';

const ARViewer = () => {
  const navigate = useNavigate();
  const [isARSupported, setIsARSupported] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const checkARSupport = () => {
    // Check if WebXR is supported
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    } else {
      setIsARSupported(false);
    }
  };

  const activateCamera = () => {
    setCameraActive(true);
    // In a real implementation, this would access the device camera
    // and overlay 3D models using WebXR or AR.js
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AR Visualization</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AR Viewer Placeholder */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Smartphone className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                AR Camera View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 dark:bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                {cameraActive ? (
                  <div className="text-white text-center">
                    <Camera className="w-20 h-20 mx-auto mb-4 text-primary-400" />
                    <p className="text-xl font-semibold">Camera Active</p>
                    <p className="text-sm text-gray-400 mt-2">AR overlay would appear here</p>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-600 text-center">
                    <Camera className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Camera Inactive</p>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Click below to activate</p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <Button
                  onClick={() => {
                    checkARSupport();
                    activateCamera();
                  }}
                  className="w-full"
                  disabled={cameraActive}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {cameraActive ? 'Camera Active' : 'Activate Camera'}
                </Button>
                {isARSupported && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    WebXR AR is supported on this device
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AR Controls */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Box className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                AR Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-primary-900 dark:text-primary-100">AR Visualization</h4>
                    <p className="text-sm text-primary-800 dark:text-primary-200 mt-1">
                      This module allows you to visualize interior designs in your physical space using augmented reality. Upload a 3D model or select from your generated designs to see how they look in your actual room.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Available Models</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow cursor-pointer">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Living Room Design</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">3D model with furniture</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow cursor-pointer">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Bedroom Design</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">3D model with bed and storage</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow cursor-pointer">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Kitchen Design</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">3D model with cabinets</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">AR Features</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" /> Real-time 3D model placement</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" /> Scale and position adjustment</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" /> Material and color customization</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" /> Screenshot and sharing</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" /> Measurement tools</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload 3D Model (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Notes */}
        <Card className="mt-6 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              Implementation Notes
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">Current Status:</strong> This is a placeholder for the AR visualization module.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Recommended Technologies:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>WebXR API for immersive AR experiences</li>
                <li>AR.js for marker-based AR</li>
                <li>Three.js or React Three Fiber for 3D rendering</li>
                <li>Model-Viewer for displaying 3D models</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Features to Implement:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Camera access and permission handling</li>
                <li>3D model loading from generated designs</li>
                <li>Plane detection for surface placement</li>
                <li>Gesture controls for model manipulation</li>
                <li>Lighting estimation for realistic rendering</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ARViewer;
