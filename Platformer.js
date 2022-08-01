
let HEIGHT = 600;
let WIDTH = 800;
let DEFAULT_PADDING = 20;

let item_height = 36;
let item_width = 140;
let is_interacting_with_onscreen_buttons = false;

let bullet_colour = 0;
let background_colour = 0;
let soft_text_colour = 0;
let power_colour = 0;
let decoration_colour = 0;
let target_colour = 0;
let active_state_colour = 0;
let inactive_state_colour = 0;
const ground_height = 1.25;
const wall_width = 1.25;
const hud_height = 55;
const hud_width = 200;
const text_size = 14;

let separator = {start: {x: 0, y: 0}, end: {x: 0, y: 0}};
let stack = [];
let stackObserver = (state) => {};
let weaponStack = [];

const ENTITY_BASE_WIDTH = 40;
const ENTITY_BASE_HEIGHT = 60;

let entity = {x: 0, y: 0, w: ENTITY_BASE_WIDTH, h: ENTITY_BASE_HEIGHT, gravity: 0};

let playTime = 1;

function easeInSine(x) {
  return 1 - cos((x * PI) / 2);
}

function easeOutSine(x) {
  return sin((x * PI) / 2);
}

function GetLeftBound() {
  return item_width + item_width;
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

function aim() {
  //stroke(color(255, 0, 0));
  if(!focused) {
    return;
  }
  let dirX = mouseX - entity.x;
  let dirY = mouseY - entity.y;
  let length = dirX * dirX + dirY * dirY;
  if(length != 0) {
    length = sqrt(length);
    dirX /= length;
    dirY /= length;
    bullet.dir.x = dirX;
    bullet.dir.y = dirY;
    dirX *= 500;
    dirY *= 500;
  }
  stroke(target_colour);
  line(entity.x, entity.y, entity.x + dirX, entity.y + dirY);
  //stroke(color(0, 0, 0));
}

let direction = 0;
let was_crouching = false;
let is_crouching = false;
let was_jumping = false;
let is_jumping = false;

let jump_buffer_time_point = -100000;

function was_jump_buffered() {
  return millis() < jump_buffer_time_point + 750;
}

function buffer_jump(tp) { 
  jump_buffer_time_point = tp;
}

function touchMoved() {
  return !focused;
}

function stack_push(state) {
  if(stack.length > 0) {
    //stack[stack.length-1].a = 0;    
  }
  state.from = {x: 0, y: 0};
  stack.push(state);
  stackObserver(state);
  state.a = 0;
}
function stack_pop()
{
  stack.pop();
  if(stack.length > 0) {
    stackObserver(stack[stack.length-1]);
    //stack[stack.length-1].a = 0;    
  }
  else{
    stackObserver(null);
  }
}
function weapon_push(state) {
  if(weaponStack.length > 0) {
    //stack[stack.length-1].a = 0;    
  }
  state.from = {x: 0, y: 0};
  weaponStack.push(state);
  state.a = 0;
}
function weapon_pop()
{
  weaponStack.pop();
  if(weaponStack.length > 0) {
    //stack[stack.length-1].a = 0;    
  }
}

function do_idle() {
  const is_on_ground = is_grounded();
  if(is_on_ground === false) {
    isAirJustPushed = true;
    stack_push(air);
    return true;
  }
  if(direction !== 0) {
    stack_push(moving);
    return true;
  }

  if(is_crouching && !was_crouching) {
    stack_push(crouching);
    return true;
  }
  if((is_jumping && !was_jumping) || was_jump_buffered()) {
    jump_t = 0.25;
    isJumpJustPushed = true;
    stack_push(jump);
    return true;
  }
  return true;
}
let jump_t = 0;
function do_moving() {
  const is_on_ground = is_grounded();
  if(!is_on_ground) {
    isAirJustPushed = true;
    stack_push(air);
    return true;
  }
  entity.x += direction * (deltaTime / 1000) * 150 * playTime;
  if((is_jumping && !was_jumping) || was_jump_buffered()) {
    jump_t = 0.25;
    isJumpJustPushed = true;
    stack_push(jump);
    return true;
  }

  if(is_crouching && !was_crouching) {
    stack_push(crouching);
    return true;
  }
  return direction !== 0;
}
let isJumpJustPushed = false;
function do_jumping() {
  if(!isJumpJustPushed) {
    return false;
  }
  entity.x += direction * (deltaTime / 1000) * 150 * playTime;

  entity.y -= easeOutSine((1 - jump_t)) * 960 * playTime * (deltaTime / 1000);
  jump_t += (deltaTime / 1000) * 1.25 * playTime;

  if(jump_t > 1) {
    isJumpJustPushed = false;
    isAirJustPushed = true;
    stack_push(air);
    return true;
  }
  return true;  
}
let isAirJustPushed = false;
function do_airborne() {
  entity.gravity = easeOutSine(air.a) * 20;
  if(!isAirJustPushed) {
    entity.gravity = 0;
    return false;
  }
  if((is_jumping && !was_jumping)) {
    buffer_jump(millis());
  }
  const is_on_ground = onGround;
  entity.x += direction * (deltaTime / 1000) * 100 * playTime;
  if(!is_on_ground && (entity.y < HEIGHT - ((entity.h / 2) + entity.h * 0.05))) {
    entity.y += (deltaTime * 100)/ 1000 * playTime;
    return true;
  }
  isAirJustPushed = false;
  stack_push(landing);
  entity.gravity = 0;
  return true;
}
function do_landing() {
  const a = easeOutSine(landing.a * 2);
  translate(random(-10*a,10*a),random(-10*a,10*a));
  landing.a += deltaTime / 1000;
  entity.w = ENTITY_BASE_WIDTH + (ENTITY_BASE_WIDTH * a);
  entity.h = ENTITY_BASE_HEIGHT - ((ENTITY_BASE_HEIGHT/ 2) * a);
  if((is_jumping && !was_jumping)) {
    buffer_jump(millis());
  }
  if(landing.a > 1) {
    entity.w = ENTITY_BASE_WIDTH;
    entity.h = ENTITY_BASE_HEIGHT;
    return false;
  }
  return true;
}
function do_crouching() {
    //w: 40, h: 60
  entity.x += direction * (deltaTime / 1000) * 100 * playTime;
  if(is_crouching) {
    entity.w = ENTITY_BASE_HEIGHT;
    entity.h = ENTITY_BASE_WIDTH;
    return true;
  }
  else {
    entity.w = ENTITY_BASE_WIDTH;
    entity.h = ENTITY_BASE_HEIGHT;
    return false;
  }
}
function stack_top_is_equal(state) {
  if(stack.length > 0) {
    if(stack[stack.length-1] === state) {
      return true;
    }   
  }
  return false;
}

function can_shoot() {
  return stack_top_is_equal(idle) || stack_top_is_equal(moving) || stack_top_is_equal(jump);
}

function do_aiming() {
  if(can_shoot()) {
    weapon_push(weaponAimState);
    return true;
  }
  return true;
}

function do_actual_aiming() {
  aim();
  if(can_shoot()) {
    if (!is_interacting_with_onscreen_buttons && mouseIsPressed === true) {
      shootTimer = 0;
      weapon_push(weaponShootState);
      return true;
    }
    return true;
  }
  else {
    return false;
  }
}
let bullet = {active: false, x: 0, y: 0, dir: {x: 0, y: 0}, r: 25};
let shootTimer = 0.0;
function do_shooting() {
  bullet.active = true;
  shootTimer += (deltaTime / 1000) * 4;
  if(shootTimer < 1.0) {
    bullet.x = lerp(entity.x, entity.x + (bullet.dir.x * 800), shootTimer);
        bullet.y = lerp(entity.y, entity.y + (bullet.dir.y * 800), shootTimer);
    return true;
  }
  else {
    bullet.active = false;
    return false;
  }
}

const weaponDefaultState = 
{
  from: {x: 0, y: 0}, 
  title: "Default State", 
  func: do_aiming, 
  colour: 0, 
  a: 1
};

const weaponAimState = 
{
  from: {x: 0, y: 0}, 
  title: "Aim State", 
  func: do_actual_aiming, 
  colour: 0, 
  a: 1
};

const weaponShootState = 
{
  from: {x: 0, y: 0}, 
  title: "Shooting State", 
  func: do_shooting, 
  colour: 0, 
  a: 1
};

const idle = 
{
  from: {x: 0, y: 0}, 
  title: "Idle State", 
  func: do_idle, 
  colour: 0, 
  a: 1
};
const moving = 
{
  from: {x: 0, y: 0}, 
  title: "Move State", 
  func: do_moving, 
  colour : 0, 
  a: 1};
const jump = 
{
  from: {x: 0, y: 0}, 
  title: "Jump State", 
  func: do_jumping, 
  colour: 0, 
  a: 1
};
const air = 
{
  from: {x: 0, y: 0}, 
  title: "Fall State", 
  func: do_airborne, 
  colour: 0, 
  a: 1
};
const landing = 
{
  from: {x: 0, y: 0}, 
  title: "Landing State", 
  func: do_landing, 
  colour: 0, 
  a: 1
};
const crouching = 
{
  from: {x: 0, y: 0}, 
  title: "Crouching State", 
  func: do_crouching, 
  colour: 0, 
  a: 1
};

let canvas;

function respawn_player() {
  entity.y = (HEIGHT * 0.25) - entity.h;
  entity.x = WIDTH * 0.05;
  buffer_jump(-10000);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  HEIGHT = height;
  WIDTH = width;
  respawn_player();
  separator.start.x = GetLeftBound();
  separator.start.y = 0;
  separator.end.x = GetLeftBound();
  separator.end.y = HEIGHT;
}

let colliders = [];

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  HEIGHT = height;
  WIDTH = width;
  background_colour = color(41, 43, 47, 255);
  bullet_colour = color(255, 242, 156, 255);
  soft_text_colour = color(211, 191, 215, 255);
  decoration_colour = color(127, 90, 136, 255);
  target_colour = color(149, 245, 172, 255);
  inactive_state_colour = color(255, 242, 156, 255);
  active_state_colour = color(149, 245, 172, 255);
  power_colour = color(240, 201, 214, 255);
  //strokeWeight(2);
  stack_push(idle);
  weapon_push(weaponDefaultState);
  //stack.push(moving);
  //stack.push(jump);
  //stack.push(air);
  respawn_player();
  separator.start.x = GetLeftBound();
  separator.start.y = 0;
  separator.end.x = GetLeftBound();
  separator.end.y = HEIGHT;

  colliders.push(0, HEIGHT / 2, WIDTH, ground_height);
  colliders.push(0, (HEIGHT / 2) + ground_height * 4, WIDTH, ground_height);
}

