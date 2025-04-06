/*
** Author: Giancarlo Trevisan
** Date: 2025/03/17
** Description: Object parametrizer. Allow to add parameters to an object
** Usage: <kv-params name="parameters"></kv-params>
*/
class kvParams extends HTMLElement {
	static observedAttributes = ['schema', 'data', 'mode', 'um', 'sheet', 'lang']; // mode = [ *show | edit | range | manage ] um = [ *msu | isu ]
	static #Texts = {
		'type': { en: 'Type', it: 'Tipo' },
		'label': { en: 'Label', it: 'Etichetta' },
		'um': { en: 'U.M.', it: 'U.M.' },
		'flags': { en: 'Attributes', it: 'Attributi' },
		'number': { en: 'Number', it: 'Numero' },
		'text': { en: 'Text', it: 'Testo' },
		'date': { en: 'Date', it: 'Data' },
		'select': { en: 'Selection', it: 'Selezione' },
		'checkbox': { en: 'Checkbox', it: 'Checkbox' },
		'textarea': { en: 'Notes', it: 'Note' },
		'group': { en: 'Group', it: 'Gruppo' },
		'separator': { en: 'Line', 'it': 'Linea' },
		'delete': { en: 'You sure you want to delete the parameter?', it: 'Sicuri di voler eliminare il parametro?' },
		'optionless': { en: 'Options are not applicabile to $1 parameters.', it: 'Le opzioni non sono applicabili ai parametri $1.' },
		'samples': { en: 'Samples', it: 'Misurazioni' },
		'sampleRemove': { en: 'Sure you want to delete the sample?', it: 'Sicuri di voler eliminare la misurazione?' },
		'na': { en: 'Allow Not Applicable (NA)', it: 'Consenti Non Applicabile (NA)' },
		'decimals': { en: 'Decimals', it: 'Decimali' },
		'save': { en: 'Save', it: 'Salva' },
		'pair': { en: 'Pair', it: 'Accoppia' },
		'new': { en: 'New parameter', it: 'Nuovo parametro' }
	};
	static #Flags = [
		{ en: 'Described', it: 'Descrittivo', icon: 'fas fa-font' },
		{ en: 'Searched', it: 'Ricercabile', icon: 'fas fa-search' },
		{ en: '', it: '', icon: '' }, // Available
		{ en: 'Imported', it: 'Importato', icon: 'fas fa-wifi' },
		{ en: 'Technical sheet', it: 'Dati tecnici', icon: 'fas fa-drafting-compass' },
		{ en: 'Sales sheet', it: 'Dati commerciali', icon: 'fas fa-handshake' },
		{ en: 'Production sheet', it: 'Dati produttivi', icon: 'fas fa-tools' },
		{ en: 'Test sheet', it: 'Dati collaudo', icon: 'fas fa-tachometer-alt' },
		{ en: 'Logistics sheet', it: 'Dati logistici', icon: 'fas fa-truck-loading' },
		{ en: 'Plate', it: 'Dati Targa', icon: 'fas fa-qrcode' },
		{ en: 'Required', it: 'Obbligatorio', icon: 'fas fa-exclamation' }
	];
	Schema = [];
	Data = {};
	Sheet = 4;
	UM = 'msu';
	Lang = 'en';

	static findId(array, id) { return array.find(el => el.id == id) }
	static sizeArray(arr = [], size = 1) {
		if (size <= arr.length)
			return arr.slice(0, size);
		return arr.concat(new Array(size - arr.length).fill());
	}

	constructor() {
		super();

		this.Schema = JSON.parse(this.innerText || "[]");

		this.addEventListener('mouseup', event => {
			const target = event.target;

			target.closest('tbody')?.querySelector('.selected')?.classList.remove('selected');
			if (target.closest('tbody'))
				target.closest('tr')?.classList.add('selected');

			if (target.classList.contains('samples')) {
				const colspan = this.querySelectorAll('tfoot th').length + 1;

				if (colspan > 6)
					return; // Limit number of samples to 5

				this.querySelector('thead [colspan]').setAttribute('colspan', colspan);

				const count = this.querySelectorAll('tbody tr').length;
				this.querySelectorAll('tbody tr').forEach(row => {
					if (row.firstElementChild.hasAttribute('colspan'))
						row.firstElementChild.setAttribute('colspan', colspan)
					else {
						const node = row.lastElementChild.cloneNode(true);
						node.firstElementChild.value = '';
						node.firstElementChild.checked = false;
						node.firstElementChild.setAttribute('tabindex', count + parseInt(node.firstElementChild.getAttribute('tabindex')));
						row.lastElementChild.insertAdjacentElement('afterend', node);
					}
				});
				if (colspan > 2) {
					this.querySelector('tfoot tr').lastElementChild.innerText = '';
					this.querySelector('tfoot tr').lastElementChild.insertAdjacentHTML('afterend', '<th><i class="far fa-trash-alt sampleRemove"></i></th>');
				}
			} else if (target.classList.contains('sampleRemove')) {
				if (!confirm(kvParams.#Texts.sampleRemove[this.Lang]))
					return;

				const colspan = this.querySelectorAll('tfoot th').length - 1;
				this.querySelector('thead [colspan]').setAttribute('colspan', colspan);

				this.querySelectorAll('tbody tr').forEach(row => {
					if (row.firstElementChild.hasAttribute('colspan'))
						row.firstElementChild.setAttribute('colspan', colspan)
					else
						row.lastElementChild.remove();
				});
				if (colspan == 2)
					this.querySelector('tfoot tr').lastElementChild.remove();
				else
					this.querySelector('tfoot tr').lastElementChild.previousElementSibling.remove();
			} else if (target.classList.contains('add')) {
				const row = this.#newRow(target.closest('tr'));
				row.scrollIntoView({ block: 'nearest' });
			} else if (target.classList.contains('remove') && target.closest('tbody')?.children.length != 1 && (event.ctrlKey || confirm(kvParams.#Texts.delete[this.Lang]))) {
				target.closest('tr').remove();
			} else if (target.classList.contains('manageOptions')) {
				this.#manageOptions(event);
			} else if (target.getAttribute('name') == 'flags') {
				target.classList.toggle('deselected');
				const flags = parseInt(target.closest('td').firstElementChild.value);
				target.closest('td').firstElementChild.value = target.classList.contains('deselected') ? flags & ~(1 << target.getAttribute('value')) : flags | (1 << target.getAttribute('value'));
			} else if (target.classList.contains('range')) {
				const range = [parseInt(target.form.min.value) || null, parseInt(target.form.max.value) || null, parseInt(target.form.decimals.value) || null, target.form.flag.checked];
				if (target.options.hasAttribute('range')) {
					target.options.setAttribute('range', JSON.stringify(range));
					target.options.setAttribute('min', range[0]);
					target.options.setAttribute('max', range[1]);
					target.options.setAttribute('step', range[2] == null ? 'any' : Math.pow(10, -range[2]));
				} else
					target.options.value = JSON.stringify(range);

				target.closest('dialog').remove();
			} else if (target.classList.contains('options')) {
				target.options.value = target.form.options.value;
				target.closest('dialog').remove();
			} else if (target.dataset.flag) {
				if (!target.classList.contains('set')) {
					this.querySelectorAll('th i.set').forEach(el => el.classList.remove('set'));
					target.classList.toggle('set');
					this.querySelectorAll('tbody input[name=flags]').forEach(el => {
						el.closest('tr').style.display = (parseInt(el.value) & (1 << parseInt(target.dataset.flag))) && target.classList.contains('set') ? '' : 'none';
					});
				} else {
					target.classList.remove('set');
					this.querySelectorAll('tbody tr').forEach(el => el.style.display = '');
				}
			}
		});
		this.addEventListener('focusin', event => {
			const target = event.target;
			this?.querySelector('tbody tr.selected')?.classList.remove('selected');
			if (target.closest('tbody'))
				target.closest('tr')?.classList.add('selected');
		});
		this.addEventListener('focusout', this.querySelector('tbody tr.selected')?.classList.remove('selected'));
		document.addEventListener('keyup', event => {
			if (event.key == 'Enter' && event.target.classList.contains('manageOptions'))
				this.#manageOptions(event);
			else if (this.getAttribute('mode') == 'manage' && event.altKey && (event.key == 'ArrowUp' || event.key == 'ArrowDown')) {
				const row = this.querySelector('tbody tr.selected');
				if (event.key == 'ArrowUp' && row.previousElementSibling) {
					let prevRow = row.previousElementSibling
					while (prevRow?.style.display == 'none')
						prevRow = prevRow.previousElementSibling;
					row.parentNode.insertBefore(row, prevRow);
				} else if (row.nextElementSibling) {
					let nextRow = row.nextElementSibling;
					while (nextRow?.style.display == 'none')
						nextRow = nextRow.nextElementSibling;
					row.parentNode.insertBefore(nextRow || row.parentNode.firstElementChild, row);
				}
			}
		});

		// deno-lint-ignore no-this-alias
		let el = this;
		while (el) {
			if (el.lang)
				break;
			el = el.parentElement;
		}
		this.Lang = kvParams.#Flags[0][el.lang] ? el.lang.substring(0, 2) : 'en';
	}
	async #fetchData(name, json) {
		if (name == 'schema' && this.Schema.length == 0)
			await fetch(json).then(res => res.json()).then(data => this.Schema = data || []).catch(() => this.Schema = []);
		else if (name == 'data')
			await fetch(json).then(res => res.json()).then(data => this.Data = data || {}).catch(() => this.Data = {});
	}
	async attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue)
			this.save();

		switch (name) {
			case 'sheet': this.Sheet = parseInt(newValue); break;
			case 'lang': this.Lang = newValue; break;
			case 'um': this.UM = newValue; break;
			case 'schema': await this.#fetchData(name, newValue); break;
			case 'data': await this.#fetchData(name, newValue); break;
		}
		if (name != 'mode')
			name = 'mode', newValue = this.getAttribute('mode');

		this.innerHTML = '';
		if (newValue == 'manage')
			this.#manageSchema();
		else
			this.#manageSheet(newValue);
	}
	#manageSchema() {
		const html =
			`<input type="hidden" name="${this.getAttribute('name')}">` +
			`<table class="schema">` +
			`<thead>` +
			`<tr>` +
			`<th>${kvParams.#Texts.type[this.Lang]}</th>` +
			`<th style="width:100%">${kvParams.#Texts.label[this.Lang]}</th>` +
			`<th>${kvParams.#Texts.um[this.Lang]}</th>` +
			`<th></th>` +
			`<th style="white-space:nowrap">${kvParams.#Flags.map((el, i) => `<i class="${el.icon}" title="${el[this.Lang]}" data-flag="${i}"></i>`).join(' ')}</th>` +
			`<th></th>` +
			`</tr>` +
			'</thead>' +
			`<tbody>` +
			`<tr>` +
			`<td><input form="kv-params" type="hidden" name="id"><select form="kv-params" title="Type" name="type">` +
			`<option value="number">${kvParams.#Texts.number[this.Lang]}</option>` +
			`<option value="text">${kvParams.#Texts.text[this.Lang]}</option>` +
			`<option value="date">${kvParams.#Texts.date[this.Lang]}</option>` +
			`<option value="select">${kvParams.#Texts.select[this.Lang]}</option>` +
			`<option value="checkbox">${kvParams.#Texts.checkbox[this.Lang]}</option>` +
			`<option value="textarea">${kvParams.#Texts.textarea[this.Lang]}</option>` +
			`<option value="group">${kvParams.#Texts.group[this.Lang]}</option>` +
			`<option value="separator">${kvParams.#Texts.separator[this.Lang]}</option>` +
			`</select>` +
			`</td>` +
			`<td><input form="kv-params" name="label" title="Label" data-value style="width: -webkit-fill-available"></td>` +
			`<td>` +
			`<select form="kv-params" name="um" title="UM">` +
			`<option></option>` +
			UMS.map(um => `<option value="${um.id}">${um.msu} ${um.isu?.replace(/(.*)/, ' [$1]') || ''}</option>`).join('') +
			`</select>` +
			`</td>` +
			`<td><input form="kv-params" type="hidden" name="options"><i class="fas fa-sliders-h manageOptions" ref="options" tabindex="0"></i></td>` +
			`<td style="white-space:nowrap">` +
			`<input form="kv-params" type="hidden" name="flags">` +
			kvParams.#Flags.map((flag, i) => `<i class="${flag.icon}" name="flags" value="${i}" title="${flag[this.Lang]}" tabindex="0"></i>`).join(' ') +
			`</td>` +
			`<td style="white-space:nowrap"><i class="far fa-trash-alt remove" tabindex="0"></i> <i class="fas fa-plus add" tabindex="0"></i></td>` +
			`</tr>` +
			`</body>` +
			`</table>`;
		this.insertAdjacentHTML('afterbegin', html);

		this.querySelector(`i[data-flag="${this.Sheet}"]`)?.classList.toggle('set');
		this.Schema.forEach(param => {
			const row = this.#newRow(this.querySelector('tbody tr:last-child'));
			row.style.display = (param.flags & (1 << this.Sheet)) ? '' : 'none';

			row.querySelectorAll("input,select").forEach(el => {
				if (el.name == 'label') {
					el.dataset.value = JSON.stringify(param.label); // Save dual language
					el.value = param.label[this.Lang]; // Show current language
				} else if (el.name == 'flags') {
					el.value = param.flags;
					for (let i = 0; i < kvParams.#Flags.length; ++i) {
						if ((param.flags & (1 << i)))
							row.querySelector(`i[name="flags"][value="${i}"]`).classList.remove('deselected');
						else
							row.querySelector(`i[name="flags"][value="${i}"]`).classList.add('deselected');
					}
				} else if (el.name == 'options') {
					el.value = JSON.stringify(param.options);
					if (param.options.join('') == '')
						el.nextElementSibling.classList.remove('set');
					else
						el.nextElementSibling.classList.add('set');
				} else if (el.type == 'checkbox')
					el.checked = (param[el.name] & (1 << parseInt(el.value))) == 0 ? false : true;
				else
					el.value = param[el.name];
			});
		});
		if (this.Schema.length > 0)
			this.querySelector('tbody tr').remove();
		this.firstElementChild.value = JSON.stringify(this.Schema);
		this.scrollIntoView({ block: 'nearest' });
	}
	#newRow(sibling) {
		const row = sibling.cloneNode(true);
		row.querySelector('select').value = 'number';
		row.querySelector('input[name="id"]').value = this.Schema.reduce((maxId, el) => Math.max(maxId, parseInt(el.id)), 0) + 1;
		row.querySelector('input[name="label"]').setAttribute('data-value', JSON.stringify(kvParams.#Texts.new));
		row.querySelector('input[name="label"]').value = kvParams.#Texts.new[this.Lang];
		row.querySelector('select[name="um"]').value = '';
		row.querySelector('input[name="options"]').value = '';
		sibling.insertAdjacentElement('afterend', row);
		sibling.classList.remove('selected');
		return row;
	}
	#manageOptions(event) {
		const row = event.target.closest('tr');
		const um = kvParams.findId(UMS, row.querySelector('[name=um]')?.value || event.target.getAttribute('um'));

		row.closest('tbody').querySelector('.selected')?.classList.remove('selected');
		row.closest('tbody').classList.add('selected');
		row.classList.add('selected');

		let html = '', options, param;
		switch (row.querySelector('[name=type]')?.value || 'number') {
			case 'number':
				if (event.target.getAttribute('ref') == 'options')
					options = JSON.parse(row.querySelector('[name="options"]')?.value || '[null, null, null, false]');
				else {
					param = kvParams.findId(this.Schema, event.target.getAttribute('ref').substring(1));
					try {
						options = JSON.parse(row.querySelector(`[name=${event.target.getAttribute('ref')}]`)?.getAttribute('range')) || param?.options;
					} catch {
						options = param?.options;
					}
				}
				options[0] = parseInt(options[0]) || '';
				options[1] = parseInt(options[1]) || '';
				options[2] = parseInt(options[2]) || '';
				options[3] = options[3] || '';
				html =
					`<dialog id="kv-params-dialog" onkeydown="if (event.key=='Escape') this.close()" onclose="this.remove()">` +
					`<header onclick="this.closest('dialog').close()">`;
				if (row.querySelector('[name=label]'))
					html += `${row.querySelector('[name=label]').value} +  [${um?.msu}]`
				else
					html += row.firstElementChild.innerText;
				html += `</header><form>` +
					`<label><span>Min</span> <input type="number" name="min" step="any" value="${options[0]}"></label>` +
					`<label><span>Max</span> <input type="number" name="max" step="any" value="${options[1]}"></label>` +
					`<label><span>${kvParams.#Texts.decimals[this.Lang]}</span> <input type="number" name="decimals" min="0" max="5" step="1" value="${options[2]}"></label>` +
					`<p style="margin:0.5rem 0"><label><input type="checkbox" name="flag" ${options[3] ? 'checked' : ''}> ${kvParams.#Texts.na[this.Lang]}</label></p>` +
					`<button type="button" class="range" ref="${event.target.getAttribute('ref')}" id="kv-params-options" style="float:right">${kvParams.#Texts.save[this.Lang]}</button>` +
					`</form></dialog>`;
				break;

			case 'select':
				try {
					options = JSON.parse(row.querySelector('[name=options]').value || '["", ""]');
				} catch {
					options = [row.querySelector('[name=options]').value, ''];
				}
				html =
					`<dialog id="kv-params-dialog" onkeydown="if (event.key=='Escape') this.close()" onclose="this.remove()">` +
					`<header onclick="this.closest('dialog').close()">${row.querySelector('[name=label]').value}</header><form>` +
					`<kv-pair name="options" src="${row.querySelector('[name=options]').value.replaceAll('"', '&quot;')}"></kv-pair>` +
					`<input type="checkbox" ${options[1] ? 'checked' : ''} onchange="this.previousElementSibling.setAttribute('pair', this.checked)"><label> ${kvParams.#Texts.pair[this.Lang]}</label><br>` +
					`<button type="button" ref="${event.target.getAttribute('ref')}" class="options" id="kv-params-options" style="float:right">${kvParams.#Texts.save[this.Lang]}</button>` +
					`</form></dialog>`;
				break;

			default:
				alert(kvParams.#Texts.optionless[this.Lang].replace('$1', row.querySelector('[name=type]').value));
				return;
		}

		if (html) {
			this.insertAdjacentHTML('beforeend', html);
			document.getElementById('kv-params-options').options = row.querySelector('[name=options]') || event.target.previousElementSibling;
			document.getElementById('kv-params-dialog').showModal();
		}
	}
	#manageSheet(mode) {
		const sheet = parseInt(this.getAttribute('sheet')) || 5;
		let cols = 1, html = '';

		this.Schema.forEach(param => {
			if (param.flags & (1 << sheet) && (mode != 'range' || (mode == 'range' && param.type == 'number')))
				cols = Math.max(cols, this.Data[`P${param.id}`]?.length || 1);
		});

		const count = this.Schema.length;

		this.Schema.forEach((param, j) => {
			if (param.flags & (1 << sheet) && (mode != 'range' || (mode == 'range' && param.type == 'number'))) {
				const ums = kvParams.findId(UMS, param.um);
				const um = param.um ? '[' + (ums[(mode == 'edit' || mode == 'range') ? 'msu' : this.UM] || ums.msu) + ']' : '';

				let options, i;
				switch (param.type) {
					case 'number':
						options = this.Data[`PR${param.id}`] || param.options || [];
						html += `<tr><td title="@${param.id}">${param.label[this.Lang]} ${um}<span>${range(options)}</span></td>`;
						kvParams.sizeArray(this.Data[`P${param.id}`], cols).forEach((value, k) => {
							value = (mode == 'view' && this.UM != 'msu' && typeof ums?.convert == 'function' ? ums.convert(value) : value) || '';
							html += `<td><input type="${mode == 'range' ? 'hidden' : 'number'}" ${attributes(param)} value="${value}" range="${JSON.stringify(options).replaceAll('"', '&quot;')}" tabindex="${k * count + j}">`;
							if (mode == 'range')
								html += `<i class="fas fa-sliders-h manageOptions" ref="P${param.id}" um="${param.um}" tabindex="${k * count + j}"></i>`;
							html += '</td>';
						});
						html += '</tr>';
						break;

					case 'text':
						html += `<tr><td title="@${param.id}">${param.label[this.Lang]}</td>`;
						kvParams.sizeArray(this.Data[`P${param.id}`], cols).forEach((value, k) => {
							html += `<td><input ${attributes(param)} value="${value || ''}" tabindex="${k * count + j}"></td>`;
						});
						html += '</tr>';
						break;

					case 'date':
						html += `<tr><td title="@${param.id}">${param.label[this.Lang]}</td>`;
						kvParams.sizeArray(this.Data[`P${param.id}`], cols).forEach((value, k) => {
							html += `<td><input type="date" ${attributes(param)} value="${value}" tabindex="${k * count + j}"></td>`;
						});
						html += '</tr>';
						break;

					case 'checkbox':
						html += `<tr><td title="@${param.id}">${param.label[this.Lang]}</td>`;
						kvParams.sizeArray(this.Data[`P${param.id}`], cols).forEach((value, k) => {
							html += `<td><input type="checkbox" ${attributes(param)} ${value ? 'checked' : ''} tabindex="${k * count + j}"></td>`
						});
						html += '</tr>';
						break;

					case 'select':
						switch (mode) {
							case 'edit':
								i = this.Lang != 'en' && param.options[1] ? 1 : 0;
								break;
							default:
								i = (this.um == 'isu' || this.Lang != 'en') && param.options[1] ? 1 : 0;
						}
						html += `<tr><td title="@${param.id}">${param.label[this.Lang]} ${um}</td>`;
						kvParams.sizeArray(this.Data[`P${param.id}`], cols).forEach((value, k) => {
							const l = param.options[0]?.split(',').findIndex(option => option == value);
							html += `<td><select ${attributes(param)} tabindex="${k * count + j}"><option></option>${param.options[i]?.split(',').map((option, j) => `<option${l == j ? ' selected' : ''}>${option}</option>`).join('')}</select></td>`
						});
						html += '</tr>';
						break;

					case 'textarea':
						html += `<tr><td colspan="*" title="@${param.id}"><label><span>${param.label[this.Lang]}${param.um ? ` [${param.um}]` : ''}</span><textarea ${attributes(param)} tabindex="${j}">${value}</textarea></label></td></tr>`;
						break;

					case 'separator':
						html += '<tr class="colspan"><td colspan="*"><hr></td></tr>';
						break;

					case 'group':
						html += `<tr class="colspan"><td colspan="*">${param.label[this.Lang]}<hr></td></tr>`;
						break;
				}
			}
		});
		html += `</tbody><tfoot><tr>${'<th></th>'.repeat(cols)}<th>${(sheet == 7 && mode == 'edit' && cols > 1) ? '<i class="far fa-trash-alt sampleRemove"></i>' : ''}</th></tr></tfoot>`;
		this.insertAdjacentHTML('afterbegin',
			`<div><table class="test"><thead><tr><th style="width:100%;text-align:left"><i class="${kvParams.#Flags[sheet].icon}"></i> ${kvParams.#Flags[sheet][this.Lang]}</th><th${(sheet == 7 && (mode == 'edit' || mode == 'range')) ? ` class="samples" colspan="${cols}">${kvParams.#Texts.samples[this.Lang]} <i class="fas fa-plus samples"></i>` : ` colspan="${cols}">`}</th></tr></thead><tbody>` +
			html.replaceAll('colspan="*"', `colspan="${cols + 1}"`) +
			'</table></div>');

		if (mode == 'show')
			this.querySelectorAll('input, textarea, select').forEach(el => el.setAttribute('disabled', ''));

		function attributes(param) {
			const options = param.options;
			let range = '';
			if (param.type == 'number')
				range = `${options[0] ? ` min="${options[0]}"` : ''}${options[1] ? ` max="${options[1]}"` : ''}${options[2] ? ` step="${Math.pow(10, -options[2])}"` : ' step="any"'}`;
			return `name="P${param.id}" ${(param.flags & (1 << 10)) == 0 ? '' : 'required'}${range} form="kvParams"`;
		}
		function range(options) {
			return `${options[0] ? `[${parseFloat(options[0]).toFixed(options[2])}, ` : '(-∞,'} ${options[1] ? `${parseFloat(options[1]).toFixed(options[2])}]` : '+∞)'}`;
		}
	}
	save() {
		if (this.querySelector('.schema') != null) {
			this.Schema = [];
			this.querySelectorAll('tbody tr').forEach(tr => {
				const param = {};
				tr.querySelectorAll('input,select').forEach(el => {
					if (el.type == 'checkbox')
						param[el.name] |= el.checked ? (1 << parseInt(el.value)) : 0;
					else if (el.type == 'number')
						param[el.name] = parseFloat(el.value);
					else if (el.hasAttribute('data-value')) {
						param[el.name] = JSON.parse(el.dataset.value || '{"en":null,"it":null}');
						param[el.name][this.Lang] = el.value;
					} else if (el.name == 'options')
						param.options = JSON.parse(el.value || '[]');
					else if (el.name == 'flags')
						param.flags = parseInt(el.value);
					else
						param[el.name] = el.value;
				});
				this.Schema.push(param);
			});
			this.firstElementChild.value = JSON.stringify(this.Schema);

			return this.firstElementChild.value;
		} else {
			const samples = this.querySelectorAll('tfoot th').length - 1;
			this.querySelectorAll('input, select, textarea').forEach((el, i) => {
				const s = i % samples;
				if (!s) {
					this.Data[el.name] = new Array(samples);
					if (el.type == 'number' || el.type == 'hidden')
						this.Data[el.name.replace('P', 'PR')] = new Array(samples);
				}

				if (el.type == 'checkbox')
					this.Data[el.name][s] = el.checked ? (1 << parseInt(el.value)) : 0;
				else if (el.type == 'number' || el.type == 'hidden') {
					this.Data[el.name][s] = parseFloat(el.value) || null;
					this.Data[el.name.replace('P', 'PR')][s] = JSON.parse(el.getAttribute('range'))[0];
				} else if (el.hasAttribute('data-value')) {
					this.Data[el.name][s] = JSON.parse(el.dataset.value || '{"en":null,"it":null}');
					this.Data[el.name][s][this.Lang] = el.value;
				} else
					this.Data[el.name][s] = el.value;
			});
			return JSON.stringify(this.Data);
		}
	}
}
customElements.define('kv-params', kvParams);