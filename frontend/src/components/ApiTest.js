import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ApiTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const results = {};

    // Test Blog API
    try {
      const blogResponse = await api.get('/blog/');
      results.blog = { success: true, data: blogResponse.data };
    } catch (error) {
      results.blog = { success: false, error: error.message };
    }

    // Test Projects API
    try {
      const projectsResponse = await api.get('/projects/');
      results.projects = { success: true, data: projectsResponse.data };
    } catch (error) {
      results.projects = { success: false, error: error.message };
    }

    // Test Services API
    try {
      const servicesResponse = await api.get('/services/');
      results.services = { success: true, data: servicesResponse.data };
    } catch (error) {
      results.services = { success: false, error: error.message };
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>
      {loading && <p>Testing API endpoints...</p>}
      
      <div className="space-y-4">
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div key={endpoint} className="p-4 border rounded">
            <h3 className="font-semibold capitalize">{endpoint} API</h3>
            {result.success ? (
              <div className="text-green-600">
                ✅ Success - {result.data?.count || 0} items found
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        onClick={testEndpoints}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Retest APIs
      </button>
    </div>
  );
};

export default ApiTest;
