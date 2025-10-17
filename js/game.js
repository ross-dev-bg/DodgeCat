

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");

const boxSize = 260;
const boxOffset = (canvas.width - boxSize) / 2;
const playerSize = 15;
const projectileSize = 4;

// ---------------- SOUND SETUP ----------------
const bgm = new Audio("sound/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.1; // adjust volume 0.0 - 1.0
let musicPlaying = false;

const deathSound = new Audio("sound/death.mp3");
deathSound.volume = 0.05; // adjust volume (0.0 to 1.0)

let orbPickups = [];   // pickups sitting in the box (last 5s)
let orbs = [];         // collected orbiting orbs
let orbSpawnTimer = 0;
let orbBaseAngle = 0;  // shared base angle so orbs are evenly spaced
const ORB_PICKUP_SPAWN_INTERVAL = 5; // spawn a pickup every 5s
const ORB_PICKUP_LIFETIME = 5; // pickup exists in box for 5s
const ORB_ORBIT_DURATION = 25; // orb lasts 25s when collected
const ORB_DISTANCE = 28; // distance from player center
const ORB_SIZE = 10;
const ORB_MAX = 3;
const ORB_ANGULAR_SPEED = 2.0; // radians per second (rotation speed)

let isInvulnerable = false;
let invulnerableTimer = 0;
const INVULNERABLE_DURATION = 2000; // 2 seconds in ms

/* ---------------- GAME STATE ---------------- */
let player, projectiles, openings, keys;
let timeSurvived, gameOver, projectileSpeed, spawnInterval, lastSpawn, lastTime;
let highScores = [];
let shield = {
  active: false,
  visible: false, 
  x: 0,
  y: 0,
  size: 10,  
  timer: 0,    
  duration: 0 
};

let touchTarget = null; // global target for touch movement

let hasDisplayedGameOver = false;
let isPaused = false;
let lastTapTime = 0;

// --- LIFE SYSTEM & PICKUP PROGRESS ---
let lives = 9;
const MAX_LIVES = 9;
let pickupsCollected = 0;
const PICKUPS_PER_LIFE = 10;

/* ---------------- SCALE FOR ALL DEVICES ---------------- */
function scaleGameContainer() {
  const container = document.getElementById("gameContainer");
  const maxWidth = window.innerWidth * 0.95;
  const maxHeight = window.innerHeight * 0.95;

  const gameWidth = Math.max(spriteCanvas.width, 300);
  const gameHeight = spriteCanvas.height + 300 + 150;

  const scale = Math.min(maxWidth / gameWidth, maxHeight / gameHeight, 1);
  container.style.transform = `scale(${scale})`;
  container.style.transformOrigin = "top center";
}
window.addEventListener("resize", scaleGameContainer);
scaleGameContainer();


function resetGame() {
  if (musicPlaying) {
    bgm.pause();
    bgm.currentTime = 0;
  }

  bgm.play().then(() => {
    musicPlaying = true;
  }).catch(err => {
    console.warn("Autoplay blocked until user interaction:", err);
  });

  player = { x: canvas.width/2, y: canvas.height/2, color: "white" };
  projectiles = [];
  openings = [];
  resetShield();
  
  hasDisplayedGameOver = false;
  
  lives = 9;
  pickupsCollected = 0;

  // reset orb system
  orbPickups = [];
  orbs = [];
  orbSpawnTimer = 0;
  orbBaseAngle = 0;

  keys = {};
  timeSurvived = 0;
  gameOver = false;
  
  baseProjectileSpeed = 100;   // starting speed in px/sec
  projectileSpeed = baseProjectileSpeed;
  
  spawnInterval = 2000;
  lastSpawn = 0;
  lastTime = Date.now();
  statusText.innerHTML = "";
  restartBtn.style.display = "none";
  startBtn.style.display = "none";
  document.getElementById("timer").style.display = "block";
  requestAnimationFrame(loop);
}

function getMovementDesign() {
  if (keys["ArrowLeft"] || keys["a"]) return movingLeftDesign;
  if (keys["ArrowRight"] || keys["d"]) return movingRightDesign;
  return idleDesign;
}

function drawPlayer() {
  const design = getMovementDesign();
  for (let row = 0; row < design.length; row++) {
    for (let col = 0; col < design[row].length; col++) {
      if (design[row][col] === "x") {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - playerSize/2 + col, player.y - playerSize/2 + row, 1, 1);
      }
    }
  }
}

