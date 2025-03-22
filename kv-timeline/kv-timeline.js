// Created: 2025/01/25
// Creator: g.trevisan@keyvisions.it
// Description: Spin the Web Web Component 
// Usage: <kv-timeline name="users" [list="users"] options="{csv || url}"></kv-timeline>
class kvTimeline extends HTMLElement {
	static lists = {};

	constructor() {
		super();
	}

	connectedCallback() {
		this.style.display = "none";
		const moments = JSON.parse(this.innerText).moments;

		const min = (new Date(moments.at(0).timestamp)).valueOf() - 500000, max = (new Date(moments.at(-1).timestamp)).valueOf() + 2000000;
		const range = max - min;

		let timeline = `<div style="position: relative; height: 3rem;">`;
		moments.filter(moment => moment.type != "pick").forEach((moment, i, moments) => {
			const duration = (new Date((new Date(moments[i + 1]?.timestamp).valueOf() - (new Date(moment.timestamp)).valueOf()))).toJSON()?.substring(11, 16);
			timeline += `<span title="${moment.name}" style="padding:0.5rem 0; border-left: thin solid black; position:absolute; top: 0; left:${((new Date(moment.timestamp)).valueOf() - min) / range * 100}%"><i class="fas fa-fw fa-${moment.type == "phase" ? "cog" : "circle"}"></i><span style="overflow-text: ellipsis; font-size:smaller"> ${i < moments.length - 1 ? duration : ""}</span></span>`;
		});
		timeline += `<hr style="position:absolute; top: 2rem; width: 100%;">`;
		moments.forEach(moment => {
			if (moment.type == "pick")
				timeline += `<span style="padding:0.5rem 0; border-left: thin solid black; position:absolute; top: 3rem; left:${((new Date(moment.timestamp)).valueOf() - min) / range * 100}%"><i class="fas fa-fw fa-shopping-cart"></i></span>`;
		});
		timeline += "<div>";
		this.insertAdjacentHTML("afterEnd", timeline);
	}
}

// Register web component
customElements.define('kv-timeline', kvTimeline);