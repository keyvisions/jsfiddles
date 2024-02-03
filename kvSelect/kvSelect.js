/*
Author: Giancarlo Trevisan
Date:   2024/01/30 
*/
async function kvSelect(input) {
    if (!(input instanceof Element)) {
        document.querySelectorAll(".kvSelect").forEach(element => kvSelect(element));
        return;
    }
//    input.style.display = 'none';

    const Key = input.dataset.key || '_id';
    const Data = JSON.parse(input.value).sort((a, b) => { return (a.name < b.name) ? -1 : 1 });
    Data.sort((a, b) => {
        return ((a.selected ? '*' : '') + a.name) < ((b.selected ? '*' : '') + b.name) ? -1 : 1;
    });

    const ol = document.createElement('ol');
    ol.className = 'kvSelect';
    ol.setAttribute('start', 0);
    ol.setAttribute('data-search', '');
    ol.insertAdjacentHTML('beforeend', '<li tabindex="0">*</li>')
    Data.forEach(datum => {
        ol.insertAdjacentHTML('beforeend', `<li tabindex="0" data-${Key}="${datum[Key]}" ${datum.selected ? 'selected' : ''}>${datum.name}</li>`)
    });

    ol.addEventListener('click', event => {
        const li = event.target.closest('li');

        if (li.hasAttribute('selected'))
            li.removeAttribute('selected');
        else
            li.setAttribute('selected', '');

        if (li.innerHTML === '*') {
            const selected = li.hasAttribute('selected');
            for (let li of event.currentTarget.children)
                if (li.style.display !== 'none')
                    if (selected) {
                        Data.find(datum => datum[Key] === li.dataset[Key]).selected = true;
                        li.setAttribute('selected', '');
                    } else {
                        Data.find(datum => datum[Key] === li.dataset[Key]).selected = false;
                        li.removeAttribute('selected');
                    }
        } else {
            Data.find(datum => datum[Key] === li.dataset[Key]).selected = li.hasAttribute('selected');
            event.currentTarget.firstChild.removeAttribute('selected');
        }
        
        const list = [...event.currentTarget.children].sort((a, b) => {
            return ((a.hasAttribute('selected') ? '*' : '') + a.innerText) < ((b.hasAttribute('selected') ? '*' : '') + b.innerText) ? -1 : 1;
        });
        event.currentTarget.innerHTML = '';
        list.forEach(li => event.currentTarget.insertAdjacentElement('beforeend', li));
        li.focus();

        input.value = JSON.stringify(Data);
    });
    ol.addEventListener('mousemove', event => {
        event.target.closest('li')?.focus();
    });
    ol.addEventListener('keydown', event => {
        let li = event.target.closest('li');
        switch (event.key) {
            case 'ArrowUp':
                if (li.previousElementSibling) {
                    for (li = li.previousElementSibling; li.style.display === 'none'; li = li.previousElementSibling);
                    li.focus();
                }
                break;
            case 'ArrowDown':
                if (li.nextElementSibling) {
                    for (li = li.nextElementSibling; li?.style.display === 'none'; li = li.nextElementSibling);
                    li?.focus();
                }
                break;
            case 'Enter':
                li.click();
                break;
            case 'Tab':
                break;
            default: // Search
                const ol = event.currentTarget;

                if (event.key === 'Backspace' || event.key === 'Delete') {
                    ol.dataset.search = '';
                    ol.firstChild.removeAttribute('selected');
                } else if (event.key.length === 1)
                    ol.dataset.search += event.key.toLowerCase();

                for (let li of ol.children) {
                    let txt = (li.innerText).toLowerCase();
                    if (txt != '*' && !li.hasAttribute('selected') && txt.indexOf(ol.dataset.search) == -1)
                        li.style.display = 'none';
                    else
                        li.style.display = '';
                }
                ol.firstChild.focus();
        }
    });
    input.insertAdjacentElement('afterend', ol);
}
window.addEventListener('load', kvSelect);
