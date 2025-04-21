/*
** Author: Giancarlo Trevisan
** Date: 2024/09/11
** Description: Fetch gantt json object and render it
** Usage: <kv-gantt src="gantt.json"></kv-gantt>
*/
class kvGantt extends HTMLElement {
	static observedAttributes = ['schema', 'tasks'];

	Data;

	constructor() {
		super();

		this.innerHTML =
			// `<h1></h1>` +
			`<input type="hidden" name="${this.getAttribute("name")}">` +
			`<menu class="resources"><li class="header"><div>Resources</div></li></menu>` +
			`<menu class="tasks"><li class="header"></li></menu>` +
			`<menu class="operators"><li class="header">Operators</li></menu>`;

		this.addEventListener('click', event => {
			const target = event.target;

			if (target.classList.contains('task'))
				alert(event.target.innerText);
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
			case 'schema':
				this.Data = await this.#fetchData(newValue) || { name: null, date: new Date(), resources: [], operators: [] };
				this.Data.tasks = this.Data.tasks || [];

				// Create random tasks: { "id": "", "name": "", "resource": "", "operator": "", "start": null, "duration": null }
				for (let i = 0; i < 25; ++i) {
					const resource = Math.floor(this.Data.resources.length * Math.random());
					const operator = Math.floor(this.Data.operators.length * Math.random());
					this.Data.tasks.push({ id: i, name: 'task', resource: this.Data.resources[resource].id, operator: this.Data.operators[operator].id, start: Math.random() * 23, duration: Math.random() * 4 + 1 });
				}
				this.renderGantt(this.Data.resources, this.Data.operators, this.Data.tasks);
				break;

			case 'tasks':
				this.Data.tasks = await this.#fetchData(newValue) || [];
				this.renderGantt(this.Data.resources, this.Data.operators, this.Data.tasks);
				break;
		}
	}

	// connectedCallback() {}

	renderGantt(resources = [], operators = [], tasks = []) {
		// this.firstElementChild.innerText = this.Data.name + ' ' + this.Data.date

		this.querySelectorAll('li:not(.header)').forEach(li => li.remove()); // Clear GANTT

		resources.forEach(resource => {
			resource._work = 0;
			this.querySelector('.resources').insertAdjacentHTML('beforeend', `<li data-id="${resource.id}"><div>${resource.name}</div><div class="load"></div></li>`);
			this.querySelector('.tasks').insertAdjacentHTML('beforeend', `<li data-id="${resource.id}"></li>`);
			this.querySelector('.operators').insertAdjacentHTML('beforeend', `<li data-id="${resource.id}"></li>`);
		});
		operators.forEach(operator => {
			operator._work = 0;
		});

		this.querySelector('.tasks').querySelectorAll('li').forEach(task =>
			task.innerHTML = Array.from(Array(25).keys()).reduce((hours, hour) => hours + `<div class="hour">${task.classList.contains('header') ? hour + ':00' : '&nbsp;'}</div>`, '')
		);

		tasks.forEach(task => {
			resources.find(resource => resource.id === task.resource)._work += task.duration;
			this.querySelector(`.tasks [data-id="${task.resource}"]`).insertAdjacentHTML('afterbegin', `<div data-id="${task.id}" class="task" style="left:${100 * task.start / 24}%; width:${100 * task.duration / 24}%">${task.name}&nbsp;</div>`);
		});
		resources.forEach(resource => this.querySelector(`.resources li[data-id="${resource.id}"] .load`).innerHTML = Math.floor(100 * (resource._work / resource.work)) + '%');

		// Summary
		const loads = [...this.querySelectorAll('.resources .load')];
		const totalLoad = (loads.reduce((totalLoad, load) => totalLoad + parseInt(load.innerText), 0) / loads.length).toFixed(0);
		this.querySelector('.resources').insertAdjacentHTML('beforeend', `<li class="loads"><div>Loads</div><div class="load">${totalLoad}%</div></li>`);
		this.querySelector('.tasks').insertAdjacentHTML('beforeend', `<li class="loads"></li>`);
		this.querySelector('.operators').insertAdjacentHTML('beforeend', `<li class="loads"></li>`);
	}

}

customElements.define('kv-gantt', kvGantt);
