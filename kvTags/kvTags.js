async function kvTags(input) {
	if (!(input instanceof Element)) {
		document.querySelectorAll("input[type=tags]").forEach(element => kvTags(element));
		return;
	}

	let wrapper = document.createElement("div");
	wrapper.setAttribute("class", "kvTags");
	wrapper.tags = input;
	input.insertAdjacentElement('afterend', wrapper);
	wrapper.appendChild(input);

	input.setAttribute("type", "hidden");
	try {
		const url = new URL(input.getAttribute("accept"));
		const response = await fetch(url);
		const accept = await response.text();
		input.predefinedTags = accept.split(",");
	} catch {
		input.predefinedTags = input.getAttribute("accept").split(",");
		input.removeAttribute("accept");
	}

	let tag = document.createElement("input");
	tag.setAttribute("autocomplete", "off");
	tag.style.width = "inherit";
	tag.addEventListener("change", event => {
		let tag = event.target.value.replace(/([^àèéìùòça-z0-9-.]+)/gi, ""),
			ref = event.currentTarget.parentElement.parentElement.tags;

		if (tag) {
			/*
			if (!ref.predefinedTags.includes(tag)) {
				if (!event.target.parentElement.previousElementSibling.hasAttribute("contenteditable"))
					return;
				ref.predefinedTags.push(tag);
				document.getElementById(ref.getAttribute("list")).innerHTML += `<option value="${tag}" disabled>${tag}</option>`;
			} else
				document.getElementById(ref.getAttribute("list")).querySelector(`[value="${tag}"]`).disabled = true;
			*/
			let tags_items = document.getElementById(`${ref.name}_items`);
			if (tags_items.innerHTML.indexOf(`<li tabindex="0">${tag}</li>`) == -1) {
				ref.value += (!ref.value ? "" : ",") + tag;
				tags_items.innerHTML += `<li tabindex="0">${tag}</li>`;
			}
			event.target.value = "";
		}
		event.currentTarget.parentElement.previousElementSibling.dispatchEvent(new Event("input", { bubbles: true }));
	});
	tag.setAttribute("list", input.getAttribute("list"));
	wrapper.insertAdjacentHTML('beforeend', `<span style="white-space:nowrap"> \u271A </span>`);
	wrapper.lastElementChild.insertAdjacentElement('afterbegin', tag);

	if (!document.getElementById(tag.getAttribute("list"))) {
		let datalist = document.createElement("datalist");
		datalist.id = tag.getAttribute("list");
		let options = "";
		for (let tag of wrapper.tags.predefinedTags)
			options += `<option value="${tag}">${tag}</option>`;
		datalist.innerHTML = options;
		wrapper.appendChild(datalist);
	}

	let items = document.createElement("ul");
	items.id = wrapper.tags.name + "_items";
	wrapper.appendChild(items);

	options = "";
	for (let tag of wrapper.tags.value.split(","))
		if (tag)
			options += `<li tabindex="0">${tag}</li>`;
	items.innerHTML = options;
	items.addEventListener("click", removeItem);
	items.addEventListener("keyup", removeItem);

	function removeItem(event) {
		if (event.target.tagName === "LI" &&
			(event.offsetX < 2 * parseInt(getComputedStyle(event.target).fontSize) ||
				"EscapeDelete".indexOf(event.key) != -1)) {
			let input = event.currentTarget.parentElement.tags,
				tag = event.target.innerText;
			input.value = input.value.replace(new RegExp(`(^${tag},|,${tag}(?=,)|,${tag}$|^${tag}$)`, "gi"), "");
			input.dispatchEvent(new Event("input", { bubbles: true }));
			event
			event.target.remove();
			// event.currentTarget.previousElementSibling.querySelector(`[value="${tag}"]`).disabled = false;
		} else
			event.target.focus({
				focusVisible: true
			});
	}
}
window.addEventListener('load', kvTags);
