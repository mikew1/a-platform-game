// *********************************
// ---------- DOM DISPLAY ----------
// *********************************
// not a module, just a separate script file.
/* If any desire to at all, could muck about with this
   to use grid instead; but dom is a pretty rotten option
   compared to the alternatives, maybe elm, lua  */

/**
 * Create a display object, using a parent el & a level
 * In js, class is just a thing that holds a constructor function
 */
class DOMDisplay {
    // called in runLevel() with (document.body, level):
    constructor(parent, level) {
        this.dom = elt("div", {class: "game"}, drawGrid(level));
        this.actorLayer = null;
        parent.appendChild(this.dom);
    }
    // direct alt. to putting it on prototype:
    clear() { this.dom.remove(); }
}

/**
 * helper function giving succinct way to
 * create an el with attribs & child nodes.
 */
function elt(name, attrs, ...children) {
    let dom = document.createElement(name);
    for (let attr of Object.keys(attrs)) {
        dom.setAttribute(attr, attrs[attr]);
    }
    for (let child of children) {
        dom.appendChild(child);
    }
    return dom;
}

/**
 * draw grid                 // - still to study&review
 * this is drawn once & never changes
 * actors in contrast are deleted & redrawn each frame
 */
const scale = 20;                           // pixels per grid unit
function drawGrid(level) {
    return elt("table", {                   // draw bg as a table element
        class: "background",
        style: `width: ${level.width * scale}px`
    }, ...level.rows.map(row =>             // use level.rows to make child els of table
        elt("tr", {style: `height: ${scale}px`},          // make trs for rows
            ...row.map(type => elt("td", {class: type}))) // make tds for table cells
    ));                                     // (spreading array of child nodes with ...)
                                            // conveniently, use string type as classnames
}

/**
 * draw array of actors      // - still to study&review
 */
function drawActors(actors) {
    return elt("div", {}, ...actors.map(actor => {
        let rect = elt("div", {class: `actor ${actor.type}`});
        rect.style.width  = `${actor.size.x * scale}px`;
        rect.style.height = `${actor.size.y * scale}px`;
        rect.style.left   = `${actor.pos.x * scale}px`;
        rect.style.top    = `${actor.pos.y * scale}px`;
        return rect;
    }));
}

/**
 * syncState                   // - still to study&review
 * remove old actor graphics & add new ones
 * removing & re-adding is simply easier to code than keeping track
 */
DOMDisplay.prototype.syncState = function(state) {
    if (this.actorLayer) this.actorLayer.remove();
    this.actorLayer = drawActors(state.actors);
    this.dom.appendChild(this.actorLayer);
    this.dom.className = `game ${state.status}`; // allows style player differently
    this.scrollPlayerIntoView(state);
};

/**
 * scrollPlayerIntoView        // - still to study&review
 *  finds players position & update wrapping elements scroll pos.
 *  would have been easier to always keep player in center; but that's jarring.
 */
DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width  = this.dom.clientWidth;
    let height = this.dom.clientHeight;
    let margin = width / 3;

    // The viewport
    let left = this.dom.scrollLeft, right = left + width;
    let top  = this.dom.scrollTop, bottom = top + height;

    let player = state.player;
    let center = player.pos.plus(player.size.times(0.5))
                           .times(scale);
    if (center.x < left + margin) {
        this.dom.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.dom.scrollLeft = center.x + margin - width;
    }
    if (center.y < top + margin) {
        this.dom.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.dom.scrollTop = center.y + margin - height;
    }
};

// ****************************************
// ---------- END OF DOM DISPLAY ----------
// ****************************************