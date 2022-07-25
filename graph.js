
const NODE_COUNT = 256;

let DEFAULT_PADDING = 20;

let background_colour = 0;
let soft_text_colour = 0;
let decoration_colour = 0;
let active_state_colour = 0;
let inactive_state_colour = 0;

const limit = 4;

// romantic colours
let peach_colour;
let grass_colour;
let sky_colour;

const text_size = 14;

const playTime = 1;

const row_count = 8;
const edges = 0.15;
const padding = 0.2;

let entities = [];

// Components
let node_components = [];
let colour_components = [];

function get_node_space_size() {
  return width / row_count;
}
function get_node_padding() {
  const space = get_node_space_size();
  return space * padding;
}
function get_node_size() {
  const space = get_node_space_size();
  return space - (space * padding);
}

function create_node(x, y) {
  return {
    sound: null,
    volume: 1,
    rate: 1,
    x: x,
    y: y,
    next_children: [],
    prev_children: []
  }
}
function set_sound(index, sound, volume, rate) {
  node_components[index].sound = sound;
  node_components[index].volume = volume;
  node_components[index].rate = rate;
}
function try_play_sound(index) {
  if(node_components[index].sound !== null && node_components[index].sound.isLoaded()) {
    node_components[index].sound.play(0, node_components[index].rate, node_components[index].volume);
  }
}

function attach_next_node(current, next) {
  node_components[current].next_children.push(next);
}
function get_node(index) {
  return node_components[index];
}
function is_child_of(current, parent) {
  const is_part_of_prev = node_components[parent].prev_children.includes(current);
  const is_part_of_next = node_components[parent].next_children.includes(current);
  return is_part_of_prev || is_part_of_next;
}
function get_next_node_index(current, next) {
  return node_components[current].next_children[next];
}
function has_next_node(current, next) {
  return node_components[current].next_children.length > next && get_next_node_index(current, next) !== null;
}

function attach_prev_node(current, prev) {
  node_components[current].prev_children.push(prev);
}
function get_prev_node_index(current, prev) {
  return node_components[current].prev_children[prev];
}
function has_prev_node(current, prev) {
  return node_components[current].prev_children.length > prev &&  (current, prev) !== null;
}

function get_node_colour(index) {
  return colour_components[index];
}
function set_node_colour(index, colour) {
  colour_components[index] = colour;
}

let current_node = -1;

function is_hovering(x, y, w, h)
{
  const node = get_node(current_node);
  const mx = current_node != -1 || is_mouse ? node.x : mouseX;
  const my = current_node != -1 || is_mouse ? node.y : mouseY;
  const half_width = w / 2;
  const half_height = h / 2;
  const left = x - half_width;
  const right = x + half_width;
  const top = y - half_height;
  const bottom = y + half_height;
  return mx >= left && mx <= right && my >= top && my <= bottom; 
}

function draw_uniform_button(x, y, colour, title) {
  rectMode(CENTER);
  const size = get_node_size();
  const roundness = size * edges;
  //const colour = is_hovering(node.x, node.y, size, size) ? active_state_colour : inactive_state_colour;
  textStyle(NORMAL);
  textSize(text_size);
  textAlign(CENTER, CENTER);
  fill(colour);
  rect(x, y, size, size, roundness);
  fill(background_colour);
  text(title, x, y, size, size);
  rectMode(CORNER); 
}

function on_node_changed()
{
  const node = current_node;
  try_play_sound(node);
}

const JUMP = 0;
const LAND = 1;
const DOUBLE_JUMP = 2;
const BOUNCE = 3;

function draw_node(index) {
  rectMode(CENTER);
  const node = node_components[index];
  let colour = get_node_colour(index);
  let title = "";
  //const colour = is_hovering(node.x, node.y, size, size) ? active_state_colour : inactive_state_colour;
  //fill(colour);
  //rect(node.x, node.y, size, size, roundness);
  const size = get_node_size();
  const is_child = is_child_of(index, current_node);
  if(is_child && is_mouse_hovering_button(node.x - size / 2, node.y - size / 2, size, size)) {
    if(mouseIsPressed && !wasMousePressed) {
      colour = color(255, 255, 255, 255);
      current_node = index;
      on_node_changed();
    }
    else {
      colour = active_state_colour;
    }
  }
  if(is_child) {
    switch(floor(index / row_count)) {
      case JUMP:        title = "Jump!";        break;
      case LAND:        title = "Land!";        break;
      case DOUBLE_JUMP: title = "Double Jump!"; break;
      case BOUNCE:      title = "Bounce!";      break;
    }
  }

  draw_uniform_button(node.x, node.y, colour, title);
  rectMode(CORNER); 
}

function draw_node_connections(index)
{
  const node = node_components[index];
  const quarter_height = get_node_size() / 4;
  const quarter_width = get_node_size() / 4;
  stroke(peach_colour);
  for(let i = 0; i < node.next_children.length; i += 1) {
    const other_node = node_components[node.next_children[i]];
    line(node.x, node.y, other_node.x, other_node.y);
  }
  stroke(sky_colour);
  for(let i = 0; i < node.prev_children.length; i += 1) {
    const other_node = node_components[node.prev_children[i]];
    line(node.x, node.y, other_node.x, other_node.y);
  } 
}

