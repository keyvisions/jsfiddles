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
    select.insertAdjacentHTML('afterbegin', '<option>*</option>');
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
        for (const o of select.options)
            o.style.display = (o.innerText === '*' || o.hasAttribute('selected') || search === '' || o.innerText.toLowerCase().indexOf(search) != -1) ? '' : 'none';
        select.value = '';
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
