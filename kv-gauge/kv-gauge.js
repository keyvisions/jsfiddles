/*
** Author: Giancarlo Trevisan
** Date: 2024/07/03
** Description: Draw a five section guage, gauge hand value [0, 1]
** Usage: <kv-gauge value="0.5" title="Titolo"></kv-gauge>
*/
class kvGauge extends HTMLElement {
    static observedAttributes = ['type', 'value', 'values', 'title'];

    constructor() {
        super();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.getAttribute('type') === 'linear')
            this.drawLinearGauge();
        else this.drawGauge();
    }

    connectedCallback() {
        if (this.getAttribute('type') === 'linear')
            this.drawLinearGauge();
        else
            this.drawGauge();
    }

    drawGauge() {
        let value = parseFloat(this.getAttribute('value')?.replace(/,/g, '.')) * 3.0 / 5.0; // Set 1 to limit between yellow and light green

        if (value > 1)
            value = 1;
        else if (!(value >= 0.0 && value <= 1))
            value = 0;

        this.style.display = 'inline-block';
        this.innerHTML = `<svg width="${this.getAttribute("width") || 250}" height="${this.getAttribute("height") || 150}" viewBox="0 0 250 150">
            <g transform="translate(125 125) scale(0.75 0.75)">
                <text class="title" y="-135">${this.getAttribute('title')}</text>
                <path d="m -100 0 A 100 100 0 0 1 -81 -59" fill="transparent" stroke="red" stroke-width="50" />
                <path d="m -81 -59 A 100 100 0 0 1 -31 -96" fill="transparent" stroke="orange" stroke-width="50" />
                <path d="m -31 -96 A 100 100 0 0 1 30 -96" fill="transparent" stroke="yellow" stroke-width="50" />
                <path d="m 30 -96 A 100 100 0 0 1 80 -59" fill="transparent" stroke="lightgreen" stroke-width="50" />
                <path d="m 80 -59 A 100 100 0 0 1 100 -1" fill="transparent" stroke="green" stroke-width="50" />
                <g class="hand" transform="rotate(${value * 180.0})">
                    <path d="m 0 6 a 6 6 0 0 0 0 -12 l -105 6 l 105 6 z" />
                </g>
                <text x="-100" y="20" stroke="red">POOR</text>
                <text x="100" y="20" stroke="green">GOOD</text>
            </g></svg>`;
    }

    drawLinearGauge() {
        const values = this.getAttribute('values').split(';').map(value => parseFloat(value.replace(/,/g, '.')));

        if (values.length !== 5) {
            values.push(Math.max(values[3], values[0] + values[1] + values[2]) * 1.2);

            this.innerHTML = `
                <div style="display:flex">
                    <div style="width:${values[3] / values[5] * 100}%; border-left: thin solid black; border-right:thin solid black; padding-left:0.25em">${this.getAttribute('title')}<span style="float:right; padding-right:0.25em">Target</span></div>
                  <div style="width:${(1.0 - values[3] / values[5]) * 100}%; text-align:right; border-right: thin solid black; padding-right: 0.25em;">&nbsp;</div>
                </div>
                <div style="display:flex; border-left: thin solid black; border-bottom:thin solid black; padding-bottom: 2px; border-right: thin solid black;">
                    <div style="width:${values[0] / values[5] * 100}%; background-color:green" title="Fatturato ad oggi € ${values[0].toLocaleString()}">&nbsp;</div>
                    <div style="width:${values[1] / values[5] * 100}%; background-color:lightgreen" title="DDT del mese € ${values[1].toLocaleString()}">&nbsp;</div>&nbsp;<i class="fas fa-truck-monster"></i>
                </div>
                    <div style="display:flex; margin-bottom: 1.5em; padding-top: 2px">
                    <div style="width:${(values[0] + values[1]) / values[5] * 100}%">&nbsp;</div>
                    <div style="width:${values[2] / values[5] * 100}%; height: 0.5em; background-color:yellow" title="Backlog € ${values[2].toLocaleString()}"></div>
                </div>`;
        } else {
            this.innerHTML = 'usage: Invoiced;Undelivered;Backlog;Budget;Wished';
        }
    }
}
customElements.define('kv-gauge', kvGauge);