function drawBox() {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxOffset, boxOffset, boxSize, boxSize);

  openings.forEach(o => {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    if (o.side === "top" || o.side === "bottom") {
      ctx.beginPath();
      ctx.moveTo(o.pos - 5, o.side === "top" ? boxOffset : boxOffset + boxSize);
      ctx.lineTo(o.pos + 5, o.side === "top" ? boxOffset : boxOffset + boxSize);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(o.side === "left" ? boxOffset : boxOffset + boxSize, o.pos - 5);
      ctx.lineTo(o.side === "left" ? boxOffset : boxOffset + boxSize, o.pos + 5);
      ctx.stroke();
    }
  });
}

function spawnProjectile() {
  const sides = ["top", "bottom", "left", "right"];
  const side = sides[Math.floor(Math.random() * sides.length)];
  const numToSpawn = 3 + Math.floor(timeSurvived / 10);

  for (let i = 0; i < numToSpawn; i++) {
    const delay = i * 100; // stagger appearance in ms
    setTimeout(() => {
      let x, y, vx, vy, pos;
      // vx/vy should be pixels per second
      if (side === "top") {
        x = boxOffset + Math.random() * boxSize;
        y = boxOffset;
        vx = 0;
        vy = projectileSpeed; // moving down, px/sec
        pos = x;
      } else if (side === "bottom") {
        x = boxOffset + Math.random() * boxSize;
        y = boxOffset + boxSize;
        vx = 0;
        vy = -projectileSpeed; // moving up
        pos = x;
      } else if (side === "left") {
        x = boxOffset;
        y = boxOffset + Math.random() * boxSize;
        vx = projectileSpeed; // moving right
        vy = 0;
        pos = y;
      } else { // right
        x = boxOffset + boxSize;
        y = boxOffset + Math.random() * boxSize;
        vx = -projectileSpeed; // moving left
        vy = 0;
        pos = y;
      }

      openings.push({ side, pos, lastUsed: Date.now() });
      projectiles.push({ x, y, vx, vy });
    }, delay);
  }
}


function spawnShield() {
  const margin = boxOffset + 50;
  const maxX = boxOffset + boxSize - 50;
  const maxY = boxOffset + boxSize - 50;
  
  shield.x = margin + Math.random() * (maxX - margin);
  shield.y = margin + Math.random() * (maxY - margin);
  shield.visible = true;
  shield.timer = 0;
}

/* ---------------- ORB SPAWNING & COLLECTION ---------------- */
function spawnOrbPickup() {
  // spawn at least 50px away from any box wall
  const margin = boxOffset + 50;
  const maxX = boxOffset + boxSize - 50;
  const maxY = boxOffset + boxSize - 50;

  const x = margin + Math.random() * (maxX - margin);
  const y = margin + Math.random() * (maxY - margin);

  orbPickups.push({ x, y, size: ORB_SIZE, timer: 0 });
}

function updateOrbPickups(delta) {
  // delta in seconds
  for (const p of orbPickups) p.timer += delta;

  // detect pickup by player
  for (const p of orbPickups) {
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < playerSize/2 + p.size/2) {
      // collect
      collectOrb();
      p.timer = ORB_PICKUP_LIFETIME + 1; // mark for removal
    }
  }

  // keep only pickups that haven't expired
  orbPickups = orbPickups.filter(p => p.timer < ORB_PICKUP_LIFETIME);
}

