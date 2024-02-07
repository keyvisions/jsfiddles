/*
Author: Giancarlo Trevisan
Date:   2024/01/28 
*/
async function kvImportData(input) {
    if (!(input instanceof Element)) {
        document.querySelectorAll(".kvImportData[data-schema]").forEach(element => kvImportData(element));
        return;
    }

    const url = document.createElement('a');
    url.href = input.dataset.schema;
    const res = await fetch(url.href, { mode: 'no-cors' });
    if (res.ok)
        input.dataset.schema = await res.text();
    else
        input.dataset.schema = '{"error":{"name":"Schema error"}}';
    delete url;

    if (!input.dataset.schema)
        return;

    input.style.display = 'none';

    const table = document.createElement('table');
    table.className = 'kvImportData';
    table.setAttribute('placeholder', input.getAttribute('placeholder'));
    table.kvRefCols = JSON.parse(input.dataset.schema);
    table.innerHTML = (() => {
        let thead = ''
        Object.values(table.kvRefCols).forEach(col => thead += `<th>${col.name}</th>`);
        return `<caption><a href="#">${table.getAttribute('placeholder')}</a></caption><thead><tr>${thead}</tr></thead>`;
    })();
    table.addEventListener('input', toJSON);
    table.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT') {
            const cell = event.target.parentElement;
            switch (event.key) {
                case 'ArrowUp':
                    cell.parentElement.previousElementSibling?.children[cell.cellIndex].firstChild.focus();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    cell.parentElement.nextElementSibling?.children[cell.cellIndex].firstChild.focus();
                    event.preventDefault();
                    break;
            }
        }
    });
    table.addEventListener('click', async (event) => {
        if (event.target.tagName === 'A') {
            const table = event.currentTarget;
            const cols = Object.keys(table.kvRefCols).length;
            try {
                table.querySelector('tbody')?.remove();

                const text = await navigator.clipboard.readText();

                let data = text.replaceAll(/(\t)/gm, '</td><td>');
                data = data.replaceAll(/(\n)/gm, '</td></tr><tr><td>');
                data = (data + '§').replace('<tr><td>§', '');

                table.insertAdjacentHTML('beforeend', `<tbody><tr><td>${data}</tbody>`);

                table.querySelectorAll('tbody>tr').forEach(tr => {
                    if (tr.children.length != cols)
                        throw new RangeError('Invalid data');
                    Object.values(table.kvRefCols).forEach((col, i) => {
                        tr.children[i].innerHTML = `<input form="kvRefTable" placeholder="${col.name}" name="${Object.keys(table.kvRefCols)[i]}" type="${col.type || ''}" value="${setValue(col.type, tr.children[i].innerText.trim())}">`;
                    });
                });
                toJSON({ currentTarget: table });
            } catch (err) {
                table.querySelector('tbody').innerHTML = `<tr><td colspan="${cols}"><strong>${err.toString()}</strong></td></tr>`;
                table.previousElementSibling.value = '';                
            }
        }
    });
    input.insertAdjacentElement('afterend', table);

    function toJSON(event) {
        let data = [];
        event.currentTarget.querySelectorAll('tbody>tr').forEach(tr => {
            let row = {};
            tr.querySelectorAll('input').forEach(input => row[input.name] = input.value);
            data.push(row);
        });
        event.currentTarget.previousSibling.value = JSON.stringify(data);
    }

    const DATE_FORMAT = (() => {
        const parts = new Intl.DateTimeFormat().formatToParts();
        const filteredParts = parts.filter(part => ['year', 'month', 'day'].includes(part.type));
        const filteredPartNames = filteredParts.map(part => part.type[0].toUpperCase());

        return {
            YMD: /(?<Y>\d{4})[-/. ](?<M>\d{1,2})[-/.](?<D>\d{1,2})(?:[ T](?<h>\d{2})\:(?<m>\d{2})(?:\:(?<s>\d{2}))?)?/,
            DMY: /(?<D>\d{1,2})[-/. ](?<M>\d{1,2})[-/.](?<Y>\d{4})(?:[ T](?<h>\d{2})\:(?<m>\d{2})(?:\:(?<s>\d{2}))?)?/,
            MDY: /(?<M>\d{1,2})[-/. ](?<D>\d{1,2})[-/.](?<Y>\d{4})(?:[ T](?<h>\d{2})\:(?<m>\d{2})(?:\:(?<s>\d{2}))?)?/
        }[filteredPartNames.join('')];
    })() || 'YMD';

    function setValue(type, value) {
        if (!type || !type.match(/datetime|date|time/))
            return value;

        let parts = value.match(DATE_FORMAT);
        if (parts) {
            for (let part in parts.groups)
                parts.groups[part] = parseInt(parts.groups[part]);
            parts = parts.groups;

            let date = new Date(parts.Y, parts.M - 1, parts.D, parts.h || null, parts.m || null, parts.s || null);

            switch (type) {
                case 'date': return date.toJSON().substring(0, 10);
                case 'time': return date.toJSON().substring(12, 16);
                case 'datetime': return date.toJSON().substring(0, 16);
            }
        }
        return null;
    }
}
window.addEventListener('load', kvImportData);
