function is_mouse_hovering_button(x, y, w, h)
{
  const mx = mouseX;
  const my = mouseY;
  const left = x;
  const right = x + w;
  const top = y;
  const bottom = y + h;
  return mx >= left && mx <= right && my >= top && my <= bottom; 
}

class slider {
  constructor(label, minimum, maximum, start, step) {
    this.label = label;
    this.value = 0;
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 30;
    this.title = null;
    this.text_size = 16;
    this.space = 0;
    this.slider = createSlider(minimum, maximum, start, step);
    this.slider.position(this.x + this.space, this.y);
    this.slider.style('width', (this.w-5)+'px');
    this.slider.style('height', '27px');
    this.slider.style('margin','auto');
    this.slider.style('display','block');
    this.slider.mouseMoved(() => {
      this.label = this.slider.value();
    });
    this.label = this.slider.value();
    this.button_text = null;
    this.button_callback = null;
    this.mouseWasPressed = false;
    this.button_colour = inactive_state_colour;
  }
  
  set_button_callback(callback) {
    this.button_callback = callback;
  }

  set_button_colour(c) {
    this.button_colour = c;
  }

  set_button_text(text) {
    this.button_text = text;
  }

  set_title(title) {
    this.title = title;
  }

  get_value() {
    return this.slider.value();
  }

  set_width(w) {
    this.w = w;
    this.slider.style('width', (w-5)+'px');
  }

  set_position(x, y) {
    this.x = x;
    this.y = y;
    this.slider.position(this.x + this.space, this.y);
  }
  
  set_space(space) {
    this.space = space;
    this.slider.position(this.x + this.space, this.y);
  }
  
  set_text_size(size) {
    this.text_size = size;
  }
  
  draw() {
    push();
    rectMode(CORNER);
    textStyle(NORMAL);
    const offset = 30;
    let h = this.h;
    if(this.title !== null) {
      h += offset;
    }

    const r = red(background_colour);
    const g = green(background_colour);
    const b = blue(background_colour);
    fill(color(r, g, b, 128));
    const w = this.w + this.space;
    const corners = (w < this.h ? w : this.h) * 0.3;
    rect(this.x, this.y - offset, w, h, corners);
    
    fill(soft_text_colour);
    textSize(this.text_size);
    textAlign(LEFT, CENTER);
    text(this.label, this.x + 5, this.y, this.w, this.h);
    textAlign(CENTER, CENTER);
    text(this.title, this.x, this.y - offset, w, this.h);
    
    if(this.button_callback !== null) {
      const bx = this.x + w + 5;
      const by = this.y - offset;
      const is_hovered = is_mouse_hovering_button(bx, by, h, h);
      const c = is_hovered ? active_state_colour : this.button_colour;
      const a = is_hovered ? 255 : 128;
      fill(color(red(c), green(c), blue(c), a));

      rect(bx, by, h, h, corners);
      textSize(this.text_size * 0.8);
      if(this.button_text !== null) {
        fill(background_colour);
        text(this.button_text, bx, by, h, h);
      }
      
      if(is_hovered && mouseIsPressed === true && this.mouseWasPressed === false) {
        this.button_callback();
      }
    }
    pop();
    this.mouseWasPressed = mouseIsPressed;
  }
}


let speed_slider;
let width_slider;
let height_slider;
let iteration_slider;
let carve_count_slider;
function easeInSine(x) {
  return 1 - cos((x * PI) / 2);
}

function easeOutSine(x) {
  return sin((x * PI) / 2);
}

function easeOutBounce(x) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
      return n1 * x * x;
  } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

// SETTINGS
let bullet_colour = 0;
let background_colour = 0;
let soft_text_colour = 0;
let decoration_colour = 0;
let target_colour = 0;
let active_state_colour = 0;
let inactive_state_colour = 0;
let peach_colour = 0;
let grass_colour = 0;
let sky_colour = 0;

// Grid size
let gw = 10;
let gh = 10;
const length = gw * gh;
const cell_margin = 0.1;

let cell_dimension = 20;
function set_cell_size(size) {
  cell_dimension = size;
}

function get_cell_size() {
  return cell_dimension;
}

// Current state
let colours = [];
let layout_states = [];

// Colour lerping
let timer_colours = [];
let from_colours = [];
let to_colours = [];
let rooms_lookup = [];

