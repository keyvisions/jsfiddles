/*
** Author: Giancarlo Trevisan
** Date: 2025/03/17
** Description: Object parametrizer. Allow to add parameters to an object
** Usage: <kv-params name="parameters"></kv-params>
*/
class kvParams extends HTMLElement {
	static observedAttributes = ['schema', 'lang', 'mode', 'um', 'sheet', 'src']; // mode = [ *show | edit | manage ] um = [ *msu | isu ]

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
		'delete': { en: 'You sure you want to delete the paramter?', it: 'Sicuri di voler eliminare il parametro?' },
		'optionless': { en: 'This parameter has not options', it: 'Questo parametro non prevede opzioni' },
		'norange': { en: 'There are no parameters that require a range', it: 'Non ci sono parametri che richiedono un intervallo' }
	};
	static #Flags = [
		{ en: 'Described', it: 'Descrittivo', icon: 'fas fa-fw fa-font' },
		{ en: 'Searched', it: 'Ricercabile', icon: 'fas fa-fw fa-search' },
		{ en: 'Sampled', it: 'Campionato', icon: 'fas fa-fw fa-code-branch' },
		{ en: 'Imported', it: 'Importato', icon: 'fas fa-fw fa-file-download' },
		{ en: 'Technical sheet', it: 'Dati tecnici', icon: 'fas fa-fw fa-drafting-compass' },
		{ en: 'Sales sheet', it: 'Dati commerciali', icon: 'fas fa-fw fa-book-open' },
		{ en: 'Production sheet', it: 'Dati produttivi', icon: 'fas fa-fw fa-tools' },
		{ en: 'Test sheet', it: 'Dati collaudo', icon: 'fas fa-fw fa-tachometer-alt' },
		{ en: 'Logistics sheet', it: 'Dati logistici', icon: 'fas fa-fw fa-truck-loading' },
		{ en: 'Plate', it: 'Dati Targa', icon: 'fas fa-fw fa-qrcode' },
		{ en: 'Required', it: 'Obbligatorio', icon: 'fas fa-fw fa-exclamation' },
	];

	Lang = 'en';
	UM = 'msu';
	Schema = [];
	Data = {};

	constructor() {
		super();

		this.Schema = JSON.parse(this.innerText || "[]");

		this.addEventListener('mouseup', event => {
			const target = event.target;

			target.closest('tbody')?.querySelector('.selected')?.classList.remove('selected');
			target.closest('tr')?.classList.add('selected');

			if (target.classList.contains('add')) {
				const row = this.#newRow(target.closest('tr'));
				row.scrollIntoView({ block: 'nearest' });
			} else if (target.classList.contains('remove') && target.closest('tbody')?.children.length != 1 && (event.ctrlKey || confirm(kvParams.#Texts.delete[this.Lang]))) {
				target.closest('tr').remove();
			} else if (target.getAttribute('name') == 'flags') {
				target.classList.toggle('deselected');
				const flags = parseInt(target.closest('td').firstElementChild.value);
				target.closest('td').firstElementChild.value = target.classList.contains('deselected') ? flags & ~(1 << target.getAttribute('value')) : flags | (1 << target.getAttribute('value'));
			} else if (target.name == 'manageOptions') {
				this.#manageParamsOptions(event);
			} else if (target.classList.contains('range')) {
				const options = '[' +
					(target.form.min.value || 'null') + ',' +
					(target.form.max.value || 'null') + ',' +
					(target.form.decimals.value || 'null') + ',' +
					target.form.NA.checked +
					']';
				target.options.value = options;
				target.closest('dialog').remove();
			} else if (target.classList.contains('options')) {
				target.closest('dialog').remove();
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

	async #fetchData(src) {
		if (this.Schema.length == 0)
			await fetch(src).then(res => res.json()).then(data => this.Schema = data || []).catch(() => this.Schema = []);
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue == newValue)
			return;

		//await this.#fetchData('UM', './um.json');

		switch (name) {
			case 'lang': this.Lang = newValue; break;
			case 'um': this.UM = newValue; break;
			case 'schema': kvParams.Parameters = []; await this.#fetchData(newValue); break;
		}
		if (name != 'mode')
			name = 'mode', newValue = this.getAttribute('mode');

		this.innerHTML = '';
		switch (newValue) {
			case 'manage': this.#loadSchema(); break;
			case 'edit': this.#showParams(true); break;
			default: this.#showParams(false);
		}
	}

	#loadSchema() {
		const html =
			`<input type="hidden" name="${this.getAttribute('name')}">` +
			`<table id="kv-params">` +
			`<thead>` +
			`<tr>` +
			`<th></th>` +
			`<th>${kvParams.#Texts.type[this.Lang]}</th>` +
			`<th style="width:100%">${kvParams.#Texts.label[this.Lang]}</th>` +
			`<th>${kvParams.#Texts.um[this.Lang]}</th>` +
			`<th></th>` +
			`<th style="white-space:nowrap">${kvParams.#Flags.map(el => `<i class="${el.icon}" title="${el[this.Lang]}"></i>`).join(' ')}</th>` +
			`<th></th>` +
			`</tr>` +
			'</thead>' +
			`<tbody>` +
			`<tr>` +
			`<td style="white-space:nowrap"><input form="kv-params" type="hidden" name="id"><i class="fas fa-grip-vertical"></i></td>` +
			`<td>` +
			`<select form="kv-params" title="Type" name="type">` +
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
			`<td><input form="kv-params" type="hidden" name="options"><button name="manageOptions">...</button></td>` +
			`<td style="white-space:nowrap">` +
			`<input form="kv-params" type="hidden" name="flags">` +
			kvParams.#Flags.map((flag, i) => `<i class="${flag.icon}" name="flags" value="${i}" title="${flag[this.Lang]}"></i>`).join(' ') +
			`</td>` +
			`<td style="white-space:nowrap"><i class="far fa-trash-alt remove"></i> <i class="fas fa-plus add"></i></td>` +
			`</tr>` +
			`</body>` +
			`</table>`;
		this.insertAdjacentHTML('afterbegin', html);

		this.Schema.forEach(param => {
			const row = this.#newRow(this.querySelector('tbody tr:last-child'));
			row.querySelectorAll("input,select").forEach(el => {
				if (el.name == 'label') {
					el.dataset.value = JSON.stringify(param.label);
					el.value = param.label[this.Lang];
				} else if (el.name == 'flags') {
					el.value = param.flags;
					for (let i = 0; i < kvParams.#Flags.length; ++i) {
						if ((param.flags & (1 << i)))
							row.querySelector(`i[name="flags"][value="${i}"]`).classList.remove('deselected');
						else
							row.querySelector(`i[name="flags"][value="${i}"]`).classList.add('deselected');
					}
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
		row.querySelector("input[name=id]").value = ''; // Clear id
		sibling.insertAdjacentElement('afterend', row);
		return row;
	}
	#manageParamsOptions(event) {
		const row = event.target.closest('tr');
		const um = this.#findId(UMS, row.querySelector('[name=um]').value);

		row.closest('tbody').querySelector('.selected')?.classList.remove('selected');
		row.closest('tbody').classList.add('selected');
		row.classList.add('selected');

		let html = '', options;
		switch (row.querySelector('[name=type]').value) {
			case 'number':
				try {
					options = JSON.parse(row.querySelector('[name=options]').value || '[null,null,null,false]');
				} catch {
					options = [null, null, null, false];
				}
				html =
					`<dialog id="kv-params-dialog" onkeydown="if (event.key=='Escape') this.close()" onclose="this.remove()">` +
					`<header onclick="this.closest('dialog').close()">${row.querySelector('[name=label]').value} (${um.msu})</header><form>` +
					`<label><span>Min</span> <input type="number" name="min" step="any" value="${options[0]}"></label>` +
					`<label><span>Max</span> <input type="number" name="max" step="any" value="${options[1]}"></label>` +
					`<label><span>Decimals</span> <input type="number" name="decimals" min="0" max="5" step="1" value="${options[2]}"></label>` +
					`<p style="margin:0.5rem 0"><label><input type="checkbox" name="flag" ${options[3] ? 'checked' : ''}> Allow Not applicable (NA)</label></p>` +
					`<button type="button" class="range" id="kv-params-options" style="float:right">Save</button>` +
					`</form></dialog>`;
				break;

			case 'select':
				try {
					options = JSON.parse(row.querySelector('[name=options]').value || '["", "", false]');
				} catch {
					options = [row.querySelector('[name=options]').value, '', false];
				}
				html =
					`<dialog id="kv-params-dialog" onkeydown="if (event.key=='Escape') this.close()" onclose="this.remove()">` +
					`<header onclick="this.closest('dialog').close()">${row.querySelector('[name=label]').value}</header><form>` +
					`<div style="display:flex; gap:1em;">` +
					`<label><span>${um?.msu || 'en'}</span> <textarea name="options" rows="10">${options[0].replaceAll(',', '\n')}</textarea></label>` +
					`<label class="IT${options[2] ? '' : ' hide'}"><span>${um?.isu || 'it'}</span> <textarea name="options" rows="10">${options[1].replaceAll(',', '\n')}</textarea></label>` +
					`</div>` +
					(um != undefined ? '' : `<p style="margin:0.5rem 0"><label><input type="checkbox" name="flag" ${options[2] ? 'checked' : ''} onclick="this.closest('dialog').querySelector('.IT').classList.toggle('hide')"> Multilingual</label></p>`) +
					`<button type="button" class="options" id="kv-params-options" style="float:right">Save</button>` +
					`</form></dialog>`;
				break;

			default:
				alert(kvParams.#Texts.optionless[this.Lang]);
				return;
		}

		if (html) {
			this.insertAdjacentHTML('beforeend', html);
			document.getElementById('kv-params-options').options = row.querySelector('[name=options]');
			document.getElementById('kv-params-dialog').showModal();
		}
	}
	#showParams(editable = false) {
		const sheet = parseInt(this.getAttribute('sheet')) || 5;
		let html = `<h2><i class="${kvParams.#Flags[sheet].icon}"></i> ${kvParams.#Flags[sheet][this.Lang]}</h2><div>`, group = false;

		this.Schema.forEach(param => {
			const ums = this.#findId(UMS, param.um);
			const um = param.um ? '[' + (ums[editable ? 'msu' : this.UM] || ums.msu) + ']' : '';

			const value = (this.UM != 'msu' ? ums.convert(this.Data[`P${param.id}`]) : this.Data[`P${param.id}`]) || '';

			if (param.flags & (1 << sheet)) {
				if (!editable || Object.keys(this.Data).length)
					switch (param.type) {
						case 'number':
							html += `<label><span>${param.label[this.Lang]} ${um}</span><input type="number" ${attributes(param)} value="${value}"></label>`;
							break;
						case 'date':
							html += `<label><span>${param.label[this.Lang]}</span><input type="date" ${attributes(param)} value="${value}"></label>`;
							break;
						case 'checkbox':
							html += `<label><input type="checkbox" ${attributes(param)} ${value ? 'checked' : ''}"> ${param.label[this.Lang]}</label>`;
							break;
						case 'select':
							html += `<label><span>${param.label[this.Lang]} ${um}</span><select ${attributes(param)} value="${value}">${param.options.split(',').map(option => `<option>${option}</option>`)}</select></label>`;
							break;
						case 'textarea':
							html += `<label class="full-width"><span>${param.label[this.Lang]} ${param.um ? `[${param.um}]` : ''}</span><textarea ${attributes(param)}>${value}</textarea></label>`;
							break;
						case 'separator':
							html += '<hr class="full-width">';
							break;
						case 'group':
							if (param.label[this.Lang] != '')
								html += `${group ? '</fieldset>' : ''}<fieldset class="full-width"><legend>${param.label[this.Lang]}</legend>`, group = true;
							else
								html += '<hr class="full-width">';
							break;
						default:
							html += `<label><span>${param.label[this.Lang]} ${um}</span><input type="${param.type}" ${attributes(param)} value="${value}"></label>`;
					}
				else if (param.type == 'number' && um)
					html += `<label><span>${param.label[this.Lang]} [${this.#findId(UMS, param.um).msu}]</span>[<input type="number" name="Pm${param.id}" step="any" placeholder="min">, <input type="number" name="PM${param.id}" step="any" placeholder="max">]</label>`;
			}
		});
		html += (group ? '</fieldset>' : '') + '</div>';
		this.insertAdjacentHTML('afterbegin', html);

		if (!editable)
			this.querySelectorAll('input, select, textarea').forEach(el => el.setAttribute('disabled', ''));

		function attributes(param) {
			return `name="P${param.id}" ${(param.flags & (1 << 10)) == 0 ? '' : 'required'}`;
		}
	}
	#findId(array, id) { return array.find(el => el.id == id) }

	save() {
		if (this.querySelector('tbody')) {
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
					} else
						param[el.name] = el.value;
				});
				this.Schema.push(param);
			});
			this.firstElementChild.value = JSON.stringify(this.Schema);
	
			return this.firstElementChild.value;
		} else {
			this.querySelectorAll('input, select, textarea').forEach(el => {
				if (el.type == 'checkbox')
					this.Data[el.name] |= el.checked ? (1 << parseInt(el.value)) : 0;
				else if (el.type == 'number')
					this.Data[el.name] = parseFloat(el.value);
				else if (el.hasAttribute('data-value')) {
					this.Data[el.name] = JSON.parse(el.dataset.value || '{"en":null,"it":null}');
					this.Data[el.name][this.Lang] = el.value;
				} else
					this.Data[el.name] = el.value;
			});
			return JSON.stringify(this.Data);
		}
	}
	search() { }
}
customElements.define('kv-params', kvParams);