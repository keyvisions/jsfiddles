const item = {
  code: '',
  components: [{
      code: 'aaa',
      description: 'bla',
      udc: 7
    },
    {
      code: 'bbb',
      description: 'bla',
      udc: 3
    }, {
      code: 'ccc',
      description: 'bla',
      udc: 7
    }
  ]
}

window.addEventListener('load', function(event) {
debugger;
  document.querySelectorAll('.ProductionLine').forEach(function(table) {
    const UDC = table.dataset.udc;

    let tr = '';
    for (let i = 1; i <= UDC; ++i)
      tr += `<th>UDC<sub>${i}</sub></th>`;
    table.querySelector('thead > tr').insertAdjacentHTML('beforeend', tr);

    item.components.forEach(function(component, i) {
      tr = `<tr><td>${component.code}</td><td>${component.description}</td>${'<td><i class="fa-regular fa-fw fa-circle"></i></td>'.repeat(UDC)}</tr>`;
      table.querySelector('tbody').insertAdjacentHTML('beforeend', tr);
    });

    tr = `<tr><td colspan="2"></td>${'<th></th>'.repeat(UDC)}</tr>`;
    table.querySelector('tfoot').insertAdjacentHTML('afterbegin', tr);

    table.addEventListener('click', function(event) {
      let target = event.target;

      if (target.tagName == 'I') {
        target.closest('tr').querySelectorAll('i.fa-circle').forEach(function(udc, i) {
          udc.className = `fa-${udc == target && !udc.classList.contains('fa-solid') ? 'solid' : 'regular'} fa-fw fa-circle`;
          item.components.find(function(component) {
            return component.code == target.closest('tr').firstChild.innerText
          }).udc = i;
        });
console.log(item);
        let udc = new Array(UDC);
        item.components.forEach(function(component) {
          udc[component.udc] = ++udc[component.udc] || 1;
        });
console.log(udc);
      }
    })
  })
})
