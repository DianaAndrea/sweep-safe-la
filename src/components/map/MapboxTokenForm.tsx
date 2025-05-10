
import React from 'react';

interface MapboxTokenFormProps {
  onSubmit: (token: string) => void;
}

const MapboxTokenForm: React.FC<MapboxTokenFormProps> = ({ onSubmit }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('mapboxToken') as string;
    if (token) {
      onSubmit(token);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div className="bg-white p-5 rounded-lg shadow-md max-w-md w-full">
        <h3 className="text-lg font-medium mb-3">Enter Mapbox Token</h3>
        <p className="text-sm text-gray-600 mb-4">
          For this demo, please enter your Mapbox public token. 
          <a 
            href="https://account.mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sweepsafe-blue hover:underline ml-1"
          >
            Get one here
          </a>
        </p>
        <form onSubmit={handleSubmit}>
          <input 
            type="text"
            name="mapboxToken"
            placeholder="pk.eyJ1IjoieW91ci11c2VyIiwiYSI..."
            className="w-full p-2 border rounded mb-3"
          />
          <button 
            type="submit"
            className="w-full bg-sweepsafe-blue text-white py-2 rounded hover:bg-sweepsafe-blue/90"
          >
            Load Map
          </button>
        </form>
      </div>
    </div>
  );
};

export default MapboxTokenForm;
