export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyByxxjhTR8jgmMyER8YtyohVo1i2Qw2gyA';

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== 'undefined' && (window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    const timeoutTimer = window.setTimeout(() => {
      reject(new Error('Google Maps script loading timed out'));
    }, 4000);

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        clearTimeout(timeoutTimer);
        resolve((window as unknown as { google: typeof google }).google);
      });
      existingScript.addEventListener('error', (e) => {
        clearTimeout(timeoutTimer);
        reject(e);
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      clearTimeout(timeoutTimer);
      if ((window as unknown as { google?: typeof google }).google?.maps) {
        resolve((window as unknown as { google: typeof google }).google);
      } else {
        reject(new Error('Google Maps script loaded without google.maps object'));
      }
    };

    script.onerror = (err) => {
      clearTimeout(timeoutTimer);
      reject(err);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

// Coastal & Offshore Maritime Regions covering Korea's coastal and distant outer waters
export const KOREA_SEA_REGIONS = {
  KOREA_ALL: { lat: 35.6, lng: 128.2, name: '전국 연근해 종합 (전 해역)', zoom: 7 },
  SOUTH_SEA: { lat: 34.8, lng: 128.2, name: '남해 (여수·통영·부산)', zoom: 9 },
  WEST_SEA: { lat: 36.2, lng: 126.2, name: '서해 (인천·태안·목포)', zoom: 8 },
  EAST_SEA: { lat: 37.2, lng: 129.5, name: '동해 (강릉·속초·포항)', zoom: 8 },
  JEJU_SEA: { lat: 33.4, lng: 126.5, name: '제주 연안 및 남해 외해', zoom: 9 },
  OUTER_SEA: { lat: 35.5, lng: 128.8, name: '원해·외해 먼바다 (대화퇴·이어도·EEZ)', zoom: 6 }
};
