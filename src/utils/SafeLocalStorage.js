class SafeLocalStorage {
    static getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error("Error accessing localStorage:", error);
            return null; // or a sensible default
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error("Error accessing localStorage:", error);
            // Handle or log the error
        }
    }

    // Additional methods for removeItem, clear, etc., can be added similarly
}

export default SafeLocalStorage;
