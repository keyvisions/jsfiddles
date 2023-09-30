window.addEventListener('load', event => {
  document.querySelectorAll('[data-json="stwProductionLine"]').forEach(widget => {
  	const data = JSON.parse(widget.value);
  
		widget.insertAdjacentHTML('afterend', `
    	<table>
      <caption>${data.code}</caption>
    	<thead><tr><th>Componente</th><th>Descrizione</th></tr></thead>
      <tbody></tbody>
      <tfoot></tfoot>
      </table>`);
  	widget.style.display = 'none';
    const table = widget.nextElementSibling;

    const UDC = data.udc; // Unità di carico presenti in linea

    let tr = '';
    for (let i = 1; i <= UDC; ++i)
      tr += `<th>UDC<sub>${i}</sub></th>`;
    table.querySelector('thead > tr').insertAdjacentHTML('beforeend', tr);

    data.components.forEach((component, i) => {
      tr = `<tr><td>${component.code}</td><td>${component.description}</td>${'<td><i class="fa-regular fa-fw fa-circle"></i></td>'.repeat(UDC)}</tr>`;
      table.querySelector('tbody').insertAdjacentHTML('beforeend', tr);
      table.querySelectorAll('tbody tr:last-child i')[component.udc].classList.replace('fa-regular', 'fa-solid');
    });

    tr = `<tr><td colspan="2">Totale componenti</td>${'<th></th>'.repeat(UDC)}</tr>`;
    table.querySelector('tfoot').insertAdjacentHTML('afterbegin', tr);

    table.tally = function () {
      let udc_c = Array(UDC);
      data.components.forEach(component => {
        udc_c[component.udc] = ++udc_c[component.udc] || 1;
      });
      table.querySelectorAll('tfoot > tr th').forEach((th, i) => th.innerHTML = typeof udc_c[i] == 'undefined' ? '' : udc_c[i]);
    };
		table.tally();

    table.addEventListener('click', event => {
      let target = event.target;

      if (target.tagName == 'I') {
        target.closest('tr').querySelectorAll('i.fa-circle').forEach((udc, i) => {
          udc.className = `fa-${udc == target && !udc.classList.contains('fa-solid') ? 'solid' : 'regular'} fa-fw fa-circle`;
          if (udc.className.indexOf('solid') != -1)
            data.components.find(component => component.code == target.closest('tr').firstChild.innerText).udc = i;
        });

        table.tally();
      }
    });
  });
});
