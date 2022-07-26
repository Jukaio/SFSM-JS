
let HEIGHT = 600;
let WIDTH = 800;
let DEFAULT_PADDING = 20;

let item_height = 36;
let item_width = 140;
let is_interacting_with_onscreen_buttons = false;

let bullet_colour = 0;
let background_colour = 0;
let soft_text_colour = 0;
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
function keyPressed() {
  //print(key, ' ', keyCode);
  if(keyCode === 16) {
    is_crouching = true;
  }
  if(keyCode === 32) {
    is_jumping = true;
  }/*
  if(keyCode === 65) {
    direction += -1;
  }
  if(keyCode === 68) {
    direction += 1;
  }*/
}


function keyReleased() {
  if(keyCode === 16) {
    //is_crouching = false;
  }
  if(keyCode === 32) {
    //is_jumping = false;
  }/*
  if(keyCode === 65) {
    direction -= -1;
  }
  if(keyCode === 68) {
    direction -= 1;
  }*/
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
  if(direction !== 0) {
    stack_push(moving);
  }

  if(is_crouching && !was_crouching) {
    stack_push(crouching);
    return true;
  }
  if(is_jumping && !was_jumping) {
    jump_t = 0.25;
    isJumpJustPushed = true;
    stack_push(jump);
    return true;
  }
  return true;
}
let jump_t = 0;
function do_moving() {
  entity.x += direction * (deltaTime / 1000) * 150 * playTime;
  if(is_jumping && !was_jumping) {
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
  entity.x += direction * (deltaTime / 1000) * 100 * playTime;

  entity.y -= easeOutSine((1 - jump_t)) * 16 * playTime;
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
  entity.x += direction * (deltaTime / 1000) * 100 * playTime;
  if(entity.y < HEIGHT - entity.h / 2) {
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
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  HEIGHT = height;
  WIDTH = width;
  entity.y = HEIGHT - entity.h;
  entity.x = GetLeftBound();
  separator.start.x = GetLeftBound();
  separator.start.y = 0;
  separator.end.x = GetLeftBound();
  separator.end.y = HEIGHT;
}

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
  //strokeWeight(2);
  stack_push(idle);
  weapon_push(weaponDefaultState);
  //stack.push(moving);
  //stack.push(jump);
  //stack.push(air);
  entity.y = HEIGHT - entity.h;
  entity.x = GetLeftBound();
  separator.start.x = GetLeftBound();
  separator.start.y = 0;
  separator.end.x = GetLeftBound();
  separator.end.y = HEIGHT;
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
  rect(offset, 0, (width / 2), height / 2);

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

  for(let i = 0; i < stack.length; i++) {
    const item = stack[i];
    draw_stack_item(item, i, offset);
  }
}

function draw_entity()
{
  rectMode(CENTER);
  
  const e = entity;
  const current = stack[stack.length-1];
  if(!current.func()) {
    stack_pop();
  }
  if(weaponStack.length > 0) {
    const currentWeaponState = weaponStack[weaponStack.length-1];
    if(!currentWeaponState.func()) {
      weapon_pop();
    }
  }
  stroke(decoration_colour);
  fill(soft_text_colour);
  rect(e.x, e.y, e.w, e.h, 15);
  
  const bottom = HEIGHT - (entity.h / 2) - ground_height;
  const right = WIDTH - (e.w / 2) - wall_width;
  const left = 0 + (e.w / 2) + wall_width
  if(e.y > bottom) {
     e.y = bottom;
  }
  if(e.y < bottom) {
    entity.y += ((deltaTime * 200)/ 1000 * playTime) + entity.gravity;
  }
  if(e.x < left) {
    e.x = left;
  }
  if(e.x > right) {
    e.x = right;
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

let on_screen_controls = true;
let wasMousePressed = false;
function draw() {
  
  background(background_colour);
  direction = 0;
  if(keyIsDown(65)) {
    direction += -1;
  }
  if(keyIsDown(68)) {
    direction += 1;
  }

  if (!focused) {
    direction = 0;
    is_jumping = false;
    is_crouching = false;
  }
  is_interacting_with_onscreen_buttons = false;
  function handle_input_button(is_once_button, label, index, height_index, callback)
  {
    push();
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    stroke(0, 0);
    const padding = width * 0.025;
    const button_size = width * 0.15;
    const bx = (button_size / 2) + padding + ((padding + button_size) * index);
    const by = height - (height / 6) - ((padding + button_size) * height_index);
    const min = 125;
    let fraction = button_size / min;  
    let title_size = 32;
    if(fraction > 1.0) {
      fraction = 1.0;
    }
    textSize(title_size * fraction);

    if(is_hovering(bx, by, button_size, button_size)) {
      if(mouseIsPressed === true && (!is_once_button || wasMousePressed === false)) {
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
    rect(bx, by, button_size, button_size, 20);
    fill(background_colour);
    text(label, bx, by, button_size, button_size);
    pop();
  }
  if(on_screen_controls) {
    handle_input_button(false, "A", 0, 0, () => { direction = -1; });
    handle_input_button(false, "Jump", 4.5, 0.75, () => { is_jumping = true; });
    handle_input_button(false, "Crouch", 3.75, -0.25, () => { is_crouching = true; });
    handle_input_button(false, "D", 1, 0, () => { direction = 1; });
  }
  //Fix this button position!
  handle_input_button(true, "Screen Controls", 0, 2, () => { on_screen_controls = !on_screen_controls; });

  draw_stack(stack, 0);
  draw_stack(weaponStack, 0 + width / 2);
  
  push();
  strokeWeight(0.5);
  stroke(decoration_colour);
  fill(decoration_colour);
  rectMode(CORNER);
  rect(0, HEIGHT / 2, WIDTH, ground_height);
  rect(0, (HEIGHT / 2) + ground_height * 4, WIDTH, ground_height);
  pop();
  
  draw_entity();
  
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
    fill(background_colour);
    rect(0, 0, WIDTH, HEIGHT);
    stroke(decoration_colour);
    textStyle(NORMAL);
    textSize(62);
    textAlign(CENTER, CENTER);
    fill(soft_text_colour);
    text("CLICK ME!", 0, HEIGHT / 2, WIDTH, HEIGHT - (HEIGHT / 2));
    textSize(32);
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
    rect(0, 0, (width / 2), item_height);
    rect(0 + (width / 2), 0, (width / 2), item_height);
    fill(soft_text_colour);
    text("Motion SBSM", 0, 0, (width / 2), item_height);
    text("Weapon SBSM", 0 + (width / 2), 0, (width / 2), item_height);
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