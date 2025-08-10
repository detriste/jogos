// Jogo de Plataforma 2D - Estilo 16-bits
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.lastTime = 0;
        
        // Configurações do jogo
        this.gravity = 0.8;
        this.friction = 0.85;
        
        // Inicializar componentes
        this.player = new Player(100, 400);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.pickups = [];
        
        // Gerar inimigos iniciais
        this.spawnEnemies();
        
        // Configurar controles
        this.setupControls();
        
        // Iniciar game loop
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    spawnEnemies() {
        // Spawnar alguns esqueletos
        for (let i = 0; i < 3; i++) {
            this.enemies.push(new Skeleton(300 + i * 200, 400));
        }
    }
    
    update(deltaTime) {
        // Atualizar jogador
        this.player.update(deltaTime, this.keys, this);
        
        // Atualizar inimigos
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player, this);
        });
        
        // Atualizar projéteis
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return projectile.active;
        });
        
        // Atualizar partículas
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // Atualizar pickups
        this.pickups.forEach(pickup => {
            pickup.update(deltaTime, this.player);
        });
        
        // Remover pickups coletados
        this.pickups = this.pickups.filter(pickup => pickup.active);
        
        // Verificar colisões
        this.checkCollisions();
        
        // Atualizar UI
        this.updateUI();
    }
    
    checkCollisions() {
        // Colisão projéteis vs inimigos
        this.projectiles.forEach(projectile => {
            if (projectile.owner === 'player') {
                this.enemies.forEach(enemy => {
                    if (enemy.alive && this.checkCollision(projectile, enemy)) {
                        enemy.takeDamage(projectile.damage);
                        projectile.active = false;
                        
                        // Efeito de hit
                        this.createHitEffect(enemy.x, enemy.y);
                        
                        // Se morreu, criar pickup de osso
                        if (!enemy.alive) {
                            this.pickups.push(new BonePickup(enemy.x, enemy.y));
                        }
                    }
                });
            }
        });
        
        // Colisão player vs inimigos
        this.enemies.forEach(enemy => {
            if (enemy.alive && this.checkCollision(this.player, enemy)) {
                if (enemy.canAttack) {
                    this.player.takeDamage(1);
                    enemy.canAttack = false;
                    setTimeout(() => enemy.canAttack = true, 1000);
                }
            }
        });
        
        // Colisão ataques melee do player vs inimigos
        if (this.player.isAttacking && this.player.currentWeapon.type === 'melee') {
            this.enemies.forEach(enemy => {
                if (enemy.alive && this.checkMeleeCollision(this.player, enemy)) {
                    enemy.takeDamage(this.player.currentWeapon.damage);
                    this.createHitEffect(enemy.x, enemy.y);
                    
                    if (!enemy.alive) {
                        this.pickups.push(new BonePickup(enemy.x, enemy.y));
                    }
                }
            });
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    checkMeleeCollision(player, enemy) {
        const attackRange = 60;
        const distance = Math.abs(player.x - enemy.x);
        return distance < attackRange && Math.abs(player.y - enemy.y) < 50;
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, 'red'));
        }
    }
    
    updateUI() {
        // Atualizar barra de vida
        const healthFill = document.getElementById('healthFill');
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        healthFill.style.width = healthPercent + '%';
        
        // Atualizar display da arma
        const weaponIcon = document.getElementById('weaponIcon');
        const weaponName = document.getElementById('weaponName');
        
        const weapon = this.player.currentWeapon;
        weaponIcon.textContent = weapon.icon;
        weaponName.textContent = weapon.name.toUpperCase();
    }
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = 'linear-gradient(to bottom, #87CEEB, #98FB98)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar background
        this.drawBackground();
        
        // Desenhar chão
        this.drawGround();
        
        // Desenhar jogador
        this.player.render(this.ctx);
        
        // Desenhar inimigos
        this.enemies.forEach(enemy => {
            if (enemy.alive) enemy.render(this.ctx);
        });
        
        // Desenhar projéteis
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Desenhar partículas
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // Desenhar pickups
        this.pickups.forEach(pickup => {
            pickup.render(this.ctx);
        });
    }
    
    drawBackground() {
        // Céu gradiente
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Nuvens simples
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = 0.8;
        this.drawCloud(100, 80, 60);
        this.drawCloud(300, 120, 40);
        this.drawCloud(600, 90, 50);
        this.drawCloud(900, 110, 45);
        this.ctx.globalAlpha = 1;
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGround() {
        // Chão de grama
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 500, this.canvas.width, 100);
        
        // Detalhes do chão
        this.ctx.fillStyle = '#32CD32';
        for (let x = 0; x < this.canvas.width; x += 20) {
            this.ctx.fillRect(x, 500, 10, 5);
        }
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Classe do Jogador
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = 15;
        this.onGround = false;
        this.facingRight = true;
        
        // Sistema de vida
        this.health = 100;
        this.maxHealth = 100;
        
        // Sistema de armas
        this.weapons = [
            { type: 'melee', name: 'espada', damage: 25, icon: '🗡️' },
            { type: 'ranged', name: 'arco', damage: 20, icon: '🏹' },
            { type: 'magic', name: 'osso mágico', damage: 30, icon: '🦴', unlocked: false }
        ];
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weapons[0];
        
        // Animação
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.isWalking = false;
        this.isAttacking = false;
        this.attackTimer = 0;
    }
    
    update(deltaTime, keys, game) {
        // Movimento horizontal
        this.velocityX *= 0.85; // Fricção
        
        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.facingRight = false;
            this.isWalking = true;
        } else if (keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.facingRight = true;
            this.isWalking = true;
        } else {
            this.isWalking = false;
        }
        
        // Pulo
        if (keys['ArrowUp'] && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }
        
        // Ataque
        if (keys[' '] && !this.isAttacking) {
            this.attack(game);
        }
        
        // Trocar arma
        if (keys['q'] || keys['Q']) {
            this.switchWeapon();
            keys['q'] = false;
            keys['Q'] = false;
        }
        
        // Aplicar gravidade
        this.velocityY += 0.8;
        
        // Aplicar velocidades
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Colisão com o chão
        if (this.y + this.height > 500) {
            this.y = 500 - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }
        
        // Limites da tela
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 1200) this.x = 1200 - this.width;
        
        // Atualizar animações
        this.updateAnimation(deltaTime);
        
        // Atualizar timer de ataque
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
    }
    
    attack(game) {
        this.isAttacking = true;
        this.attackTimer = 300; // 300ms de duração do ataque
        
        if (this.currentWeapon.type === 'ranged') {
            // Criar flecha
            const arrow = new Arrow(
                this.x + (this.facingRight ? this.width : 0),
                this.y + this.height / 2,
                this.facingRight ? 8 : -8,
                this.currentWeapon.damage
            );
            game.projectiles.push(arrow);
        } else if (this.currentWeapon.type === 'magic') {
            // Criar projétil mágico
            const magic = new MagicProjectile(
                this.x + (this.facingRight ? this.width : 0),
                this.y + this.height / 2,
                this.facingRight ? 10 : -10,
                this.currentWeapon.damage
            );
            game.projectiles.push(magic);
        }
        // Ataque melee é tratado na detecção de colisão
    }
    
    switchWeapon() {
        do {
            this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
            this.currentWeapon = this.weapons[this.currentWeaponIndex];
        } while (!this.currentWeapon.unlocked && this.currentWeapon.type === 'magic');
    }
    
    unlockMagicWeapon() {
        this.weapons[2].unlocked = true;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        if (this.animationTimer > 150) { // Trocar frame a cada 150ms
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Espelhar se necessário
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        // Desenhar personagem (estilo 16-bit pixelado)
        this.drawPixelCharacter(ctx);
        
        ctx.restore();
        
        // Desenhar arma atual se atacando
        if (this.isAttacking) {
            this.drawWeapon(ctx);
        }
    }
    
    drawPixelCharacter(ctx) {
        const colors = {
            skin: '#FFDBAC',
            armor: '#4169E1',
            hair: '#8B4513',
            weapon: '#C0C0C0'
        };
        
        // Cabeça
        ctx.fillStyle = colors.skin;
        ctx.fillRect(8, this.y, 16, 16);
        
        // Cabelo
        ctx.fillStyle = colors.hair;
        ctx.fillRect(8, this.y, 16, 8);
        
        // Corpo
        ctx.fillStyle = colors.armor;
        ctx.fillRect(4, this.y + 16, 24, 20);
        
        // Braços
        ctx.fillStyle = colors.skin;
        ctx.fillRect(0, this.y + 18, 8, 16);
        ctx.fillRect(24, this.y + 18, 8, 16);
        
        // Pernas
        ctx.fillStyle = '#654321';
        ctx.fillRect(8, this.y + 36, 8, 12);
        ctx.fillRect(16, this.y + 36, 8, 12);
        
        // Pés
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(6, this.y + 44, 12, 4);
        ctx.fillRect(18, this.y + 44, 12, 4);
        
        // Detalhes da animação de caminhada
        if (this.isWalking && this.onGround) {
            const offset = Math.sin(this.animationFrame) * 2;
            ctx.translate(0, offset);
        }
    }
    
    drawWeapon(ctx) {
        ctx.save();
        
        const weaponX = this.x + (this.facingRight ? this.width + 5 : -25);
        const weaponY = this.y + 15;
        
        if (this.currentWeapon.type === 'melee') {
            // Desenhar espada
            ctx.fillStyle = '#C0C0C0';
            if (this.facingRight) {
                ctx.fillRect(weaponX, weaponY, 20, 4);
                ctx.fillRect(weaponX + 15, weaponY - 2, 3, 8);
            } else {
                ctx.fillRect(weaponX, weaponY, 20, 4);
                ctx.fillRect(weaponX + 2, weaponY - 2, 3, 8);
            }
        }
        
        ctx.restore();
    }
}

// Inicializar jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});