function position_node(index, x, y) {
  node_components[index].x = y;
  node_components[index].y = x;
}

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

function flush_entities() {
  while(entities.length != 0) {
    entities.pop();
  } 
  for(let i = 0; i < node_components.length; i += 1)
  {
    const node = node_components[i];
    node.x = 0;
    node.y = 0;
    node.next_children.length = 0;
    node.prev_children.length = 0;
  }
}

// coordinate to index
function ctoi(x, y) {
  return (y * row_count) + x;
}

let harp_sounds = [];
let high_harp_sounds = [];
let pan_sounds = [];
let flute_sounds = [];

const DEBUG_AREA_SIZE = 0.5;
let DEBUG_AREA_START = 0;

function setup_entities() {
  wrap_index = (index, n) => {
      return ((index % n) + n) % n;
  };

  const space = get_node_space_size();
  const offset = space / 2;
  const max = (limit * row_count) + row_count;
  // Set positions of nodes
  for(let iy = 0; iy < limit; iy += 1) {
      for(let ix = 0; ix < row_count; ix += 1) {
      let x = offset + (ix * space);
      let y = offset + (iy * space);
      const index = ctoi(ix, iy);
      position_node(index, x, y);
      entities.push(index);
    }  
  }
  // Set all children  for root - jump 
  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, JUMP);
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), LAND));
    attach_next_node(index, ctoi(wrap_index(ix, row_count), DOUBLE_JUMP));
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), BOUNCE));
  }
  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, DOUBLE_JUMP);
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), LAND));
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), DOUBLE_JUMP));
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), BOUNCE));
  }

  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, LAND);
    attach_next_node(index, ctoi(ix, JUMP));
    attach_prev_node(index, ctoi(wrap_index(ix - 1, row_count), LAND));
    attach_next_node(index, ctoi(ix, DOUBLE_JUMP));
    attach_next_node(index, ctoi(ix, BOUNCE));
  }

  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, BOUNCE);
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), LAND));
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), DOUBLE_JUMP));
    attach_next_node(index, ctoi(wrap_index(ix + 1, row_count), BOUNCE));
  }

  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, 0);
    set_sound(index, harp_sounds[ix], 1.25, 1);
  }
  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, 1);
    set_sound(index, pan_sounds[ix], 0.35, 1);
  }
  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, 2);
    set_sound(index, high_harp_sounds[ix], 1.25, 1);
  }
  for(let ix = 0; ix < row_count; ix += 1) {
    const index = ctoi(ix, 3);
    set_sound(index, flute_sounds[ix], 0.25, 1);
  }
  current_node = ctoi(0, 1);
}

let buttons = [];
function create_button(text, x, y, w, h, validation, callback) {
  push();
  const width = w / 4;
  const size = get_node_space_size();
  const roundness = size * edges;
  const padding = get_node_padding();
  buttons.push({
    text: text,
    x: x,
    y: y,
    w: w,
    h: h,
    is_valid: validation,
    callback: callback
  });
  pop();
}

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


function setup_buttons(x, y, w) {
  buttons.length = 0;
  const width = w / 4;
  const size = get_node_space_size();
  const padding = get_node_padding();

  const titles = ["Q", "W", "E", "R"];
  const validations = [
    () => {
      return has_next_node(current_node, 0);
    }, 
    () => {
      return has_next_node(current_node, 1);
    },
    () => {
      return has_next_node(current_node, 2);
    },
    () => {
      return has_next_node(current_node, 3);
    }
  ];

  const callbacks = [
    () => {
      current_node = get_next_node_index(current_node, 0); 
    },
    () => {
      current_node = get_next_node_index(current_node, 1); 
    },
    () => {
      current_node = get_next_node_index(current_node, 2); 
    },
    () => {
      current_node = get_next_node_index(current_node, 3);  
    }
  ];

  for(let i = 0; i < 4; i++) {
    const px = x + (i * width) + (padding / 2);
    const py = y + padding + (padding / 2); 
    const pw = width - padding;
    const ph = size - padding;
    create_button(titles[i], px, py, pw, ph, validations[i], callbacks[i]);
  }
}

let wasMousePressed = false;
function draw_buttons() {

  const size = get_node_space_size();
  const roundness = size * edges;
  push();
  for(let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    if(!button.is_valid()) {
      fill(128);
    }
    else if(is_mouse_hovering_button(button.x, button.y, button.w, button.h)) {
      fill(active_state_colour);
      if(mouseIsPressed && !wasMousePressed) {
        fill(255);
        button.callback();
      }
    }
    else {
      fill(soft_text_colour);
    }
    rect(button.x, button.y, button.w, button.h, roundness);

    textStyle(NORMAL);
    textSize(text_size);
    textAlign(CENTER, CENTER);
    fill(background_colour);
    text(button.text, button.x, button.y, button.w, button.h);
  }
  pop();

}


