const repo = 'keyvisions/jsfiddles/',
    jsfiddle = 'kvSelect';

window.addEventListener('load', async () => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://jsfiddle.net/api/post/library/pure/';
    form.target = 'check';

    let config = await fetch(`https://raw.githubusercontent.com/${repo}/main/${jsfiddle}/jsfiddle.json`);
    config = await config.json();
    for (let key in config) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        if (config[key].toString().startsWith('http')) {
            let res = await fetch(config[key].toString());
            config[key] = await res.text();
        }
        input.value = config[key];

        form.insertAdjacentElement('beforeend', input);
    }

    form.insertAdjacentHTML('beforeend', '<button type="submit">JSFiddle - Code Playground</button>');
    document.querySelector('body').insertAdjacentElement('beforeend', form);
});
