'use client';

import { useEffect, useState } from 'react';

interface DiagnosticInfo {
  isSecureContext: boolean;
  hasNavigator: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  protocol: string;
  userAgent: string;
}

export function CameraDiagnostics() {
  const [info, setInfo] = useState<DiagnosticInfo | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInfo({
        isSecureContext: window.isSecureContext || false,
        hasNavigator: typeof navigator !== 'undefined',
        hasMediaDevices: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
        hasGetUserMedia: 
          typeof navigator !== 'undefined' && 
          'mediaDevices' in navigator && 
          typeof navigator.mediaDevices.getUserMedia === 'function',
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
      });
    }
  }, []);

  if (!info) {
    return <div className="p-4 bg-gray-900 text-white">Loading diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white text-xs font-mono space-y-2">
      <h3 className="font-bold text-sm mb-2">Camera API Diagnostics</h3>
      <div>✓ Secure Context: {info.isSecureContext ? '✅ Yes' : '❌ No'}</div>
      <div>✓ Navigator: {info.hasNavigator ? '✅ Yes' : '❌ No'}</div>
      <div>✓ MediaDevices: {info.hasMediaDevices ? '✅ Yes' : '❌ No'}</div>
      <div>✓ getUserMedia: {info.hasGetUserMedia ? '✅ Yes' : '❌ No'}</div>
      <div>✓ Protocol: {info.protocol}</div>
      <div className="text-xs text-gray-400 break-words">UA: {info.userAgent.substring(0, 50)}...</div>
      
      {!info.isSecureContext && (
        <div className="mt-4 p-2 bg-red-900 border border-red-600 rounded">
          <p className="font-bold">⚠️ Insecure Context</p>
          <p className="text-xs">Camera requires HTTPS or localhost</p>
        </div>
      )}
    </div>
  );
}
