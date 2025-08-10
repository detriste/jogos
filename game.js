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
        this.effectsManager = new EffectsManager();
        this.particleSystem = new ParticleSystem();
        this.gameOverScreen = new GameOverScreen();
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
        // Verificar se jogador morreu
        if (this.player.health <= 0) {
            this.gameOverScreen.show();
            return;
        }
        
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
        
        // Atualizar sistema de partículas
        this.particleSystem.update(deltaTime);
        
        // Atualizar partículas antigas
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
        
        // Atualizar tela de game over
        this.gameOverScreen.update(deltaTime);
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
                        this.particleSystem.createBloodSplash(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        this.effectsManager.playHitSound();
                        
                        // Se morreu, criar pickup de osso
                        if (!enemy.alive) {
                            this.pickups.push(new BonePickup(enemy.x, enemy.y));
                            this.effectsManager.playDeathSound();
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
                    this.particleSystem.createBloodSplash(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    this.particleSystem.createSwordSlash(enemy.x, enemy.y, this.player.facingRight ? 1 : -1);
                    this.effectsManager.playHitSound();
                    
                    if (!enemy.alive) {
                        this.pickups.push(new BonePickup(enemy.x, enemy.y));
                        this.effectsManager.playDeathSound();
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
        const attackRange = 80;
        const distance = Math.abs(player.x - enemy.x);
        const verticalDistance = Math.abs(player.y - enemy.y);
        return distance < attackRange && verticalDistance < 60;
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
        
        // Desenhar sistema de partículas
        this.particleSystem.render(this.ctx);
        
        // Desenhar partículas antigas
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // Desenhar pickups
        this.pickups.forEach(pickup => {
            pickup.render(this.ctx);
        });
        
        // Desenhar tela de game over
        this.gameOverScreen.render(this.ctx, this.canvas);
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

// Classe dos Esqueletos (Inimigos)
class Skeleton {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 44;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 1.5;
        this.health = 50;
        this.maxHealth = 50;
        this.alive = true;
        this.facingRight = false;
        this.canAttack = true;
        
        // IA
        this.aiTimer = 0;
        this.aiState = 'patrol'; // patrol, chase, attack
        this.patrolDirection = Math.random() > 0.5 ? 1 : -1;
        this.detectionRange = 120;
        this.attackRange = 40;
        
        // Animação
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    update(deltaTime, player, game) {
        if (!this.alive) return;
        
        this.aiTimer += deltaTime;
        
        // IA básica
        const distanceToPlayer = Math.abs(this.x - player.x);
        const canSeePlayer = distanceToPlayer < this.detectionRange && Math.abs(this.y - player.y) < 60;
        
        if (canSeePlayer && distanceToPlayer < this.attackRange) {
            this.aiState = 'attack';
        } else if (canSeePlayer) {
            this.aiState = 'chase';
        } else {
            this.aiState = 'patrol';
        }
        
        // Comportamento baseado no estado
        switch (this.aiState) {
            case 'patrol':
                this.velocityX = this.patrolDirection * this.speed * 0.5;
                if (this.aiTimer > 2000) { // Mudar direção a cada 2 segundos
                    this.patrolDirection *= -1;
                    this.aiTimer = 0;
                }
                break;
                
            case 'chase':
                const direction = player.x > this.x ? 1 : -1;
                this.velocityX = direction * this.speed;
                this.facingRight = direction > 0;
                break;
                
            case 'attack':
                this.velocityX *= 0.1; // Parar para atacar
                break;
        }
        
        // Aplicar gravidade
        this.velocityY += 0.8;
        
        // Aplicar movimento
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Colisão com o chão
        if (this.y + this.height > 500) {
            this.y = 500 - this.height;
            this.velocityY = 0;
        }
        
        // Limites da tela
        if (this.x < 0) {
            this.x = 0;
            this.patrolDirection = 1;
        }
        if (this.x + this.width > 1200) {
            this.x = 1200 - this.width;
            this.patrolDirection = -1;
        }
        
        // Aplicar fricção
        this.velocityX *= 0.9;
        
        // Atualizar animação
        this.updateAnimation(deltaTime);
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        if (this.animationTimer > 200) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Espelhar se necessário
        if (this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        this.drawPixelSkeleton(ctx);
        
        ctx.restore();
        
        // Barra de vida
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }
    
    drawPixelSkeleton(ctx) {
        const colors = {
            bone: '#F5F5DC',
            shadow: '#A9A9A9',
            eyes: '#FF0000'
        };
        
        // Cabeça/crânio
        ctx.fillStyle = colors.bone;
        ctx.fillRect(6, this.y, 20, 18);
        
        // Olhos vermelhos
        ctx.fillStyle = colors.eyes;
        ctx.fillRect(10, this.y + 6, 3, 3);
        ctx.fillRect(17, this.y + 6, 3, 3);
        
        // Maxilar
        ctx.fillStyle = colors.bone;
        ctx.fillRect(8, this.y + 12, 16, 6);
        
        // Corpo (caixa torácica)
        ctx.fillStyle = colors.bone;
        ctx.fillRect(8, this.y + 18, 16, 18);
        
        // Costelas (detalhes)
        ctx.fillStyle = colors.shadow;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(10, this.y + 20 + i * 3, 12, 1);
        }
        
        // Braços
        ctx.fillStyle = colors.bone;
        ctx.fillRect(2, this.y + 20, 6, 14);
        ctx.fillRect(24, this.y + 20, 6, 14);
        
        // Pernas
        ctx.fillStyle = colors.bone;
        ctx.fillRect(10, this.y + 36, 4, 8);
        ctx.fillRect(18, this.y + 36, 4, 8);
        
        // Animação de caminhada
        if (Math.abs(this.velocityX) > 0.1) {
            const walkOffset = Math.sin(this.animationFrame * 0.5) * 1;
            ctx.translate(0, walkOffset);
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = 30;
        const barHeight = 4;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 10;
        
        // Fundo da barra
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vida atual
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Borda
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// Classe das Flechas
class Arrow {
    constructor(x, y, velocityX, damage) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 2;
        this.velocityX = velocityX;
        this.velocityY = 0;
        this.damage = damage;
        this.active = true;
        this.owner = 'player';
        this.life = 3000; // 3 segundos
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
        
        // Sair da tela
        if (this.x < -50 || this.x > 1250 || this.y < -50 || this.y > 650) {
            this.active = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Flecha
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width - 4, this.height);
        
        // Ponta da flecha
        ctx.fillStyle = '#C0C0C0';
        if (this.velocityX > 0) {
            ctx.fillRect(this.x + this.width - 4, this.y - 1, 4, 4);
        } else {
            ctx.fillRect(this.x, this.y - 1, 4, 4);
        }
        
        // Penas
        ctx.fillStyle = '#228B22';
        if (this.velocityX > 0) {
            ctx.fillRect(this.x, this.y - 1, 3, 1);
            ctx.fillRect(this.x, this.y + 2, 3, 1);
        } else {
            ctx.fillRect(this.x + this.width - 3, this.y - 1, 3, 1);
            ctx.fillRect(this.x + this.width - 3, this.y + 2, 3, 1);
        }
        
        ctx.restore();
    }
}

// Classe de Projétil Mágico
class MagicProjectile {
    constructor(x, y, velocityX, damage) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.velocityX = velocityX;
        this.velocityY = Math.sin(Date.now() * 0.01) * 2;
        this.damage = damage;
        this.active = true;
        this.owner = 'player';
        this.life = 4000;
        this.trail = [];
    }
    
    update(deltaTime) {
        // Movimento ondulatório
        this.y += Math.sin(this.x * 0.01) * 0.5;
        
        this.x += this.velocityX;
        
        // Adicionar à trilha
        this.trail.push({ x: this.x, y: this.y, life: 300 });
        
        // Atualizar trilha
        this.trail = this.trail.filter(point => {
            point.life -= deltaTime;
            return point.life > 0;
        });
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
        
        if (this.x < -50 || this.x > 1250 || this.y < -50 || this.y > 650) {
            this.active = false;
        }
    }
    
    render(ctx) {
        // Desenhar trilha
        this.trail.forEach((point, index) => {
            const alpha = point.life / 300;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#9370DB';
            ctx.fillRect(point.x, point.y, 6, 6);
        });
        
        ctx.globalAlpha = 1;
        
        // Desenhar projétil principal
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Brilho
        ctx.fillStyle = '#DDA0DD';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Núcleo brilhante
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 4, this.y + 4, 4, 4);
    }
}

// Classe de Partículas
class Particle {
    constructor(x, y, color = 'red') {
        this.x = x + Math.random() * 20 - 10;
        this.y = y + Math.random() * 20 - 10;
        this.velocityX = (Math.random() - 0.5) * 8;
        this.velocityY = (Math.random() - 0.5) * 8 - 2;
        this.life = 500 + Math.random() * 500;
        this.maxLife = this.life;
        this.color = color;
        this.size = 2 + Math.random() * 4;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.2; // Gravidade nas partículas
        this.velocityX *= 0.98; // Fricção
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

// Classe de Pickup de Osso
class BonePickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.active = true;
        this.bobOffset = 0;
        this.glowTimer = 0;
    }
    
    update(deltaTime, player) {
        // Efeito de flutuação
        this.bobOffset += deltaTime * 0.005;
        this.glowTimer += deltaTime;
        
        // Verificar colisão com jogador
        if (this.active && 
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            
            // Coletado!
            player.unlockMagicWeapon();
            this.active = false;
        }
    }
    
    render(ctx) {
        const bobY = this.y + Math.sin(this.bobOffset) * 3;
        const glow = Math.sin(this.glowTimer * 0.01) * 0.3 + 0.7;
        
        ctx.globalAlpha = glow;
        
        // Desenhar osso
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(this.x + 2, bobY + 2, 12, 4);
        ctx.fillRect(this.x, bobY, 4, 8);
        ctx.fillRect(this.x + 12, bobY + 8, 4, 8);
        
        // Brilho mágico
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(this.x + 4, bobY + 1, 8, 6);
        
        ctx.globalAlpha = 1;
    }
}

// Inicializar jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});