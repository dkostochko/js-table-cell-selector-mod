import {_gOptions} from "./app";
import {getParentTags, isElement, off, on} from "./dom";
import {addClass} from "./funcs";

export default class Table {
    isMouseDown = false; // whether the left mouse button is pressed
    obApp;
    obSelector;
    obEvent;
    table; // html table
    coord0; // initial coordinate of selection, real table cells
    _isMouse = false;
    _onMouseOver = (e) => this.onMouseOver(e);
    _onMouseDown = (e) => this.onMouseDown(e);
    _onMouseEnter = (e) => this.onMouseEnter(e);
    _onMouseLeave = (e) => this.onMouseLeave(e);
    _onMouseUp = (e) => this.onMouseUp(e);
    _onOutTableClick = (e) => this.onOutTableClick(e);

    constructor(table, obSelector, obEvent, obApp) {
        if (isElement(table) && table.tagName === "TABLE") {
            this.table = table; // DOM element table
            this.obApp = obApp;
            this.obSelector = obSelector;
            this.obEvent = obEvent;
            addClass(this.table, _gOptions.tableClass);
            this.addEvents();
        } else {
            throw new Error("Мodule must be initialized to Table");
        }
    }

    addEvents() {
        const table = this.table;
        on(table, "mouseover", this._onMouseOver);
        on(table, "mousedown", this._onMouseDown);
        on(table, "mouseenter", this._onMouseEnter);
        on(table, "mouseleave", this._onMouseLeave);
        on(document.body, "mouseup", this._onMouseUp);
        on(table.ownerDocument, "click", this._onOutTableClick); // click outside the table
    }

    removeEvents() {
        const table = this.table;
        off(table, "mouseover", this._onMouseOver);
        off(table, "mousedown", this._onMouseDown);
        off(table, "mouseenter", this._onMouseEnter);
        off(table, "mouseleave", this._onMouseLeave);
        off(document.body, "mouseup", this._onMouseUp);
        off(table.ownerDocument, "click", this._onOutTableClick);
    }

    get isMouse() {
        return this._isMouse;
    }

    isRightMouseBtn(e) {
        let isRightMB;
        e = e || window.event;

        if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = e.which === 3;
        else if ("button" in e)  // IE, Opera
            isRightMB = e.button === 2;

        return isRightMB;
    }

    onMouseDown(e) {
        if (this.isIgnoreMouseDown) return;
        if (_gOptions.mouseBlockSelection) e.preventDefault();
        if (this.isRightMouseBtn(e)) return true;

        let cell = getParentTags(e.target, "td,th");
        if (cell === null) return; // not for cell

        this.isMouseDown = true;
        if (e.shiftKey && this.coord0) {
            const [start, finish] = this.obSelector.getSelectedRectangleCoords();
            if (start[0] === finish[0] && start[1] === finish[1]) {
                this.selectRange(this.coord0, [cell.parentNode.rowIndex, cell.cellIndex]);
                return;
            }
        }
        this.obSelector.deselectAll();
        this.obSelector.selectCell(cell);
        this.obEvent.startSelect(e, cell);
        this.coord0 = [cell.parentNode.rowIndex, cell.cellIndex];
    }

    onMouseOver(e) {
        let cell = getParentTags(e.target, "td,th");
        if (cell === null) return; // not for cell

        if (!this.isMouseDown) {
            this.isIgnoreMouseDown = this.obSelector.isSelectedCell(cell);
            return;
        }

        this.selectRange(this.coord0, [cell.parentNode.rowIndex, cell.cellIndex]);
    }

    selectRange(coord0, coord1) {
        let coords = this.obSelector.getSelectedRectangleCoords(coord0, coord1);
        if (coords !== false) this.obSelector.select(coords[0], coords[1]);
    }

    onMouseEnter() {
        this._isMouse = true;
    }

    onMouseLeave() {
        this._isMouse = false;
    }

    onMouseUp(e) {
        if (this.isMouseDown) {
            this.obEvent.finishSelect(e);
            this.isIgnoreMouseDown = true;
        }
        this.isMouseDown = false;
    }

    onOutTableClick() {
        this.isMouseDown = false;
        if (_gOptions.deselectOutTableClick && !this.isMouse) {
            this.obSelector.deselectAll();
        }
    }

    destroy() {
        this.removeEvents();
    }
}
