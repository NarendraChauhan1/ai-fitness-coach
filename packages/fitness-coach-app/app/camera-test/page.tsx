'use client';

import { CameraCapture } from '@/components/camera/camera-capture';

export default function CameraTestPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-4">
        <h1 className="text-white text-2xl mb-4">Camera Test Page</h1>
        <p className="text-gray-400 mb-8">This page tests the camera component in isolation</p>
      </div>
      
      <div className="w-full h-[600px]">
        <CameraCapture 
          onReady={(video) => console.log('[Test] Camera ready:', video)}
          onError={(error) => console.error('[Test] Camera error:', error)}
          className="w-full h-full"
        />
      </div>
      
      <div className="p-4 text-white">
        <h2 className="text-xl mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>You should see a permission screen with &quot;Enable Camera&quot; button</li>
          <li>Click the button</li>
          <li>Allow camera access when prompted</li>
          <li>Camera should start</li>
          <li>Check browser console for logs</li>
        </ol>
      </div>
    </div>
  );
}
