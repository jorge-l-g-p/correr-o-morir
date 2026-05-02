import Phaser from 'phaser';

/**
 * PreloadScene — crea todas las texturas usando Canvas API nativo
 * antes de pasarlas a Phaser via textures.addCanvas().
 * Esto evita los problemas de RenderTexture en Phaser 4.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create(): void {
    this.makeRoad();
    this.makeSidewalk();
    this.makeBuilding('bld_a', '#2C3E6B', '#85C1E9', 5, 96);
    this.makeBuilding('bld_b', '#4A2C2C', '#F1948A', 4, 80);
    this.makeBuilding('bld_c', '#1E4D2B', '#82E0AA', 6, 112);
    this.makeBuilding('bld_d', '#4A3728', '#F0B27A', 3, 72);
    this.makeCar('car_red',    '#E74C3C');
    this.makeCar('car_blue',   '#2980B9');
    this.makeCar('car_yellow', '#F39C12');
    this.makeCar('car_white',  '#ECF0F1');
    this.makeCar('car_green',  '#27AE60');
    this.makeCar('car_black',  '#2C3E50');
    this.makePlayerSheet('char_runner',   '#FF6B35', '#8B4513', '#FF8C00', '#2C3E50');
    this.makePlayerSheet('char_survivor', '#4ECDC4', '#2C3E50', '#1ABC9C', '#34495E');
    this.makeFruit('fruit_apple',  '#FF3333', '#CC0000');
    this.makeFruit('fruit_orange', '#FF8C00', '#CC6600');
    this.makeFruit('fruit_berry',  '#9B59B6', '#6C3483');
    this.makeFruit('fruit_melon',  '#27AE60', '#1E8449');
    this.makeTrap('trap_mushroom', '#00FF41');
    this.makeTrap('trap_flower',   '#FF00FF');
    this.makeTrap('trap_cactus',   '#FFFF00');
    this.makeTrafficLight();
    this.makeGoal();
    this.scene.start('GameScene');
  }

  private canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return [c, c.getContext('2d')!];
  }

  private add2phaser(key: string, c: HTMLCanvasElement): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, c);
  }

  private makeRoad(): void {
    const [c, ctx] = this.canvas(128, 128);
    ctx.fillStyle = '#3A3A3A'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#555'; 
    for (let i = 0; i < 30; i++) ctx.fillRect(Math.random()*128, Math.random()*128, 3, 3);
    ctx.fillStyle = '#FFDD00';
    ctx.fillRect(62, 0, 4, 50); ctx.fillRect(62, 78, 4, 50);
    this.add2phaser('road', c);
  }

  private makeSidewalk(): void {
    const [c, ctx] = this.canvas(64, 64);
    ctx.fillStyle = '#C8C8C8'; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, 28, 28); ctx.strokeRect(34, 2, 28, 28);
    ctx.strokeRect(2, 34, 28, 28); ctx.strokeRect(34, 34, 28, 28);
    this.add2phaser('sidewalk', c);
  }

  private makeBuilding(key: string, wall: string, win: string, floors: number, w: number): void {
    const h = floors * 28 + 20;
    const [c, ctx] = this.canvas(w, h);
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, w, 8);
    const cols = Math.floor(w / 26);
    for (let f = 0; f < floors; f++) {
      for (let col = 0; col < cols; col++) {
        const lit = Math.random() > 0.3;
        ctx.fillStyle = lit ? win : '#111122';
        ctx.fillRect(6 + col * 26, 12 + f * 28, 16, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
        ctx.strokeRect(6 + col * 26, 12 + f * 28, 16, 14);
        if (lit) {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath(); ctx.moveTo(6+col*26+8, 12+f*28); ctx.lineTo(6+col*26+8, 12+f*28+14); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(6+col*26, 12+f*28+7); ctx.lineTo(6+col*26+16, 12+f*28+7); ctx.stroke();
        }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, w, h);
    this.add2phaser(key, c);
  }

  private makeCar(key: string, color: string): void {
    const [c, ctx] = this.canvas(32, 56);
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(17, 52, 13, 4, 0, 0, Math.PI*2); ctx.fill();
    // Carroceria
    ctx.fillStyle = color;
    this.roundRect(ctx, 3, 4, 26, 48, 5);
    // Techo
    ctx.fillStyle = this.darken(color, 30);
    this.roundRect(ctx, 6, 12, 20, 28, 4);
    // Parabrisas
    ctx.fillStyle = 'rgba(173,216,230,0.85)';
    this.roundRect(ctx, 7, 14, 18, 11, 2);
    ctx.fillStyle = 'rgba(173,216,230,0.65)';
    this.roundRect(ctx, 7, 29, 18, 9, 2);
    // Ruedas
    ctx.fillStyle = '#1A1A1A';
    this.roundRect(ctx, 0, 7, 6, 12, 2);
    this.roundRect(ctx, 26, 7, 6, 12, 2);
    this.roundRect(ctx, 0, 37, 6, 12, 2);
    this.roundRect(ctx, 26, 37, 6, 12, 2);
    // Faros
    ctx.fillStyle = '#FFFDE7'; ctx.fillRect(5, 4, 7, 4); ctx.fillRect(20, 4, 7, 4);
    ctx.fillStyle = '#FF1744'; ctx.fillRect(5, 48, 7, 4); ctx.fillRect(20, 48, 7, 4);
    this.add2phaser(key, c);
  }

  private makePlayerSheet(key: string, rim: string, hair: string, shirt: string, pants: string): void {
    const FW = 48, FH = 64;
    const [c, ctx] = this.canvas(FW * 8, FH);
    const dirs: Array<'down'|'up'|'left'|'right'> = ['down','down','up','up','left','left','right','right'];
    const steps = [0,1,0,1,0,1,0,1];
    for (let f = 0; f < 8; f++) {
      this.drawPlayerFrame(ctx, f * FW, 0, FW, FH, dirs[f], steps[f], rim, hair, shirt, pants);
    }
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addSpriteSheet(key, c as any, { frameWidth: FW, frameHeight: FH });
  }

  private drawPlayerFrame(
    ctx: CanvasRenderingContext2D,
    ox: number, oy: number, FW: number, FH: number,
    dir: 'down'|'up'|'left'|'right', step: number,
    rim: string, hair: string, shirt: string, pants: string
  ): void {
    const cx = ox + FW / 2;
    const skin = '#FFDBA C'.replace(' ','');
    const legA = step === 0 ? -4 : 4;
    const legB = step === 0 ?  4 : -4;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(cx+2, oy+FH-5, 14, 5, 0, 0, Math.PI*2); ctx.fill();

    // Piernas
    ctx.fillStyle = pants;
    if (dir === 'left' || dir === 'right') {
      this.roundRect(ctx, cx-6, oy+FH-26+legA, 10, 18, 3);
      this.roundRect(ctx, cx-2, oy+FH-26+legB, 10, 18, 3);
    } else {
      this.roundRect(ctx, cx-12, oy+FH-26+legA, 10, 18, 3);
      this.roundRect(ctx, cx+2,  oy+FH-26+legB, 10, 18, 3);
    }

    // Zapatos
    ctx.fillStyle = '#1A1A1A';
    if (dir === 'left' || dir === 'right') {
      const sd = dir === 'right' ? 4 : -4;
      this.roundRect(ctx, cx-6+sd, oy+FH-10+legA, 12, 7, 2);
      this.roundRect(ctx, cx-2+sd, oy+FH-10+legB, 12, 7, 2);
    } else {
      this.roundRect(ctx, cx-14, oy+FH-10+legA, 12, 7, 2);
      this.roundRect(ctx, cx+2,  oy+FH-10+legB, 12, 7, 2);
    }

    // Cuerpo
    ctx.fillStyle = shirt;
    this.roundRect(ctx, cx-14, oy+FH-46, 28, 22, 5);

    // Brazos
    const armSwing = step === 0 ? -3 : 3;
    if (dir === 'left' || dir === 'right') {
      const ax = dir === 'right' ? cx+10 : cx-18;
      this.roundRect(ctx, ax, oy+FH-44, 8, 14, 3);
    } else {
      this.roundRect(ctx, cx-22, oy+FH-44+armSwing, 8, 14, 3);
      this.roundRect(ctx, cx+14, oy+FH-44-armSwing, 8, 14, 3);
    }

    // Manos
    ctx.fillStyle = '#FFDBAC';
    if (dir === 'left' || dir === 'right') {
      ctx.beginPath(); ctx.arc(dir==='right'?cx+14:cx-14, oy+FH-31, 4, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx-18, oy+FH-31+armSwing, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+18, oy+FH-31-armSwing, 4, 0, Math.PI*2); ctx.fill();
    }

    // Cuello
    ctx.fillStyle = '#FFDBAC'; ctx.fillRect(cx-5, oy+FH-52, 10, 8);

    // Cabeza
    ctx.fillStyle = '#FFDBAC';
    this.roundRect(ctx, cx-13, oy+FH-68, 26, 22, 7);

    // Pelo
    ctx.fillStyle = hair;
    this.roundRectTop(ctx, cx-13, oy+FH-68, 26, 11, 7);
    ctx.fillRect(cx-13, oy+FH-58, 4, 6);
    ctx.fillRect(cx+9,  oy+FH-58, 4, 6);

    // Cara
    if (dir === 'down') {
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath(); ctx.arc(cx-4, oy+FH-57, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+4, oy+FH-57, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx-3, oy+FH-58, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+5, oy+FH-58, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, oy+FH-48, 4, 0.2, Math.PI-0.2); ctx.stroke();
    } else if (dir === 'left' || dir === 'right') {
      const ex = dir === 'right' ? cx+6 : cx-6;
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath(); ctx.arc(ex, oy+FH-57, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex+1, oy+FH-58, 1, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = '#FFDBAC';
      ctx.beginPath(); ctx.arc(cx-13, oy+FH-57, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+13, oy+FH-57, 4, 0, Math.PI*2); ctx.fill();
    }

    // Aro identificador
    ctx.strokeStyle = rim; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, oy+FH-57, 15, 0, Math.PI*2); ctx.stroke();
  }

  private makeFruit(key: string, color: string, dark: string): void {
    const [c, ctx] = this.canvas(30, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(16, 27, 9, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(15, 14, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = dark + '60';
    ctx.beginPath(); ctx.arc(18, 16, 9, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(10, 9, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(15,2); ctx.lineTo(17,6); ctx.stroke();
    ctx.fillStyle = '#27AE60';
    ctx.beginPath(); ctx.ellipse(18, 4, 4.5, 3, 0, 0, Math.PI*2); ctx.fill();
    this.add2phaser(key, c);
  }

  private makeTrap(key: string, color: string): void {
    const [c, ctx] = this.canvas(32, 32);
    ctx.fillStyle = color + '33';
    ctx.beginPath(); ctx.arc(16, 16, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = this.darken(color, 30);
    ctx.beginPath(); ctx.moveTo(16,2); ctx.lineTo(30,29); ctx.lineTo(2,29); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(16,6); ctx.lineTo(27,27); ctx.lineTo(5,27); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(15, 11, 2, 9); ctx.fillRect(15, 22, 2, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(16,2); ctx.lineTo(30,29); ctx.lineTo(2,29); ctx.closePath(); ctx.stroke();
    this.add2phaser(key, c);
  }

  private makeTrafficLight(): void {
    for (const d of [{key:'tl_red',red:true},{key:'tl_green',red:false}]) {
      const [c, ctx] = this.canvas(20, 48);
      ctx.fillStyle = '#555'; ctx.fillRect(8, 0, 4, 48);
      ctx.fillStyle = '#222';
      this.roundRect(ctx, 1, 4, 18, 36, 3);
      ctx.fillStyle = d.red ? '#FF1744' : '#330000';
      ctx.beginPath(); ctx.arc(10, 14, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = !d.red ? '#00E676' : '#003300';
      ctx.beginPath(); ctx.arc(10, 30, 6, 0, Math.PI*2); ctx.fill();
      this.add2phaser(d.key, c);
    }
  }

  private makeGoal(): void {
    const [c, ctx] = this.canvas(160, 100);
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 11; col++) {
        ctx.fillStyle = (r + col) % 2 === 0 ? '#000' : '#fff';
        ctx.fillRect(col * 15, r * 20, 15, 20);
      }
    }
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, 156, 96);
    this.add2phaser('goal', c);
  }

  // Helpers Canvas
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  private roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  private darken(hex: string, pct: number): string {
    const n = parseInt(hex.replace('#',''), 16);
    const r = Math.max(0, ((n>>16)&0xff) - pct*2);
    const g = Math.max(0, ((n>>8)&0xff)  - pct*2);
    const b = Math.max(0, (n&0xff)        - pct*2);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  }
}
