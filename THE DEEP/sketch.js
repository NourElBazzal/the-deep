let camera;
let oceanBg;
let gameManager;
let hud;
let zoneManager;
var algaeImages = [];
let showDebug = false;
var fishSprites = {};
var sounds = {};
var shakeAmount = 0;
var shakeDuration = 0;
var savedConfig = null;

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

  sounds = {};
  sounds.ambient = loadSound('assets/sounds/ambient.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  zoneManager = new ZoneManager();
  camera = new Camera(1000, 1500);
  oceanBg = new OceanBackground();
  gameManager = new GameManager(zoneManager);
  hud = new HUD(zoneManager, gameManager);

  // If screen is wider than world, the camera clamp will feel locked
  // Log a warning so you know
  if (width > 2000) {
    console.warn(`Screen (${width}px) is wider than world (2000px). Consider increasing worldWidth.`);
  }

}

function draw() {
  background(5, 10, 20);

  // If start screen, just show HUD and return
  if (gameManager.isStartScreen()) {
    hud.show();
    return;
  }

  // Update game
  let mouseWorldPos = getMouseWorldPos();
  gameManager.update(mouseWorldPos);
  hud.update(gameManager.getPlayer());

  // Adjust ambient volume based on depth and game state
  if (sounds.ambient) {
    if (gameManager.isStartScreen()) {
      sounds.ambient.setVolume(0.3);
    } else if (gameManager.gameState === 'playing' || 
              gameManager.gameState === 'dying') {
      let depth = gameManager.getPlayer().pos.y;
      // Surface = quieter and brighter, Abyss = louder and deeper
      let targetVol = map(depth, 0, 3000, 0.2, 0.7);
      // Smooth volume transition
      let currentVol = sounds.ambient.getVolume();
      let newVol = lerp(currentVol, targetVol, 0.02);
      sounds.ambient.setVolume(newVol);
    } else {
      // Game over or won — fade out
      let currentVol = sounds.ambient.getVolume();
      sounds.ambient.setVolume(lerp(currentVol, 0.05, 0.02));
    }
  }

  push();

  // Screen shake
  if (shakeDuration > 0) {
    shakeDuration--;
    shakeAmount = lerp(shakeAmount, 0, 0.15);
    translate(
      random(-shakeAmount, shakeAmount),
      random(-shakeAmount, shakeAmount)
    );
  } else {
    shakeAmount = 0;
  }

  camera.apply();
  oceanBg.show();
  gameManager.show();

  // Debug overlay pass
  if (showDebug) {
    gameManager.showDebug();
  }

  // BehaviorManager debug overlay
  if (showDebug && gameManager.gameState === 'playing') {
    push();
    fill(180, 220, 255, 200);
    textFont('Courier New, monospace');
    textSize(11);
    textAlign(LEFT, TOP);

    // Show first 3 fish as samples
    let sample = gameManager.aiFish.slice(0, 3);
    let yOff   = 80;
    for (let fish of sample) {
      text(`── ${fish.type} ──`, 14, yOff);
      yOff += 14;
      let lines = fish.bm.describe().split('\n');
      for (let line of lines) {
        text(line, 14, yOff);
        yOff += 13;
      }
      yOff += 6;
    }
    pop();
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

  if (key === 's' || key === 'S') {
    let predator = gameManager.aiFish.find(f => f.type === 'predator');
    if (predator) {
      savedConfig = predator.bm.save();
      console.log('Saved config:', JSON.stringify(savedConfig, null, 2));
    }
  }

  if (key === 'l' || key === 'L') {
    // Load an "aggressive predator" preset onto all predators
    let aggressivePreset = {
      wander:   { weight: 0.2, active: true  },
      pursue:   { weight: 4.0, active: true  },
      boundary: { weight: 2.0, active: true  }
    };
    gameManager.aiFish
      .filter(f => f.type === 'predator')
      .forEach(f => f.bm.load(aggressivePreset));
    console.log('Loaded aggressive preset on all predators');
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
    
    // Start music on first user interaction
    if (sounds.ambient && !sounds.ambient.isPlaying()) {
      sounds.ambient.setLoop(true);
      sounds.ambient.setVolume(0.3);
      sounds.ambient.play();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function triggerShake(amount, duration) {
  shakeAmount = amount;
  shakeDuration = duration;
}
