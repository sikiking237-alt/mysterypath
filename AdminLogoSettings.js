import React, { useState } from 'react';
import { useUpdateLogoMutation, useGetLogoQuery } from './coursesApi';

const AdminLogoSettings = () => {
  const { data: logoData, isLoading: isLogoLoading } = useGetLogoQuery();
  const [updateLogo, { isLoading: isUpdating }] = useUpdateLogoMutation();
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'File is too large. Max 2MB.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await updateLogo(formData).unwrap();
      setMessage({ text: 'Logo updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.data?.error || 'Failed to update logo', type: 'error' });
    }
  };

  return (
    <div className="admin-settings-card" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Website Logo Settings</h3>
      <p className="text-muted">Upload a new logo to change the appearance across the site.</p>
      
      <div style={{ margin: '20px 0' }}>
        <label>Current Logo Preview:</label>
        <div style={{ background: '#f8f9fa', padding: '10px', marginTop: '10px', display: 'inline-block' }}>
          {isLogoLoading ? (
            <span>Loading...</span>
          ) : (
            <img src={logoData?.logo_url} alt="Site Logo" style={{ maxHeight: '50px' }} />
          )}
        </div>
      </div>

      <div className="upload-section">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          disabled={isUpdating}
        />
        {isUpdating && <p>Uploading...</p>}
      </div>

      {message.text && (
        <p style={{ color: message.type === 'success' ? 'green' : 'red', marginTop: '10px' }}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default AdminLogoSettings;