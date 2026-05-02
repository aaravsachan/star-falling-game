const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let gameOver = false;
let gameStarted = false;
let player = { x: canvas.width / 2 - 25, y: canvas.height - 50, width: 50, height: 20 };
let fallingObjects = [];
let lastCreateTime = 0;
let wave = 1;
let waveStartTime = 0;
let activePowerUps = { shield: 0, slow: 0 };
const baseSpawnInterval = 1000;
const waveDuration = 12000;
let keys = { left: false, right: false };
const playerSpeed = 8.4;

const maxFallingObjects = 70;

function createFallingObject() {
    if (fallingObjects.length >= maxFallingObjects) return;
    const rand = Math.random();
    const waveShift = Math.min(0.12, (wave - 1) * 0.02);
    const starChance = 0.35 - waveShift * 0.5;
    const blueChance = 0.17 - waveShift * 0.2;
    const greenChance = 0.08 - waveShift * 0.2;
    const purpleChance = 0.02;
    const orangeChance = 0.01;
    const whiteChance = 0.001;
    const shieldChance = 0.015;
    const slowChance = 0.015;
    let type;
    if (rand < starChance) type = 'star';
    else if (rand < starChance + blueChance) type = 'blueStar';
    else if (rand < starChance + blueChance + greenChance) type = 'greenStar';
    else if (rand < starChance + blueChance + greenChance + purpleChance) type = 'purpleStar';
    else if (rand < starChance + blueChance + greenChance + purpleChance + orangeChance) type = 'orangeStar';
    else if (rand < starChance + blueChance + greenChance + purpleChance + orangeChance + whiteChance) type = 'whiteStar';
    else if (rand < starChance + blueChance + greenChance + purpleChance + orangeChance + whiteChance + shieldChance) type = 'shield';
    else if (rand < starChance + blueChance + greenChance + purpleChance + orangeChance + whiteChance + shieldChance + slowChance) type = 'slow';
    else type = 'ghoul';
    let speed = (2 + Math.random() * 3) * (1 + (wave - 1) * 0.08);
    if (type === 'ghoul') speed *= 1.5; // Make ghouls 50% faster
    const obj = {
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        speed: speed,
        type: type
    };
    fallingObjects.push(obj);
}

function updateWaveDisplay() {
    document.getElementById('wave').textContent = 'Wave: ' + wave;
}

function updatePowerUpDisplay() {
    const statusElement = document.getElementById('powerUpStatus');
    if (!statusElement) return;
    const active = [];
    const now = Date.now();
    if (activePowerUps.shield > now) active.push('Shield');
    if (activePowerUps.slow > now) active.push('Slow');
    statusElement.textContent = active.length ? 'Power: ' + active.join(', ') : '';
}

function activatePowerUp(type) {
    const duration = 6000;
    if (type === 'shield') activePowerUps.shield = Date.now() + duration;
    if (type === 'slow') activePowerUps.slow = Date.now() + duration;
    updatePowerUpDisplay();
}

function drawFallingObject(obj) {
    ctx.save();
    const centerX = obj.x + 10;
    const centerY = obj.y + 10;
    if (obj.type === 'star' || obj.type === 'blueStar' || obj.type === 'greenStar' || obj.type === 'purpleStar' || obj.type === 'orangeStar' || obj.type === 'whiteStar') {
        const colorMap = {
            star: 'yellow',
            blueStar: 'blue',
            greenStar: 'green',
            purpleStar: 'purple',
            orangeStar: 'orange',
            whiteStar: 'white'
        };
        ctx.fillStyle = colorMap[obj.type];
        if (obj.type === 'whiteStar') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'white';
        }
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = 10;
        const innerRadius = 5;
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    } else if (obj.type === 'shield' || obj.type === 'slow') {
        const color = obj.type === 'shield' ? 'gold' : 'cyan';
        const label = obj.type === 'shield' ? 'S' : 'T';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, centerX, centerY);
    } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(obj.x + 3, obj.y + 3, 4, 4);
        ctx.fillRect(obj.x + 13, obj.y + 3, 4, 4);
        ctx.fillStyle = 'black';
        ctx.fillRect(obj.x + 4, obj.y + 4, 2, 2);
        ctx.fillRect(obj.x + 14, obj.y + 4, 2, 2);
    }
    ctx.restore();
}

