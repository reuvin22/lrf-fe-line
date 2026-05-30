import liff from '@line/liff';
import environment from '../environment';

const LIFF_ID = environment.VITE_LIFF_KEY;
const LIFF_ENABLED = environment.VITE_LIFF_ENABLED;

export const initLiff = async () => {
  if (!LIFF_ENABLED) {
    return;
  }
  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      login();
    }
  } catch (error) {
    console.error('LIFF initialization failed:', error);
  }
};

export const login = () => {
  if (!LIFF_ENABLED) return;
  liff.login();
};

export const logout = () => {
  if (!LIFF_ENABLED) {
    window.location.reload();
    return;
  }
  liff.logout();
  window.location.reload();
};

export const getProfile = async () => {
  if (!LIFF_ENABLED) {
    return {
      userId: environment.VITE_LIFF_MOCK_USER_ID,
      displayName: environment.VITE_LIFF_MOCK_DISPLAY_NAME,
    };
  }
  try {
    return await liff.getProfile();
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
};

export const getAccessToken = () => {
  if (!LIFF_ENABLED) return null;
  return liff.getAccessToken();
};

export const isLoggedIn = () => {
  if (!LIFF_ENABLED) return true;
  return liff.isLoggedIn();
};

export default liff;
