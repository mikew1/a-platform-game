
// Goal of game is to collect all coins.
// If player touches lava, game restarts.

let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;

// Js is a prototype language, so does not have classes, wtf
//  developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Details_of_the_Object_Model
// Memo: "Prototype langs work by haing some specially designated instances that serve
// as ways to make new objects. You may never use those objects themselves, directly.
// They serve instead as templates to make new objects from. The difference then is you
// can add to them directly, and changes pass through. Think of a clone having slots,
// & if a slot is absent, that message just passes straight through to the prototype,
// which you can modify at run time. It can be vastly more dynamic than strict OO".
// [< Own words, off of last chapter of 7langs, p289].

// Todos: explore the update functions, the physics, add monster, see chapter.
// there's much to do here; js is not the cleanest language for this,
// but that's not really a problem; the working skeleton is here to hack.

class Vec {
    // Given a 2D world, will use this
    constructor(x, y) {  this.x = x; this.y = y;                              }
    plus(other)       {  return new Vec(this.x + other.x, this.y + other.y);  }
    times(factor)     {  return new Vec(this.x * factor, this.y * factor);    }
}

class Level {
    // Read a level & set its height, width & startActors:
    constructor(plan) {
        // splat each line to array. nice.
        let rows = plan.trim().split("\n").map(l => [...l]);  //console.log(rows);
        this.height = rows.length;
        this.width  = rows[0].length;
        // need to create an actor object for each actor found in level plan
        this.startActors = [];
        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let type = levelChars[ch]; // <- lookup what the char is
                if (typeof type == "string") return type;
                // it's an actor, so create it:
                this.startActors.push(type.create(new Vec(x, y), ch));
                // x,y pos in plan that had an actor, set as empty:
                return "empty";
            });
        });
    }
}



class State {
    // Contains all that's needed to create a running game at a moment in time.
    // Note how complete this is. Excluding game logic, which is like the physics
    // of our world, so can be considered never to change, this data is all that's
    // needed to recreate not only a world exactly, but a moment in time exactly.
    // One instance of this class is enough to save a game. todo: add a save feature.
    // This is an immutable structure. We don't modify it, we create a new one for
    // each frame. takes level, actor positions, & game status. could add more.
    // memo, functional style implies all state in params, no ref. to global vars.
    constructor(level, actors, status) {
        this.level  = level;    // <- height, width & rows. startActors no longer used.
        this.actors = actors;   // <- actors with their positions right now.
        this.status = status;   // <- playing, lost, or won.
    }
    static start(level) {
        return new State(level, level.startActors, "playing");
    }
    get player() {              // <- get player as a property
        return this.actors.find(a => a.type == "player");
    }                   // rtn first (only) match
}




/**
 * Actors
 * all have an update() method to advance it one timestep.
 * we set that later, on prototype. _js 'classes' effectively just hold constructors_
 * all take pos in constructor, which is top left corner.
 * all have a size property, which is fixed, so _set on prototype_, for speed.
 * could also set type on prototype, instead of construct: try it, is it reserved word.
 * Define actor 'classes', which in js _effectively just hold constructors_:
 * (functions will be added later, below, by attaching to prototypes)
 */
class Player {
    // create with pos & speed
    constructor(pos, speed) {
        this.pos   = pos;
        this.speed = speed;
    }
    get type() { return "player"; }
    // q. wtf is static create? a. it's a method we've added, that's used
    // by Level constructor to create a new actor (actors are created only
    // at start of game, rest of time they just update).
    // So, _create() is used to call constructor of object, all held in 'class'_
    static create(pos) { // <- 2nd arg, ch, just ignored here
        // set initial pos /2 sq. above posn given, since player is 1.5 high:
        return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0,0));
    }
}                                           // add size, which doesn't change, to prototype
Player.prototype.size = new Vec(0.8, 1.5);  // <- incr. 0.8 to make player fat (best w. dom display)


