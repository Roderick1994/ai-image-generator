import React from 'react';
import { Cloud, HardDrive, CheckCircle, AlertCircle, Settings, ExternalLink } from 'lucide-react';

interface StorageStatusProps {
  status: {
    type: 'cloud' | 'local';
    configured: boolean;
    connected: boolean;
    message: string;
  };
}

export function StorageStatus({ status }: StorageStatusProps) {
  const getStatusColor = () => {
    if (status.type === 'cloud' && status.connected) {
      return 'border-blue-200 bg-blue-50';
    }
    if (status.configured && !status.connected) {
      return 'border-yellow-200 bg-yellow-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  const getStatusIcon = () => {
    if (status.type === 'cloud') {
      return status.connected ? (
        <CheckCircle className="h-5 w-5 text-blue-600" />
      ) : (
        <AlertCircle className="h-5 w-5 text-yellow-600" />
      );
    }
    return <HardDrive className="h-5 w-5 text-gray-600" />;
  };

  const getStatusTitle = () => {
    if (status.type === 'cloud') {
      return status.connected ? 'Cloud Storage Active' : 'Cloud Storage Error';
    }
    return 'Local Storage Active';
  };

  const getStatusDescription = () => {
    if (status.type === 'cloud' && status.connected) {
      return 'Your images are being saved to Supabase cloud storage and will persist across devices.';
    }
    if (status.configured && !status.connected) {
      return 'Cloud storage is configured but connection failed. Using local storage as fallback.';
    }
    return 'Images are saved locally in your browser. They will be lost if you clear browser data.';
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start space-x-3">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {getStatusTitle()}
            </h4>
            {status.type === 'cloud' ? (
              <Cloud className="h-4 w-4 text-blue-500" />
            ) : (
              <HardDrive className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusDescription()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Status: {status.message}
          </p>
          
          {!status.configured && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Want to use cloud storage?
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Configure Supabase to save your images in the cloud and access them from any device.
              </p>
              <div className="mt-2">
                <a
                  href="/SUPABASE_SETUP_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Setup Guide
                </a>
              </div>
            </div>
          )}
          
          {status.configured && !status.connected && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">
                  Connection Issue
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Check your Supabase configuration and network connection. Using local storage as backup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}