// Coordinate to index
function ctoi(x, y) {
  return (y * gw) + x;
}

// Coordinate to position
function ctop(x, y) {
  const dim = get_cell_size();
  const px = x * dim;
  const py = y * dim;
  return { x: px, y: py };
}

function ptoc(x, y) {
  const dim = get_cell_size();
  const px = floor(x / dim);
  const py = floor(y / dim);
  return { x: px, y: py };
}

// Get x coordinate
function itox(index) {
  return index % gw;
}

// Get y coordinate
function itoy(index) {
  return floor(index / gw);
}

// Quick get
function g(buffer, x, y) {
  return buffer[ctoi(x, y)];
}

// Quick set
function s(buffer, x, y, that) {
  buffer[ctoi(x, y)] = that;
}

function for_each(action) {
  for(let y = 0; y < gh; y++) {
    for(let x = 0; x < gw; x++) {
      action(x, y);
    }
  }
} 

function buffer(buf, to) {
  for_each((x, y) => {
    s(buf, x, y, to);
  });
}

// Grid control

function create_grid() {
  const dim = get_cell_size();
  for_each((x, y) => {
    // Cell draw data
    s(colours, x, y, decoration_colour);
    
    // State for first layer
    s(layout_states, x, y, false);

    // Colour lerping to make pretty
    s(timer_colours, x, y, 0.0);
    s(from_colours, x, y, decoration_colour); 
    s(to_colours, x, y, decoration_colour);
    s(rooms_lookup, x, y, null);
  });
}

function resize_grid() {
  const m = max(gw, gh);
  const dim = (height > width ? width / m : height / m);
  set_cell_size(dim);
}

function draw_grid() {
  push();
  const offset = get_cell_size() * cell_margin;
  const dim = get_cell_size() - offset;
  for_each((x, y) => {
    fill(g(colours, x, y));
    const pos = ctop(x, y);
    pos.x += offset / 2;
    pos.y += offset / 2;
    //const pos = g(positions, x, y);
    rect(pos.x, pos.y, dim, dim);
  });
  pop();
}

// Logic 

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

class path_builder {
  constructor(cx, cy, path_length, ignore_middle_steps) {
    this.cx = cx;
    this.cy = cy;
    this.path_length = path_length;
    this.current_step = path_length;
    this.ignore_middle_steps = ignore_middle_steps;
    this.temp_states = [];

    buffer(this.temp_states, false);
  }

  reset() {
    this.current_step = this.path_length;
    buffer(this.temp_states, false);
  }

  shuffle_array(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
  }
  
  start(on_carve_callback) {
    buffer(this.temp_states, false);
    s(this.temp_states, this.cx, this.cy, true);
    on_carve_callback(this.cx, this.cy);
    this.build(on_carve_callback, this.cx, this.cy);
  }

  build(on_carve_callback, cx, cy) {
    const N = 0;
    const S = 1;
    const E = 2;
    const W = 3;
    
    const DX = [ 0, 0, 1, -1 ];
    const DY = [ 1, -1, 0, 0 ];
    //const OPP = [ S, N, W, E ]; Eh, no need for now
    const directions = [ N, S, E, W ];
  
    this.shuffle_array(directions);
    
    for(let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      if(this.ignore_middle_steps) {
        if(dir === N || dir === S) {
          if(cx % 2 === 0) {
            continue;
          }
        }
        else if(dir === E || dir === W) {
          if(cy % 2 === 0) {
            continue;
          }
        }
      }
  
      let nx = cx + DX[dir];
      let ny = cy + DY[dir];
  
      const state = g(this.temp_states, nx, ny);
      if(nx >= 0 && nx < gw && ny >= 0 && ny < gh && state == false) {
        // Breakout advance and check
        this.current_step -= 1;
        if(this.current_step <= 0) {
          return;
        }

        // Internal state tracker of grid
        s(this.temp_states, nx, ny, true);

        // Callback to user implementation
        on_carve_callback(nx, ny);
        
        // TODO: .. Make little pause here 

        // Next step
        this.build(on_carve_callback, nx, ny);
      }
    }
  }
}

// Colouring
let colouring_done = false;
let queue = [];
let path_timer = 0;