function collectOrb() {
  // When collecting:
  // - if less than ORB_MAX, push a new orb with full duration
  // - if already ORB_MAX, find orb with least remaining and replace it (refresh to full)
  if (orbs.length < ORB_MAX) {
    orbs.push(createOrb());
  } else {
    // find index with smallest remaining
    let idx = 0;
    for (let i = 1; i < orbs.length; i++) {
      if (orbs[i].remaining < orbs[idx].remaining) idx = i;
    }
    // replace that orb with fresh one (keeps array length so spacing stays consistent)
    orbs[idx] = createOrb();
  }
  
  pickupsCollected++;
  if (pickupsCollected >= PICKUPS_PER_LIFE) {
    pickupsCollected = 0;
    if (lives < MAX_LIVES) lives++;
  }

}

function createOrb() {
  return {
    // angle not per-orb now — position computed from orbBaseAngle + i*spacing
    distance: ORB_DISTANCE,
    size: ORB_SIZE,
    remaining: ORB_ORBIT_DURATION,
    x: 0,
    y: 0
  };
}

function updateOrbs(delta) {
  // update shared base angle: rotates all orbs together
  orbBaseAngle += ORB_ANGULAR_SPEED * delta;

  // update remainder timers and compute positions so collisions work in updateProjectiles
  const n = orbs.length;
  const spacing = n > 0 ? (2 * Math.PI) / n : 0;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    orb.remaining -= delta;
    // compute angle and position
    const angle = orbBaseAngle + i * spacing;
    orb.x = player.x + Math.cos(angle) * orb.distance;
    orb.y = player.y + Math.sin(angle) * orb.distance;
    // if expired, remove
    if (orb.remaining <= 0) {
      orbs.splice(i, 1);
    }
  }
}

function resetShield() {
  shield = {
    active: false,
    visible: false,
    x: 0,
    y: 0,
    size: 10,
    timer: 0,
    duration: 0
  };
}

function updatePlayer(delta) {
  const speed = 200; // pixels per second
  let dx = 0, dy = 0;

  if(touchTarget) {
    dx = touchTarget.x - player.x;
    dy = touchTarget.y - player.y;

    // Smooth movement: move toward target with max speed
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist > 1){ // avoid jitter when very close
      dx = (dx / dist) * speed * delta;
      dy = (dy / dist) * speed * delta;
    } else {
      dx = 0;
      dy = 0;
    }
  } else {
    // fallback for keyboard
    if (keys["ArrowUp"] || keys["w"]) dy -= 1;
    if (keys["ArrowDown"] || keys["s"]) dy += 1;
    if (keys["ArrowLeft"] || keys["a"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"]) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * speed * delta;
      dy = (dy / len) * speed * delta;
    }
  }

  player.x += dx;
  player.y += dy;

  const min = boxOffset + playerSize / 2;
  const max = boxOffset + boxSize - playerSize / 2;
  player.x = Math.max(min, Math.min(max, player.x));
  player.y = Math.max(min, Math.min(max, player.y));
}

function updateProjectiles(delta) {
  const newOpenings = [];
  projectiles = projectiles.filter(p => {
    // Move using seconds-based delta
    p.x += p.vx * delta;
    p.y += p.vy * delta;

    let exited = false;
    if (p.vy > 0 && p.y >= boxOffset + boxSize) {
      newOpenings.push({ side: "bottom", pos: p.x, lastUsed: Date.now() });
      exited = true;
    } else if (p.vy < 0 && p.y <= boxOffset) {
      newOpenings.push({ side: "top", pos: p.x, lastUsed: Date.now() });
      exited = true;
    } else if (p.vx > 0 && p.x >= boxOffset + boxSize) {
      newOpenings.push({ side: "right", pos: p.y, lastUsed: Date.now() });
      exited = true;
    } else if (p.vx < 0 && p.x <= boxOffset) {
      newOpenings.push({ side: "left", pos: p.y, lastUsed: Date.now() });
      exited = true;
    }

  // Check for shield absorption (only if active)
    if (!exited && shield.active) {
      const dx = p.x - shield.x;
      const dy = p.y - shield.y;
      const halfSize = 15;

      if (Math.abs(dx) <= halfSize && Math.abs(dy) <= halfSize) {
        exited = true; // projectile absorbed by shield
      }
    }


    // Check orb collisions (consume projectiles)
    if (!exited && orbs.length > 0) {
      for (const orb of orbs) {
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < orb.size / 2 + projectileSize / 2) {
          exited = true; // projectile absorbed by orb
          break;
        }
      }
    }

    return !exited;
  });
  openings.push(...newOpenings);
}

