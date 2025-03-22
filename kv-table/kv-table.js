document.onkeydown = (event) => {
    // Move to cell, if visible do nothing
    let td = document.querySelector(".selected")
    if (td) {
        let row = td.closest("tr").rowIndex,
            col = td.cellIndex;

        switch (event.key) {
            case "ArrowUp":
                if (row > 1) --row
                break;
            case "ArrowDown":
                if (row < td.closest("tbody").children.length - 1) ++row
                break;
            case "ArrowLeft":
                if (col > 1) --col
                break;
            case "ArrowRight":
                if (col < td.closest('tr').children.length - 1) ++col
                break;
            case "Home":
                col = 1;
                if (event.ctrlKey) row = 1;
                break;
            case "End":
                col = td.parentElement.children.length - 1;
                if (event.ctrlKey) row = td.closest('tbody').children.length;
                break;
        }

        td.className = '';
        td = td.closest('tbody').children[row - 1].children[col];
        td.className = 'selected';

        const table = td.closest('table'), rect = td.getBoundingClientRect();
        if (window.innerWidth < rect.right) {
            const colgroup = [...table.querySelectorAll('col')];
            colgroup.every((col, i) => {
                if (i == 0 || col.style.visibility == 'collapse')
                    return true;
                col.style.visibility = 'collapse';
            });
        }
        if (table.querySelector(`colgroup col:nth-child(${col+1})`).style.visibility == 'collapse')
            table.querySelector(`colgroup col:nth-child(${col+1})`).style.visibility = '';

        if (window.innerHeight < rect.bottom) {
            const rows = [...table.querySelectorAll('tbody tr')];
            rows.every((row, i) => {
                if (i == 0 || row.style.display == 'none')
                    return true;
                row.style.display = 'none';
            });
        }
        td.closest('tr').style.display = '';
    }
}
function cellClicked(event) {
    let td = document.querySelector('.selected');
    if (td)
        td.className = '';
    td = event.target;
    if (td.tagName == "TD" && td.cellIndex > 0)
        td.className = "selected";
}

function hideRange(col, row) {
    console.log(col, row)
    document.querySelectorAll("tbody>tr").forEach((tr, i) => {
        tr.style.display = i < row - 1 ? "none" : ""
    })
}

console.clear();