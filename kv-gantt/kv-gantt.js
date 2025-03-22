/*
** Author: Giancarlo Trevisan
** Date: 2024/09/11
** Description: Fetch gantt json object and render it
** Usage: <kv-gantt src="gantt.json"></kv-gantt>
*/
class kvGantt extends HTMLElement {
	static observedAttributes = ['src'];

	gantt;

	constructor() {
		super();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case 'src':
				try {
					const url = new URL(newValue);
					const res = await fetch(url);
					if (!res.ok)
						throw new Error(`Response status: ${res.status}`);
					this.gantt = await res.json();
				} catch {
					this.gantt = { name: null, start: new Date(), tasks: [] };
				}
				this.renderGantt();
				break;
		}
	}

	connectedCallback() {
		this.innerHTML = '<p>Loading gantt...</p>';
	}

	renderGantt() {
	}

}

customElements.define('kv-gantt', kvGantt);
