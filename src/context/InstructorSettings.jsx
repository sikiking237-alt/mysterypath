import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { apiCall } from '../../config/apiConfig'; // Assuming apiConfig.js is in src/config

// Import tab components
import ProfileTab from './Tabs/ProfileTab';
import SecurityTab from './Tabs/SecurityTab';
import PreferencesTab from './Tabs/PreferencesTab';
import TeachingTab from './Tabs/TeachingTab';
import BillingTab from './Tabs/BillingTab';

// A simple spinner component for loading states
const Spinner = () => <div className="spinner"></div>;

const InstructorSettings = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [initialSettings, setInitialSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const TABS = useMemo(() => ({
    profile: { label: t.profileTab, Component: ProfileTab },
    preferences: { label: t.preferencesTab, Component: PreferencesTab },
    teaching: { label: t.teachingTab, Component: TeachingTab },
    security: { label: t.securityTab, Component: SecurityTab },
    billing: { label: t.billingTab, Component: BillingTab },
  }), [t]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall('instructor.getSettings'); // Using centralized API endpoint
      setSettings(response.data);
      setInitialSettings(response.data);
    } catch (err) {
      setError(err.message || t.error);
    } finally {
      setIsLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, language]); // Refetch if language changes to get any language-specific data

  const handleSettingsChange = useCallback((tab, field, value) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await apiCall('instructor.saveSettings', { body: settings });
      setSettings(response.data);
      setInitialSettings(response.data);
      // Optionally show a success toast/notification here
      console.log(t.success);
    } catch (err) {
      setError(err.message || t.error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  if (isLoading) {
    return (
      <div className="settings-container loading-state">
        <Spinner />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="settings-container error-state">
        <p>{error}</p>
        <button onClick={fetchSettings}>{t.retry || 'Retry'}</button>
      </div>
    );
  }

  const ActiveComponent = TABS[activeTab].Component;

  return (
    <div className="instructor-settings-panel">
      <header className="settings-header">
        <div>
          <h1>{t.instructorSettings}</h1>
          <p>{t.manageProfile}</p>
        </div>
        <div className="header-actions">
          {hasUnsavedChanges && <span className="unsaved-indicator">{t.unsavedChanges || 'Unsaved changes'}</span>}
          <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? <><Spinner /> {t.saving}</> : t.saveChanges}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="settings-content">
        <nav className="settings-tabs">
          {Object.keys(TABS).map(tabKey => (
            <button
              key={tabKey}
              className={`tab-item ${activeTab === tabKey ? 'active' : ''}`}
              onClick={() => setActiveTab(tabKey)}
            >
              {TABS[tabKey].label}
            </button>
          ))}
        </nav>

        <main className="tab-content">
          {ActiveComponent && settings && (
            <ActiveComponent
              data={settings[activeTab]}
              onDataChange={(field, value) => handleSettingsChange(activeTab, field, value)}
              t={t}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorSettings;

```

### Key Features of this Proposed Component:
*   **Modern & Professional Structure**: Follows modern React practices with hooks for clean, readable, and maintainable state management.
*   **Centralized API Logic**: Uses the `apiCall` helper function, as defined in your `ADMIN_IMPROVEMENTS.md`, ensuring consistent authentication, error handling, and session management.
*   **Robust State Management**:
    *   `isLoading`: Shows a loading spinner while fetching initial data, improving UX.
    *   `isSaving`: Disables the save button and shows a saving indicator during API requests to prevent duplicate submissions.
    *   `error`: Displays clear error messages from the API, with a retry option.
*   **Change Detection**: An "Unsaved changes" indicator appears, and the "Save Changes" button is only enabled when there are actual changes to save.
*   **Component-Based Tabs**: The UI is broken down into modular tab components (`ProfileTab`, `SecurityTab`, etc.), making the code easier to manage. Each tab is responsible for its own fields but receives data and update handlers from the parent.
*   **Internationalization**: Fully integrated with your `useLanguage` hook, so all text is translated.

To make this fully functional, you would need to create the individual tab components (e.g., `ProfileTab.jsx`) that contain the form fields. They would look something like this:

```javascript
// Example: src/components/Instructor/Tabs/ProfileTab.jsx

const ProfileTab = ({ data, onDataChange, t }) => {
  return (
    <div className="form-section">
      <label>{t.fullName}</label>
      <input
        type="text"
        value={data.fullName || ''}
        onChange={(e) => onDataChange('fullName', e.target.value)}
        placeholder={t.fullNamePlaceholder}
      />
      {/* ... other profile fields ... */}
    </div>
  );
};

export default ProfileTab;
```

### Next Steps

This example provides a solid, professional foundation for your instructor panel. To apply these changes directly to your project, please provide the relevant source files for the instructor panel. I will then be able to perform a detailed code review and provide a precise diff to integrate these improvements.

<!--
[PROMPT_SUGGESTION]How can I add client-side validation to the form fields?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Show me how to implement the `apiCall` function in `apiConfig.js`.[/PROMPT_SUGGESTION]
-->