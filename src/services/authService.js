/**
 * ==============================================================================
 * Authentication Service (Business Logic & Credibility Validation)
 * ==============================================================================
 * Encapsulates all authentication workflows with Supabase Auth:
 * - Data credibility checks (real phone check, dummy detection, DOB age validation)
 * - User Sign Up (with Name, Date of Birth, Email, Country Code + Phone, Email Verification)
 * - User Sign In (Email / Password)
 * - User Sign Out
 * - Session & Auth State Management
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config/constants';

/**
 * Validates phone number credibility (detects fake, repeated, sequential, or dummy numbers)
 * @param {string} countryCode
 * @param {string} phoneNumber
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePhoneCredibility(countryCode, phoneNumber) {
  if (!countryCode) {
    return { isValid: false, error: 'Please select a valid country code.' };
  }

  // Remove any non-digits
  const cleanDigits = (phoneNumber || '').replace(/\D/g, '');

  if (!cleanDigits) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Check length against country rule
  const countryRule = APP_CONFIG.countries.find((c) => c.code === countryCode);
  const minLength = countryRule ? countryRule.length : 7;
  const maxLength = 12;

  if (cleanDigits.length < minLength || cleanDigits.length > maxLength) {
    return {
      isValid: false,
      error: `Phone number for ${countryCode} must be ${countryRule?.length || '7-12'} digits long.`,
    };
  }

  // Detect repeated identical digits (e.g., 0000000000, 1111111111, 9999999999)
  const isAllSameDigit = /^(\d)\1+$/.test(cleanDigits);
  if (isAllSameDigit) {
    return { isValid: false, error: 'Please enter a valid, active phone number (repeated digits detected).' };
  }

  // Detect ascending/descending sequential numbers (e.g. 1234567890, 9876543210)
  const sequentialPatterns = [
    '0123456789',
    '1234567890',
    '9876543210',
    '0987654321',
    '12345678',
    '87654321',
    '1122334455',
    '1212121212',
  ];
  if (sequentialPatterns.some((pattern) => cleanDigits.includes(pattern))) {
    return { isValid: false, error: 'Please enter a legitimate phone number (sequential pattern detected).' };
  }

  // For Indian numbers (+91), must start with 6, 7, 8, or 9 and be 10 digits
  if (countryCode === '+91') {
    if (cleanDigits.length !== 10 || !/^[6-9]/.test(cleanDigits)) {
      return { isValid: false, error: 'Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9.' };
    }
  }

  // For US/Canada (+1), standard NANP area code cannot start with 0 or 1
  if (countryCode === '+1') {
    if (cleanDigits.length !== 10 || /^[01]/.test(cleanDigits)) {
      return { isValid: false, error: 'Please enter a valid 10-digit North American phone number.' };
    }
  }

  return { isValid: true };
}

/**
 * Validates date of birth credibility
 * @param {string} dob - ISO date string (YYYY-MM-DD)
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDobCredibility(dob) {
  if (!dob) {
    return { isValid: false, error: 'Please enter your date of birth.' };
  }

  const birthDate = new Date(dob);
  const now = new Date();

  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Please provide a valid date format.' };
  }

  if (birthDate > now) {
    return { isValid: false, error: 'Date of birth cannot be in the future.' };
  }

  // Calculate age
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < APP_CONFIG.auth.minAge) {
    return {
      isValid: false,
      error: `You must be at least ${APP_CONFIG.auth.minAge} years old to create an account.`,
    };
  }

  if (age > APP_CONFIG.auth.maxAge) {
    return {
      isValid: false,
      error: 'Please enter a realistic date of birth.',
    };
  }

  return { isValid: true };
}

/**
 * Validates name credibility
 * @param {string} name
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateNameCredibility(name) {
  const trimmed = (name || '').trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.' };
  }

  // Check against dummy names
  if (APP_CONFIG.validation.dummyNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: 'Please enter your authentic full name.' };
  }

  // Check for repeated single characters (e.g., "aaaaa")
  if (/^([a-zA-Z])\1+$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a legitimate full name.' };
  }

  // Must contain letters
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Name must contain alphabet characters.' };
  }

  return { isValid: true };
}

/**
 * Validates email credibility
 * @param {string} email
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateEmailCredibility(email) {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed || !APP_CONFIG.validation.emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (APP_CONFIG.validation.dummyEmails.includes(trimmed)) {
    return { isValid: false, error: 'Please provide a genuine, active email address.' };
  }

  return { isValid: true };
}

/**
 * Validates entire signup form data against business & credibility rules
 * @param {Object} formData
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateSignUpData({ name, dob, email, countryCode, phone, password }) {
  const nameCheck = validateNameCredibility(name);
  if (!nameCheck.isValid) return nameCheck;

  const dobCheck = validateDobCredibility(dob);
  if (!dobCheck.isValid) return dobCheck;

  const emailCheck = validateEmailCredibility(email);
  if (!emailCheck.isValid) return emailCheck;

  const phoneCheck = validatePhoneCredibility(countryCode, phone);
  if (!phoneCheck.isValid) return phoneCheck;

  if (!password || password.length < APP_CONFIG.auth.minPasswordLength) {
    return {
      isValid: false,
      error: `Password must be at least ${APP_CONFIG.auth.minPasswordLength} characters long.`,
    };
  }

  return { isValid: true };
}

/**
 * Registers a new user and triggers email verification flow
 * @param {Object} params
 * @param {string} params.name - Full name
 * @param {string} params.dob - Date of birth (YYYY-MM-DD)
 * @param {string} params.email - Email address
 * @param {string} params.countryCode - Phone country code (e.g. +91)
 * @param {string} params.phone - Phone number
 * @param {string} params.password - Password
 * @returns {Promise<{ user: any, session: any, error: any }>}
 */
export async function signUp({ name, dob, email, countryCode, phone, password }) {
  const validation = validateSignUpData({ name, dob, email, countryCode, phone, password });
  if (!validation.isValid) {
    return { user: null, session: null, error: { message: validation.error } };
  }

  const cleanPhoneDigits = (phone || '').replace(/\D/g, '');
  const fullPhoneNumber = `${countryCode} ${cleanPhoneDigits}`;
  const redirectTo = APP_CONFIG.auth.emailRedirectTo || `${window.location.origin}/#auth?verified=true`;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      data: {
        name: name.trim(),
        full_name: name.trim(),
        dob: dob,
        phone: fullPhoneNumber,
      },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { user: null, session: null, error };
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Signs in an existing user with email and password
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: any, session: any, error: any }>}
 */
export async function signIn({ email, password }) {
  if (!email || !password) {
    return { user: null, session: null, error: { message: 'Email and password are required.' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password,
  });

  if (error) {
    return { user: null, session: null, error };
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Signs out the current active session
 * @returns {Promise<{ error: any }>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Retrieves the current authenticated session
 * @returns {Promise<{ session: any, error: any }>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
}

/**
 * Retrieves the currently logged in user
 * @returns {Promise<{ user: any, error: any }>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

/**
 * Listens for auth state changes
 * @param {Function} callback
 * @returns {{ subscription: { unsubscribe: Function } }}
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
