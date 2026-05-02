// game

import Phaser from 'phaser';
import { PhaserBridge } from '../game-engine.component';

const WORLD_W   = 3200;
const WORLD_H   = 3200;
const BLOCK_W   = 320;
const BLOCK_H   = 280;
const P_SPEED   = 230;
const GAME_TIME = 180; // segundos (3 minutos)

interface Player {
  sprite:   Phaser.Physics.Arcade.Sprite;
  nameTag:  Phaser.GameObjects.Text;
  vBg:      Phaser.GameObjects.Rectangle;
  vBar:     Phaser.GameObjects.Rectangle;
  vitality: number;
  score:    number;
  won:      boolean;
  dead:     boolean;
  up:    Phaser.Input.Keyboard.Key;
  down:  Phaser.Input.Keyboard.Key;
  left:  Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  lastDir: string;
}

interface MovingCar {
  sprite: Phaser.Physics.Arcade.Sprite;
  axis:   'h' | 'v';
  min:    number;
  max:    number;
  spd:    number;
}

export class GameScene extends Phaser.Scene {
  private bridge!: PhaserBridge;
  private p1!: Player;
  private p2!: Player;
  private buildings!: Phaser.Physics.Arcade.StaticGroup;
  private carsGroup!: Phaser.Physics.Arcade.Group;
  private items!:     Phaser.Physics.Arcade.StaticGroup;
  private movingCars: MovingCar[] = [];
  private cam1!: Phaser.Cameras.Scene2D.Camera;
  private paused   = true;
  private over     = false;
  private timeLeft = GAME_TIME;
  private timerTxt!: Phaser.GameObjects.Text;
  private elapsed  = 0; // acumulador en ms

  // Minimapas
  private mm1!: Phaser.GameObjects.Graphics;
  private mm2!: Phaser.GameObjects.Graphics;
  private readonly MM_W = 140;
  private readonly MM_H = 110;

  constructor() { super({ key: 'GameScene' }); }