function draw_stack_item(item, index, offset) {
  const height = item_height;
  const x = offset;
  const element_width = (width / 2);
  let a = easeOutBounce(item.a);
  const y = ((HEIGHT / 2) - (index * height) - height) * a;

  stroke(red(item.colour) / 2, green(item.colour) / 2, blue(item.colour) / 2, alpha(item.colour));
  fill(item.colour);
  rect(x, y, element_width, item_height, 15);
  stroke(0, 0);

  fill(background_colour);
  text(item.title, x, y, element_width, item_height);
}

function draw_stack(stack, offset) {
  rectMode(CORNER);
  //stroke();
  textStyle(NORMAL);
  textSize(text_size);
  textAlign(CENTER, CENTER);
  
  fill(background_colour);
  stroke(decoration_colour);
  //rect(offset, 0, (width / 2), height / 2);

  for(let i = 0; i < stack.length; i++) {
    const item = stack[i];
    if(item.a < 1) {
      item.a += deltaTime / 1000 * 1.5;
    }
    else if(item.a > 1) {
      item.a = 1;
    }
    if(i == stack.length - 1) {
      item.colour = color(red(active_state_colour), green(active_state_colour), blue(active_state_colour), item.a * 255);
    }
    else {
      item.colour = color(red(inactive_state_colour), green(inactive_state_colour), blue(inactive_state_colour), item.a * 255);
    }
  }
}

