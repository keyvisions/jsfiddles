/*
** Author: Giancarlo Trevisan
** Date: 2024/09/11
** Description: Fetch budget json object and render it
** Usage: <kv-budget data="https://portale.delco.it/export.asp?*p=939&fType=.json" title="Budget"></kv-budget>
*/
class kvBudget extends HTMLElement {
	static observedAttributes = ['title', 'data', 'year'];

	year;
	title;
	budget;

	constructor() {
		super();

		if (!this.getAttribute('year')) {
			year = (new Date()).getFullYear();
			this.setAttribute('year', year);
		} else
			this.year = parseInt(this.getAttribute('year'));

		this.year = this.getAttribute('title') || '';
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case 'data':
				try {
					const url = new URL(newValue);
					url.searchParams.set('year', this.year);
					const res = await fetch(url);
					if (!res.ok)
						throw new Error(`Response status: ${res.status}`);
					this.budget = await res.json();
				} catch {
					this.budget = JSON.parse(newValue);
				}
				this.renderBudget();
				break;
			case 'title':
				this.title = newValue;
				if (this.innerHTML != '')
					this.nextElementSibling.querySelector('caption').innerText = newValue;
				break;
			case 'year':
				this.year = parseInt(newValue) || (new Date()).getFullYear();
				this.renderBudget();
				break;
		}
	}

	connectedCallback() {
		this.renderBudget();
	}

	editBudget() {
		const selected = JSON.parse(this.getAttribute('selected'));

		const supplier = this.budget.customers.find(customer => customer.code === selected.customer)[selected.supplier] || [null, null, null, null];

		fetch(this.getAttribute('data') + `&dettaglio=${selected.customer},${selected.supplier},W`)
			.then(res => res.json())
			.then(json => {
				let html = `
					<label style="display:block; min-height:1.5em;">${selected.customer}</label>
					<form>
						<table>
							<thead>
								<tr><th rowspan=2">Supplier</th><th colspan="2">Proposed</th><th colspan="2">Forecasted</th></tr>
								<tr><th class="C">C</th><th class="W">W</th><th class="C">C</th><th class="W">W</th></tr>
							</thead>
							<tbody>
								<tr>
									<td>${selected.supplier}</td>
									<td class="C"><input name="PC" type="number" value="${1000 * supplier[0] || ''}" min="0" max="10000" disabled></td>
									<td class="W"><input name="PW" type="number" value="${1000 * supplier[1] || ''}" min="0" max="10000" disabled></td>
									<td class="C"><input name="FC" type="number" value="${1000 * selected[2] || ''}" min="0" max="10000"></td>
									<td class="W"><input name="FW" type="number" value="${1000 * selected[3] || ''}" min="0" max="10000"></td>
								</tr>
							</tbody>
						</table>
					</form>
					<br>
					<table class="budgetData">
						<thead>
							<tr><th><input type="checkbox"></th><th>PN</th><th>Description</th><th>Price</th><th>Qty</th><th>Total</th></tr>
							<tr><td></td><td colspan="4">Total</td><td></td></tr>
						</thead>
					<tbody>`;

				let design = '';
				json.forEach(r => {
					if (design != r.design)
						html += `<tr><td class="design"><input type="checkbox"></td><td colspan="4">${r.design}</th><td></td></tr>`;
					else
						html += `<tr><td><input type="checkbox"></td><td>${r.PN}</td><td>${r.description}</td><td>${r.price}</td><td>${r.qty}</td><td>${r.total}</td></tr>`;
					design = r.design;
				});
				html += '</tbody></table>';

				this.querySelector('.budgetEditor').innerHTML = html;
				// kvBudget.toggleRows(this.querySelector('.budgetData'));
				this.querySelector('.budgetData').addEventListener('click', kvBudget.toggleRows);
			})
			.catch(err => console.log(err.message));
	}

	renderBudget() {
		try {
			if (typeof this.budget === 'undefined')
				return;

			this.innerHTML = `
						<div style = "display:grid; column-gap:0.5em;">
							<div style="overflow:auto">
								<label style="display:block; min-height:1.5em;"><input type="checkbox"> Hide inactive suppliers</label>
								<table>
									<colgroup>
										<col />
										<col />
										<col />
										<col span="2" />
										${this.budget.suppliers?.map(() => '<col span="2" />').join('')}
									</colgroup>
									<thead>
										<tr><th rowspan="2">Customers</th><th rowspan="2">Turnover<br>${this.year - 1}</th><th rowspan="2">&emsp;BIBA&emsp;<br>${this.year}</th><th colspan="2">Budget ${this.year + 1}</th>${this.budget.suppliers?.map(supplier => `<th colspan="2">${supplier}</th>`).join('')}</tr>
										<tr><th class="C">C</th><th class="W">W</th>${this.budget.suppliers?.map(() => '<th class="C">C</th><th class="W">W</th>').join('')}</tr>
										<tr class="totals"><td>Totals</td><td></td><td></td><td class="C"></td><td class="W"></td>${this.budget.suppliers?.map(() => '<td class="C"></td><td class="W"></td>').join('')}</tr>
									</thead>
									<tbody class="customers"></tbody>
									<!--tfoot>
									<tr><td colspan="5"></td><td colspan="${this.budget.suppliers?.length || 1}"><kv-scroll></kv-scroll></td></tr>
								</tfoot-->
							</table>
				</div>
						<div class="budgetEditor"></div>
				</div> `;

			const tbody = this.querySelector('tbody.customers');
			this.budget.customers?.forEach(customer => {
				let row = `<tr>
					<td><span style="white-space:pre; font-family: monospace">${customer.code}</span> ${customer.name}</td>
					<th>${customer[`V${this.year - 1}`] || ''}</th>
					<th>${customer[`V${this.year}`] || ''}</th>
					<th class="C"></th>
					<th class="W"></th>
					${this.budget.suppliers.map(supplier => {
					if (!customer[supplier])
						return '<td class="C"></td><td class="W"></td>';
					return `<td class="C ${customer[supplier][2] > customer[supplier][0] ? 'R' : 'G'}">${customer[supplier][2] || customer[supplier][0] || ''}</td><td class="W ${customer[supplier][1] > customer[supplier][3] ? 'R' : 'G'}">${customer[supplier][3] || customer[supplier][1] || ''}</td>`;
				}).join('')
					} `;
				tbody.insertAdjacentHTML('beforeend', row);
			});

			this.computeBudget();
			this.querySelector('input').addEventListener('click', kvBudget.toggleIdle);
			this.querySelector('.customers').addEventListener('click', kvBudget.drillDown);

		} catch {
			console.log('Unable to render budget');
		}
	}

	computeBudget() {
		const tbody = this.querySelector('tbody');

		this.querySelectorAll('tbody tr').forEach(row => {
			let totalC = 0, totalW = 0;
			for (let col = 5; col < row.childElementCount; col += 2) {
				totalC += parseInt(row.children[col].innerText) || 0;
				totalW += parseInt(row.children[col + 1].innerText) || 0;
			}
			row.children[3].innerText = totalC || '';
			row.children[4].innerText = totalW || '';
		});

		const totals = this.querySelector('thead tr:last-child');
		for (let col = 1; col < tbody.firstChild.children.length; col++) {
			let total = 0;
			for (let row = 0; row < tbody.children.length; row++)
				total += parseInt(tbody.children[row].children[col].innerText) || 0;
			totals.children[col].innerText = total || '';
		}
	}

	static sumRows(budgetData) {
		let total = 0;
		budgetData.querySelectorAll('tbody tr').forEach(tr => total += tr.firstChild.firstChild.checked ? parseInt(tr.lastElementChild.innerText) || 0 : 0);
		budgetData.querySelector('thead tr:nth-child(2) td:last-child').innerHTML = total;
	}

	static toggleRows(event) {
		const checkbox = event.target;
		if (checkbox.getAttribute('type') != 'checkbox')
			return;

		if (checkbox.parentElement.tagName == 'TH' && checkbox.closest('thead'))
			event.currentTarget.querySelectorAll('tbody input').forEach(el => el.checked = checkbox.checked);
		else if (checkbox.parentElement.className == 'design')
			for (let el = checkbox.closest('tr').nextElementSibling; el && el.firstChild.className != 'design'; el = el.nextElementSibling)
				el.firstChild.firstChild.checked = checkbox.checked;

		kvBudget.sumRows(checkbox.closest('.budgetData'));
	}

	static drillDown(event) {
		const el = event.target, budget = el.closest('kv-budget');

		budget.removeAttribute('selected');
		budget.querySelector('td.selected')?.classList.remove('selected');

		if (el.tagName === 'TD' && el.cellIndex >= 5) {
			let customer = el.closest('tr').children[0].innerText.substring(0, 5);
			let supplier = budget.querySelector('thead>tr').children[3 + Math.ceil((el.cellIndex - 4) / 2)].innerText;
			budget.setAttribute('selected', JSON.stringify({ "customer": customer, "supplier": supplier, "values": [0, 0, 0, 0] }));
			el.classList.add('selected');

			budget.editBudget();
		}
	}

	static toggleRange(table, range, visible = true) {
		const colgroup = table.querySelector('colgroup');
		for (let column = range[0]; column <= (range[1] || range[0]); ++column)
			colgroup.children[column].style.visibility = visible ? '' : 'collapse'
	}

	static toggleIdle(event) {
		const el = event.target;

		const table = el.closest('kv-budget').querySelector('table');
		const totals = el.closest('kv-budget').querySelector('thead tr:last-child');
		for (let i = 5; i < totals.childElementCount; i += 2)
			if ((totals.children[i].innerText === '' && totals.children[i + 1].innerText === '') || !el.checked)
				kvBudget.toggleRange(table, [3 + Math.ceil((i - 4) / 2)], !el.checked);

	}
}

customElements.define('kv-budget', kvBudget);
