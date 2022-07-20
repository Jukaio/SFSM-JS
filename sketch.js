let HEIGHT = 600;
let WIDTH = 800;
let DEFAULT_PADDING = 20;
let item_height = 60;
let item_width = 140;
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
    is_crouching = false;
  }
  if(keyCode === 32) {
    is_jumping = false;
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
  entity.y -= jump_t * 14 * playTime;
  entity.x += direction * (deltaTime / 1000) * 100 * playTime;
  jump_t += (deltaTime / 1000) * 1.5 * playTime;
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
    if (mouseIsPressed === true) {
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

function windowResized() {
  resizeCanvas(windowWidth - 30, windowHeight - 30);
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
  createCanvas(windowWidth - 30, windowHeight - 30);
  HEIGHT = height;
  WIDTH = width;

  
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
  
  stackObserver = (state) => {
    
  }
}

function draw_stack_item(item, index, offset) {
  const height = item_height;
  const width = item_width;
  const x = offset;
  const y = HEIGHT - (index * height) - height;
  
  let a = easeOutBounce(item.a);
  
  fill(item.colour);
  rect(x, y * a, item_width, item_height, 15);
  
  let c = color(0, 0, 0);
  fill(c);
  text(item.title, x, y * a, item_width, item_height);
}

function draw_stack(stack, offset) {
  rectMode(CORNER);
  //stroke();
  textStyle(NORMAL);
  textSize(text_size);
  textAlign(CENTER, CENTER);
  for(let i = 0; i < stack.length; i++) {
    const item = stack[i];
    if(item.a < 1) {
      item.a += deltaTime / 1000 * 1.5;
    }
    else if(item.a > 1) {
      item.a = 1;
    }
    if(i == stack.length - 1) {
      item.colour = color(100, 204, 0, item.a * 255);
    }
    else {
      item.colour = color(255, 204, 0, item.a * 255);
    }
  }

  for(let i = 0; i < stack.length; i++) {
    const item = stack[i];
    let colour;
    if(i == stack.length - 1) {
      colour = color(100, 204, 0);
    }
    else {
      colour = color(255, 204, 0);
    }
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
  
  fill(color(0, 0, 0));
  rect(e.x, e.y, e.w, e.h, 15);
  
  if(e.y > HEIGHT - entity.h / 2) {
    e.y = HEIGHT - entity.h / 2;
  }
  if(e.y < HEIGHT - entity.h / 2) {
    entity.y += ((deltaTime * 200)/ 1000 * playTime) + entity.gravity;
  }
  if(e.x < GetLeftBound() + e.w / 2) {
    e.x = GetLeftBound() + e.w / 2;
  }
  if(e.x > WIDTH - e.w / 2) {
    e.x = WIDTH - e.w / 2;
  }
}

function draw_HUD()
{
  textSize(16);
  textAlign(LEFT, CENTER);
  fill(color(0, 0, 0, 0));
  rect(WIDTH - (hud_width / 2), DEFAULT_PADDING, (hud_width / 2) - DEFAULT_PADDING, hud_height, 15);
  fill(color(0, 0, 0));
  text("Move", WIDTH - hud_width, DEFAULT_PADDING, hud_width / 2, hud_height);
}

function draw() {
  background(220);
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
  else {

  }
  draw_entity();

  draw_stack(stack, 0);
  draw_stack(weaponStack, item_width);
  
  if(bullet.active) {
    circle(bullet.x, bullet.y, bullet.r);
  }
  //draw_HUD();
  //camera(0, 0);
  const s = separator;
  line(s.start.x, s.start.y, s.end.x, s.end.y);
  was_jumping = is_jumping;
  was_crouching = is_crouching;
  if(!focused) {
    rectMode(CORNER);
    fill(color(255, 0, 0, 80));
    rect(0, 0, WIDTH, HEIGHT);

    textStyle(NORMAL);
    textSize(160);
    textAlign(CENTER, CENTER);
    let c = color(0, 0, 0);
    fill(c);
    text("CLICK ME!", 0, 0, WIDTH, HEIGHT);
    textSize(32);
    text("A: Left - D: Right\nSpace: Jump\nLMB: Shoot", 0, DEFAULT_PADDING, WIDTH, HEIGHT / 4);
    rectMode(CENTER);
  }
}