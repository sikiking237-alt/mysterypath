// frontend/src/components/Admin/AdminInviteForm.jsx
import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiCall, apiEndpoints } from '../config/apiConfig';

const AdminInviteForm = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('instructor');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // ✅ Use the correct endpoint from apiConfig
      const response = await apiCall(apiEndpoints.admin.invite, {
        method: 'POST',
        body: { email, role, name }
      });

      if (response.error) {
        setStatus({
          type: 'error',
          message: response.error
        });
      } else {
        setStatus({
          type: 'success',
          message: response.email_sent 
            ? `✅ Invitation sent to ${email}!` 
            : `⚠️ Invitation created, but email was not sent. ${response.email_error || ''}`.trim()
        });
        setEmail('');
        setName('');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component (same as before)
};

export default AdminInviteForm;
