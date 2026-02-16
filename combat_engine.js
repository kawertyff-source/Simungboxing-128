// --- 3D SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 4); // First Person View

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Sharp on mobile
document.getElementById('game-world').appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// --- PLAYER (Gloves) ---
const gloveGeo = new THREE.BoxGeometry(0.4, 0.4, 0.5);
const gloveMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.2 });
const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
leftGlove.position.set(-0.6, 1.2, 3);
const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
rightGlove.position.set(0.6, 1.2, 3);
scene.add(leftGlove); scene.add(rightGlove);

// --- ENEMY (The Boss) ---
const enemyGroup = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
const headGeo = new THREE.SphereGeometry(0.4, 32, 32);
const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Enemy is Red
const body = new THREE.Mesh(bodyGeo, enemyMat);
const head = new THREE.Mesh(headGeo, enemyMat);
head.position.y = 1;
enemyGroup.add(body); enemyGroup.add(head);
enemyGroup.position.set(0, 1.2, 0);
scene.add(enemyGroup);

// --- COMBAT LOGIC ---
let hp = 100, st = 100, enHp = 100;
let isAttacking = false;
let canCounter = false; // Enemy vulnerability window

// Controls
document.querySelectorAll('.touch-zone').forEach(zone => {
    zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const action = zone.dataset.act;
        playerAttack(action);
    });
});

function playerAttack(type) {
    if(st < 10 || isAttacking) return;
    
    st -= 10;
    isAttacking = true;
    updateBars();

    // Determine hand
    const hand = (type === 'jab' || type === 'hook') ? leftGlove : rightGlove;
    
    // Punch Animation
    new TWEEN.Tween(hand.position)
        .to({ z: 1, x: (type==='hook' ? 0 : hand.position.x) }, 80) // Hook curves in
        .yoyo(true).repeat(1)
        .onComplete(() => isAttacking = false)
        .start();

    // Hit Detection
    setTimeout(() => {
        // Effects
        shakeCamera(0.2);
        triggerVFX();
        
        // Damage Calculation
        let dmg = 5 + (GameData.stats.str * 0.1);
        
        if(canCounter) { // COUNTER HIT SYSTEM
            dmg *= 2.5;
            triggerSlowMo();
            showCritical();
            GameData.stats.cash += 50; // Earn cash
        }
        
        enHp -= dmg;
        if(enHp <= 0) resetFight();
        
        // Enemy Feedback
        enemyGroup.position.z = -0.5;
        new TWEEN.Tween(enemyGroup.position).to({z:0}, 200).start();
        
        updateBars();
    }, 80);
}

// Enemy AI Loop
function enemyAI() {
    if(Math.random() > 0.95) { // Enemy Attacks randomly
        // Telegraphing attack (Flash Yellow)
        enemyMat.color.setHex(0xffff00); 
        canCounter = true; // Open for counter

        setTimeout(() => {
            // Attack lands
            if(!isAttacking) { // If player didn't counter
                hp -= 10;
                shakeCamera(0.5);
                document.getElementById('damage-overlay').style.opacity = 0.8;
                setTimeout(()=>document.getElementById('damage-overlay').style.opacity=0, 200);
            }
            canCounter = false;
            enemyMat.color.setHex(0xff0000); // Back to normal
            updateBars();
        }, 600); // 0.6s reaction time window
    }
}

// --- VFX SYSTEMS ---
function shakeCamera(intensity) {
    new TWEEN.Tween(camera.position)
        .to({ x: (Math.random()-0.5)*intensity, y: 1.6 + (Math.random()-0.5)*intensity }, 50)
        .yoyo(true).repeat(4).start();
}

function triggerVFX() {
    const lines = document.getElementById('speed-lines');
    lines.style.opacity = 1;
    setTimeout(() => lines.style.opacity = 0, 100);
    
    if(navigator.vibrate) navigator.vibrate(30);
}

function showCritical() {
    const txt = document.getElementById('critical-text');
    txt.style.transform = "translate(-50%, -50%) scale(1.5)";
    setTimeout(() => txt.style.transform = "translate(-50%, -50%) scale(0)", 500);
}

function triggerSlowMo() {
    // Simple time dilation simulation
    // In a complex engine we use delta time, here we just pause AI briefly
}

function updateBars() {
    document.getElementById('hp-bar').style.width = hp + '%';
    document.getElementById('st-bar').style.width = st + '%';
    document.getElementById('enemy-hp-bar').style.width = enHp + '%';
}

function resetFight() {
    enHp = 100;
    GameData.stats.cash += 100;
    GameData.save();
    alert("K.O.!! YOU WIN!");
}

// Game Loop
function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time);
    enemyAI();
    
    // Stamina Regen
    if(st < 100) st += 0.5;
    document.getElementById('st-bar').style.width = st + '%';

    renderer.render(scene, camera);
}
// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
