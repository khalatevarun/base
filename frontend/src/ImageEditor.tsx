import { useState } from 'react';

const API_URL = 'http://localhost:3000';

interface ImageEditProps {
  onBack: () => void;
}

export function ImageEditor({ onBack }: ImageEditProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'edit'>('analyze');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await fetch(`${API_URL}/image/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to analyze image' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile || !instruction.trim()) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('instruction', instruction);

    try {
      const res = await fetch(`${API_URL}/image/edit`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to process edit request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: 700 }}>
            AI Image Editor with Gemini
          </h1>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          />
        </div>

        {previewUrl && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('analyze')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeTab === 'analyze' ? '#3b82f6' : '#e5e7eb',
                color: activeTab === 'analyze' ? 'white' : '#374151'
              }}
            >
              Analyze Image
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeTab === 'edit' ? '#3b82f6' : '#e5e7eb',
                color: activeTab === 'edit' ? 'white' : '#374151'
              }}
            >
              Edit Instructions
            </button>
          </div>

          {activeTab === 'analyze' && (
            <div>
              <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                Analyze your image using Google's Gemini AI to understand its content and composition.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                style={{
                  background: !selectedFile || loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: !selectedFile || loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {loading ? 'Analyzing...' : 'Analyze Image'}
              </button>
            </div>
          )}

          {activeTab === 'edit' && (
            <div>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe what you want to edit in the image (e.g., 'Make the sky more dramatic', 'Add warm lighting', 'Remove the background')"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleEdit}
                disabled={!selectedFile || !instruction.trim() || loading}
                style={{
                  background: !selectedFile || !instruction.trim() || loading ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: !selectedFile || !instruction.trim() || loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {loading ? 'Processing...' : 'Get Edit Instructions'}
              </button>
            </div>
          )}
        </div>

        {result && (
          <div style={{
            background: result.error ? '#fef2f2' : '#f0f9ff',
            border: `1px solid ${result.error ? '#fecaca' : '#bae6fd'}`,
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
          }}>
            {result.error ? (
              <div>
                <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Error</h3>
                <p style={{ color: '#dc2626', margin: 0 }}>{result.error}</p>
              </div>
            ) : (
              <div>
                <h3 style={{ color: '#0369a1', margin: '0 0 12px 0' }}>
                  {activeTab === 'analyze' ? 'Image Analysis' : 'Edit Instructions'}
                </h3>
                {result.analysis && (
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {result.analysis}
                  </div>
                )}
                {result.description && (
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    color: '#374151',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {result.description}
                  </div>
                )}
                {result.filename && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                    File: {result.filename} ({(result.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}