let onGround = false;
const coyote_time = 200;
let coyote_time_start = 0; 
function is_grounded() 
{
  const can_still_jump = !(millis() > (coyote_time_start + coyote_time));
  return onGround || can_still_jump;
}

function rect_to_rect(lhs, rhs) {
  if (lhs.x + lhs.w >= rhs.x &&    // r1 right edge past r2 left
      lhs.x <= rhs.x + rhs.w &&    // r1 left edge past r2 right
      lhs.y + lhs.h >= rhs.y &&    // r1 top edge past r2 bottom
      lhs.y <= rhs.y + rhs.h) {    // r1 bottom edge past r2 top
        return true;
  }
  return false;
}

let collision_line;
function draw_entity(ground_rects) {
  rectMode(CENTER);
  
  const e = entity;
  const current = stack[stack.length-1];
  const prev_x = e.x;
  const prev_y = e.y;
  if(!current.func()) {
    stack_pop();
  }
  /*
  if(weaponStack.length > 0) {
    const currentWeaponState = weaponStack[weaponStack.length-1];
    if(!currentWeaponState.func()) {
      weapon_pop();
    }
  }*/
  stroke(was_jump_buffered() ? color(red(power_colour) * 0.8, green(power_colour) * 0.8, blue(power_colour) * 0.8) : decoration_colour);
  fill(was_jump_buffered() ? power_colour : soft_text_colour);
  
  rect(e.x, e.y, e.w, e.h, 15);
  
  const bottom = HEIGHT - (entity.h / 2) - ground_height;
  const right = WIDTH - (e.w / 2) - wall_width;
  const left = 0 + (e.w / 2) + wall_width;
  
  const prevGround = onGround;
  
  const player_rect = {x: e.x - (e.w / 2), y: e.y - (e.h / 2), w: e.w, h: e.h};
  const offset = 1;
  const ground_check_rect = {x: e.x - (e.w * 0.75) / 2, y: e.y + (e.h / 2), w: e.w * 0.75, h: offset};
  const top_check = {x: e.x - (e.w * 0.1) / 2, y: e.y - (e.h / 2), w: offset, h: offset};
  const left_check = {x: e.x - (e.w * 0.5), y: e.y, w: offset, h: offset};
  const right_check = {x: e.x + (e.w * 0.5) - offset, y: e.y, w: offset, h: offset};
  onGround = false;

  push();
  rectMode(CORNER);
  function draw_rect(r) {
    rect(r.x, r.y, r.w, r.h);
  }
  //draw_rect(ground_check_rect);
  //draw_rect(top_check);
  //draw_rect(left_check);
  //draw_rect(right_check);
  pop();

  if(!onGround) {
    entity.y += ((deltaTime * 200)/ 1000 * playTime) + entity.gravity;
  }
  if(e.x < left) {
    e.x = left;
  }
  if(e.x > right) {
    e.x = right;
  }

  // Brute-force sweeps :D 
  for(let i = 0; i < ground_rects.length; i++) {
    while(rect_to_rect(top_check, ground_rects[i])) {
      e.y += 1;
      top_check.y += 1;
    }
  }

  for(let i = 0; i < ground_rects.length; i++) {
    while(rect_to_rect(right_check, ground_rects[i])) {
      e.x -= 1;
      right_check.x -= 1;
    }
  }

  for(let i = 0; i < ground_rects.length; i++) {
    while(rect_to_rect(left_check, ground_rects[i])) {
      e.x += 1;
      left_check.x += 1;
    }
  }
  
  for(let i = 0; i < ground_rects.length; i++) {
    if(rect_to_rect(ground_check_rect, ground_rects[i])) {
      onGround = true;
      e.y = ground_rects[i].y - (e.h / 2) - ground_check_rect.h;
      break;
    }
  }

  // Do bottom collision rouine

  if(e.y >= bottom - entity.h) {
    respawn_player();
    points = [];
  }
  if(!onGround && prevGround) {
    coyote_time_start = millis();
  }
}

