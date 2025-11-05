let BASE_URL = 'https://api.swimply.larsjohansen.com';
if (import.meta.env.DEV) {
    BASE_URL = "http://api.swimply.larsjohansen.com:8000";
}

export const POOL_TEMPERATURE_DATA = BASE_URL + '/api/v1/pool/temperature';