function reset_colour_path() {
  path_timer = 0;
  colouring_done = false;
}

function slowly_colour_path() {
  if(colouring_done === true) {
    return;
  }
  const max_time = queue.length * speed_slider.get_value();
  const ip = lerp(0, queue.length, easeOutSine(path_timer));
  const index = ceil(ip);

  const in_bounds = index < queue.length;
  
  if(in_bounds) {
    const item = queue[index];
    const fraction = index - ip;

    const colour = lerpColor(active_state_colour, inactive_state_colour, easeInSine(fraction));
    s(colours, item.x, item.y, colour);
    path_timer += (deltaTime / 1000) / max_time;
  }
  else {
    for(let i = 0; i < queue.length; i++) {
      const current = queue[i];
      s(colours, current.x, current.y, active_state_colour);
    }
    colouring_done = true;
  }
}

class layout_room {
  constructor(x, y) {
    this.indeces = [];
    this.neighbours = [];
    this.indeces.push({x: x, y: y});
  }

  is_valid() {
    return this.indeces.length > 0;
  }

  get_origin() {
    return this.indeces[0];
  }
}

let rooms = [];
function in_bounds(x, y) {
  return x >= 0 && y >= 0 && x < gw && y < gh;
}

function is_valid(x, y) {
  return in_bounds(x, y) && g(rooms_lookup, x, y) !== null;
}

let is_maze_layout = false;
function create_layout() {
  const cx = floor((gw) / 2);
  const cy = floor((gh) / 2);
  const iterations = 5;
  const pb = new path_builder(cx, cy, carve_count_slider.get_value(), is_maze_layout);
  queue = [];

  const on_carve = (x, y) => {
    s(layout_states, x, y, true);
    queue.push({x: x, y: y});
  };


  for(let i = 0; i < iteration_slider.get_value(); i++) {
    pb.reset();
    pb.start(on_carve);
  }

  rooms = [];
  for_each((x, y) => {
    if(g(layout_states, x, y) === true) {
      const room = new layout_room(x, y);
      rooms.push(room);
      s(rooms_lookup, x, y, room);
    }
    else {
      s(rooms_lookup, x, y, null);
    }
  });

  for(let i = 0; i < rooms.length; i++) {
    const room = rooms[i];

    function check_and_add(nx, ny) {
      const coord = room.get_origin();
      if(is_valid(coord.x + nx, coord.y + ny)) {
        room.neighbours.push(g(rooms_lookup, coord.x + nx, coord.y + ny));
      }
    }
    check_and_add(-1, 0);
    check_and_add(0, 1);
    check_and_add(1, 0);
    check_and_add(0, -1);
  }
  const { all_rooms, single_rooms, multi_rooms } = create_merge_rooms(rooms);
  console.log(all_rooms);
  console.log(single_rooms);
  console.log(multi_rooms);
  some_cool_room = all_rooms;
  //calculate_walls(all_rooms);
}
let some_cool_room; 
function create_merge_rooms(single_rooms) {
  let room_output = [];
  let singles = [];
  let multis = [];
  let closed_rooms = new Set();
  for(let i = 0; i < single_rooms.length; i++) {
    const room = single_rooms[i];
    if(closed_rooms.has(room)) {
      continue;
    }
    const merge_chance = 0.5;
    const merge_amount = 3;
    if(random(0, 1) < merge_chance) { // 0.5 == merge chance
      const attempt = try_merge(room, closed_rooms, merge_chance, merge_amount) 
      if(attempt.success === true) {
        const merged_room = attempt.result;
        room_output.push(merged_room);
        multis.push(merged_room);
        for(let j = 0; j < merged_room.indeces.length; j++) {
          const index = merged_room.indeces[j];
          s(rooms_lookup, index.x, index.y, merged_room);
        }
      }
      else {
        room_output.push(room);
        singles.push(room);
        const index = room.get_origin();
        closed_rooms.add(room);
        s(rooms_lookup, index.x, index.y, room);
      }
    }
    else {
      room_output.push(room);
      singles.push(room);
      closed_rooms.add(room);
      const index = room.get_origin();
      s(rooms_lookup, index.x, index.y, room);
    }
  }
  return { all_rooms: room_output, single_rooms: singles, multi_rooms: multis };
}

