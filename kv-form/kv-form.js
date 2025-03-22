var Model = {
    preDocument: (model) => {
        Model.setup(null, model, '');
    },
    setup: /*async*/ (el, model, mode) => {
        if (!el)
            el = document.getElementById("Analysis");

        if (el.modelElement)
            el.modelElement.remove();

        if (!Model.UM)
            Model.UM = Model.fetchJSON('um');
        Model.data = el;

        el.style.display = 'none';
        (el.closest('form') || el).insertAdjacentHTML('afterend', /*await*/ Model.render(Model.fetchJSON(model), mode, JSON.parse(el.value)));
        el.modelElement = (el.closest('form') || el).nextElementSibling;
        Model.formulas(el.modelElement.querySelector(".ModuleForm"), model);

        //      el.modelElement.querySelector(".ModuleForm").dispatchEvent(new Event("input", { bubbles: true }));
        el.modelElement.querySelector(".ModuleForm").applyFormulas(el.modelElement.querySelector(".ModuleForm"));

        localStorage.data = Model.data.value;
    },
    formulas: (form, model) => {
        window.sum = function (array) {
            var sum = 0.0;
            for (var i = 0; i < array.length; ++i)
                if (!isNaN(array[i]) && array[i] != null) sum += array[i];
            return sum;
        };
        window.avg = function (array) {
            var sum = 0.0, j = 0;
            for (i = 0; i < array.length; ++i)
                if (!isNaN(array[i]) && array[i] != null) sum += array[i], ++j;
            return j ? sum / j : parseFloat(null);
        };
        window.count = function (array) {
            var j = 0;
            for (var i = 0; i < array.length; ++i)
                if (!isNaN(array[i]) && array[i] != null) ++j;
            return j;
        };
        window.setValidity = function (output) {
            if ((output.hasAttribute("min") && parseFloat(output.value) < parseFloat(output.getAttribute("min"))) ||
                (output.hasAttribute("max") && parseFloat(output.value) > parseFloat(output.getAttribute("max"))))
                output.classList.add("invalid");
            else
                output.classList.remove("invalid");
        };

        //        var fn = 'var target=event.target, form=event.currentTarget, data=JSON.parse(Model.data.value).' + model + '; var o;';
        var fn = 'var data=JSON.parse(Model.data.value).' + model + '; var o;';
        var outputs = form.querySelectorAll("output[data-formula]"), n;
        for (i = 0; i < outputs.length; ++i) {
            n = (i > 0 && outputs[i - 1].getAttribute("name") == outputs[i].getAttribute("name")) ? ++n : 0;
            var output = outputs[i];
            var decimals = output.getAttribute("step") ? Math.round(-Math.log(parseFloat(output.getAttribute("step"))) / Math.log(10.0)) : undefined;
            fn += output.dataset.formula.replace('=', 'n=' + n + ';o=form.querySelectorAll("[name=' + output.getAttribute("name") + ']")[n];o.value=(') + (Number.isInteger(decimals) ? ').toFixed(' + decimals + ')' : ')') + ';o.innerText=o.value;setValidity(o);';
        }
        //        form.addEventListener("input", Function("event", fn));
        form.applyFormulas = Function("form", fn);
    },
    fetchJSON: (filename) => {
        if (filename == 'um')
            return modelData.UM;
        return { [filename]: modelData.modules[filename] };
    },
    fetchOptions: /*async*/ (options) => {
        /*
        const res = await fetch(options);
        return await res.text();
        */
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200)
                options = xhttp.responseText;
        };
        xhttp.open("GET", options, false); // async = false
        xhttp.send(null);
        return options;
    },
    um: (txt) => {
        return Model.UM[txt] || { type: "text" };
    },
    toggleAll: (event) => {
        document.querySelectorAll('.ModuleForm input[type="checkbox"]').forEach(checkbox => checkbox.checked = event.target.checked);
        Model.save(document.querySelector('form.ModuleForm'));
    },
    render: /*async*/ (model, mode = 'edit', data = {}, level = 1) => {
        var html = '', parentName = Object.keys(model)[0];
        if (model) {
            if (level == 1) {
                model = model[parentName];

                if (mode == 'analyze')
                    html += '<label>De/seleziona tutti <input type="checkbox" onclick="Model.toggleAll(event)"></label><hr>';
                html += `<form class="ModuleForm" ${mode != '' ? 'onchange="Model.save(this)"' : ''} data-mode="${mode}">`;
            }

            for (var name in model) {
                var datum = model[name];

                if (name == 'footnote') {
                    html += `<div style="padding:1rem 0; font-size:bigger; color:red;">${datum.label}</div>`;
                    continue;
                }
                if (name == 'heading') {
                    if (level > 1)
                        html += `<h${level}>${model.heading}</h${level}>`;
                    continue;
                }
                if (name == 'notes') {
                    var value = data[model.name] && data[model.name][name] || '';
                    html += `<textarea class="wide" rows="5" name="notes" placeholder="${datum.default}" title="${datum.label}" ${mode == 'edit' ? '' : ' readonly'}>${value || ''}</textarea>`;
                    continue;
                }
                if (typeof datum == 'string') {
                    html += `<label class="wide">${datum}</label>`;
                    continue;
                }
                if (name == 'parameters') {
                    html += `<section name="${parentName}">${/*await*/ Model.render(datum, mode, data[parentName], level + 1)}</section>`;
                    continue;
                }
                if (datum.labels) {
                    html += `<section name="${name}"><table class="wide"><caption>${datum.heading || ''}</caption><thead><tr><th></th>`;
                    for (var column of datum.labels)
                        html += `<th>${column}</th>`;
                    html += '</tr></thead><tbody>';
                    var cols = datum.labels.length;
                    for (var parameter in datum.parameters) {
                        var datum2 = datum.parameters[parameter],
                            attributes = (datum2.attributes || '') + (Model.um(datum2.um).attributes || '') + (mode == 'edit' ? '' : ' readonly');
                        html += `<tr><th>${datum2.label || ''}${Model.um(datum2.um).label ? ' [' + Model.um(datum2.um).label + ']' : ''}</th>`;
                        for (var i = 0; i < cols; ++i) {
                            if ((datum2.default || '').startsWith('=') && mode != 'analyze') {
                                html += `<td><output name="${parameter}" ${attributes} data-formula="${datum2.default}"></output></td>`;
                            } else {
                                var value = (data[name] && data[name][parameter]) ? (data[name][parameter][i] != null ? data[name][parameter][i] : '') : '';
                                if (mode == '') {
                                    html += `<td style="font-family:monospace">${value}<input name="${parameter}" type="hidden" value="${value || ''}"></td>`;
                                } else if (datum2.type == 'textarea') {
                                    html += `<textarea name="${name}" placeholder="${datum2.default || ''}" ${attributes}>${value || ''}</textarea>`;
                                } else if (mode != 'analyze' && datum2.default && (datum2.default.indexOf(',') != -1 || datum2.default[0] == '?')) {
                                    html += `<td><select name="${parameter}"><option></option>`;
                                    if (datum2.default[0] == '?')
                                        datum2.default = /*await*/ Model.fetchOptions('/' + location.search + '&*r=1890&fClass=' + datum2.default);
                                    datum2.default.split(',').forEach(itm =>
                                        html += `<option ${itm == value ? 'selected' : ''}>${itm}</option>`
                                    );
                                    html += '</select></td>';
                                } else
                                    html += `<td><input name="${parameter}" type="${mode == 'analyze' ? 'checkbox' : (Model.um(datum2.um).type || '')}" placeholder="${datum2.default || ''}" value="${value || ''}" ${attributes}></td>`;
                            }
                        }
                        html += '</tr>';
                    }
                    html += '</tbody></table></section>';
                    continue;
                }
                var attributes = (datum.attributes || '') + (Model.um(datum.um).attributes || '') + (mode == 'edit' ? '' : ' readonly');
                if ((datum.default || '').startsWith('=') && mode != 'analyze') {
                    html += `<label>
                    <header></header>
                    <span>${datum.label || ''}${Model.um(datum.um).label ? ' [' + Model.um(datum.um).label + ']' : ''}</span>
                    <output name="${name}" ${attributes} data-formula="${datum.default}"></output>
                    <span style="color:red">${datum.note || ''}</span>
                    </label>`;
                } else {
                    var value = data[name] || (data[name] != null ? data[name] : '');
                    html += `<label ${datum.header ? 'class="wide"' : ''}>
                    <header>${datum.header || ''}</header>
                    <span>${datum.label || ''}${Model.um(datum.um).label ? ' [' + Model.um(datum.um).label + ']' : ''}</span>`;

                    if (mode == '') {
                        html += `<span style="min-width:5rem; font-family:monospace">${value || ''}</span><input name="${name}" type="hidden" value="${value || ''}">`;
                    } else if (datum.type == 'textarea') {
                        html += `<textarea name="${name}" placeholder="${datum.default || ''}" ${attributes}>${value || ''}</textarea>`;
                    } else if (mode != 'analyze' && datum.default && (datum.default.indexOf(',') != -1 || datum.default[0] == '?')) {
                        html += `<select name="${name}"><option></option>`;
                        if (datum.default[0] == '?')
                            datum.default = /*await*/ Model.fetchOptions('/' + location.search + '&*r=1890&fClass=' + datum.default);
                        datum.default.split(',').forEach(itm =>
                            html += `<option ${itm == value ? 'selected' : ''}>${itm}</option>`
                        );
                        html += '</select>';
                    } else
                        html += `<input name="${name}" type="${mode == 'analyze' ? 'checkbox' : (Model.um(datum.um).type || '')}" placeholder="${datum.default || ''}" value="${value || ''}" ${attributes}>`;

                    if (datum.note)
                        html += `<span style="color:black; padding-left:0.5rem;">${datum.note}</span>`;
                    html += '</label>';
                }
            }

            if (level == 1)
                html += '</form>';
            else
                return `${html}`;
        }
        return `<div>${html}</div>`;
    },
    save: (form) => {
        var data = {};
        for (var input of form)
            if (!input.hasAttribute('disabled')) {
                var value = form.dataset.mode == 'edit' ? input.value : input.checked;
                if (input.type == 'number')
                    value = parseFloat(value);

                var subdata = locateData(input);
                if (typeof subdata[input.name] == 'undefined')
                    subdata[input.name] = value;
                else if (Array.isArray(subdata[input.name]))
                    subdata[input.name].push(value);
                else
                    subdata[input.name] = new Array(subdata[input.name], value);
            }

        if (form.dataset.mode == 'edit') {
            data.title = modelData.modules[Object.keys(data)[0]].heading;
            data.operator = data[Object.keys(data)[0]].operator || "";
            data.date = data[Object.keys(data)[0]].recorded;
            data.status = form.reportValidity() ? "x" : "o";
        }

        Model.data.value = JSON.stringify(data);
        localStorage.data = Model.data.value;
        form.applyFormulas(form);

        function locateData(input) {
            var hierarchy = [], structure = data;
            for (var section = input.closest('section[name]'); section; section = section.parentElement.closest('section[name]'))
                hierarchy.unshift(section.getAttribute('name'))
            hierarchy.forEach(element => {
                if (!structure[element])
                    structure[element] = {};
                structure = structure[element];
            });
            return structure;
        }
    }
};