function updateShield(delta) {
  // If shield inactive and invisible, count up until eligible to spawn
  if (!shield.visible && !shield.active) {
    shield.timer += delta;
    if (shield.timer > 30) {
      // After 30 seconds, random chance to spawn (about once every 10s)
      if (Math.random() < delta / 10) {
        spawnShield();
      }
    }
  }

  // If active, count down its lifespan
  if (shield.active) {
    shield.timer += delta;
    if (shield.timer > shield.duration) {
      shield.active = false;
      shield.timer = 0;
    }
  }

  // Detect pickup
  if (shield.visible) {
    const dx = player.x - shield.x;
    const dy = player.y - shield.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < playerSize / 2 + shield.size / 2) {
      activateShield();
    }
  }
  
  if (shield.visible && shield.timer > 10) {
    shield.visible = false;
    shield.timer = 0;
  }
}

function activateShield() {
  shield.visible = false;
  shield.active = true;
  shield.timer = 0;
  
  shield.duration = 5 + Math.random() * 5; // 5–10 seconds
  //shield.duration = 99999; //for testing game state
  
  pickupsCollected++;
  if (pickupsCollected >= PICKUPS_PER_LIFE) {
    pickupsCollected = 0;
    if (lives < MAX_LIVES) lives++;
  }

}

function checkCollision() {
  for (const p of projectiles) {
    if (Math.abs(p.x - player.x) < (playerSize / 2 + projectileSize / 2) &&
      Math.abs(p.y - player.y) < (playerSize / 2 + projectileSize / 2)) {

      // Skip if currently invulnerable
      if (isInvulnerable) continue;

      // Lose a life
      lives--;

      if (lives <= 0) {
        gameOver = true;
        player.color = "red";
      } else {
          // Trigger 2-second invulnerability if not on last life
          isInvulnerable = true;
          invulnerableTimer = performance.now();

          // Start flashing effect
          const flashInterval = setInterval(() => {
            player.color = (player.color === "white") ? "black" : "white";
          }, 150);

          // Stop invulnerability after 2 seconds
          setTimeout(() => {
            clearInterval(flashInterval);
            player.color = "white";
            isInvulnerable = false;
          }, INVULNERABLE_DURATION);
        }
    }
  }
}

function cleanupOpenings() {
  openings = openings.filter(o => Date.now() - o.lastUsed < 1000);
}

function drawProjectiles() {
  ctx.fillStyle = "white";
  projectiles.forEach(p => {
    ctx.fillRect(p.x - projectileSize/2, p.y - projectileSize/2, projectileSize, projectileSize);
  });
}