function merge_rooms(lhs, rhs) {
  const coord = lhs.get_origin();
  const new_room = new layout_room(coord.x, coord.y);

  for(let i = 1; i < lhs.indeces.length; i++) {
    const index = lhs.indeces[i];
    new_room.indeces.push(index);
  }
  for(let i = 0; i < rhs.indeces.length; i++) {
    const index = rhs.indeces[i];
    new_room.indeces.push(index);
  }

  const union = [...new Set([...lhs.neighbours, ...rhs.neighbours])];
  union.forEach((item) => {
    new_room.neighbours.push(item);
  });

  for(let i = 0; i < new_room.neighbours.length; i++) {
    const neighbour = new_room.neighbours[i];
    let to_remove = neighbour.neighbours.indexOf(lhs);
    if(to_remove !== -1) {
      neighbour.neighbours.splice(to_remove, 1);
    }
    to_remove = neighbour.neighbours.indexOf(rhs);
    if(to_remove !== -1) {
      neighbour.neighbours.splice(to_remove, 1);
    }
    neighbour.neighbours.push(new_room);
  }
  let to_remove = new_room.neighbours.indexOf(lhs);
  if(to_remove !== -1) {
    new_room.neighbours.splice(to_remove, 1);
  }
  to_remove = new_room.neighbours.indexOf(rhs);
  if(to_remove !== -1) {
    new_room.neighbours.splice(to_remove, 1);
  }
  return new_room;
}

// result.value
function try_merge(room, closed_rooms, merge_chance, counter) {
  if(counter <= 0) {
    return { success: false, result: room};
  }

  if(room.is_valid()) {
    const valid_neighbours = room.neighbours.filter((item) => {
      return !closed_rooms.has(item);
    });
    console.log(valid_neighbours);
    //console.log(valid_neighbours);
    if(valid_neighbours.length !== 0) {
      const neighbour = valid_neighbours[0];
      // merge
      let result = merge_rooms(room, neighbour);
      closed_rooms.add(neighbour);
      closed_rooms.add(room);
      closed_rooms.add(result);
      if(random(0, 1) < merge_chance) { // 0.5 == merge chance
        const next = try_merge(result, closed_rooms, merge_chance, counter - 1);
        return { success: true, result: next.result};
      }
      return { success: true, result: result};
    }
  }
  return { success: false, result: room };
}

const wall_count = 10;
const wall_size = 22.0;
const wall_half_size = {x: wall_size / 2, y: wall_size / 2};
// Wall direction

const U = {x: 0, y: 1};
const D = {x: 0, y: -1};
const L = {x: -1, y: 0};
const R = {x: 1, y: 0};

const expansion = [
  L,
  R,
  U,
  D
];

var normals = [
  D,
  U,
  R,
  L
];

const counts = [
  wall_count,
  wall_count,
  wall_count,
  wall_count
];

