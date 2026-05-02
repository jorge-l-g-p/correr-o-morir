/**
 * PlayerEntity — sprite del jugador en Phaser.
 * Gestiona movimiento, animaciones y estado visual.
 * El GameStateService es la fuente de verdad; esta clase solo renderiza.
 */
import Phaser from 'phaser';
import { IPlayerControls } from '../../../../core/interfaces/player.interface';

/** Velocidad base de movimiento en px/s */
const BASE_SPEED = 200;

export class PlayerEntity extends Phaser.Physics.Arcade.Sprite {

  readonly socketId:   string;
  readonly controls:   IPlayerControls | null; // null = jugador remoto (sin controles locales)
  readonly speedMult:  number;

  private cursors!:    Phaser.Types.Input.Keyboard.CursorKeys | null;
  private wasd!:       Record<string, Phaser.Input.Keyboard.Key> | null;
  private nameLabel!:  Phaser.GameObjects.Text;
  private vitalityBar!: Phaser.GameObjects.Rectangle;
  private vitalityBg!:  Phaser.GameObjects.Rectangle;

  isMoving = false;

  constructor(
    scene:     Phaser.Scene,
    x:         number,
    y:         number,
    spriteKey: string,
    socketId:  string,
    username:  string,
    controls:  IPlayerControls | null,
    speedMult: number = 1
  ) {
    super(scene, x, y, spriteKey);
    this.socketId  = socketId;
    this.controls  = controls;
    this.speedMult = speedMult;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(28, 44);

    this.setupControls(scene);
    this.createUI(scene, username);
  }

  // ─── Controles ────────────────────────────────────────────────────────────

  private setupControls(scene: Phaser.Scene): void {
    if (!this.controls || !scene.input.keyboard) {
      this.cursors = null;
      this.wasd    = null;
      return;
    }

    const kb = scene.input.keyboard;
    const c  = this.controls;

    if (c.up === 'ArrowUp') {
      this.cursors = kb.createCursorKeys();
      this.wasd    = null;
    } else {
      this.cursors = null;
      this.wasd = {
        up:    kb.addKey(c.up),
        down:  kb.addKey(c.down),
        left:  kb.addKey(c.left),
        right: kb.addKey(c.right)
      };
    }
  }

  // ─── UI sobre el sprite ───────────────────────────────────────────────────

  private createUI(scene: Phaser.Scene, username: string): void {
    this.nameLabel = scene.add.text(0, 0, username, {
      fontSize: '11px',
      color:    '#ffffff',
      stroke:   '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 1);

    // Barra de vitalidad mini
    this.vitalityBg  = scene.add.rectangle(0, 0, 32, 4, 0x333333).setOrigin(0.5);
    this.vitalityBar = scene.add.rectangle(0, 0, 32, 4, 0x4caf50).setOrigin(0, 0.5);
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  override update(): void {
    this.handleMovement();
    this.updateUI();
  }

  private handleMovement(): void {
    if (!this.controls) return; // jugador remoto, no procesar input

    const body  = this.body as Phaser.Physics.Arcade.Body;
    const speed = BASE_SPEED * this.speedMult;
    let vx = 0, vy = 0;

    const up    = this.wasd ? this.wasd['up'].isDown    : this.cursors?.up.isDown;
    const down  = this.wasd ? this.wasd['down'].isDown  : this.cursors?.down.isDown;
    const left  = this.wasd ? this.wasd['left'].isDown  : this.cursors?.left.isDown;
    const right = this.wasd ? this.wasd['right'].isDown : this.cursors?.right.isDown;

    if (left)  vx = -speed;
    if (right) vx =  speed;
    if (up)    vy = -speed;
    if (down)  vy =  speed;

    // Normalizar diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    body.setVelocity(vx, vy);
    this.isMoving = vx !== 0 || vy !== 0;

    // Flip horizontal según dirección
    if (vx < 0) this.setFlipX(true);
    if (vx > 0) this.setFlipX(false);
  }

  /** Actualiza posición del jugador remoto (recibida del servidor) */
  setRemotePosition(x: number, y: number): void {
    // Interpolación suave para evitar saltos bruscos
    this.scene.tweens.add({
      targets:  this,
      x, y,
      duration: 50,
      ease:     'Linear'
    });
  }

  /** Actualiza la mini barra de vitalidad sobre el sprite */
  updateVitalityBar(vitality: number): void {
    const w = Math.max(0, (vitality / 100) * 32);
    this.vitalityBar.width = w;
    const color = vitality > 60 ? 0x4caf50 : vitality > 30 ? 0xff9800 : 0xf44336;
    this.vitalityBar.setFillStyle(color);
  }

  private updateUI(): void {
    const offsetY = -this.height / 2;
    this.nameLabel.setPosition(this.x, this.y + offsetY - 14);
    this.vitalityBg.setPosition(this.x, this.y + offsetY - 6);
    this.vitalityBar.setPosition(this.x - 16, this.y + offsetY - 6);
  }

  override destroy(fromScene?: boolean): void {
    this.nameLabel?.destroy();
    this.vitalityBg?.destroy();
    this.vitalityBar?.destroy();
    super.destroy(fromScene);
  }
}