  init(): void {
    this.bridge     = (window as any).__phaserBridge as PhaserBridge;
    this.movingCars = [];
    this.paused     = true;
    this.over       = false;
    this.timeLeft   = GAME_TIME;
    this.elapsed    = 0;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this.buildCity();
    this.spawnCars();
    this.spawnItems();

    const kb = this.input.keyboard!;
    const p1Name = this.bridge?.getState()?.localPlayer?.username ?? 'Jugador 1';
    const p2Name = (window as any).__p2State?.username ?? 'Jugador 2';

    this.p1 = this.makePlayer(WORLD_W/2 - 60, WORLD_H - 200, 'char_runner',   0xFF6B35, p1Name,
      kb.addKey('W'), kb.addKey('S'), kb.addKey('A'), kb.addKey('D'));
    this.p2 = this.makePlayer(WORLD_W/2 + 60, WORLD_H - 200, 'char_survivor', 0x4ECDC4, p2Name,
      kb.addKey('UP'), kb.addKey('DOWN'), kb.addKey('LEFT'), kb.addKey('RIGHT'));

    this.physics.add.collider(this.p1.sprite, this.buildings);
    this.physics.add.collider(this.p2.sprite, this.buildings);
    this.physics.add.collider(this.p1.sprite, this.p2.sprite);
    this.physics.add.overlap(this.p1.sprite, this.carsGroup, () => this.carHit(this.p1));
    this.physics.add.overlap(this.p2.sprite, this.carsGroup, () => this.carHit(this.p2));
    this.physics.add.overlap(this.p1.sprite, this.items, (_p, it) => this.pickItem(this.p1, it as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.p2.sprite, this.items, (_p, it) => this.pickItem(this.p2, it as Phaser.Physics.Arcade.Sprite));

    // Camara unica centrada entre los dos jugadores
    this.cam1 = this.cameras.main;
    this.cam1.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cam1.setViewport(0, 0, W, H);

    // HUD fijo en pantalla
    const p1NameHud = this.bridge?.getState()?.localPlayer?.username ?? 'J1';
    const p2NameHud = (window as any).__p2State?.username ?? 'J2';
    this.add.text(12, 8, `${p1NameHud}  (WASD)`, { fontSize: '14px', color: '#FF6B35', stroke: '#000', strokeThickness: 3, fontStyle: 'bold' })
      .setScrollFactor(0).setDepth(200);
    this.add.text(W - 12, 8, `${p2NameHud}  (Flechas)`, { fontSize: '14px', color: '#4ECDC4', stroke: '#000', strokeThickness: 3, fontStyle: 'bold' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(200);

    // Timer grande en el centro
    this.timerTxt = this.add.text(W / 2, 10, this.formatTime(GAME_TIME), {
      fontSize: '28px', color: '#FFD700', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);

    this.buildMinimaps(W, H);
    this.countdown(W, H);
  }

  override update(_t: number, dt: number): void {
    if (this.over) return;

    const anyMoving =
      (this.p1.sprite.body as Phaser.Physics.Arcade.Body).speed > 0 ||
      (this.p2.sprite.body as Phaser.Physics.Arcade.Body).speed > 0;

    if (anyMoving) this.tickCars(); else this.stopCars();

    if (this.paused) return;

    // Countdown del tiempo de juego
    this.elapsed += dt;
    if (this.elapsed >= 1000) {
      this.elapsed -= 1000;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.timerTxt.setText(this.formatTime(this.timeLeft));
      if (this.timeLeft <= 10) {
        this.timerTxt.setStyle({ fontSize: '28px', color: '#FF1744', stroke: '#000', strokeThickness: 5, fontStyle: 'bold' });
        this.tweens.add({ targets: this.timerTxt, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
      }
      if (this.timeLeft <= 0) {
        this.timeUp();
        return;
      }
    }

    this.movePlayer(this.p1);
    this.movePlayer(this.p2);
    this.updateLabels(this.p1);
    this.updateLabels(this.p2);

    const W = this.scale.width;
    const H = this.scale.height;
    const midX = (this.p1.sprite.x + this.p2.sprite.x) / 2;
    const midY = (this.p1.sprite.y + this.p2.sprite.y) / 2;
    const camX = Phaser.Math.Clamp(midX - W/2, 0, WORLD_W - W);
    const camY = Phaser.Math.Clamp(midY - H/2, 0, WORLD_H - H);
    this.cam1.scrollX += (camX - this.cam1.scrollX) * 0.08;
    this.cam1.scrollY += (camY - this.cam1.scrollY) * 0.08;

    this.updateMinimaps(W, H);

    // Sincronizar con Angular
    if (this.bridge) {
      this.bridge.updateLocal({
        vitality: this.p1.vitality, score: this.p1.score,
        position: { x: this.p1.sprite.x, y: this.p1.sprite.y },
        isMoving: (this.p1.sprite.body as Phaser.Physics.Arcade.Body).speed > 0,
        isInSmog: false, isInGreen: false
      });
    }
    // Exponer datos de J2 para el HUD — preservar el nombre real
    const prevP2 = (window as any).__p2State;
    (window as any).__p2State = {
      vitality: this.p2.vitality,
      score:    this.p2.score,
      username: prevP2?.username ?? 'Jugador 2'
    };
  }

  // Tiempo agotado — gana quien tenga mas puntos
  private timeUp(): void {
    if (this.over) return;
    this.over   = true;
    this.paused = true;

    const j1Name = this.bridge?.getState()?.localPlayer?.username ?? 'Jugador 1';
    const j2Name = (window as any).__p2State?.username ?? 'Jugador 2';

    let msg: string;
    if (this.p1.score > this.p2.score) {
      msg = `${j1Name} gana!`;
      this.p1.won = true;
    } else if (this.p2.score > this.p1.score) {
      msg = `${j2Name} gana!`;
      this.p2.won = true;
    } else {
      msg = 'Empate!';
    }
    this.showResult(msg);
    if (this.bridge) this.bridge.endGame();
  }

  private formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private buildCity(): void {
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'road').setOrigin(0).setDepth(0);
    this.buildings = this.physics.add.staticGroup();
    const cols = Math.floor(WORLD_W / BLOCK_W);
    const rows = Math.floor(WORLD_H / BLOCK_H);
    const bldKeys = ['bld_a','bld_b','bld_c','bld_d'];
    const bldW    = [96, 80, 112, 72];
    const bldH    = [5*28+20, 4*28+20, 6*28+20, 3*28+20];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = c * BLOCK_W, by = r * BLOCK_H;
        this.add.tileSprite(bx+30, by+30, BLOCK_W-60, BLOCK_H-60, 'sidewalk').setOrigin(0).setDepth(1);
        const idx = (r*cols+c) % 4;
        const bld = this.physics.add.staticSprite(bx+BLOCK_W/2, by+BLOCK_H/2, bldKeys[idx]).setDepth(2);
        bld.setDisplaySize(bldW[idx], bldH[idx]);
        (bld.body as Phaser.Physics.Arcade.StaticBody).setSize(bldW[idx]-4, bldH[idx]-4);
        this.buildings.add(bld);
        if ((r+c) % 4 === 0) this.add.image(bx+BLOCK_W-20, by+20, 'tl_red').setDepth(5).setScale(1.1);
      }
    }
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(2, 0xFFDD00, 0.5);
    for (let x = BLOCK_W; x < WORLD_W; x += BLOCK_W) g.lineBetween(x, 0, x, WORLD_H);
    for (let y = BLOCK_H; y < WORLD_H; y += BLOCK_H) g.lineBetween(0, y, WORLD_W, y);
    g.fillStyle(0xFFFFFF, 0.5);
    for (let x = BLOCK_W-50; x < WORLD_W; x += BLOCK_W)
      for (let y = BLOCK_H-50; y < WORLD_H; y += BLOCK_H)
        for (let s = 0; s < 5; s++) g.fillRect(x, y+s*16, 100, 8);
  }

  private spawnCars(): void {
    this.carsGroup = this.physics.add.group();
    const carKeys = ['car_red','car_blue','car_yellow','car_white','car_green','car_black'];
    const cols = Math.floor(WORLD_W / BLOCK_W);
    const rows = Math.floor(WORLD_H / BLOCK_H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spd = (90 + Math.random()*80) * (Math.random()>0.5?1:-1);
        const car = this.carsGroup.create(c*BLOCK_W+BLOCK_W/2, r*BLOCK_H+BLOCK_H-18,
          carKeys[Math.floor(Math.random()*carKeys.length)]) as Phaser.Physics.Arcade.Sprite;
        car.setDepth(3).setScale(0.85);
        (car.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
        car.setVelocityX(spd);
        this.movingCars.push({ sprite: car, axis: 'h', min: c*BLOCK_W+10, max: (c+1)*BLOCK_W-10, spd });
        if (c % 3 === 0) {
          const spd2 = (90+Math.random()*80)*(Math.random()>0.5?1:-1);
          const car2 = this.carsGroup.create(c*BLOCK_W+BLOCK_W-18, r*BLOCK_H+BLOCK_H/2,
            carKeys[Math.floor(Math.random()*carKeys.length)]) as Phaser.Physics.Arcade.Sprite;
          car2.setDepth(3).setScale(0.85).setAngle(90);
          (car2.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
          car2.setVelocityY(spd2);
          this.movingCars.push({ sprite: car2, axis: 'v', min: r*BLOCK_H+10, max: (r+1)*BLOCK_H-10, spd: spd2 });
        }
      }
    }
  }

  private tickCars(): void {
    for (const mc of this.movingCars) {
      if (!mc.sprite.active) continue;
      const pos = mc.axis === 'h' ? mc.sprite.x : mc.sprite.y;
      if (pos < mc.min || pos > mc.max) {
        mc.spd *= -1;
        if (mc.axis === 'h') { mc.sprite.setVelocityX(mc.spd); mc.sprite.setFlipX(mc.spd < 0); }
        else                 { mc.sprite.setVelocityY(mc.spd); mc.sprite.setFlipY(mc.spd < 0); }
      }
    }
  }

  private stopCars(): void {
    for (const mc of this.movingCars) {
      if (mc.sprite.active) mc.sprite.setVelocity(0, 0);
    }
  }

  private spawnItems(): void {
    this.items = this.physics.add.staticGroup();
    const fruits = ['fruit_apple','fruit_orange','fruit_berry','fruit_melon'];
    const traps  = ['trap_mushroom','trap_flower','trap_cactus'];
    for (let i = 0; i < 100; i++) {
      const x = 60 + Math.random()*(WORLD_W-120);
      const y = 60 + Math.random()*(WORLD_H-120);
      const isTrap = Math.random() < 0.3;
      const key = isTrap ? traps[Math.floor(Math.random()*traps.length)] : fruits[Math.floor(Math.random()*fruits.length)];
      const s = this.items.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
      s.setDepth(4).setData('trap', isTrap).setData('val', isTrap ? -(15+Math.floor(Math.random()*15)) : 10+Math.floor(Math.random()*20));
      this.tweens.add({ targets: s, y: s.y-7, duration: 900+Math.random()*400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private makePlayer(x: number, y: number, key: string, color: number, label: string,
    up: Phaser.Input.Keyboard.Key, down: Phaser.Input.Keyboard.Key,
    left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key): Player {
    const sprite = this.physics.add.sprite(x, y, key, 0).setDepth(6).setScale(1.3);
    (sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true).setSize(24, 28).setOffset(12, 32);
    if (!this.anims.exists(key+'_down')) {
      this.anims.create({ key: key+'_down',  frames: this.anims.generateFrameNumbers(key, { frames:[0,1] }), frameRate:7, repeat:-1 });
      this.anims.create({ key: key+'_up',    frames: this.anims.generateFrameNumbers(key, { frames:[2,3] }), frameRate:7, repeat:-1 });
      this.anims.create({ key: key+'_left',  frames: this.anims.generateFrameNumbers(key, { frames:[4,5] }), frameRate:7, repeat:-1 });
      this.anims.create({ key: key+'_right', frames: this.anims.generateFrameNumbers(key, { frames:[6,7] }), frameRate:7, repeat:-1 });
      this.anims.create({ key: key+'_idle',  frames: this.anims.generateFrameNumbers(key, { frames:[0]   }), frameRate:1, repeat:-1 });
    }
    sprite.play(key+'_down');
    const nameTag = this.add.text(x, y-50, label, { fontSize:'13px', color:'#fff', stroke:'#000', strokeThickness:3, fontStyle:'bold' }).setOrigin(0.5).setDepth(10);
    const vBg  = this.add.rectangle(x, y-38, 44, 8, 0x111111, 0.9).setDepth(10);
    const vBar = this.add.rectangle(x-22, y-38, 44, 8, color).setOrigin(0, 0.5).setDepth(11);
    return { sprite, nameTag, vBg, vBar, vitality:100, score:0, won:false, dead:false, up, down, left, right, lastDir:'down' };
  }

  private movePlayer(p: Player): void {
    if (p.dead || p.won) { (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0,0); return; }
    let vx = 0, vy = 0;
    if (p.left.isDown)  vx = -P_SPEED;
    if (p.right.isDown) vx =  P_SPEED;
    if (p.up.isDown)    vy = -P_SPEED;
    if (p.down.isDown)  vy =  P_SPEED;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    // Velocidad proporcional a la vitalidad: 100% vit = velocidad completa, 1% vit = 30%
    const speedMult = 0.30 + (p.vitality / 100) * 0.70;
    vx *= speedMult;
    vy *= speedMult;

    (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    const k = p.sprite.texture.key;
    if      (vx < 0) { p.sprite.play(k+'_left',  true); p.lastDir='left';  }
    else if (vx > 0) { p.sprite.play(k+'_right', true); p.lastDir='right'; }
    else if (vy < 0) { p.sprite.play(k+'_up',    true); p.lastDir='up';    }
    else if (vy > 0) { p.sprite.play(k+'_down',  true); p.lastDir='down';  }
    else             { p.sprite.play(k+'_idle',   true); }

    // Animacion mas lenta cuando tiene poca vitalidad
    const frameRate = Math.max(2, Math.round(7 * speedMult));
    p.sprite.anims.currentAnim && (p.sprite.anims.msPerFrame = 1000 / frameRate);

    // Desgaste por inactividad
    if (vx === 0 && vy === 0) p.vitality = Math.max(1, p.vitality - 0.02);
  }

  private updateLabels(p: Player): void {
    const sx = p.sprite.x, sy = p.sprite.y;
    p.nameTag.setPosition(sx, sy-50);
    p.vBg.setPosition(sx, sy-38);
    p.vBar.setPosition(sx-22, sy-38);
    const pct = p.vitality/100;
    p.vBar.width = 44*pct;
    p.vBar.setFillStyle(pct>0.6?0x4CAF50:pct>0.3?0xFF9800:0xF44336);
  }

  private carHit(p: Player): void {
    if (p.dead||p.won) return;
    p.vitality = Math.max(1, p.vitality-20);
    this.cam1.flash(300,255,0,0); this.cam1.shake(200,0.012);
    this.floatText(p.sprite.x, p.sprite.y, '-20 VIT', '#FF1744');
  }

  private pickItem(p: Player, item: Phaser.Physics.Arcade.Sprite): void {
    if (!item.active) return;
    const isTrap = item.getData('trap') as boolean;
    const val    = item.getData('val')  as number;
    item.destroy();
    if (isTrap) {
      p.vitality = Math.max(1, p.vitality+val);
      this.cam1.flash(200,255,50,0);
      this.floatText(p.sprite.x, p.sprite.y, `${val} VIT`, '#FF6D00');
    } else {
      p.vitality = Math.min(100, p.vitality+val);
      p.score   += 10;
      this.floatText(p.sprite.x, p.sprite.y, `+${val} VIT  +10pts`, '#00E676');
    }
  }

  private buildMinimaps(W: number, H: number): void {
    const pad=8, mw=this.MM_W, mh=this.MM_H;
    this.add.rectangle(pad+mw/2, H-pad-mh/2, mw+4, mh+4, 0x000000, 0.7).setScrollFactor(0).setDepth(190);
    this.add.text(pad+4, H-pad-mh-14, 'J1', { fontSize:'11px', color:'#FF6B35', stroke:'#000', strokeThickness:2 }).setScrollFactor(0).setDepth(191);
    this.add.rectangle(W-pad-mw/2, H-pad-mh/2, mw+4, mh+4, 0x000000, 0.7).setScrollFactor(0).setDepth(190);
    this.add.text(W-pad-mw+4, H-pad-mh-14, 'J2', { fontSize:'11px', color:'#4ECDC4', stroke:'#000', strokeThickness:2 }).setScrollFactor(0).setDepth(191);
    this.mm1 = this.add.graphics().setScrollFactor(0).setDepth(192);
    this.mm2 = this.add.graphics().setScrollFactor(0).setDepth(192);
  }

  private updateMinimaps(W: number, H: number): void {
    const pad=8, mw=this.MM_W, mh=this.MM_H;
    const sx=mw/WORLD_W, sy=mh/WORLD_H;
    const origins = [ [pad, H-pad-mh, this.p1, 0xFF6B35, this.mm1], [W-pad-mw, H-pad-mh, this.p2, 0x4ECDC4, this.mm2] ] as const;
    for (const [ox, oy, p, color, mm] of origins) {
      mm.clear();
      mm.fillStyle(0x3A3A3A, 0.9); mm.fillRect(ox, oy, mw, mh);
      const other = p===this.p1?this.p2:this.p1;
      const oc    = p===this.p1?0x4ECDC4:0xFF6B35;
      mm.fillStyle(oc, 0.8); mm.fillCircle(ox+other.sprite.x*sx, oy+other.sprite.y*sy, 3);
      mm.fillStyle(0xFFFFFF,1); mm.fillCircle(ox+p.sprite.x*sx, oy+p.sprite.y*sy, 5);
      mm.fillStyle(color,1);   mm.fillCircle(ox+p.sprite.x*sx, oy+p.sprite.y*sy, 4);
      mm.lineStyle(1.5, color, 0.8); mm.strokeRect(ox, oy, mw, mh);
    }
  }

  private floatText(x: number, y: number, msg: string, color: string): void {
    const t = this.add.text(x, y-20, msg, { fontSize:'16px', color, stroke:'#000', strokeThickness:3, fontStyle:'bold' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets:t, y:y-65, alpha:0, duration:900, ease:'Power2', onComplete:()=>t.destroy() });
  }

  private countdown(W: number, H: number): void {
    this.paused = true;
    const ov  = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(150);
    const txt = this.add.text(W/2, H/2, '3', { fontSize:'130px', color:'#FFD700', stroke:'#000', strokeThickness:8, fontStyle:'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    this.time.delayedCall(1000, ()=>{ txt.setText('2'); this.tweens.add({ targets:txt, scaleX:1.3, scaleY:1.3, duration:100, yoyo:true }); });
    this.time.delayedCall(2000, ()=>{ txt.setText('1'); this.tweens.add({ targets:txt, scaleX:1.3, scaleY:1.3, duration:100, yoyo:true }); });
    this.time.delayedCall(3000, ()=>{
      txt.setText('CORRE!');
      txt.setStyle({ fontSize:'100px', color:'#FF6B35', stroke:'#000', strokeThickness:8, fontStyle:'bold' });
      this.tweens.add({ targets:[txt,ov], alpha:0, duration:600, onComplete:()=>{ txt.destroy(); ov.destroy(); this.paused=false; } });
    });
  }

  private showResult(msg: string): void {
    const W = this.scale.width, H = this.scale.height;

    // Fondo oscuro
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.82).setScrollFactor(0).setDepth(300);

    // Trofeo para el ganador (emoji grande)
    const trophy = this.p1.won ? '🏆' : this.p2.won ? '🏆' : '🤝';
    this.add.text(W/2, H/2 - 160, trophy, { fontSize: '80px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Animacion del trofeo
    const trophyTxt = this.children.getByName('trophy') as Phaser.GameObjects.Text;
    this.tweens.add({
      targets: this.add.text(W/2, H/2 - 160, trophy, { fontSize: '80px' }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setName('trophy2'),
      scaleX: 1.15, scaleY: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Titulo
    this.add.text(W/2, H/2 - 80, msg, {
      fontSize: '46px', color: '#FFD700', stroke: '#000', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Separador
    const sep = this.add.graphics().setScrollFactor(0).setDepth(301);
    sep.lineStyle(2, 0xFFD700, 0.5);
    sep.lineBetween(W/2 - 200, H/2 - 40, W/2 + 200, H/2 - 40);

    // Resultado J1
    const j1Name = this.bridge?.getState()?.localPlayer?.username ?? 'Jugador 1';
    const j2Name = (window as any).__p2State?.username ?? 'Jugador 2';
    const j1Winner = this.p1.won;
    this.add.text(W/2 - 120, H/2 - 15,
      `${j1Winner ? '🏆 ' : ''}${j1Name}`, {
      fontSize: '20px', color: '#FF6B35', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(W/2 - 120, H/2 + 20,
      `${this.p1.score} pts  |  ${Math.round(this.p1.vitality)}% vit`, {
      fontSize: '17px', color: '#FF6B35', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Separador vertical
    sep.lineBetween(W/2, H/2 - 35, W/2, H/2 + 45);

    // Resultado J2
    const j2Winner = this.p2.won;
    this.add.text(W/2 + 120, H/2 - 15,
      `${j2Winner ? '🏆 ' : ''}${j2Name}`, {
      fontSize: '20px', color: '#4ECDC4', stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.add.text(W/2 + 120, H/2 + 20,
      `${this.p2.score} pts  |  ${Math.round(this.p2.vitality)}% vit`, {
      fontSize: '17px', color: '#4ECDC4', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Boton jugar de nuevo
    const btn = this.add.text(W/2, H/2 + 90, '[ Jugar de nuevo ]', {
      fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#FFD700'));
    btn.on('pointerout',   () => btn.setColor('#ffffff'));
    btn.on('pointerdown',  () => {
      (window as any).__p2State = null;
      this.cameras.resetAll();
      this.scene.restart();
    });
  }
}
