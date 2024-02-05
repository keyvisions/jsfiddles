const repo = 'keyvisions/jsfiddles/',
    jsfiddle = 'kvSelect';

window.addEventListener('load', () => {
    const body = new FormData();
    
    body.set('panel_html', 0);
    body.set('html', async () => {
        let html = await fetch(`https://raw.githubusercontent.com/${repo}/main/${jsfiddle}/index.html`);
        return await html.text();
    });
    body.set('panel_js', 0);
    body.set('js', async () => {
        let js = await fetch(`https://raw.githubusercontent.com/${repo}/main/${jsfiddle}/${jsfiddle}.js`);
        return await js.text();
    });
    body.set('panel_css', 0);
    body.set('css', async () => {
        let css = await fetch(`https://raw.githubusercontent.com/${repo}/main/${jsfiddle}/${jsfiddle}.css`);
        return await css.text();
    });
    body.set('title', '');
    body.set('description', '');
    body.set('resources', '');
    // body.set('dtd', 'html 4');
    body.set('wrap', 'l'); // l|d|h|b

    fetch('https://jsfiddle.net/api/post/library/pure/', {
        method: 'post',
        target: 'check',
        body: body
    });
});