class Lava {
    // create with pos, speed & reset pos (if present, where to reset to when hits wall,
    // otherwise just reverse dir). memo, constructor will be called on every update()
    constructor(pos, speed, reset) { // <- if call with 2 params, 3rd will be undefined.
        this.pos = pos;
        this.speed = speed;
        this.reset = reset;  // if set, instead of bounce on collision, reset to here.
    }
    get type() { return "lava"; }

    // memo, create is called only at start of game
    static create(pos, ch) {
        // initialise by type of lava:
        if (ch == "=") {                                   // horiz osc. type
            return new Lava(pos, new Vec(2, 0));
        } else if (ch == '|') {                            // vert. osc. type
            return new Lava(pos, new Vec(0, 2));
        } else if (ch == 'v') {                            // vert. down type
            return new Lava(pos, new Vec(0, 3), pos);
        }
    }
}
Lava.prototype.size = new Vec(1, 1);


class Coin {
    // pos. of coins doesn't change, but they do wobble, to liven up visuals
    constructor(pos, basePos, wobble) {
        this.pos = pos;
        this.basePos = basePos;   // basePos plus wobble determine pos.
        this.wobble = wobble;     // tracks phase of bouncing motion
    }
    get type() { return "coin"; }
    // memo, create is called only at start of game
    static create(pos) {
        let basePos = pos.plus(new Vec(0.2, 0.1));    // <- hack to explore effect
        return new Coin(basePos, basePos,
                        Math.random() * Math.PI * 2); // <- random phase in (0, 2pi) rads.
    }
}
Coin.prototype.size = new Vec(0.6, 0.6);  // <- change to see effect

// This needs to come here because it refers to classes above.
// Want to move to modules, in which case might need import.
// Or, redesign to use string indication of actor, avoid need for classname.
const levelChars = {
    ".": "empty", "#": "wall", "+": "lava",
    "@": Player, "o": Coin,
    "=": Lava, "|": Lava, "v": Lava
};

// Run in console to test above:
// l = new Level(simpleLevelPlan)
// s = State.start(l)
// Keep running those two cmds as we develop more below.

/**
 * At this point, we have a level and actors. Next, we need to make level
 * visible on screen. After that, model time & motion for each actor.
 * The final part will be running the game by creating a display object.
 *
 * In game.html, runGame is called with two params, first being GAME_LEVELS,
 * then a Constructor function, aka javascript 'class'. Initially, that's the
 * Constructor function 'class', DOMDisplay, below, but we'll swap that later.
 */

/* -- have clipped DOMDisplay code here into separate file
     not a module, just a separate .js file --   */


/**
 * Update functions for each actor
 * incl. collision detection & motion
 */

// Tells us whether a rectangle (specd by position & size)
//  touches a grid el of given type:
Level.prototype.touches = function(pos, size, type) {
    var xStart = Math.floor(pos.x);
    var xEnd   = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd   = Math.ceil(pos.y + size.y);

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            let isOutside = x < 0 || x >= this.width ||  // ext. boundaries of entire level
                            y < 0 || y >= this.height;
            let here = isOutside ? "wall" : this.rows[y][x]; // wall else current game char
            if (here == type) return true;               // check for actual type
        }
    }
    return false;
}

// uses touches, above, to find out whether the player is touching lava:
State.prototype.update = function(time, keys) { // (keys is which keys are being held down)
    let actors = this.actors
        .map(actor => actor.update(time, this, keys));         // fp wld rtn rslt, not assign
    let newState = new State(this.level, actors, this.status); // in fp, wld be fn, not var

    if (newState.status != "playing") return newState;

    let player = newState.player;
    if (this.level.touches(player.pos, player.size, "lava")) { // check for touching lava
        return new State(this.level, actors, "lost");
    }

    for (let actor of actors) {
        if (actor != player && overlap(actor, player)) {
            newState = actor.collide(newState);                // call collide fn on actor
        }
    }
    return newState;
}

