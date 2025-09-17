import { useState } from 'react';
import './App.css';
import { ImageEditor } from './ImageEditor';

const API_URL = 'http://localhost:3000'; // Change if needed

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [deployId, setDeployId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [currentView, setCurrentView] = useState<'deploy' | 'imageEdit'>('deploy');

  const handleDeploy = async () => {
    setLoading(true);
    setStatus('Uploading...');
    setDeployedUrl('');
    setDeployId('');
    try {
      const res = await fetch(`${API_URL}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      setDeployId(data.id);
      pollStatus(data.id);
    } catch (err) {
      setStatus('Error uploading');
      setLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    let done = false;
    setStatus('Uploading...');
    while (!done) {
      try {
        const res = await fetch(`${API_URL}/status?id=${id}`);
        const data = await res.json();
        if (data.status === 'uploaded') {
          setStatus('Building...');
        } else if (data.status === 'deployed') {
          setStatus('Deployed!');
          setDeployedUrl(`http://${id}.localhost:3001`); // Change domain if needed
          setLoading(false);
          done = true;
        } else {
          setStatus(data.status || 'Processing...');
        }
        await new Promise(res => setTimeout(res, 2000));
      } catch {
        setStatus('Error fetching status');
        setLoading(false);
        done = true;
      }
    }
  };

  if (currentView === 'imageEdit') {
    return <ImageEditor onBack={() => setCurrentView('deploy')} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: 32, 
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1f2937', fontWeight: 700, fontSize: '32px' }}>Base Platform</h1>
          <button
            onClick={() => setCurrentView('imageEdit')}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            🎨 AI Image Editor
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#1f2937', fontWeight: 600, fontSize: '24px' }}>
            Instant App Deployment
          </h2>
          <p style={{ 
            color: '#6b7280', 
            lineHeight: '1.5', 
            fontSize: '16px',
            margin: '0 0 24px 0' 
          }}>
            Deploy your React applications instantly from GitHub. Simply paste your repository URL below 
            and we'll handle the build and deployment process for you. Your app will be live in minutes 
            with its own unique URL.
          </p>
        </div>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repo URL (e.g., https://github.com/username/repo)"
          style={{ 
            width: '100%', 
            padding: '12px 16px', 
            marginBottom: 16, 
            fontSize: 16,
            borderRadius: 6,
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          disabled={loading}
        />
        <button
          onClick={handleDeploy}
          disabled={loading || !repoUrl}
          style={{ 
            padding: '12px 24px', 
            fontSize: 16, 
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500
          }}
        >
          {loading ? status : 'Deploy'}
        </button>
      </div>

      {deployId && (
        <div style={{ 
          marginTop: 24,
          padding: 16,
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ marginBottom: deployedUrl ? 12 : 0, color: '#374151' }}>
            Status: <b>{status}</b>
          </div>
          {deployedUrl && (
            <div style={{ marginTop: 12 }}>
              <a 
                href={deployedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                View deployed app →
              </a>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
