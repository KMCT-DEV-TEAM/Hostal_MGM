const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const tokenStorage = {
    get() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    set(token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    remove() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setRefreshToken(token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    },

    removeRefreshToken() {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    clear() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
};