// js is mix of oo & non; fns exist in global space:
function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
           actor1.pos.x < actor2.pos.x + actor2.size.x &&
           actor1.pos.y + actor1.size.y > actor2.pos.y &&
           actor1.pos.y < actor2.pos.y + actor2.size.y;
}

// if any actor does overlap, its collide method gets a chance to update the state
Lava.prototype.collide = function(state) {
    return new State(state.level, state.actors, "lost");
}
Coin.prototype.collide = function(state) {
    let filtered = state.actors.filter(a => a != this);
    let status = state.status;
    if (!filtered.some(a => a.type == "coin")) status = "won";  // no coins left
    return new State(state.level, filtered, status);
}

Lava.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));      // next position
    if(!state.level.touches(newPos, this.size, "wall")) {
        return new Lava(newPos, this.speed, this.reset);     // if no touch, move it
    } else if (this.reset) {
        return new Lava(this.reset, this.speed, this.reset); // touch, reset for drip
    } else {
        return new Lava(this.pos, this.speed.times(-1));     // touch, bounce
    }
};

const wobbleSpeed = 8, wobbleDist = 0.7;
Coin.prototype.update = function(time) {
    let wobble = this.wobble + time * wobbleSpeed;
    let wobblePos = Math.sin(wobble) * wobbleDist;
    return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                    this.basePos, wobble);
};


const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;
                            // (this method is heavily reliant on variable state):
Player.prototype.update = function(time, state, keys) {
    let xSpeed = 0;         // 'initialise' (not fp)
    if (keys.ArrowLeft)  xSpeed -= playerXSpeed; // if left, move at (const) speed
    if (keys.ArrowRight) xSpeed += playerXSpeed; // if right, move at (const) speed
    let pos = this.pos;     // 'initialise' (not fp)
    let movedX = pos.plus(new Vec(xSpeed * time, 0)); // use xSpeed to compute new x
    if (!state.level.touches(movedX, this.size, "wall")) {
        pos = movedX;      // if no touch, set new pos to movedX as computed
    }

    let ySpeed = this.speed.y + time * gravity;               // add gravity
    let movedY = pos.plus(new Vec(0, ySpeed * time));         // compute movedY
    if (!state.level.touches(movedY, this.size, "wall")) {    // if not touch wall, set to new
        pos = movedY;
    } else if (keys.ArrowUp && ySpeed > 0) {    // if jump pressed, falling, & hit something
        ySpeed = -jumpSpeed;                    // jump (negative ySpeed)
    } else {
        ySpeed = 0;                             // bumped into something, so no ySpeed
    }
    return new Player(pos, new Vec(xSpeed, ySpeed));
};


/**
 * Track keys
 * want keys to have effect as long as they are held
 * see event chapter to understand below code
 */
function trackKeys(keys) {
    let down = Object.create(null);
    function track(event) {
        if (keys.includes(event.key)) {
            down[event.key] = event.type == "keydown";
            event.preventDefault();
        }
    }
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    return down;
}

const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);


/**
 * Running the game
 *
 */
function runAnimation(frameFunc) {
    let lastTime = null;
    function frame(time) {
        if (lastTime != null) {
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            if (frameFunc(timeStep) === false) return;
        }
        lastTime = time;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function runLevel(level, Display) {
    let display = new Display(document.body, level);
    let state   = State.start(level);
    let ending  = 1;
    return new Promise(resolve => {
        runAnimation(time => {
            state = state.update(time, arrowKeys);
            display.syncState(state);
            if (state.status == "playing") {
                return true;
            } else if (ending > 0) {
                ending -= time;
                return true;
            } else {
                display.clear();
                resolve(state.status);
                return false;
            }
        });
    });
}

// call runGame(GAME_LEVELS, DOMDisplay) in inline script:
async function runGame(plans, Display) {
    for (let level = 0; level < plans.length;) {
        let status = await runLevel(new Level(plans[level]), Display);
        if (status == "won") level++;
    }
    console.log("You've won!");
}