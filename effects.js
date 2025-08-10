// Sistema de Efeitos Visuais e Sonoros
class EffectsManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio não suportado');
        }
    }
    
    // Criar som sintetizado
    createSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Sons do jogo
    playJumpSound() {
        this.createSound(400, 0.2, 'square');
    }
    
    playSwordSound() {
        this.createSound(300, 0.1, 'sawtooth');
    }
    
    playBowSound() {
        this.createSound(800, 0.15, 'sine');
    }
    
    playMagicSound() {
        this.createSound(600, 0.3, 'triangle');
    }
    
    playHitSound() {
        this.createSound(200, 0.1, 'square');
    }
    
    playDeathSound() {
        this.createSound(150, 0.5, 'sawtooth');
    }
    
    playPickupSound() {
        this.createSound(1000, 0.2, 'sine');
    }
    
    playWeaponSwitchSound() {
        this.createSound(500, 0.1, 'triangle');
    }
}

// Classe para efeitos de partículas mais avançados
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createBloodSplash(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push(new BloodParticle(x, y));
        }
    }
    
    createMagicExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new MagicParticle(x, y));
        }
    }
    
    createSwordSlash(x, y, direction) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new SlashParticle(x, y, direction));
        }
    }
    
    createArrowTrail(x, y) {
        this.particles.push(new ArrowTrailParticle(x, y));
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
    }
}

// Partícula de sangue
class BloodParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.velocityX = (Math.random() - 0.5) * 8;
        this.velocityY = (Math.random() - 0.5) * 8 - 2;
        this.life = 600 + Math.random() * 400;
        this.maxLife = this.life;
        this.size = 2 + Math.random() * 3;
        this.color = `rgb(${200 + Math.random() * 55}, 0, 0)`;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.3; // Gravidade
        this.velocityX *= 0.95; // Fricção
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Partícula mágica
class MagicParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 30;
        this.y = y + (Math.random() - 0.5) * 30;
        this.velocityX = (Math.random() - 0.5) * 6;
        this.velocityY = (Math.random() - 0.5) * 6 - 3;
        this.life = 800 + Math.random() * 600;
        this.maxLife = this.life;
        this.size = 3 + Math.random() * 4;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.2;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.angle += this.spin;
        this.velocityY += 0.1; // Leve gravidade
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Estrela mágica
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.fillStyle = '#DDA0DD';
        ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// Partícula de corte de espada
class SlashParticle {
    constructor(x, y, direction) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        this.velocityX = direction * (3 + Math.random() * 4);
        this.velocityY = (Math.random() - 0.5) * 4;
        this.life = 300 + Math.random() * 200;
        this.maxLife = this.life;
        this.size = 4 + Math.random() * 3;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityX *= 0.9;
        this.velocityY *= 0.9;
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, this.y, this.size, 2);
        ctx.globalAlpha = 1;
    }
}

// Partícula de rastro de flecha
class ArrowTrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 200;
        this.maxLife = this.life;
        this.size = 3;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Classe para tela de morte
class GameOverScreen {
    constructor() {
        this.visible = false;
        this.alpha = 0;
    }
    
    show() {
        this.visible = true;
    }
    
    hide() {
        this.visible = false;
        this.alpha = 0;
    }
    
    update(deltaTime) {
        if (this.visible && this.alpha < 1) {
            this.alpha += deltaTime * 0.002;
            if (this.alpha > 1) this.alpha = 1;
        }
    }
    
    render(ctx, canvas) {
        if (!this.visible) return;
        
        // Fundo escuro
        ctx.globalAlpha = this.alpha * 0.8;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        if (this.alpha > 0.5) {
            // Texto de Game Over
            ctx.font = '48px Courier New';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
            
            ctx.font = '24px Courier New';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Pressione F5 para reiniciar', canvas.width / 2, canvas.height / 2 + 20);
        }
    }
}