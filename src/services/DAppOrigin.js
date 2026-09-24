// Connection approval and bridge checks must use the same canonical URL.
export function getDAppUrl(uri) {
    try {
        const url = new URL(uri);
        if (url.protocol !== 'https:' || url.username || url.password ||
            url.origin === window.location.origin) {
            return null;
        }
        return url;
    } catch (error) {
        return null;
    }
}