const walls = [];
function calculate_walls_for_room_index(room, index) {
  const  door_positions = [
    {x: round(wall_count / 2), y: round(wall_count / 2)},
  ];
  
  const dim = get_cell_size();
  const half ={x: dim / 2, y: dim / 2};
  const full ={ x: dim, y: dim };
  const wall_layout= [];
  buffer(wall_layout, null);
  
  function sub(lhs, rhs) {
    return {x: lhs.x - rhs.x, y: lhs.y - rhs.y};
  }
  function add(lhs, rhs) {
    return {x: lhs.x + rhs.x, y: lhs.y + rhs.y};
  }
  function mul(lhs, scalar) {
    return {x: lhs.x * scalar, y: lhs.y * scalar};
  }
  
  const position = add(ctop(index.x, index.y), half);
  const top_left = ctop(index.x, index.y);
  const bottom_right = add(position, half);
  
  const ws = dim / wall_count;
  
  const has_direction = [
    false, false, false, false
  ];

  const neighbours = [
    add(index, U),
    add(index, D),
    add(index, L),
    add(index, R),
  ];
  const origins = [
    bottom_right,
    top_left,
    top_left,
    bottom_right,
  ];

  function get_index(room_index, wall_index) {
    const size = get_cell_size() / wall_count;
    const a = mul(mul(expansion[room_index], size), wall_index);
    return add(a, origins[room_index]);
  }

  function pos_to_index(x, y, ox, oy)
  {
    x -= ox;
    y -= oy;
    return { x: floor(x / ws), y: floor(y / ws) }
  };
  

  function side_is_wall(x, y) {
    if(!in_bounds(x, y)) {
      return true;
    }
    const target = g(rooms_lookup, x, y);
    return target === null || target !== room;
  }

  function is_door(x, y, nx, ny)
  {
    if(!in_bounds(nx, ny)) {
      return false;
    }

    is_it = false;
    for(let t = 0; t < door_positions; t++) {
      is_it |= x == door_positions[t].x || y == door_positions[t].y;
    }

    const target = g(rooms_lookup, x, y);
    return is_it && target != room && target != null;
  }
  
  //circle(0, 0, 250)
  function outline_rooms(c) {
    const nx = neighbours[c].x;
    const ny = neighbours[c].y;

    if(side_is_wall(nx, ny)) {
      fill(color(0, 255, 0))
      for(let j = 0; j < wall_count + 1; j++) {
        //const pos = get_index(i, j);
        const pos = get_index(c, j);
        rect(pos.x - ws / 2, pos.y - ws / 2, ws, ws);
      }
      fill(color(255, 0, 0))
      //circle(top_left.x, top_left.y, dim / wall_count);
      //circle(bottom_right.x, bottom_right.y, dim / wall_count);
      fill(color(0, 0, 255));
      //circle(position.x, position.y, dim / wall_count);
    }
  }
  outline_rooms(0);
  outline_rooms(1);
  outline_rooms(2);
  outline_rooms(3);

}

function calculate_walls_for_room(room) {
  for(let i = 0; i < room.indeces.length; i++) {
    const index = room.indeces[i];
    calculate_walls_for_room_index(room, index);
  }
}

function calculate_walls(all_rooms) {
  for(let i = 0; i < all_rooms.length; i++) {
    const room = all_rooms[i];
    calculate_walls_for_room(room);
  }
  
}

let sliders = [];

