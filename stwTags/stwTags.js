function stwTags(input) {
  if (!(input instanceof Element)) {
    document.querySelectorAll("input[type=tags]").forEach(element => stwTags(element));
    return;
  }

	let wrapper = document.createElement("div");
  wrapper.setAttribute("class", "stwTags");
	wrapper.tags = input;
  input.insertAdjacentElement('afterend', wrapper);
	wrapper.appendChild(input);

  input.setAttribute("type", "hidden");
  input.predefinedTags = input.getAttribute("accept").toLowerCase().split(",");
	input.removeAttribute("accept");

	let tag = document.createElement("input");
  tag.setAttribute("autocomplete", "off");
  tag.addEventListener("change", event => {
    let tag = event.target.value.replace(/([^àèéìùòça-z0-9-]+)/gi, "").toLowerCase(),
      ref = event.currentTarget.parentElement.tags;

    if (tag) {
      if (!ref.predefinedTags.includes(tag)) {
        ref.predefinedTags.push(tag);
        document.getElementById(ref.name).innerHTML += `<option value="${tag}" new>${tag}</option>`;
      } else {
				ref.predefinedTags.splice(ref.predefinedTags.indexOf(tag), 1);
        document.getElementById(ref.name).querySelector(`[value="${tag}"]`).remove();
			}
      let tags_items = document.getElementById(`${ref.name}_items`);
      if (tags_items.innerHTML.indexOf(`<li tabindex="0">${tag}</li>`) == -1) {
        ref.value += (!ref.value ? "" : ",") + tag;
        tags_items.innerHTML += `<li tabindex="0">${tag}</li>`;
      }
      event.target.value = "";
    }
  });
  tag.setAttribute("list", wrapper.tags.name);
  wrapper.appendChild(tag);
	
	wrapper.appendChild(document.createElement("span"));
	wrapper.lastElementChild.appendChild(document.createTextNode(" \u271A"));

  let datalist = document.createElement("datalist");
  datalist.id = wrapper.tags.name;
  let options = "";
  for (let tag of wrapper.tags.predefinedTags)
    options += `<option value="${tag}">${tag}</option>`;
  datalist.innerHTML = options;
  wrapper.appendChild(datalist);

  let items = document.createElement("div");
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
      event.target.remove();
	    event.currentTarget.previousElementSibling.insertAdjacentHTML("beforeend", `<option value="${tag}">${tag}</option>`);
    } else
      event.target.focus({
        focusVisible: true
      });
  }
}
stwTags();
