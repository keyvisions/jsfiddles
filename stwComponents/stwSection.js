// Created: 2024/06/17
// Creator: g.trevisan@keyvisions.it
// Description: Spin the Web Web Component 
// Usage: <stw-section name="header"></stw-section>
customElements.define('stw-section',
    class stwSection extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            const url = this.getAttribute('url');

            fetch(url)
                .then(res => res.text())
                .then(data => console.log(data))
        }
    }
);
