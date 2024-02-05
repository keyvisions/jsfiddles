/*
Author: Giancarlo Trevisan
Date:   2024/01/30
*/
async function kvSelect(select) {
    if (!(select instanceof Element)) {
        document.querySelectorAll("select.kvSelect").forEach(element => kvSelect(element));
        return;
    }

    const wrapper = document.createElement('span');
    wrapper.classList = select.classList;
    select.classList = '';
    wrapper.insertAdjacentHTML('afterbegin', `<input type="search" style="display:block;margin-bottom:1px" placeholder="${select.getAttribute('placeholder')}">`)
    select.insertAdjacentElement('beforebegin', wrapper);
    wrapper.insertAdjacentElement('beforeend', select);
    select.style.width = `${wrapper.firstChild.getBoundingClientRect().width}px`;
    wrapper.firstChild.addEventListener('input', event => {
        event.target.nextElementSibling.options[0].removeAttribute('selected');
        renderOptions(event.target.nextElementSibling);
    });

    function renderOptions(select) {
        const search = select.previousElementSibling.value;

        let options = [];
        [...select.options].forEach(option => options.push({ selected: option.hasAttribute('selected') || false, value: option.value, text: option.innerText }));

        const scrollLeft = select.scrollLeft, scrollTop = select.scrollTop;
        select.innerHTML = '';
        options.forEach(option => {
            let display = option.text === '*' || option.selected || search === '' || option.text.toLowerCase().indexOf(search) != -1;
            select.insertAdjacentHTML('beforeend', `<option value="${option.value || option.text}"${display ? '' : ' style="display:none"'}${option.selected ? ' selected' : ''}>${option.text}</option>`);
        });
        select.value = '';
        setTimeout(() => select.scroll(scrollLeft, scrollTop), 0);
    }
    renderOptions(select);

    select.addEventListener('click', event => {
        const option = event.target;

        if (option.hasAttribute('selected'))
            option.removeAttribute('selected');
        else
            option.setAttribute('selected', '');

        if (option.innerText === '*') {
            const selected = option.hasAttribute('selected');
            for (let option of select.options)
                if (option.style.display !== 'none')
                    if (selected)
                        option.setAttribute('selected', '');
                    else
                        option.removeAttribute('selected');
        } else
            select.options[0].removeAttribute('selected');

        renderOptions(event.currentTarget);
    });
    select.addEventListener('keydown', event => {
        const select = event.currentTarget;
        if (event.key === 'Enter')
            select.options[select.selectedIndex].click();
        else if (event.key === 'Delete')
            select.previousElementSibling.value = '';
    });

}
window.addEventListener('load', kvSelect);