// Application Callbacks
let canvas;
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  
  resize_grid();

  const w = (width * 0.15) < 100 ? width * 0.15 : 100;
  
  for(let i = 0; i < sliders.length; i++) {
    sliders[i].set_position(10, 40 + (i * 70));
    sliders[i].set_text_size(width < 500 ? 14 : 18);
    sliders[i].set_width(w);
    sliders[i].set_space(50);
  }
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  
  background_colour = color(41, 43, 47, 255);
  bullet_colour = color(255, 242, 156, 255);
  soft_text_colour = color(211, 191, 215, 255);
  decoration_colour = color(127, 90, 136, 255);
  target_colour = color(149, 245, 172, 255);
  inactive_state_colour = color(255, 242, 156, 255);
  active_state_colour = color(149, 245, 172, 255);
  peach_colour = color(250, 224, 197, 255);
  grass_colour = color(231, 255, 201, 255);
  sky_colour = color(206, 236, 245, 255);

  const w = (width * 0.15) < 100 ? width * 0.15 : 100;
  const h = 50;

  speed_slider = new slider("", 0.05, 1, 0.25, 0.01);
  width_slider = new slider("", 10, 50, 10, 1);
  height_slider = new slider("", 10, 50, 10, 1);
  iteration_slider = new slider("", 1, 10, 4, 1);;
  carve_count_slider = new slider("", 1, 20, 8, 1);
  
  sliders = [
    speed_slider,
    width_slider,
    height_slider,
    iteration_slider,
    carve_count_slider
  ]; 

  // Speed
  speed_slider.set_title("Layout Speed");
  speed_slider.set_button_text("Re-\ngenerate")
  speed_slider.set_button_callback(() => {
    push();
    fill(background_colour);
    rect(0, 0, width, height);
    pop();
    
    create_grid();
    create_layout();
    reset_colour_path();

    if(mode === MERGING_MODE) {
      for(let i = 0; i < queue.length; i++) {
        s(colours, queue[i].x, queue[i].y, active_state_colour);
      }
    }
  });
  
  // Width
  width_slider.set_title("Width");
  width_slider.set_button_text("Layout Mode")
  width_slider.set_button_callback(() => {
    if(mode === LAYOUT_MODE) {
      return;
    }
    iteration_slider.set_button_colour(inactive_state_colour);
    height_slider.set_button_colour(inactive_state_colour);
    width_slider.set_button_colour(active_state_colour);
    mode = LAYOUT_MODE;
    for(let i = 0; i < queue.length; i++) {
      s(colours, queue[i].x, queue[i].y, decoration_colour);
    }
    reset_colour_path();
  });
  width_slider.slider.mouseReleased(() => {
    gw = width_slider.get_value();
    resize_grid();
    create_grid();
    create_layout();
    reset_colour_path();
  });
  width_slider.set_button_colour(active_state_colour);

  // Height
  height_slider.set_title("Height");
  height_slider.set_button_text("Room Mode")
  height_slider.set_button_callback(() => {
    if(mode === MERGING_MODE) {
      return;
    }
    iteration_slider.set_button_colour(inactive_state_colour);
    width_slider.set_button_colour(inactive_state_colour);
    height_slider.set_button_colour(active_state_colour);
    mode = MERGING_MODE;
    for(let i = 0; i < queue.length; i++) {
      s(colours, queue[i].x, queue[i].y, active_state_colour);
    }
  });
  height_slider.slider.mouseReleased(() => {
    gh = height_slider.get_value();
    resize_grid();
    create_grid();
    create_layout();
    reset_colour_path();
  });

  // Iterations
  iteration_slider.set_title("Iterations");
  iteration_slider.set_button_text("Wall Mode")
  iteration_slider.set_button_callback(() => {
    if(mode === WALL_MODE) {
      return;
    }
    height_slider.set_button_colour(inactive_state_colour);
    width_slider.set_button_colour(inactive_state_colour);
    iteration_slider.set_button_colour(active_state_colour);
    mode = WALL_MODE;
  });
  iteration_slider.slider.mouseReleased(() => {
    create_grid();
    create_layout();
    reset_colour_path();
  });

  // Carve
  carve_count_slider.set_title("Path Length");
  carve_count_slider.slider.mouseReleased(() => {
    create_grid();
    create_layout();
    reset_colour_path();
  });

  for(let i = 0; i < sliders.length; i++) {
    sliders[i].set_position(10, 40 + (i * 70));
    sliders[i].set_text_size(width < 500 ? 14 : 18);
    sliders[i].set_width(w);
    sliders[i].set_space(50);
  }

  resize_grid();
  create_grid();

  create_layout();
  reset_colour_path();
}

function draw_hovered_rooom_and_neighbours()
{
  push();
  rectMode(CORNER);
  textAlign(CENTER,CENTER);
  stroke(0, 0);
  const offset = (get_cell_size() * cell_margin) * 0.25;
  const dim = get_cell_size() + offset;

  const coord = ptoc(mouseX, mouseY);
  const r = red(sky_colour);
  const gr = green(sky_colour);
  const b = blue(sky_colour);
  const a = 255;
  if(is_valid(coord.x, coord.y)) {
    fill(color(r, gr, b, a));
    const room = g(rooms_lookup, coord.x, coord.y);
    for(let i = 0; i < room.indeces.length; i++) {
      const index = room.indeces[i];
      const ipos = ctop(index.x, index.y);
      rect(ipos.x, ipos.y , dim, dim);
    }

    for(let i = 0; i < room.neighbours.length; i++) {
      const n = room.neighbours[i];
      for(let j = 0; j < n.indeces.length; j++) {
        const nindex = n.indeces[j];
        const npos = ctop(nindex.x, nindex.y);
        fill(color(red(peach_colour), green(peach_colour), blue(peach_colour), a));
        rect(npos.x, npos.y, dim, dim);
        fill(background_colour);
        text(i, npos.x, npos.y, dim, dim);
      }
    }
  }
  pop();
}


let mode = 0;
const LAYOUT_MODE = 0;
const MERGING_MODE = 1;
const WALL_MODE = 2;

function draw() {
  background(background_colour);

  
  if(mode == 0) {
    slowly_colour_path();
    draw_grid();
  }
  else if(mode == 1) {
    draw_grid();
    draw_hovered_rooom_and_neighbours(); 
  }
  else if(mode == 2) {
    draw_hovered_rooom_and_neighbours(); 
    calculate_walls(some_cool_room);
  }

  for(let i = 0; i < sliders.length; i++) {
    sliders[i].draw();
  }
}