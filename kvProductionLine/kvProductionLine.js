window.addEventListener('load', event => {
  document.querySelectorAll('[data-json="kvProductionLine"]').forEach(async widget => {
    let data = JSON.parse(widget.value), html;

    widget.style.display = 'none';

    widget.insertAdjacentHTML('beforebegin', `
      <table class="kvProductionLines">
      <caption>Linee di Produzione</caption>
      <thead><tr><th>Reparto</th><th>Codice linea</th><th>Descrizione</th><th>UDC</th><!--th></th--></tr></thead>
      <tbody></tbody>
      <tfoot style="display:none"><tr class="dataRow"><td><input name="department"></td><td><input name="code"></td><td style="width:100%"><input name="description" style="width:100%"></td><td><input type="number" name="udc" min="1" max="20"></td><!--td style="width:1em"><i class="fas fa-fw fa-trash" style="cursor:pointer"></i></td--></tr></tfoot>
      <tfoot>
        <!--tr class="newRow" style="cursor:pointer"><td colspan="5"><i class="fas fa-fw fa-plus"></i> Nuova linea</td></tr-->
        <tr class="LDP hidden"><td colspan="5"><label><span>Lista di prelievo<span> <select name="LDP"></select> <button type="button" name="loadLDP">Assegna a linea di produzione</button></label><ul></ul></td></tr>
      </tfoot>
      </table>
    `);
    const productionLines = widget.previousElementSibling;
    widget.insertAdjacentHTML('afterend', '<table class="kvProductionLine"></table>');
    const productionLine = widget.nextElementSibling;

    // Carica LDP
    const response = await fetch('https://intranet.ktc-air.com/?*r=13140');
    const options = await response.json();
    html = '';
    options.forEach(option => html += `<option value="${option.numreg}">${option.numdoc} del ${option.date}</option>`);
    productionLines.addEventListener('change', event => {
      let row = productionLines.querySelector('tr.selected').rowIndex - 1;
      data[row][event.target.name] = event.target.value;
      productionLines.manage(event);
    });
    productionLines.querySelector('[name=LDP]').innerHTML = html;
    productionLines.querySelector('[name=loadLDP]').addEventListener('click', async event => {
      let numreg = event.target.previousElementSibling.value;
      const response = await fetch('https://intranet.ktc-air.com/?*r=13139&NUMREG=' + numreg);
      const ldp = await response.json();

      const line = data[productionLines.querySelector('tr.selected').rowIndex - 1];
      if (line) {
        line.components.forEach(component => component.included = false);

        ldp.components.forEach(component => {
          let i = line.components.findIndex(c => c.code == component.code);
          if (i == -1)
            line.components.push({ code: component.code, description: component.description, category: component.category, udc: null, included: true });
          else if (!line.components[i].included)
            line.components[i].included = true;
        });
      }
      let html = '';
      ldp.items.forEach(item => html += `<li><b>${item.code}</b> ${item.description}</li>`);
      event.target.closest('tr').querySelector('ul').innerHTML = html;

      productionLine.render(line);
    });

    productionLines.setup = () => {
      data.forEach(line => {
        productionLines.querySelector('tbody').insertAdjacentHTML('beforeend', productionLines.querySelector('tfoot').innerHTML);
        let tr = productionLines.querySelector('tbody tr:last-child');
        tr.querySelectorAll('[name]').forEach(field => field.value = line[field.name]);
      });
    };
    productionLines.setup();

    productionLines.addEventListener('click', event => { productionLines.manage(event) });
    productionLines.manage = event => {
      const target = event.target, tr = event.target.closest('tr');
      if (target.classList.contains('fa-trash')) {
        event.stopPropagation();
        if (confirm('Procedo con l\'eliminazione della linea di produzione?')) {
          data.splice(tr.rowIndex - 1, 1);
          tr.remove();
        }
      } else if (tr?.classList.contains('dataRow')) {
        productionLines.querySelector('.selected')?.classList.remove('selected');
        tr.classList.add('selected');
        productionLine.setup(data.find(a => a.code == tr.querySelector('[name=code]').value) || {});
        document.querySelector('.LDP.hidden')?.classList.remove('hidden');
      } else if (tr?.className == 'newRow') {
        productionLines.querySelector('tbody').insertAdjacentHTML('beforeend', productionLines.querySelector('tfoot').innerHTML);
        let tr = productionLines.querySelector('tbody tr:last-child');
        productionLines.querySelector('.selected')?.classList.remove('selected');
        tr.classList.add('selected');
        tr.querySelector('input').focus();
        data.push({ department: null, code: null, description: null, udc: 10, components: [] });
      }
    };

    productionLine.setup = data => {
      productionLine.innerHTML = `
        <caption>${data.description} (${data.code})</caption>
        <thead>
          <tr><th>Componente</th><th>Descrizione</th><th>Categoria</th></tr>
          <tr>
            <td><input type="search" name="code" style="width:100%"></td>
            <td><input type="search" name="description" style="width:100%"></td>
            <td><input type="search" name="category" style="width:100%"></td>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot></tfoot>`;

      let tr = '';
      for (let i = 1; i <= data.udc; ++i)
        tr += `<th>UDC<sub>${i}</sub></th>`;
      productionLine.querySelector('thead > tr').insertAdjacentHTML('beforeend', tr);

      tr = `<tr><td colspan="3">Numero di componenti nella UDC</td>${'<th></th>'.repeat(data.udc)}</tr>`;
      productionLine.querySelector('tfoot').insertAdjacentHTML('afterbegin', tr);
    }
    productionLine.addEventListener('input', event => {
      let code = productionLine.querySelector('[name=code]').value.toLowerCase(),
        description = productionLine.querySelector('[name=description]').value.toLowerCase(),
        category = productionLine.querySelector('[name=category]').value.toLowerCase();

      productionLine.querySelectorAll('tbody tr').forEach(tr => {
        tr.classList.remove('hidden');
        if (tr.children[0].innerText.toLowerCase().indexOf(code) == -1)
          tr.classList.add('hidden');
        if (tr.children[1].innerText.toLowerCase().indexOf(description) == -1)
          tr.classList.add('hidden');
        if (tr.children[2].innerText.toLowerCase().indexOf(category) == -1)
          tr.classList.add('hidden');
      });
      event.target.focus();
    });

    productionLine.render = (line = { components: [] }, sort = false) => {
      if (sort)
        line.components.sort((a, b) => -Math.sign(b.udc - a.udc));

      productionLine.querySelector('tbody').innerHTML = '';
      line.components.forEach((component, i) => {
        tr = `<tr${component.included ? '' : ' class="notPartOf"'}><td>${component.code}</td><td>${component.description}</td><td>${component.category}</td>${'<td class="udc"></td>'.repeat(line.udc)}</tr>`;
        productionLine.querySelector('tbody').insertAdjacentHTML('beforeend', tr);
        if (component.udc != null)
          productionLine.querySelectorAll('tbody tr:last-child .udc')[component.udc].classList.add('selected');
      });
      productionLine.tally(line);
    };
    productionLine.tally = (line = { components: [] }) => {
      let udc_t = Array(line.udc), udc_p = Array(line.udc);
      line.components.forEach(component => {
        udc_t[component.udc] = ++udc_t[component.udc] || 1;
        if (component.included)
          udc_p[component.udc] = ++udc_p[component.udc] || 1;
      });
      productionLine.querySelectorAll('tfoot > tr th').forEach((th, i) => th.innerHTML = typeof udc_t[i] == 'undefined' ? '' : (udc_p[i] || '0') + ' di ' + udc_t[i]);
    }

    productionLine.addEventListener('click', event => {
      let target = event.target, line = data[productionLines.querySelector('tr.selected').rowIndex - 1];

      if (target.classList.contains('udc')) {
        let component = line.components.find(component => component.code == target.closest('tr').firstChild.innerText);
        component.udc = null;

        target.closest('tr').querySelectorAll('.udc').forEach((udc, i) => {
          if (udc == target) { udc.classList.toggle('selected'); } else { udc.classList.remove('selected'); }
          if (udc.classList.contains('selected'))
            component.udc = i;
        });
        productionLine.tally(line);
      }
    });
  });
});
