import {_gOptions} from "./app";
import {isUndef, addClass, hasClass, removeClass} from "./funcs";

export default class Selector {
    _countCols = 0;
    _countRows = 0;
    _table;
    obEvent;
    matrix;

    constructor (table, obEvent) {
        this._table = table;
        this.obEvent = obEvent;
        this.selectCell = selectCell;
        this.initSizeMatrix();
    }

    deselectAll() {
        let length = 0;

        this.goCells( ( cell, coord) => {
            if (this.isSelectedCell(cell)) {
                deselectCell(cell);
                this.obEvent.deselect( cell, coord );
                length++;
            }
        } );

        return length;
    }

    /**
     *
     * @param c - coordinate cell. Example [0, 0]
     */
    getCell (c) {
        const matrix = this.matrix;
        if (c[0] >= 0 && c[1] >= 0) {
            if (c[0] < this.countRows && c[1] < this.countCols) {
                if (matrix[c[0]][c[1]][0] < 0) c[0] += matrix[c[0]][c[1]][0];
                if (matrix[c[0]][c[1]][1] < 0) c[1] += matrix[c[0]][c[1]][1];

                return this.table.rows[c[0]].cells[matrix[c[0]][c[1]][2]];
            }
        }
    }

    get countCols () {
        return this._countCols;
    }

    get countRows () {
        return this._countRows;
    }

    /**
     * get coords of selected cells
     * @returns array [[0, 0], [1, 1]] or false
     */
    getSelectedRectangleCoords ( sc0, sc1 ) {
        let isSelected = false;
        let c1 = Array(2);
        let c2 = Array(2);
        const scIsAr = Array.isArray(sc0) && Array.isArray(sc1);

        this.goCells( ( cell, coord) => {
            let [ iy, ix ] = coord;

            if ( scIsAr ) {
                if ((sc0[0] !== iy || sc0[1] !== this.matrix[iy][ix][2]) && (sc1[0] !== iy || sc1[1] !== this.matrix[iy][ix][2])) {
                    return;
                }
            } else {
                if (!this.isSelectedCell( cell )) return;
            }

            isSelected = true;

            if (isUndef(c1[0]) || c1[0] > iy) c1[0] = iy;
            if (isUndef(c1[1]) || c1[1] > ix) c1[1] = ix;

            if (isUndef(c2[0]) || c2[0] < iy) c2[0] = iy;
            if (isUndef(c2[1]) || c2[1] < ix) c2[1] = ix;
        } );

        return isSelected ? [c1, c2] : false;
    }

    get sizeMatrix () {
        return this.matrix;
    }

    getRectangleCoords (c1, c2) {
        // magic ))
        let loop = true;
        const matrix = this.matrix;
        while(loop) {
            loop = false;

            // min y
            for (let iy = c1[0]; iy <= c1[0]; iy++) {
                for (let ix = c1[1]; ix <= c2[1]; ix++) {
                    if (!isUndef(matrix[iy][ix][0]) && matrix[iy][ix][0] < 0) {
                        c1[0] += matrix[iy][ix][0];
                        iy += matrix[iy][ix][0] - 1;
                        loop = true;
                        break;
                    }
                }
            }

            // max y
            for (let iy = c2[0]; iy <= c2[0]; iy++) {
                if ((c2[0] + 1) === this._countRows ) continue;
                for (let ix = c1[1]; ix <= c2[1]; ix++) {
                    if (!isUndef(matrix[iy][ix][0]) && matrix[iy + 1][ix][0] < 0) {
                        c2[0]++;
                        loop = true;
                        break;
                    }
                }
            }

            // min x
            for (let iy = c1[0]; iy <= c2[0]; iy++) {
                if (matrix[iy][c1[1]][1] < 0) {
                    c1[1] += matrix[iy][c1[1]][1];
                    iy = c1[0] - 1;
                    loop = true;
                    // break;
                }
            }

            // max x
            for (let iy = c1[0]; iy <= c2[0]; iy++) {
                if ((c2[1] + 1) === this._countCols) continue;
                if (matrix[iy][c2[1]+1][1] < 0) {
                    c2[1]++;
                    iy = c1[0] - 1;
                    loop = true;
                    // break;
                }
            }
        }
        return [c1, c2];
    }

