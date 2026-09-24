import {getDAppUrl} from './DAppOrigin';
test.each(['javascript:alert(1)', 'data:text/html,test', 'http://site.example', '//site.example', 'https://user:pass@site.example', 'not a url', window.location.origin])('rejects unsafe dApp URL %s', uri => expect(getDAppUrl(uri)).toBeNull());
test('canonicalizes the authority and preserves the dApp path', () => {
    const url = getDAppUrl('https://EXAMPLE.com:443/a?b=c');
    expect(url.origin).toBe('https://example.com'); expect(url.href).toBe('https://example.com/a?b=c');
});
