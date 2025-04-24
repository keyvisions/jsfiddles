/*
** Author: Giancarlo Trevisan
** Date: 2024/09/11
** Description: Fetch gantt json object and render it
** Usage: <kv-gantt src="gantt.json"></kv-gantt>
*/
class kvGantt extends HTMLElement {
	static observedAttributes = ['src', 'lang'];

	static #Texts = {
		'resource': { en: 'Resource', it: 'Risorsa' },
		'operator': { en: 'Operator', it: 'Operatore' },
		'task': { en: 'Task', it: 'Attività' },
		'load': { en: 'Load', it: 'Carico' },
		'department': { en: 'Department', it: 'Reparto' }
	};

	Data = { name: null, date: new Date(), resources: [], operators: [], tasks: [] };
	Lang = 'en';

	constructor() {
		super();

		this.innerHTML =
			`<input type="hidden" name="${this.getAttribute("name")}">` +
			`<table>` +
			`<thead><tr><th rowspan="2"></th><th rowspan="2">Load</th><th class="day"></th></tr><tr><th class="tasks"></th></tr></thead>` +
			`<tbody></tbody>` +
			`<tfoot><tr><td></td><td class="load"></td><td class="tasks"></td></tfoot>` +
			`</table>`;

		this.addEventListener('click', event => {
			const target = event.target;

			if (target.classList.contains('task'))
				alert(event.target.innerText);
			else if (target.closest('tr[data-id')) {
				this.querySelector('tr.selected')?.classList.remove('selected');
				target.closest('tr').classList.add('selected');
			}
		});
	}

	async #fetchData(src) {
		return await fetch(src)
			.then(res => res.json())
			.then(data => data)
			.catch(() => ["", ""]);
	}

	async attributeChangedCallback(name, _oldValue, newValue) {
		switch (name) {
			case 'src':
				this.Data = await this.#fetchData(newValue) || { name: null, date: new Date(), resources: [], operators: [], tasks: [] };

				// Create random tasks: { "id": null, "name": null, "resource": null, "operator": null, "start": null, "duration": null, "progress": 0 }
				if (!this.Data.tasks.length)
					for (let i = 0; i < 20; ++i) {
						const resource = Math.floor(this.Data.resources.length * Math.random());
						const operator = Math.floor(this.Data.operators.length * Math.random());
						this.Data.tasks.push({ id: i, name: kvGantt.#Texts.task[this.Lang], resource: this.Data.resources[resource].id, operator: this.Data.operators[operator].id, start: Math.random() * 23, duration: Math.random() * 4 + 1, progress: Math.random() * 100 });
					}
				break;

			case 'lang':
				this.Lang = newValue;
				break;
		}
		this.renderGantt(this.Data.resources, this.Data.operators, this.Data.tasks);
	}

	renderGantt(resources = [], operators = [], tasks = []) {
		// Assign a unique color to each operator
		const operatorColors = {};
		operators.forEach((operator, index) => {
			operatorColors[operator.id] = this.#generateColor(index); // Generate or assign a color
		});

		this.querySelector('thead th:nth-child(2)').innerText = kvGantt.#Texts.load[this.Lang];
		this.querySelector('tfoot td:nth-child(1)').innerText = kvGantt.#Texts.load[this.Lang];

		this.querySelector('.day').innerText = new Date(this.Data.date).toLocaleDateString(undefined, {
			weekday: 'long', // Full name of the day (e.g., "Monday")
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		this.querySelector('tbody').innerHTML = ''; // Clear GANTT

		let department = '';
		resources.forEach((resource, i) => {
			if (department != resource.department) {
				department = resource.department;
				this.querySelector('tbody').insertAdjacentHTML('beforeend', `<tr class="department"><td colspan="${3 + this.Data.operators.length}">${kvGantt.#Texts.department[this.Lang]}: ${department}</td></tr>`);
			}

			resource._work = 0;
			this.querySelector('tbody').insertAdjacentHTML('beforeend', `<tr data-id="${resource.id}"><td><span class="expand-symbol" title="Expand/Collapse">▶</span> ${resource.name}</td><td class="load"></td><td class="tasks"></td></tr>`);

			let loads = '';
			operators.filter(operator => operator.work > 0).forEach(operator => {
				if (!i) {
					const operatorColor = operatorColors[operator.id]; // Get the operator's color
					this.querySelector('thead tr').insertAdjacentHTML('beforeend', `
						<th rowspan="2" class="operator" style="background-color: ${operatorColor};">
							${operator.name}
						</th>`);
				}
				operator._work = tasks.reduce((load, task) => load += task.resource == resource.id && task.operator == operator.id ? task.duration : 0, 0);
				loads += `<td class="load">${(100 * operator._work / operator.work).toFixed(0)}</td>`;
			});
			loads = loads.replace(/">0</g, ' zero">0<');
			this.querySelector('tbody tr:last-child').insertAdjacentHTML('beforeend', loads);
		});

		this.querySelectorAll('.tasks').forEach((task, i) =>
			task.innerHTML = Array.from(Array(24).keys()).reduce((hours, hour) => hours + `<div class="hour">${!i ? hour + ':00' : '&nbsp;'}</div>`, '') // Hours
		);

		tasks.forEach(task => {
			resources.find(resource => resource.id === task.resource)._work += task.duration;
			const operatorColor = operatorColors[task.operator]; // Get the operator's color
			this.querySelector(`tr[data-id="${task.resource}"] .tasks`).insertAdjacentHTML('afterbegin', `
				<div 
					data-id="${task.id}" 
					title="${operators.find(operator => operator.id == task.operator).name}" 
					class="task" 
					style="left:${100 * task.start / 24}%; width:${100 * task.duration / 24}%; background-color:${operatorColor};">
					${task.name}
					<div 
						class="progress-bar" 
						style="width:${task.progress}%; background-color: rgba(0, 0, 0, 0.2); height: 100%; position: absolute; top: 0; left: 0;">
					</div>
				</div>`);
		});

		resources.forEach(resource => {
			const load = this.querySelector(`tr[data-id="${resource.id}"] .load`);
			const loadPercentage = Math.floor(100 * (resource._work / resource.work));
			load.innerText = loadPercentage;

			if (loadPercentage === 0) {
				load.classList.add('zero');
			}
		});

		// Summary
		let loads = [...this.querySelectorAll('tbody td:nth-child(2)')];
		this.querySelector('tfoot td:nth-child(2)').innerText = (loads.reduce((totalLoad, load) => totalLoad + parseInt(load.innerText), 0) / loads.length).toFixed(0);

		for (let o = 0; o < this.Data.operators.length; ++o) {
			loads = [...this.querySelectorAll(`tbody td:nth-child(${4 + o})`)];
			this.querySelector('tfoot tr').insertAdjacentHTML('beforeend', `<td class="load">${loads.reduce((totalLoad, load) => totalLoad + parseInt(load.innerText), 0)}</td>`);
		}

		this.querySelectorAll('td.load').forEach(td => {
			const loadPercentage = parseInt(td.innerText, 10) || 0; // Parse the percentage value
			td.style.background = this.#showLoad(loadPercentage); // Apply histogram background
		});

		// Calculate hourly loads
		const hourlyLoads = Array(24).fill(0);
		tasks.forEach(task => {
			const startHour = Math.floor(task.start);
			const endHour = Math.min(24, Math.ceil(task.start + task.duration));
			for (let hour = startHour; hour < endHour; hour++) {
				hourlyLoads[hour] += task.duration / (endHour - startHour); // Distribute load
			}
		});

		// Normalize loads to percentages
		const maxLoad = Math.max(...hourlyLoads);
		const hourlyPercentages = hourlyLoads.map(load => (load / maxLoad) * 100);

		// Render the tfoot section
		const td = this.querySelector('tfoot td:nth-child(3)');
		td.innerHTML = hourlyPercentages.map(percent => `<div class="bar" style="background: ${this.#showLoad(percent)}">${percent.toFixed(0)}%</div>`).join('');
	}

	#showLoad(loadPercentage) {
		let color;
		if (loadPercentage <= 50)
			color = '#ffcccc'; // Light Red for 0-50%
		else if (loadPercentage <= 80)
			color = '#ffe0b3'; // Light Orange for 51-80%
		else
			color = '#ccffcc'; // Light Green for 81-100%
		return `linear-gradient(to right, ${color} ${loadPercentage}%, transparent ${loadPercentage}%)`;
	}

	// Generate a unique color for each operator
	#generateColor(index) {
		const colors = ['#ff9999', '#ffcc99', '#ffff99', '#ccff99', '#99ff99', '#99ffcc', '#99ccff', '#9999ff', '#cc99ff', '#ff99cc'];
		return colors[index % colors.length]; // Cycle through predefined colors
	}
}

customElements.define('kv-gantt', kvGantt);

// https://www.color-meanings.com/shades-of-brown-color-names-html-hex-rgb-codes/
// document.querySelectorAll('.has-background').forEach((p, i) => console.log(`--C${i}: ${p.childNodes[2].textContent.replace('Hex ', '')}; /* ${p.querySelector('strong').innerText} */`))