function is_hovering(x, y, w, h)
{
  const half_width = w / 2;
  const half_height = h / 2;
  const left = x - half_width;
  const right = x + half_width;
  const top = y - half_height;
  const bottom = y + half_height;
  function check(posx, posy) {
    return posx >= left && posx <= right && posy >= top && posy <= bottom;
  };

  if(check(mouseX, mouseY)) {
    return true;
  }
  for(let i = 0; i < touches.length; i++) {
    if(check(touches[i].x, touches[i].y)) {
      return true;
    }
  }
  return false;
}

let points = [];
function add_player_point(x, y) {
  points.push({x: x, y: y});
}

function draw_player_points() {
  push();
  fill(active_state_colour);
  stroke(active_state_colour);
  for(let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const end = points[i + 1];
    line(p.x, p.y, end.x, end.y);
    //circle(p.x, p.y, 10);
  }
  pop();
}

function cut_off_player_points() {
  const maximum_length = 100;
  const difference = points.length - maximum_length;
  if(difference > 0) {
    points.splice(0, difference);
  }
}


let screen_button_time_point = 0;
let on_screen_controls = true;
let wasMousePressed = false;
const CONTROLS_ON_TITLE = "Screen\nControls\nOn";
const CONTROLS_OFF_TITLE = "Screen\nControls\nOff";
let control_button_title = CONTROLS_ON_TITLE;