function drawShield() {

  if (shield.visible) {
    const scale = 1 + 0.1 * Math.sin(Date.now() / 300); // pulsates between 0.9 and 1.1
    const pixelSize = (shield.size * scale) / 10; // scale sprite to shield.size with pulse
	
    ctx.fillStyle = "cyan";

    for (let row = 0; row < shieldSprite.length; row++) {
      for (let col = 0; col < shieldSprite[row].length; col++) {
        if (shieldSprite[row][col] === "x") {
          ctx.fillRect(
            shield.x - shield.size / 2 + col * pixelSize,
            shield.y - shield.size / 2 + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }

  if (shield.active) {
    // Draw faint interior (always visible)
    ctx.fillStyle = "rgba(0,255,255,0.1)";
    ctx.fillRect(shield.x - 14, shield.y - 14, 28, 28);

    // Decide if outline should blink
    let drawOutline = true;
    if (shield.duration - shield.timer <= 3) {
      drawOutline = Math.floor(shield.timer) % 2 === 0; // blink every second
    }

    if (drawOutline) {
      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 1;
      ctx.strokeRect(shield.x - 15, shield.y - 15, 30, 30);
    }
  }

}

/* ---------------- DRAW ORBS & PICKUPS ---------------- */
function drawOrbPickups() {
  ctx.fillStyle = "orange";
  for (const p of orbPickups) {
    const pixelSize = p.size / orbSprite.length;
    for (let row = 0; row < orbSprite.length; row++) {
      for (let col = 0; col < orbSprite[row].length; col++) {
        if (orbSprite[row][col] === "x") {
          ctx.fillRect(
            p.x - p.size / 2 + col * pixelSize,
            p.y - p.size / 2 + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}

function drawOrbs() {
  const n = orbs.length;
  if (n === 0) return;

  for (let i = 0; i < n; i++) {
    const orb = orbs[i];
    ctx.fillStyle = "orange";
    const pixelSize = orb.size / orbSprite.length;
    for (let row = 0; row < orbSprite.length; row++) {
      for (let col = 0; col < orbSprite[row].length; col++) {
        if (orbSprite[row][col] === "x") {
          ctx.fillRect(
            orb.x - orb.size / 2 + col * pixelSize,
            orb.y - orb.size / 2 + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}


function drawLives() {
  const heartSize = 10;
  const startX = boxOffset - heartSize - 10;
  const startY = boxOffset + boxSize - heartSize;

  for (let i = 0; i < lives; i++) {
    const y = startY - i * (heartSize + 2);
    drawHeart(startX, y, heartSize);
  }
}

function drawHeart(x, y, size) {
  const pixelSize = size / heartSprite.length;
  ctx.fillStyle = "red";
  for (let row = 0; row < heartSprite.length; row++) {
    for (let col = 0; col < heartSprite[row].length; col++) {
      if (heartSprite[row][col] === "x") {
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

function drawPickupBar() {
  const barWidth = 10;
  const barHeight = boxSize;
  const startX = boxOffset + boxSize + 10;
  const startY = boxOffset;

  // outline
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY, barWidth, barHeight);

  // fill
  const fillHeight = (pickupsCollected / PICKUPS_PER_LIFE) * barHeight;
  ctx.fillStyle = "white";
  ctx.fillRect(startX, startY + barHeight - fillHeight, barWidth, fillHeight);
}


/* ---------------- MAIN DRAW/LOOP ---------------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBox();
  drawLives();
  drawPickupBar();
  drawPlayer();
  drawProjectiles();
  drawShield();
  drawOrbPickups();
  drawOrbs();
}

function loop() {
  const now = Date.now();
  const delta = (now - lastTime)/1000;
  lastTime = now;
  
  // ---- Pause Handling ----
  if (isPaused) {
    draw(); // still draw current frame
    // Draw overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "10px monospace";
    ctx.fillText("Press ESC or Double Tap to Resume", canvas.width / 2, canvas.height / 2 + 10);
    requestAnimationFrame(loop);
    return;
  }


if (gameOver) {

  if (!hasDisplayedGameOver) {
    hasDisplayedGameOver = true; // ensures we only run this once

    if (musicPlaying) {
      bgm.pause();
      bgm.currentTime = 0;
      musicPlaying = false;
    }

    if (!isMuted) deathSound.play();

    openings = [];
    document.getElementById("timer").style.display = "none";

    highScores.push(timeSurvived);
    highScores.sort((a, b) => b - a);
    if (highScores.length > 5) highScores.length = 5;

    let scoreHTML = '<div style="color:red;font-size:20px;">GAME OVER</div>';
    scoreHTML += `<div>Time survived: ${timeSurvived.toFixed(1)}s</div>`;
    scoreHTML += '<div style="margin-top:8px;"><strong>Top 5 Scores</strong></div><ol>';
    highScores.forEach(s => scoreHTML += `<li>${s.toFixed(1)}s</li>`);
    scoreHTML += '</ol>';

    statusText.innerHTML = scoreHTML;
    restartBtn.style.display = "inline-block";
  }

  return;
}

  
  if (isInvulnerable && performance.now() - invulnerableTimer > INVULNERABLE_DURATION) {
    isInvulnerable = false;
    player.color = "white";
  }

  updatePlayer(delta);
  if(now-lastSpawn>spawnInterval){spawnProjectile();lastSpawn=now;}

  updateProjectiles(delta);
  checkCollision();
  cleanupOpenings();

  timeSurvived += delta;
  document.getElementById("timer").textContent=`Time: ${timeSurvived.toFixed(1)}s`;

  // projectile speed in px/sec: base + growth based on time survived
  projectileSpeed = baseProjectileSpeed + Math.min(150, Math.sqrt(timeSurvived) * 5); 

  spawnInterval = Math.max(500,2000-Math.sqrt(timeSurvived)*70);
  
  updateShield(delta);

  // ORB updates
  orbSpawnTimer += delta;
  if (orbSpawnTimer >= ORB_PICKUP_SPAWN_INTERVAL) {
    spawnOrbPickup();
    orbSpawnTimer = 0;
  }
  updateOrbPickups(delta);
  updateOrbs(delta);

  draw();
  requestAnimationFrame(loop);
}

function togglePause() {
  if (gameOver) return; // no pausing on game over
  isPaused = !isPaused;

  if (isPaused) {
    // Pause audio and animations
    bgm.pause();
  } else {
    // Resume audio and continue loop
    if (!isMuted) bgm.play().catch(()=>{});
    lastTime = Date.now(); // reset timing so delta doesn’t jump
    requestAnimationFrame(loop);
  }
}

window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    togglePause();
    return; // prevent movement keys from being processed on pause toggle
  }

  keys[e.key] = true;
});

window.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);
canvas.addEventListener("touchend", ()=>{ keys = {}; });

function handleTouch(e){
  e.preventDefault(); // prevent scrolling
  const rect = canvas.getBoundingClientRect();

  // Only track the first touch
  const touch = e.touches[0];
  const tx = touch.clientX - rect.left;
  const ty = touch.clientY - rect.top;

  touchTarget = { x: tx, y: ty };
}

canvas.addEventListener("touchend", ()=>{ 
  touchTarget = null; // stop moving when touch ends
});


// --- Double-tap outside box to toggle pause ---
canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const now = Date.now();
  const timeSinceLastTap = now - lastTapTime;

  // detect tap position
  const touch = e.touches[0];
  const tx = touch.clientX - rect.left;
  const ty = touch.clientY - rect.top;

  if (timeSinceLastTap < 300) {
    togglePause();
    e.preventDefault();
  }

  lastTapTime = now;
}, { passive: false });


restartBtn.addEventListener("click", resetGame);
startBtn.addEventListener("click", resetGame);
startBtn.style.display="inline-block";

const muteText = document.getElementById("muteSound");

// Load saved mute state
let isMuted = localStorage.getItem("dodgecatMuted") === "true";
updateMuteUI();

// Apply initial mute state
bgm.muted = isMuted;

// Click handler
muteText.addEventListener("click", () => {
  isMuted = !isMuted;
  bgm.muted = isMuted;
  localStorage.setItem("dodgecatMuted", isMuted);
  updateMuteUI();
});

function updateMuteUI() {
  muteText.style.color = isMuted ? "red" : "white";
}