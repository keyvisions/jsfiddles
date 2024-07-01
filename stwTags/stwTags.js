// Created: 2024/06/12
// Creator: g.trevisan@keyvisions.it
// Description: Spin the Web Web Component 
// Usage: <stw-tags name="users" [list="users"] options="{csv || url}"></stw-tags>
class stwTags extends HTMLElement {
	static lists = {};

	constructor() {
		super();
	}

	connectedCallback() {
		const list = this.getAttribute('list') || (this.getAttribute('name') + '_list'),
			options = this.getAttribute('options') || '';

		stwTags.lists[list] = stwTags.lists[list] || options;
		try {
			fetch(new URL(options))
				.then(res => res.text())
				.then(text => this.render(list, text.split(',')));
		} catch {
			this.render(list, options.split(','));
		}
	}

	render(list, predefinedTags = []) {
		const wrapper = document.createElement('span');
		wrapper.classList.add('stwTags');

		const input = document.createElement('input');
		input.type = 'hidden';
		wrapper.appendChild(input);

		let tag = document.createElement('input');
		tag.setAttribute('list', list);
		tag.setAttribute('autocomplete', 'off');
		tag.style.width = 'inherit';

		// Add keyup event only if options includes @value
		if (stwTags.lists[list].indexOf('@value') !== -1)
			tag.setAttribute('onkeyup', 'stwTags.fetchItems(event)');

		tag.setAttribute('onchange', 'stwTags.changeItem(event)');
		wrapper.insertAdjacentHTML('beforeend', `<span style="white-space:nowrap"> \u271A </span>`);
		wrapper.lastElementChild.insertAdjacentElement('afterbegin', tag);

		// Choosen tags
		let ul = document.createElement('ul');
		ul.style.padding = 0;
		ul.style.display = 'inline';
		wrapper.appendChild(ul);

		ul.setAttribute('onclick', 'stwTags.manageItem(event)');
		ul.setAttribute('onkeyup', 'stwTags.manageItem(event)');
		ul.setAttribute('onfocusin', 'stwTags.manageItem(event)');

		// datalist
		let options = '';
		for (let tag of predefinedTags)
			options += tag ? `<option value="${tag}">${tag}</option>` : '';

		if (!document.getElementById(list)) {
			let datalist = document.createElement('datalist');
			datalist.id = list;
			datalist.innerHTML = options;
			tag.appendChild(datalist);
		}

		this.insertAdjacentElement('afterend', wrapper);
		this.remove(); // Remove stw-tags element

		// Clean-up
		input.removeAttribute('list');
		input.removeAttribute('options');

		const observer = new MutationObserver(mutation => {
			const input = mutation[0].target;

			let options = '';
			for (let tag of (input.getAttribute('value') || '').split(','))
				options += tag ? `<li tabindex="0">${tag}</li>` : '';
			input.parentElement.querySelector('ul').innerHTML = options;
		});
		observer.observe(input, { attributes: true, attributeFilter: ['value'] });

		for (let attribute of this.attributes)
			input.setAttribute(attribute.name, attribute.value);
	}

	// Event handlers
	static fetchItems(event) {
		if (event.target.value) {
			const list = event.target.getAttribute('list');
			if (!document.getElementById(list)) {
				let datalist = document.createElement('datalist');
				datalist.id = list;
				event.target.parentElement.appendChild(datalist);
			}

			fetch(stwTags.lists[list].replace('@value', event.target.value))
				.then(res => res.text())
				.then(csv =>
					document.getElementById(list).innerHTML = csv.split(',').reduce((a, b) => a + '<option value="' + b + '">' + b + '</option>', '')
				);
		}
	}
	static changeItem(event) {
		let tag = event.target.value.replace(/([^àèéìùòça-z0-9-.]+)/gi, ''),
			ref = event.currentTarget.parentElement.previousElementSibling;

		if (tag) {
			let tags_items = event.currentTarget.parentElement.nextElementSibling;
			if (tags_items.innerHTML.indexOf(`<li tabindex="0">${tag}</li>`) == -1) {
				ref.value += (!ref.value ? '' : ',') + tag;
				tags_items.innerHTML += `<li tabindex="0">${tag}</li>`;
			}
			event.target.value = '';
			if (stwTags.lists[event.target.list.id].indexOf('@value') !== -1)
				document.getElementById(event.target.list.id).innerHTML = '';
		}
		ref.dispatchEvent(new Event('input', { bubbles: true }));
		event.target.focus({
			focusVisible: true
		});
	}
	static manageItem(event) {
		if ((event.type === 'keyup' && event.target.tagName === 'LI' && event.ctrlKey && event.key === 'Enter') ||
			(event.type === 'click' && event.target.tagName === 'LI' && event.ctrlKey)) {
			event.target.closest('ul').insertAdjacentElement('afterBegin', event.target);
			event.target.focus();

/* 		} else if (event.type === 'focusin' && !event.ctrlKey) {
			event.target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab' }));
 */
		} else if ((event.type === 'click' && event.target.tagName === 'LI' &&
			(event.offsetX < 2 * parseInt(getComputedStyle(event.target).fontSize))) ||
			(event.target.tagName === 'LI' && ['Backspace', 'Delete'].includes(event.key))) {
			let input = event.currentTarget.parentElement.firstElementChild,
				tag = event.target.innerText;
			input.value = input.value.replace(new RegExp(`(^${tag},|,${tag}(?=,)|,${tag}$|^${tag}$)`, 'gi'), '');
			input.dispatchEvent(new Event('input', { bubbles: true }));
			event.target.remove();

		} /* else if (event.type === 'keyup' && event.key !== 'Tab')
			event.currentTarget.closest('span').querySelector('input[list]').focus({
				focusVisible: true
			}); */
	}
}

// Register web component
customElements.define('stw-tags', stwTags);