function windowResized() {
  const space = windowHeight > windowWidth ? windowWidth : windowHeight;
  resizeCanvas(space - DEFAULT_PADDING, space - DEFAULT_PADDING);
  DEBUG_AREA_START = (height * DEBUG_AREA_SIZE) + DEFAULT_PADDING;

  flush_entities();
  setup_entities();
}

function preload() {
  soundFormats( 'WAV');
}

function setup() {
  background_colour = color(41, 43, 47, 255);
  soft_text_colour = color(211, 191, 215, 255);
  decoration_colour = color(127, 90, 136, 255);
  inactive_state_colour = color(255, 242, 156, 255);
  active_state_colour = color(149, 245, 172, 255);
  peach_colour = color(250, 224, 197, 255);
  grass_colour = color(231, 255, 201, 255);
  sky_colour = color(206, 236, 245, 255);

  let str = getURL();
  const count = getURLPath().length;
  for(let i = 0; i < count; i++) {
    str = str.substring(0, str.lastIndexOf("/"));
  }
  const path = str;

  const NOTE_COUNT = 8;
  const high_note_names = ["C6", "G6", "F6", "E6", "G6", "A6", "F6", "E6"];
  const low_note_names = ["C5", "D5", "F5", "E5", "C5", "F5", "D5", "G5"];
  for(let i = 0; i < NOTE_COUNT; i++) {
    harp_sounds.push(loadSound(path + "/Harp/"+ low_note_names[i] + "_Harp"));
    pan_sounds.push(loadSound(path + "/Pan/"+ low_note_names[i] + "_Handpan"));
    flute_sounds.push(loadSound(path + "/Flute/"+ high_note_names[i] + "_Flute"));
    high_harp_sounds.push(loadSound(path + "/Harp/"+ high_note_names[i] + "_Harp"));
  }

  for(let i = 0; i < NODE_COUNT; i++) {
    colour_components.push(color(inactive_state_colour));
    node_components.push(create_node(0, 0));
  }
  //sound.play();
  const space = windowHeight > windowWidth ? windowWidth : windowHeight;
  createCanvas(space - DEFAULT_PADDING, space - DEFAULT_PADDING);
  DEBUG_AREA_START = (height * DEBUG_AREA_SIZE) + DEFAULT_PADDING;
  setup_entities();

}

function check_hover() {
  let lookup = [];
  lookup.fill(false, 0, NODE_COUNT);

  for(let index = 0; index < entities.length; index++) {
    if(lookup[index]) {
      continue;
    }
    const node = node_components[index];
    const size = get_node_size();
    if(is_hovering(node.x, node.y, size, size)) {
      const space = get_node_space_size();
      
      for(let y = 0; y < limit; y++) {
        if(has_next_node(index, y)) {
          const next = get_next_node_index(index, y);
          set_node_colour(next, peach_colour);
          lookup[next] = true;
        }
        
        if(has_prev_node(index, y)) {
          const next = get_prev_node_index(index, y);
          set_node_colour(next, sky_colour);
          lookup[next] = true;
        }
      }

      //const y = current_row;
      //set_node_colour(index, colour);
      /* Doesn't work with looping... Also not really great :D 
      for(let y = 0; y < limit; y++) {

        for(let current = index; ; current = get_next_node_index(current, y)) {
          set_node_colour(current, peach_colour);
          lookup[current] = true;
          if(!has_next_node(current, y)) {
            break;
          }
          else if(lookup[current]) {
            continue;
          }
        }
  
        for(let current = index; ; current = get_prev_node_index(current, y)) {
          set_node_colour(current, sky_colour);
          lookup[current] = true;
          if(!has_prev_node(current, y)) {
            break;
          }
          else if(lookup[current]) {
            continue;
          }
        }
      }
      */
      set_node_colour(index, active_state_colour);
    }
    else {
      set_node_colour(index, inactive_state_colour);
    }
  }
}

function draw_button_area(x, y, w, h)
{
  push();
  const width = w / 4;
  const size = get_node_space_size();
  const roundness = size * edges;
  const padding = get_node_padding();
  for(let i = 0; i < 4; i++) {
    const px = x + (i * width) + (padding / 2);
    const py = y + padding + (padding / 2); 
    const pw = width - padding;
    const ph = size - padding;
    fill(soft_text_colour);
    rect(px, py, pw, ph, roundness);
    textStyle(NORMAL);
    textSize(text_size);
    textAlign(CENTER, CENTER);
    fill(background_colour);
    text("Hello", px, py, pw, ph);
  }
  pop();
}

function draw() {
  background(background_colour);
  push();
  //if(mouseIsPressed === true) {
  //  sound.play();
 // }
 
  //draw_buttons();
  check_hover();
  for(let i = 0; i < entities.length; i++) {
    draw_node_connections(entities[i]);
  }
  for(let i = 0; i < entities.length; i++) {
    draw_node(entities[i]);
  }
  fill(soft_text_colour);
  pop();
  wasMousePressed = mouseIsPressed;
}