// setInterval(createFallingObject, 1000); // Create a new falling object every second

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            startGame();
        } else if (gameOver) {
            restartGame();
        }
    } else if (e.code === 'ArrowLeft') {
        keys.left = true;
    } else if (e.code === 'ArrowRight') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        keys.left = false;
    } else if (e.code === 'ArrowRight') {
        keys.right = false;
    }
});

function updateWaveDisplay() {
    document.getElementById('wave').textContent = 'Wave: ' + wave;
}

function startGame() {
    gameStarted = true;
    wave = 1;
    waveStartTime = Date.now();
    activePowerUps = { shield: 0, slow: 0 };
    updateWaveDisplay();
    updatePowerUpDisplay();
    document.getElementById('startScreen').style.display = 'none';
}

function restartGame() {
    score = 0;
    gameOver = false;
    gameStarted = false;
    wave = 1;
    waveStartTime = Date.now();
    activePowerUps = { shield: 0, slow: 0 };
    fallingObjects = [];
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    updateWaveDisplay();
    updatePowerUpDisplay();
    player.x = canvas.width / 2 - 25;
}

function update() {
    if (!gameStarted || gameOver) return;
    // Handle arrow key movement
    if (keys.left) {
        player.x -= playerSpeed;
        if (player.x < 0) player.x = 0;
    }
    if (keys.right) {
        player.x += playerSpeed;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    }
    const now = Date.now();
    const elapsed = now - waveStartTime;
    if (elapsed > waveDuration) {
        wave++;
        waveStartTime = now;
        updateWaveDisplay();
    }
    const currentSpawnInterval = Math.max(300, baseSpawnInterval - (wave - 1) * 90);
    if (now - lastCreateTime > currentSpawnInterval) {
        createFallingObject();
        lastCreateTime = now;
    }
    const speedMultiplier = activePowerUps.slow > now ? 0.7 : 1;
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed * speedMultiplier;
        if (obj.y > canvas.height) {
            fallingObjects.splice(i, 1);
            continue;
        }
        if (obj.x < player.x + player.width &&
            obj.x + obj.width > player.x &&
            obj.y < player.y + player.height &&
            obj.y + obj.height > player.y) {
            if (obj.type === 'star' || obj.type === 'blueStar' || obj.type === 'greenStar' || obj.type === 'purpleStar' || obj.type === 'orangeStar' || obj.type === 'whiteStar') {
                if (obj.type === 'star') score += 1;
                else if (obj.type === 'blueStar') score += 2;
                else if (obj.type === 'greenStar') score += 10;
                else if (obj.type === 'purpleStar') score += 100;
                else if (obj.type === 'orangeStar') score += 500;
                else if (obj.type === 'whiteStar') score += 1000;
                document.getElementById('score').textContent = 'Score: ' + score;
                fallingObjects.splice(i, 1);
            } else if (obj.type === 'shield' || obj.type === 'slow') {
                activatePowerUp(obj.type);
                fallingObjects.splice(i, 1);
            } else {
                if (activePowerUps.shield > now) {
                    score += 5;
                    document.getElementById('score').textContent = 'Score: ' + score;
                    fallingObjects.splice(i, 1);
                } else {
                    gameOver = true;
                    document.getElementById('gameOver').style.display = 'block';
                }
            }
        }
    }

    updatePowerUpDisplay();
}

function draw() {
    if (!gameStarted) return;
    const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, '#021024');
    background.addColorStop(1, '#000814');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player (basket)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(player.x, player.y + player.height, player.width, 5);
    // Draw falling objects
    fallingObjects.forEach(obj => {
        drawFallingObject(obj);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

updateWaveDisplay();
updatePowerUpDisplay();
gameLoop();