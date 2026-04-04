let camera;
let oceanBg;
let gameManager;
let hud;
let zoneManager;
var algaeImages = [];
let showDebug = false;
var fishSprites = {};

function preload() {
  algaeImages = [];
  algaeImages.push(loadImage('assets/decorations/algae1.png'));
  algaeImages.push(loadImage('assets/decorations/algae2.png'));
  algaeImages.push(loadImage('assets/decorations/algae3.png'));

  // Player spritesheets
  fishSprites.idle   = loadImage('assets/fish/idle_swimming.png');
  fishSprites.swim_up   = loadImage('assets/fish/swim_up.png');
  fishSprites.swim_down = loadImage('assets/fish/swim_down.png');
  fishSprites.eating = loadImage('assets/fish/eating_animation.png');
  fishSprites.dash   = loadImage('assets/fish/speed_dash_animation.png');
  fishSprites.flip   = loadImage('assets/fish/flip_direction.png');
  fishSprites.death  = loadImage('assets/fish/death_animation.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  zoneManager = new ZoneManager();
  camera = new Camera(1000, 1500);
  oceanBg = new OceanBackground();
  gameManager = new GameManager(zoneManager);
  hud = new HUD(zoneManager, gameManager);
}

function draw() {
  background(10, 42, 74);

  // If start screen, just show HUD and return
  if (gameManager.isStartScreen()) {
    hud.show();
    return;
  }

  // Update game
  let mouseWorldPos = getMouseWorldPos();
  gameManager.update(mouseWorldPos);
  hud.update(gameManager.getPlayer());

  // Apply camera
  push();
  camera.apply();

  // Draw world
  oceanBg.show();
  gameManager.show();

  // Debug overlay pass
  if (showDebug) {
    gameManager.showDebug();
  }

  pop();

  // Camera follows player
  if (gameManager.gameState === 'playing') {
    camera.follow(gameManager.getPlayer());
  }

  // Draw HUD
  hud.show();
}

function getMouseWorldPos() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let worldX = mouseX + (camera.pos.x - width / 2);
    let worldY = mouseY + (camera.pos.y - height / 2);
    return createVector(worldX, worldY);
  }
  return null;
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
   showDebug = !showDebug;
  }

  // Internal low-level steering debug from vehicle.js
  if (key === 'v' || key === 'V') {
    Vehicle.internalDebug = !Vehicle.internalDebug;
  }
  
  if ((key === 'r' || key === 'R') && (gameManager.isGameOver() || gameManager.isWon())) {
    gameManager.restart();
    camera.pos.set(gameManager.getPlayer().pos.x, gameManager.getPlayer().pos.y);
  }

  if (key === ' ') {
    if (gameManager.gameState === 'playing') {
      gameManager.getPlayer().dash();
    }
  }
}

function mousePressed() {
  if (gameManager.isStartScreen()) {
    gameManager.startGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
