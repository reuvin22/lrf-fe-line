import liff from '@line/liff';
import environment from '../environment';

const LIFF_ID = environment.VITE_LIFF_KEY

export const initLiff = async () => {
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
  liff.login();
};

export const logout = () => {
  liff.logout();
  window.location.reload();
};

export const getProfile = async () => {
  try {
    return await liff.getProfile();
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
};

export const getAccessToken = () => {
  return liff.getAccessToken();
};

export const isLoggedIn = () => {
  return liff.isLoggedIn();
};

export default liff;