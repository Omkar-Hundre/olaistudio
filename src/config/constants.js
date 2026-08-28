/**
 * ==============================================================================
 * Global Application Constants & Configuration
 * ==============================================================================
 * Centralized configuration parameters including authentication constants,
 * country codes, credibility blacklist patterns, and validation rules.
 * ==============================================================================
 */

export const APP_CONFIG = {
  appName: 'Olai',
  appDescription: 'Visual AI Workflow & Automation Canvas',
  routes: {
    home: '/',
    authCallback: '/#verified',
  },
  auth: {
    emailRedirectTo: typeof window !== 'undefined' 
      ? `${window.location.origin}/#auth?verified=true` 
      : '',
    minPasswordLength: 6,
    minAge: 13,
    maxAge: 110,
    defaultDob: '2002-06-15', // Default pre-filled 24-year-old DOB
  },
  countries: [
    { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
    { code: '+1', country: 'US / Canada', flag: '🇺🇸', length: 10 },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧', length: 10 },
    { code: '+61', country: 'Australia', flag: '🇦🇺', length: 9 },
    { code: '+49', country: 'Germany', flag: '🇩🇪', length: 10 },
    { code: '+33', country: 'France', flag: '🇫🇷', length: 9 },
    { code: '+81', country: 'Japan', flag: '🇯🇵', length: 10 },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8 },
    { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
    { code: '+49', country: 'Germany', flag: '🇩🇪', length: 10 },
  ],
  validation: {
    emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    dummyEmails: [
      'test@test.com',
      'asdf@asdf.com',
      'admin@admin.com',
      'fake@fake.com',
      'temp@temp.com',
      'user@example.com',
      'sample@sample.com',
      'abc@abc.com',
      'xyz@xyz.com',
      'demo@demo.com',
    ],
    dummyNames: [
      'test',
      'testing',
      'asdf',
      'qwerty',
      'admin',
      'user',
      'demo',
      'null',
      'undefined',
      'dummy',
      'fake',
      'sample',
      'abc',
      'xyz',
    ],
  },
};
