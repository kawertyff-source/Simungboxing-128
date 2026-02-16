// RPG & Save System
const GameData = {
    stats: { str: 10, agi: 10, cash: 1000 },
    skills: [],
    save: function() {
        localStorage.setItem('boxer_save', JSON.stringify(this.stats));
        localStorage.setItem('boxer_skills', JSON.stringify(this.skills));
    },
    load: function() {
        const savedStats = localStorage.getItem('boxer_save');
        if(savedStats) this.stats = JSON.parse(savedStats);
        this.updateUI();
    },
    updateUI: function() {
        document.getElementById('stat-str').innerText = this.stats.str;
        document.getElementById('stat-agi').innerText = this.stats.agi;
        document.getElementById('stat-cash').innerText = this.stats.cash;
    }
};

function toggleDashboard() {
    const dash = document.getElementById('dashboard');
    dash.classList.toggle('hidden');
    GameData.updateUI();
}

function rollGacha() {
    if(GameData.stats.cash < 500) {
        alert("Not enough cash!"); return;
    }
    GameData.stats.cash -= 500;
    
    // Gacha Logic
    const rng = Math.random();
    let result = "COMMON GLOVES";
    let color = "white";

    if(rng > 0.95) { result = "SSR: DEMPSEY ROLL"; color = "gold"; GameData.stats.str += 50; }
    else if(rng > 0.8) { result = "SR: GAZELLE PUNCH"; color = "cyan"; GameData.stats.agi += 20; }
    else { GameData.stats.str += 2; } // Common items give stats

    const resBox = document.getElementById('gacha-result');
    resBox.innerText = result;
    resBox.style.color = color;
    
    GameData.save();
    GameData.updateUI();
}

// Load on start
GameData.load();