function draw() {

  background(background_colour);
  direction = 0;
  if(keyIsDown(65)) {
    direction += -1;
  }
  if(keyIsDown(68)) {
    direction += 1;
  }
  if(keyIsDown(16)) {
    is_crouching = true;
  }
  if(keyIsDown(32)) {
    is_jumping = true;
  }
  if (!focused) {
    direction = 0;
    is_jumping = false;
    is_crouching = false;
  }
  // Everything became somewhat hardcoded; Meh, whatever. Just a prototype
  // For next time: Clear distinction between update and drawing routine
  // Don't be lazy, it fucks up drawing order...
  is_interacting_with_onscreen_buttons = false;
  function handle_input_button(is_left_aligned, is_bottom_aligned, label, index, height_index, callback)
  {
    push();
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    stroke(0, 0);
    const size = height < width ? height : width;
    const padding = size * 0.025;
    const button_size = size * 0.175;
    const bx = is_left_aligned 
      ? (button_size / 2) + padding + ((padding + button_size) * index)
      : width - ((button_size / 2) + padding + ((padding + button_size) * index));
    const by = is_bottom_aligned 
      ? height - (height / 6) - ((padding + button_size) * height_index)
      : (height / 2) + ((padding + button_size) * height_index) + (button_size / 2) + padding;
    const min = 125;
    let fraction = button_size / min;  
    let title_size = 28;
    if(fraction > 1.0) {
      fraction = 1.0;
    }
    textSize(title_size * fraction);
 
    if(focused && is_hovering(bx, by, button_size, button_size)) {
      if(mouseIsPressed === true) {
        const colour = active_state_colour;
        fill(red(colour), green(colour), blue(colour), 255);
        is_interacting_with_onscreen_buttons = true;
        callback();
      }
      else {
        const colour = inactive_state_colour;
        fill(red(colour), green(colour), blue(colour), 255);
      }
    }
    else {
      const colour = inactive_state_colour;
      fill(red(colour), green(colour), blue(colour), 64);
    }
    rect(bx, by, button_size, button_size, button_size * 0.30);
    fill(background_colour);
    text(label, bx, by, button_size, button_size);
    pop();
  }
  if(focused) {
    if(on_screen_controls) {
      handle_input_button(true, true, "Left", 0, 0, () => { direction = -1; });
      handle_input_button(false, true, "Jump", 0, 0.75, () => { is_jumping = true; });
      handle_input_button(false, true, "Crouch", 0.75, -0.25, () => { is_crouching = true; });
      handle_input_button(true, true, "Right", 1, 0, () => { direction = 1; });
    }
    //Fix this button position!
    handle_input_button(true, false, control_button_title, 0, 0, () => 
    {
      if((screen_button_time_point + 250) < millis()) {
        screen_button_time_point = millis();
        on_screen_controls = !on_screen_controls;
        if(on_screen_controls) {
          control_button_title = CONTROLS_ON_TITLE;
        }
        else {
          control_button_title = CONTROLS_OFF_TITLE;
        }
      }
    });
  }
  draw_stack(stack, 0);
  draw_stack(weaponStack, 0 + width / 2);
  
  push();
  strokeWeight(0.5);
  stroke(decoration_colour);
  fill(decoration_colour);
  
  
  rectMode(CORNER);
  const cy = (HEIGHT * 0.4);
  const ch = (HEIGHT * 0.5) - cy;

  const cw = 150;
  let size = (width) / 4;  

  //const cw = WIDTH * 0.25;
  let ground_rects = [];
  //ground_rects.push({x: 0, y: cy, w: cw, h: ch});
  const count = ceil(WIDTH / cw);
  //ground_rects.push({x: 0, y: 50, w: cw, h: ch});
  //ground_rects.push({x: 150, y: cy - ch, w: cw, h: ch});
  for(let i = 0; i < count; i++) {
    if((i % 2) === 0 || i === count - 1) {
      ground_rects.push({x: i * cw, y: cy, w: cw, h: ch});
    }
  }

  //ground_rects.push({x: cw + 150, y: cy, w: cw, h: ch});
  //ground_rects.push({x: WIDTH - cw, y: cy, w: cw, h: ch});

  for(let i = 0; i < ground_rects.length; i++) {
    const l = ground_rects[i];
    rect(l.x, l.y, l.w, l.h);
  }

  //rect(0, ch, WIDTH, ground_height);
  rect(0, (HEIGHT * 0.5) + ground_height * 4, WIDTH, ground_height);
  pop();
  
  add_player_point(entity.x, entity.y);
  draw_player_points();
  cut_off_player_points();
  draw_entity(ground_rects);



  if(bullet.active) {
    stroke(red(bullet_colour) / 2, green(bullet_colour) / 2, blue(bullet_colour) / 2, alpha(bullet_colour));
    fill(bullet_colour);
    circle(bullet.x, bullet.y, bullet.r);
  }

  wasMousePressed = mouseIsPressed;
  was_jumping = is_jumping;
  was_crouching = is_crouching;
  is_jumping = false;
  is_crouching = false;
  if(!focused) {
    rectMode(CORNER);
    const min = 200;
    let fraction = ((width > height ? height : width) / 2) / min;  
    if(fraction > 1.0) {
      fraction = 1.0;
    }
    
    fill(red(background_colour), 240);
    rect(0, 0, WIDTH, HEIGHT);
    stroke(decoration_colour);
    textStyle(NORMAL);
    textSize(fraction * 62);
    textAlign(CENTER, CENTER);
    fill(soft_text_colour);
    text("CLICK ME!", 0, HEIGHT / 2, WIDTH, HEIGHT - (HEIGHT / 2));
    textSize(fraction * 27);
    text("A: Left - D: Right\nSpace: Jump - Shift: Crouching\nLMB: Shoot", 0, 0, WIDTH, HEIGHT / 2);
    rect(0, HEIGHT / 2, WIDTH, ground_height);
    rect(0, (HEIGHT / 2) + ground_height * 4, WIDTH, ground_height);
    rectMode(CENTER);
  }
  else {
    rectMode(CORNER);
    const min = 200;
    let fraction = (width / 2) / min;  
    let title_size = 26;
    if(fraction > 1.0) {
      fraction = 1.0;
    }
    textSize(title_size * fraction);
    textAlign(CENTER, CENTER);
    stroke(decoration_colour);
    fill(background_colour);
    //rect(0, 0, (width / 2), item_height);
    //rect(0 + (width / 2), 0, (width / 2), item_height);
    fill(soft_text_colour);
    //text("Motion SBSM", 0, 0, (width / 2), item_height);
    //text("Weapon SBSM", 0 + (width / 2), 0, (width / 2), item_height);
    rectMode(CENTER);
  }


  strokeWeight(0.5);
  stroke(decoration_colour);
  fill(decoration_colour);
  rectMode(CORNER);
  // Left border
  rect(0, 0, wall_width, HEIGHT);
  // Right border
  rect(WIDTH - wall_width, 0, wall_width, HEIGHT);
  // Bottom border
  rect(0, HEIGHT - ground_height, WIDTH, ground_height);
  // Top border
  rect(0, 0, WIDTH, ground_height);

  textStyle(NORMAL);  
  strokeWeight(1);
  // Let's draw a border...
  /*
  rectMode(CORNER);
  fill(0, 0, 0, 0);
  strokeWeight(STROKE_WEIGHT_BORDER);
  stroke(decoration_colour);
  rect(0, 0, WIDTH, HEIGHT);
  strokeWeight(1);
  rectMode(CENTER);*/
}