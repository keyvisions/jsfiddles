function removeRow(el) {
    if (confirm('Sicuri di voler eliminare la riga?'))
        el.closest('tr').remove();
}

async function fetchCode(code) {
    // let url = `https://service.vmcitaly.com/?*r=12345&customer=10000&code=220.2300`
    const response = await fetch('catalog.json');
    const catalog = await response.json();

    let item = catalog.find(i => (i.code + i.option) == code);
    item.flags = 0;
    if (item)
        addRow(item);
}

function addRow(item) {
    let cart = document.getElementById('cart');
    cart.querySelector('tbody').insertAdjacentHTML('beforeend', cart.querySelector('tfoot').innerHTML);

    cart.querySelector('tbody').lastElementChild.querySelectorAll('[name]').forEach(el => {
        if (el.tagName == 'TD' || el.tagName == 'DIV')
            el.innerHTML = item[el.getAttribute('name')] || '';
        else if (el.name == 'quantity') {
            item.restrictions = item.restrictions || '1/1';
            const restrictons = item.restrictions.split('/');
            el.setAttribute('min', restrictons[0]);
            el.setAttribute('step', restrictons[1]);
            el.value = item[el.getAttribute('name')];
        } else
            el.value = item[el.getAttribute('name')]?.toString() || '';
    });
    cart.querySelector('tbody').lastElementChild.className = item.flags & 1 ? 'stwCartOrder' : 'stwCartQuote';
}

function fillCart(sort = true) {
    let cart = JSON.parse(document.getElementsByName('cart')[0].value);
    if (sort) {
        cart.sort((a, b) => a.flags - b.flags);
        document.getElementsByName('cart')[0].value = JSON.stringify(cart);
    }
    cart.forEach(item => addRow(item));
}

function saveCart(el) {
    let cart = [];
    el.querySelectorAll('tbody tr').forEach(tr => {
        let item = {};
        tr.querySelectorAll('[name]').forEach(el => {
            if (el.tagName == 'TD' || el.tagName == 'DIV')
                item[el.getAttribute('name')] = el.innerHTML;
            else if (el.name == 'quantity') {
                let quantity = parseInt(el.value);
                if (quantity < parseInt(el.getAttribute('min')))
                    quantity = parseInt(el.getAttribute('min'));
                if (quantity % parseInt(el.getAttribute('step')))
                    quantity += parseInt(el.getAttribute('step')) - (quantity % parseInt(el.getAttribute('step')));
                item[el.getAttribute('name')] = quantity;
                el.value = quantity;
            } else
                item[el.getAttribute('name')] = el.value;
        });
        tr.className = item.flags & 1 ? 'stwCartOrder' : 'stwCartQuote';
        cart.push(item);
    });
    document.getElementsByName('cart')[0].value = JSON.stringify(cart);
}

window.addEventListener('load', () => {
    fillCart();
});