    initSizeMatrix () {
        const rows = this.table.rows;
        this._countRows = rows.length;
        let countCols = 0;
        for (let row of rows) {
            let max = 0;
            [...row.cells].forEach(function (c) {
                max += c.colSpan;
            });
            if (max > countCols) {
                countCols = max;
            }
        }

        const matrix = Array(this._countRows).fill().map(
            () => Array(countCols).fill().map(
                () => Array(2)
            )
        );
        const rowCrest = new Array(countCols).fill(0);

        let iy = 0;
        for (let row of rows) {
            let ix = 0;
            let cells = row.cells;
            const crestFn = () => {
                while (ix < countCols && rowCrest[ix]) {
                    rowCrest[ix]--;
                    matrix[iy][ix][0] = matrix[iy-1][ix][0] || 0 - 1;
                    matrix[iy][ix][1] = matrix[iy-1][ix][1];
                    ix++;
                }
            };

            for (let itd = 0; itd < cells.length; itd++) {
                const cell = cells[itd];
                if (hasClass(cell,"fake")) {
                    continue;
                }
                let colspan = cell.getAttribute("colspan");
                let rowspan = cell.getAttribute("rowspan");
                if (rowspan > 1) matrix[iy][ix][0] = 0;
                if (colspan > 1) matrix[iy][ix][1] = 0;

                crestFn();

                try {
                    if (colspan > 1) {
                        matrix[iy][ix][2] = itd;
                        for (let i = 0; i > -colspan; i--) {
                            matrix[iy][ix][1] = i;
                            if (rowspan > 1) rowCrest[ix] = rowspan - 1;
                            ix++;
                        }
                    } else {
                        matrix[iy][ix][2] = itd;
                        if (rowspan > 1) rowCrest[ix] = rowspan - 1;
                        ix++;
                    }
                } catch (e) {
                    console.error("Error: going beyond the size matrix. " + e);
                }
            }

            crestFn();
            iy++;
        }
        this._countCols = countCols;
        this.matrix = matrix;
    }

    isIgnoredCell(cell) {
        const ppn = cell.parentNode.parentNode;
        return hasClass(cell, _gOptions.ignoreClass) // td
            || hasClass(cell.parentNode, _gOptions.ignoreClass) // tr
            || (_gOptions.ignoreThead && ppn.tagName === "THEAD")
            || (_gOptions.ignoreTfoot && ppn.tagName === "TFOOT");
    }

    isSelectedCell(cell) {
        return hasClass(cell, _gOptions.selectClass);
    }

    /**
     * select cells. Fn: select (c1 [, c2])
     * @param c1 - starting position [0, 0]
     * @param c2 - end position [1, 1]
     * @returns {boolean}
     */
    select (c1, c2)    {
        let isSelected = false;
        const countRows = this._countRows;
        const countCols = this._countCols;
        if (c1[0] >= countRows || c1[1] >= countCols || c2[0] < 0 || c2[1] < 0) return false;
        if (c1[0] < 0) c1[0] = 0;
        if (c1[1] < 0) c1[1] = 0;
        if (c2[0] >= countRows) c2[0] = countRows - 1;
        if (c2[1] >= countCols) c2[1] = countCols - 1;

        [c1, c2] = this.getRectangleCoords(c1, c2);

        this.goCells( ( cell, coord) => {
            let prevState = hasClass( cell, _gOptions.selectClass );

            if ( coord[0] < c1[0] || coord[0] > c2[0] || coord[1] < c1[1] || coord[1] > c2[1] ) {
                if ( prevState ) {
                    deselectCell(cell);
                    this.obEvent.deselect( cell, coord );
                }
            } else {
                let result =  selectCell( cell );
                this.obEvent.select( prevState, cell, coord );
                if (!isSelected) isSelected = result;
            }
        } );

        return isSelected;
    }

    selectAll () {
        let length = 0;

        this.goCells( ( cell, coord) => {
            let prevState = hasClass( cell, _gOptions.selectClass );
            let result =  selectCell( cell );
            if ( result ) {
                this.obEvent.select( prevState, cell, coord );
                length++;
            }
        } );

        return length;
    }

    goCells ( fn ) {
        const rows = this.table.rows;
        if (rows.length !== this.countRows) {
            this.initSizeMatrix();
        }
        const matrix = this.matrix;
        for (let iy = 0; iy < this.countRows; iy++) {
            let cells = rows[iy].cells;
            for (let ix = 0; ix < this.countCols; ix++) {
                if (!(matrix[iy][ix][0] < 0) && !(matrix[iy][ix][1] < 0)) {
                    fn( cells[matrix[iy][ix][2]], [ iy, ix ] );
                }
            }
        }

    }

    get table () {
        return this._table;
    }
}

function selectCell(cell) {
    const ppn = cell.parentNode.parentNode;
    const isSelected = _gOptions.selectIgnoreClass || !hasClass(cell, _gOptions.ignoreClass);
    const tagName = ppn.tagName;
    if (((tagName === "TBODY" || tagName === "TABLE") && isSelected)
        || (tagName === "THEAD" && !_gOptions.ignoreThead && isSelected)
        || (tagName === "TFOOT" && !_gOptions.ignoreTfoot && isSelected))
    {
        addClass(cell, _gOptions.selectClass);
        return true;
    }
    return false;
}

function deselectCell(cell) {
    removeClass(cell, _gOptions.selectClass);
}

export {selectCell};
