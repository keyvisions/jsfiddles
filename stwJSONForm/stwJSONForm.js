function JSONForm() {
    document.querySelectorAll('[data-json]').forEach(jsonField => {
        let form = jsonField.form;
        if (form) {
            jsonField.style.display = 'none';
            form.jsonField = jsonField;

            form.querySelectorAll('[form="json"]').forEach(el => {
                el.classList.add('JSONData');
            });

            if (form.hasAttribute('disabled')) {
                form.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]').forEach(el => {
                    el.style.display = 'none';
                });

                form.querySelectorAll('.JSONData').forEach(el => {
                    if (el.tagName == 'DIV')
                        el.removeAttribute('contenteditable');
                    else if (el.tagName == 'TABLE')
                        ;
                    else {
                        el.disabled = true;
                        if (el.value == 'disabled')
                            el.value = '';
                    }
                });
            }

            form.newColumn = table => {
                if (!table.querySelector('tbody'))
                    table.querySelector('tfoot.dataRow').insertAdjacentHTML('beforebegin', '<tbody></tbody>');
                if (!table.querySelector('tbody').childElementCount) {
                    table.querySelector('tbody').insertAdjacentHTML('afterbegin', table.querySelector('tfoot.dataRow').innerHTML);
                } else {
                    let th = table.querySelector('thead>tr>th:nth-child(2)').cloneNode(true);
                    table.querySelector('thead>tr>th').insertAdjacentElement('afterend', th);

                    let rows = table.querySelectorAll('tfoot.dataRow td');
                    for (let r = 0; r < rows.length; ++r)
                        table.querySelector('tbody').children[r].appendChild(rows[r].cloneNode(true));
                }
            }

            form.JSONStringify = function (event, table) {
                let form = event.currentTarget;

                let data = JSON.parse(form.jsonField.value || '{}'),
                    el = table || event.target;

                table = el.closest('table') && el.closest('table').classList.contains('JSONData') ? el.closest('table') : table;
                if (table) {
                    let tableName = table.getAttribute('name');
                    data[tableName] = [];
                    if (table.classList.contains('columnar')) {
                        for (let i = 0; i < table.querySelectorAll('tbody>tr:first-child .JSONData[name]').length; ++i)
                            data[tableName].push({});

                        table.querySelectorAll('tbody>tr').forEach(function (row, i) {
                            row.querySelectorAll('.JSONData[name]').forEach(function (fld, i) {
                                data[tableName][i][fld.getAttribute('name')] = form.valueStringify(fld);
                            });
                        });

                    } else {
                        table.querySelectorAll('tbody').forEach(row => {
                            let rowData = {};
                            row.querySelectorAll('.JSONData[name]').forEach(fld => {
                                rowData[fld.getAttribute('name')] = form.valueStringify(fld);
                            });
                            data[tableName].push(rowData);
                        });

                        // Summary functions
                        data[`${tableName}_summary`] = {};
                        table.querySelectorAll(`tfoot output[for]`).forEach(output => {
                            let sum = 0;
                            table.querySelectorAll(`tbody input[name=${output.getAttribute('for')}]`).forEach(cell => sum += parseFloat(cell.value) || 0.0);
                            output.value = sum;
                            data[`${tableName}_summary`][output.getAttribute('for')] = sum;
                        });
                    }

                    if (table.querySelector('tfoot.dataRow').onchange)
                        table.querySelector('tfoot.dataRow').onchange(table);

                } else
                    data[el.getAttribute('name')] = form.valueStringify(el);

                form.jsonField.value = JSON.stringify(data);
            }
            form.valueStringify = el => {
                let value;

                if (el.type == 'checkbox' && (el.value == undefined || el.value == 'on')) {
                    value = 0;
                    if (el.closest('fieldset'))
                        el.closest('fieldset').querySelectorAll('[type=checkbox]').forEach(checkbox => { value = (value || 0) << 1 | checkbox.checked });
                    else
                        value = el.checked;
                } else if (el.type == 'checkbox') {
                    value = [];
                    el.closest('fieldset').querySelectorAll('[type=checkbox]').forEach(checkbox => {
                        if (checkbox.checked) value.push(checkbox.value)
                    });
                } else if (el.type == 'select-multiple') {
                    value = [];
                    el.querySelectorAll('option').forEach(option => {
                        if (option.selected) value.push(option.value)
                    });
                } else
                    value = typeof el.value != 'undefined' ? el.value : el.innerHTML;

                el.classList.add('modified');

                return value;
            }
            form.JSONParse = event => {
                let form = event.target.closest('form');
                let data;

                try {
                    data = JSON.parse(form.jsonField.value || '{}');
                    form.style.backgroundColor = 'inherit';
                    form.title = '';
                } catch (err) {
                    form.style.backgroundColor = 'rgba(255,0,0,0.1)';
                    form.title = err;
                    return;
                }

                Object.keys(data).forEach(datum => {
                    let el = form.querySelector('.JSONData[name="' + datum + '"]');
                    if (el && el.tagName == 'TABLE' && el.classList.contains('JSONData')) {
                        if (!el.hasAttribute('data-key'))
                            el.querySelectorAll('tbody').forEach(tbody => { tbody.remove(); });
                        if (el.classList.contains('columnar')) {
                            el.querySelector('tfoot.dataRow').insertAdjacentHTML('beforebegin', '<tbody></tbody>');
                            let ths = el.querySelectorAll('.deleteColumn');
                            for (let i = ths.length - 1; i > 0; --i)
                                ths[i].parentElement.removeChild(ths[i]);

                            for (let col = 0; col < data[datum].length; ++col)
                                form.newColumn(el);

                            data[datum].forEach(function (subdatum, c) {
                                Object.keys(subdatum).forEach(key => {
                                    let subelement = el.querySelector(`tbody td:nth-child(${c + 2}) .JSONData[name="${key}"]`);
                                    if (subelement)
                                        form.parseValue(subelement, subdatum[key]);
                                });
                            });
                        } else {
                            if (el.hasAttribute('data-key')) {
                                el.querySelectorAll('tbody[data-key]').forEach((tbody, row) => {
                                    let subdatum = data[datum].find(d => d[el.getAttribute('data-key')] == tbody.getAttribute('data-key')) ||
                                        { [el.getAttribute('data-key')]: tbody.getAttribute('data-key') };

                                    let _tbody = document.createElement('tbody');
                                    _tbody.innerHTML = el.querySelector('tfoot.dataRow').innerHTML;

                                    _tbody.querySelectorAll('td').forEach((_td, col) => {
                                        if (_td.innerHTML != '')
                                            tbody.querySelector(`td:nth-child(${col + 1})`).innerHTML = (col == 0 ? `${row + 1}.` : '') + _td.innerHTML;
                                    });

                                    Object.keys(subdatum).forEach(datum => {
                                        let subelement = tbody.querySelector(`.JSONData[name="${datum}"]`);
                                        if (subelement)
                                            form.parseValue(subelement, subdatum[datum]);
                                    });
                                });

                            } else {
                                data[datum].forEach(subdatum => {
                                    let tbody = document.createElement('tbody');
                                    tbody.innerHTML = el.querySelector('tfoot.dataRow').innerHTML;

                                    Object.keys(subdatum).forEach(datum => {
                                        let subelement = tbody.querySelector(`.JSONData[name="${datum}"]`);
                                        if (subelement)
                                            form.parseValue(subelement, subdatum[datum]);
                                    });

                                    el.querySelector('tfoot.dataRow').insertAdjacentElement('beforebegin', tbody);
                                });
                            }

                            // Summary functions
                            el.querySelectorAll(`tfoot output[for]`).forEach(output => {
                                let sum = 0;
                                el.querySelectorAll(`tbody input[name=${output.getAttribute('for')}]`).forEach(cell => sum += parseFloat(cell.value) || 0.0);
                                output.value = sum;
                            });
                        }
                    } else
                        form.parseValue(el, data[datum]);
                });

                form.querySelectorAll('table.JSONData').forEach(table => {
                    if (table.querySelector('tfoot.dataRow').onchange)
                        table.querySelector('tfoot.dataRow').onchange(table);
                });

                // Reflect form default values if data fields are undefined
                for (let i = 0; i < form.childElementCount; ++i) {
                    let el = form[i];
                    if (!el.value || typeof data[el.getAttribute('name')] != 'undefined' || !el.classList.contains('JSONData'))
                        continue;
                    form.JSONStringify({
                        currentTarget: form,
                        target: el
                    });
                }
            }
            form.parseValue = function (el, value) {
                if (!el || el.tagName == 'TD' || (el.tagName == 'DIV' && el.contentEditable == 'false'))
                    return;
                if (el.tagName == 'DIV') {
                    el.innerHTML = value;

                } else if (el.type == 'checkbox' || el.type == 'radio') {
                    if (el.closest('fieldset')) {
                        if (Array.isArray(value))
                            el.closest('fieldset').querySelectorAll('[type=checkbox]').forEach(checkbox => {
                                checkbox.checked = value.find(value => { return value == checkbox.value }) ? true : false;
                            });
                        else if (el.type == 'radio')
                            el.closest('fieldset').querySelectorAll('[type=radio]').forEach(radio => {
                                radio.checked = (value == radio.value);
                            });
                        else
                            el.closest('fieldset').querySelectorAll('[type=checkbox]').forEach(function (checkbox, i) {
                                checkbox.checked = (value || 0) & (1 << i) ? true : false;
                            });
                    } else {
                        el.checked = value ? true : false;
                    }

                } else if (el.type == 'select-multiple') {
                    el.querySelectorAll('option').forEach(option => {
                        if (value.find(value => { return value == option.value }))
                            option.setAttribute('selected', '');
                    });

                } else {
                    el.value = value;
                }
            }

            // Normalize JSON field
            try {
                JSON.parse(jsonField.value);
                if (!jsonField.value)
                    jsonField.value = '{}';
            } catch (err) {
                jsonField.value = '{}';
            }
            form.JSONParse({
                target: jsonField
            });

            form.zoom = function (event, contenteditable) {
                contenteditable = contenteditable || event.target;

                if ((event.type == 'mousedown' || event.key == 'F2') && (contenteditable.tagName == 'TEXTAREA' || contenteditable.hasAttribute('contenteditable'))) { // Zoom
                    if (contenteditable.closest('label'))
                        contenteditable.closest('label').classList.toggle('zoom');
                    else
                        contenteditable.classList.toggle('zoom');
                    contenteditable.blur();
                    contenteditable.focus();
                    event.stopPropagation();
                    event.preventDefault();
                }
            }

            form.addEventListener('keydown', form.zoom);
            form.addEventListener('input', form.JSONStringify);
            form.addEventListener('click', event => {
                if (event.target.hasAttribute('contenteditable')) {
                    event.preventDefault();
                    return;
                }

                let action = event.target.closest('th') || event.target.closest('td');
                if (!action)
                    return;

                let table = event.target.closest('table');
                action = action.classList;
                if (action.contains('newRow')) {
                    table.querySelector('tfoot').insertAdjacentHTML('beforeBegin', '<tbody>' + table.querySelector('tfoot.dataRow').innerHTML + '</tbody>');
                    event.stopPropagation();
                }
                if (action.contains('deleteRow') && confirm('Sicuri di voler eliminare la riga?')) {
                    event.target.closest('tbody').remove();
                    if (table.querySelector('tfoot.dataRow').onchange)
                        table.querySelector('tfoot.dataRow').onchange(table);
                    form.JSONStringify(event, table);
                    event.stopPropagation();
                }
                if (action.contains('newColumn')) {
                    form.newColumn(table);
                    event.stopPropagation();
                }
                if (action.contains('deleteColumn') && confirm('Sicuri di voler eliminare la colonna?')) {
                    let rows = table.querySelectorAll('thead>tr, tbody>tr'),
                        col = event.target.closest('th').cellIndex;

                    if (rows[0].childElementCount == 2)
                        table.querySelector('tbody').innerHTML = '';
                    else
                        for (let r = 0; r < rows.length; ++r)
                            rows[r].removeChild(rows[r].children[col]);

                    let data = JSON.parse(form.jsonField.value || '{}');
                    if (data[table.getAttribute('name')]) {
                        data[table.getAttribute('name')].splice(col - 1, 1);
                        form.jsonField.value = JSON.stringify(data)
                    }
                    form.JSONStringify(event);
                    event.stopPropagation();
                }
            });

            form.querySelectorAll('div[contenteditable]').forEach(contenteditable => {
                contenteditable.addEventListener('focus', event => {
                    let toolbar = document.getElementById('JSONToolbar');
                    if (!toolbar) {
                        document.body.insertAdjacentHTML('beforeend', '<div id="JSONToolbar"><i class="fas fa-fw fa-strikethrough" data-format="s" title="Barra testo selezionato"></i> <i class="fas fa-fw fa-highlighter" data-format="mark" title="Evidenzia testo selezionato"></i> <i class="fas fa-expand" data-action="expand" title="Zoom (F2)"></i></div>');
                        toolbar = document.getElementById('JSONToolbar');
                        toolbar.addEventListener('mousedown', form.formatText)
                    }
                    let rect = event.target.getBoundingClientRect();
                    toolbar.style.top = parseInt(rect.top + window.scrollY + 1) + 'px';
                    toolbar.style.right = parseInt(window.innerWidth - rect.right) + 'px';
                    toolbar.style.display = '';
                });
                contenteditable.addEventListener('blur', event => {
                    document.getElementById('JSONToolbar').style.display = 'none';
                });
            });

            form.formatText = event => {
                let sel = window.getSelection();
                if (event.target.dataset.format && sel && sel.rangeCount) {
                    let range = sel.getRangeAt(0);

                    let el = document.createElement(event.target.dataset.format);
                    el.innerHTML = range;
                    el.setAttribute('title', Date().toLocaleString());

                    range.deleteContents();
                    range.insertNode(el);
                } else if (event.target.dataset.action == 'expand' && document.activeElement.hasAttribute('contenteditable')) {
                    form.zoom(event, document.activeElement);
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
            }
        }
    });
}
// window.addEventListener('load', JSONForm, { once: true });