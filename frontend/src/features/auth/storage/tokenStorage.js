const ACCESS_TOKEN_KEY = "auth_token";

let memoryToken = null;

export const tokenStorage = {
    getAccessToken() {
        if (memoryToken !== null) return memoryToken;
        memoryToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        return memoryToken;
    },

    setAccessToken(token) {
        memoryToken = token;
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    removeAccessToken() {
        memoryToken = null;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    clear() {
        memoryToken = null;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
};
