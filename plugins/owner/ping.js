import {
    createCanvas,
    registerFont
} from 'canvas';
import {
    performance
} from "perf_hooks";
import os from "os";
import {
    execSync
} from "child_process";

const THEME = {
    bg: "#0a1628",
    bgSecondary: "#0f1f3d",
    bgTertiary: "#132744",
    card: "rgba(15, 35, 70, 0.85)",
    cardGlass: "rgba(20, 45, 90, 0.6)",
    primary: "#3b82f6",
    primaryDark: "#1d4ed8",
    primaryLight: "#60a5fa",
    secondary: "#1e40af",
    success: "#3b82f6",
    successDark: "#1d4ed8",
    warning: "#60a5fa",
    warningDark: "#3b82f6",
    danger: "#ef4444",
    dangerDark: "#dc2626",
    purple: "#6366f1",
    purpleNeon: "#818cf8",
    cyan: "#38bdf8",
    cyanDark: "#0ea5e9",
    pink: "#a5b4fc",
    pinkNeon: "#c7d2fe",
    orange: "#60a5fa",
    gold: "#93c5fd",
    textPrimary: "#ffffff",
    textSecondary: "#bfdbfe",
    textTertiary: "#93c5fd",
    textGlow: "#60a5fa",
    border: "rgba(59, 130, 246, 0.3)",
    borderGlow: "rgba(59, 130, 246, 0.6)",
    glow: "rgba(59, 130, 246, 0.4)",
    glowPurple: "rgba(99, 102, 241, 0.4)",
    glowPink: "rgba(165, 180, 252, 0.3)",
    white: "#ffffff",
    whiteGlow: "rgba(255, 255, 255, 0.3)",
    blueBright: "#2563eb",
    blueNeon: "#3b82f6",
    blueSky: "#38bdf8",
    blueIce: "#bae6fd"
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const formatTime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
};

function drawHexagon(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawCircuitPattern(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = THEME.border;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;

    const nodes = [];
    for (let i = 0; i < 25; i++) {
        nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            connections: Math.floor(Math.random() * 3) + 1
        });
    }

    nodes.forEach((node, idx) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = THEME.primary;
        ctx.fill();

        for (let i = 0; i < node.connections; i++) {
            const target = nodes[(idx + i + 1) % nodes.length];
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            
            if (Math.random() > 0.5) {
                ctx.lineTo(target.x, node.y);
                ctx.lineTo(target.x, target.y);
            } else {
                ctx.lineTo(node.x, target.y);
                ctx.lineTo(target.x, target.y);
            }
            ctx.stroke();
        }
    });

    ctx.restore();
}

function drawBackground(ctx, w, h) {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
    gradient.addColorStop(0, THEME.bgSecondary);
    gradient.addColorStop(0.5, THEME.bg);
    gradient.addColorStop(1, "#000508");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.03;
    const hexSize = 40;
    const hexHeight = hexSize * Math.sqrt(3);
    for (let row = -1; row < h / hexHeight + 1; row++) {
        for (let col = -1; col < w / (hexSize * 1.5) + 1; col++) {
            const x = col * hexSize * 1.5;
            const y = row * hexHeight + (col % 2 ? hexHeight / 2 : 0);
            ctx.strokeStyle = THEME.primary;
            drawHexagon(ctx, x, y, hexSize);
            ctx.stroke();
        }
    }
    ctx.restore();

    drawCircuitPattern(ctx, w, h);

    ctx.save();
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = Math.random() * 2 + 0.5;
        const alpha = Math.random() * 0.5 + 0.2;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i % 3 === 0 ? THEME.primary : i % 3 === 1 ? THEME.blueSky : THEME.white;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        if (size > 1.5) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) {
        const gradient2 = ctx.createRadialGradient(
            Math.random() * w, Math.random() * h, 0,
            Math.random() * w, Math.random() * h, 300
        );
        gradient2.addColorStop(0, i % 2 === 0 ? THEME.primary : THEME.blueSky);
        gradient2.addColorStop(1, "transparent");
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = THEME.border;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < w; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
    }
    for (let i = 0; i < h; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCard(ctx, x, y, w, h, radius, glowColor = THEME.primary) {
    ctx.save();
    
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = THEME.card;
    ctx.fill();
    
    ctx.shadowBlur = 0;
    const borderGradient = ctx.createLinearGradient(x, y, x + w, y + h);
    borderGradient.addColorStop(0, glowColor);
    borderGradient.addColorStop(0.5, "transparent");
    borderGradient.addColorStop(1, glowColor);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.1;
    const innerGlow = ctx.createLinearGradient(x, y, x, y + h);
    innerGlow.addColorStop(0, glowColor);
    innerGlow.addColorStop(0.3, "transparent");
    ctx.fillStyle = innerGlow;
    ctx.fill();
    
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 15);
    ctx.lineTo(x + 15, y + 5);
    ctx.lineTo(x + 25, y + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - 15, y + 15);
    ctx.lineTo(x + w - 15, y + 5);
    ctx.lineTo(x + w - 25, y + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 15, y + h - 15);
    ctx.lineTo(x + 15, y + h - 5);
    ctx.lineTo(x + 25, y + h - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - 15, y + h - 15);
    ctx.lineTo(x + w - 15, y + h - 5);
    ctx.lineTo(x + w - 25, y + h - 5);
    ctx.stroke();
    
    ctx.restore();
}

function drawIcon(ctx, x, y, type, color) {
    ctx.save();
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (type) {
        case 'cpu':
            ctx.strokeRect(x - 14, y - 14, 28, 28);
            
            const cpuGrad = ctx.createLinearGradient(x - 8, y - 8, x + 8, y + 8);
            cpuGrad.addColorStop(0, color);
            cpuGrad.addColorStop(1, THEME.blueSky);
            ctx.fillStyle = cpuGrad;
            ctx.fillRect(x - 8, y - 8, 16, 16);
            
            ctx.beginPath();
            for (let i = -1; i <= 1; i++) {
                ctx.moveTo(x - 14, y + i * 7);
                ctx.lineTo(x - 20, y + i * 7);
                ctx.moveTo(x + 14, y + i * 7);
                ctx.lineTo(x + 20, y + i * 7);
                ctx.moveTo(x + i * 7, y - 14);
                ctx.lineTo(x + i * 7, y - 20);
                ctx.moveTo(x + i * 7, y + 14);
                ctx.lineTo(x + i * 7, y + 20);
            }
            ctx.stroke();
            break;
            
        case 'memory':
            for (let i = 0; i < 4; i++) {
                const memGrad = ctx.createLinearGradient(x - 12 + i * 7, y - 14, x - 12 + i * 7, y + 14);
                memGrad.addColorStop(0, color);
                memGrad.addColorStop(0.5, THEME.white);
                memGrad.addColorStop(1, color);
                ctx.strokeStyle = memGrad;
                ctx.strokeRect(x - 12 + i * 7, y - 14, 6, 28);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x - 12 + i * 7, y + 4, 6, 10);
                ctx.globalAlpha = 1;
            }
            break;
            
        case 'disk':
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.stroke();
            
            const diskGrad = ctx.createRadialGradient(x, y, 0, x, y, 5);
            diskGrad.addColorStop(0, color);
            diskGrad.addColorStop(1, THEME.blueSky);
            ctx.fillStyle = diskGrad;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 11, -0.5, 0.8);
            ctx.stroke();
            ctx.globalAlpha = 1;
            break;
            
        case 'network':
            drawHexagon(ctx, x, y, 14);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x, y + 10);
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + 10, y);
            ctx.stroke();
            
            const dotPositions = [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0]];
            dotPositions.forEach(([dx, dy], i) => {
                ctx.beginPath();
                ctx.arc(x + dx, y + dy, i === 4 ? 3 : 2, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
            
        case 'server':
            for (let i = 0; i < 3; i++) {
                const srvGrad = ctx.createLinearGradient(x - 14, y - 12 + i * 9, x + 14, y - 12 + i * 9);
                srvGrad.addColorStop(0, color);
                srvGrad.addColorStop(1, THEME.blueSky);
                ctx.strokeStyle = srvGrad;
                ctx.strokeRect(x - 14, y - 12 + i * 9, 28, 7);
                
                ctx.fillStyle = i === 0 ? THEME.white : i === 1 ? THEME.blueSky : THEME.primary;
                ctx.beginPath();
                ctx.arc(x + 9, y - 8.5 + i * 9, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x - 10, y - 10 + i * 9, 12, 3);
                ctx.globalAlpha = 1;
            }
            break;
            
        case 'clock':
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI / 6) * i - Math.PI / 2;
                const len = i % 3 === 0 ? 4 : 2;
                ctx.beginPath();
                ctx.moveTo(x + 10 * Math.cos(angle), y + 10 * Math.sin(angle));
                ctx.lineTo(x + (10 + len) * Math.cos(angle), y + (10 + len) * Math.sin(angle));
                ctx.stroke();
            }
            
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 8);
            ctx.stroke();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = THEME.white;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 7, y + 2);
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    ctx.restore();
}

function drawLogo(ctx, x, y, size) {
    ctx.save();
    
    ctx.shadowColor = THEME.primary;
    ctx.shadowBlur = 30;
    
    const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    gradient.addColorStop(0, THEME.primary);
    gradient.addColorStop(0.3, THEME.blueSky);
    gradient.addColorStop(0.6, THEME.white);
    gradient.addColorStop(1, THEME.primary);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    drawHexagon(ctx, x, y, size);
    ctx.stroke();
    
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.lineWidth = 2;
    drawHexagon(ctx, x, y, size * 0.6);
    ctx.stroke();

    ctx.fillStyle = THEME.white;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = THEME.blueSky;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.25 * Math.cos(angle), y + size * 0.25 * Math.sin(angle));
        ctx.lineTo(x + size * 0.55 * Math.cos(angle), y + size * 0.55 * Math.sin(angle));
        ctx.stroke();
    }

    ctx.restore();
}

function drawDonutChart(ctx, x, y, radius, lineWidth, percent, color) {
    ctx.save();
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(30, 40, 60, 0.8)";
    ctx.lineWidth = lineWidth + 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = THEME.bgSecondary;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * (percent / 100));

    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    const arcGradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    arcGradient.addColorStop(0, color);
    arcGradient.addColorStop(0.5, THEME.white);
    arcGradient.addColorStop(1, color);

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.strokeStyle = arcGradient;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.shadowBlur = 0;
    
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius - lineWidth / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = THEME.textPrimary;
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(percent)}%`, x, y);
    
    ctx.shadowBlur = 0;

    const dotAngle = endAngle;
    const dotX = x + radius * Math.cos(dotAngle);
    const dotY = y + radius * Math.sin(dotAngle);
    ctx.fillStyle = THEME.textPrimary;
    ctx.beginPath();
    ctx.arc(dotX, dotY, lineWidth / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawProgressBar(ctx, x, y, w, h, percent, color, label, value) {
    ctx.save();
    
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = "rgba(20, 30, 50, 0.8)";
    ctx.fill();
    ctx.strokeStyle = THEME.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    const progressWidth = w * (percent / 100);
    if (progressWidth > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        const gradient = ctx.createLinearGradient(x, y, x + w, y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, THEME.blueSky);
        gradient.addColorStop(1, color);
        
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(progressWidth, h), h, h / 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.3;
        const shineGrad = ctx.createLinearGradient(x, y, x, y + h);
        shineGrad.addColorStop(0, "#ffffff");
        shineGrad.addColorStop(0.5, "transparent");
        ctx.fillStyle = shineGrad;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), x, y - 8);

    ctx.shadowColor = THEME.textPrimary;
    ctx.fillStyle = THEME.textPrimary;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "right";
    ctx.fillText(value, x + w, y - 8);
    
    ctx.restore();
}

function drawStatBox(ctx, x, y, w, h, label, value, color, iconType) {
    drawCard(ctx, x, y, w, h, 12, color);

    drawIcon(ctx, x + 30, y + h / 2, iconType, color);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), x + 55, y + 24);
    ctx.shadowBlur = 0;

    ctx.fillStyle = THEME.textPrimary;
    ctx.font = "bold 14px Arial";
    ctx.fillText(value, x + 55, y + 44);
    ctx.restore();
}

function drawScanLine(ctx, y, w) {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = THEME.primary;
    ctx.fillRect(0, y, w, 2);
    ctx.restore();
}

function drawGlowingText(ctx, text, x, y, color, fontSize = 32) {
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "left";
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.shadowBlur = 15;
    ctx.fillText(text, x, y);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = THEME.textPrimary;
    ctx.fillText(text, x, y);
    
    ctx.restore();
}

function drawPingIndicator(ctx, x, y, ping) {
    ctx.save();
    
    const status = ping < 100 ? THEME.success : ping < 300 ? THEME.warning : THEME.danger;
    const statusText = ping < 100 ? "EXCELLENT" : ping < 300 ? "GOOD" : "HIGH";
    
    ctx.shadowColor = status;
    ctx.shadowBlur = 25;
    
    ctx.beginPath();
    ctx.roundRect(x - 120, y - 40, 140, 70, 15);
    ctx.fillStyle = "rgba(10, 15, 25, 0.9)";
    ctx.fill();
    ctx.strokeStyle = status;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.shadowBlur = 15;
    ctx.fillStyle = status;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${ping}ms`, x, y);
    
    ctx.shadowBlur = 8;
    ctx.font = "bold 10px Arial";
    ctx.fillText(statusText, x, y + 18);
    
    for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = i < (ping < 100 ? 3 : ping < 300 ? 2 : 1) ? 1 : 0.2;
        ctx.beginPath();
        ctx.arc(x - 100 + i * 12, y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

async function renderDashboard(stats) {
    const W = 1200;
    const H = 850;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    drawBackground(ctx, W, H);

    for (let i = 0; i < H; i += 100) {
        drawScanLine(ctx, i + Math.random() * 50, W);
    }

    drawLogo(ctx, 55, 55, 28);

    drawGlowingText(ctx, "Trina", 100, 50, THEME.primary, 36);
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "bold 36px Arial";
    ctx.fillText(" Speed Status", 210, 50);
    
    ctx.save();
    ctx.shadowColor = THEME.purple;
    ctx.shadowBlur = 10;
    ctx.fillStyle = THEME.purple;
    ctx.font = "12px Arial";
    ctx.fillText("QUANTUM PERFORMANCE DASHBOARD v2.0", 100, 75);
    ctx.restore();

    const pingStatus = stats.ping < 100 ? THEME.success : stats.ping < 300 ? THEME.warning : THEME.danger;
    drawPingIndicator(ctx, W - 30, 50, stats.ping);

    ctx.save();
    const lineGradient = ctx.createLinearGradient(30, 100, W - 30, 100);
    lineGradient.addColorStop(0, "transparent");
    lineGradient.addColorStop(0.1, THEME.primary);
    lineGradient.addColorStop(0.3, THEME.cyan);
    lineGradient.addColorStop(0.5, THEME.purple);
    lineGradient.addColorStop(0.7, THEME.pink);
    lineGradient.addColorStop(0.9, THEME.primary);
    lineGradient.addColorStop(1, "transparent");
    
    ctx.shadowColor = THEME.primary;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 105);
    ctx.lineTo(W - 30, 105);
    ctx.stroke();
    ctx.restore();

    const mainY = 130;
    const cardW = 270;
    const cardH = 250;
    const gap = 22;

    const x1 = 40;
    const x2 = x1 + cardW + gap;
    const x3 = x2 + cardW + gap;
    const x4 = x3 + cardW + gap;

    drawCard(ctx, x1, mainY, cardW, cardH, 18, THEME.primary);
    drawIcon(ctx, x1 + 35, mainY + 40, 'cpu', THEME.primary);
    drawGlowingText(ctx, "CPU USAGE", x1 + 65, mainY + 45, THEME.primary, 18);
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${stats.cpuCores} Cores @ ${stats.cpuSpeed} MHz`, x1 + 65, mainY + 62);
    drawDonutChart(ctx, x1 + cardW / 2, mainY + 150, 55, 14, stats.cpuLoad, THEME.primary);
    ctx.fillStyle = THEME.textTertiary;
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(stats.cpuModel.substring(0, 30), x1 + cardW / 2, mainY + 230);

    drawCard(ctx, x2, mainY, cardW, cardH, 18, THEME.blueSky);
    drawIcon(ctx, x2 + 35, mainY + 40, 'memory', THEME.blueSky);
    drawGlowingText(ctx, "MEMORY", x2 + 65, mainY + 45, THEME.blueSky, 18);
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Total: ${formatSize(stats.ramTotal)}`, x2 + 65, mainY + 62);
    const ramPercent = (stats.ramUsed / stats.ramTotal) * 100;
    drawDonutChart(ctx, x2 + cardW / 2, mainY + 150, 55, 14, ramPercent, THEME.blueSky);
    ctx.fillStyle = THEME.textTertiary;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${formatSize(stats.ramUsed)} / ${formatSize(stats.ramTotal)}`, x2 + cardW / 2, mainY + 225);

    drawCard(ctx, x3, mainY, cardW, cardH, 18, THEME.primaryLight);
    drawIcon(ctx, x3 + 35, mainY + 40, 'disk', THEME.primaryLight);
    drawGlowingText(ctx, "STORAGE", x3 + 65, mainY + 45, THEME.primaryLight, 18);
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Total: ${formatSize(stats.diskTotal)}`, x3 + 65, mainY + 62);
    let diskPercent = stats.diskTotal > 0 ? (stats.diskUsed / stats.diskTotal) * 100 : 0;
    drawDonutChart(ctx, x3 + cardW / 2, mainY + 150, 55, 14, diskPercent, THEME.primaryLight);
    ctx.fillStyle = THEME.textTertiary;
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${formatSize(stats.diskUsed)} / ${formatSize(stats.diskTotal)}`, x3 + cardW / 2, mainY + 225);

    drawCard(ctx, x4, mainY, cardW, cardH, 18, THEME.white);
    drawIcon(ctx, x4 + 35, mainY + 40, 'network', THEME.white);
    drawGlowingText(ctx, "NETWORK", x4 + 65, mainY + 45, THEME.white, 18);
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Interface: ${stats.networkInterface}`, x4 + 65, mainY + 62);

    ctx.save();
    ctx.shadowColor = THEME.blueSky;
    ctx.shadowBlur = 10;
    ctx.fillStyle = THEME.blueSky;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("DOWNLOAD", x4 + 25, mainY + 105);
    ctx.shadowBlur = 0;
    ctx.fillStyle = THEME.textPrimary;
    ctx.font = "bold 22px Arial";
    ctx.fillText(formatSize(stats.networkRx), x4 + 25, mainY + 130);
    
    ctx.shadowColor = THEME.white;
    ctx.shadowBlur = 10;
    ctx.fillStyle = THEME.white;
    ctx.font = "bold 12px Arial";
    ctx.fillText("UPLOAD", x4 + 25, mainY + 165);
    ctx.shadowBlur = 0;
    ctx.fillStyle = THEME.textPrimary;
    ctx.font = "bold 22px Arial";
    ctx.fillText(formatSize(stats.networkTx), x4 + 25, mainY + 190);
    ctx.restore();
    
    ctx.fillStyle = THEME.textTertiary;
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`IP: ${stats.networkIP}`, x4 + cardW / 2, mainY + 230);

    const statsY = 405;
    const statW = 180;
    const statH = 65;
    const statGap = 15;

    const statColors = [THEME.primary, THEME.blueSky, THEME.primaryLight, THEME.white, THEME.blueIce];
    drawStatBox(ctx, 40, statsY, statW, statH, "HOSTNAME", stats.hostname.substring(0, 14), statColors[0], 'server');
    drawStatBox(ctx, 40 + (statW + statGap), statsY, statW, statH, "PLATFORM", `${stats.platform} (${stats.arch})`, statColors[1], 'server');
    drawStatBox(ctx, 40 + (statW + statGap) * 2, statsY, statW, statH, "BOT UPTIME", stats.uptimeBot, statColors[2], 'clock');
    drawStatBox(ctx, 40 + (statW + statGap) * 3, statsY, statW, statH, "SERVER UP", stats.uptimeServer, statColors[3], 'clock');
    drawStatBox(ctx, 40 + (statW + statGap) * 4, statsY, statW + 45, statH, "NODE.JS", stats.nodeVersion, statColors[4], 'server');

    const perfY = 495;
    const perfH = 310;
    const perfW = W - 80;

    drawCard(ctx, 40, perfY, perfW, perfH, 18, THEME.primary);

    drawGlowingText(ctx, "SYSTEM PERFORMANCE", 70, perfY + 38, THEME.primary, 20);
    
    ctx.fillStyle = THEME.textSecondary;
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Real-time quantum resource analysis", 70, perfY + 58);

    const barY = perfY + 90;
    const barW = 520;
    const barH = 20;
    const barGap = 45;

    drawProgressBar(ctx, 70, barY, barW, barH, stats.cpuLoad, THEME.primary,
        "CPU Load", `${stats.cpuLoad}%`);
    drawProgressBar(ctx, 70, barY + barGap, barW, barH, ramPercent, THEME.blueSky,
        "Memory Usage", `${Math.round(ramPercent)}%`);
    drawProgressBar(ctx, 70, barY + barGap * 2, barW, barH, diskPercent, THEME.primaryLight,
        "Disk Usage", `${Math.round(diskPercent)}%`);
    drawProgressBar(ctx, 70, barY + barGap * 3, barW, barH,
        Math.min(100, (stats.ping / 500) * 100), pingStatus,
        "Network Latency", `${stats.ping}ms`);

    const infoX = 640;
    const infoStartY = perfY + 90;
    const infoLineHeight = 35;
    let infoY = infoStartY;

    ctx.font = "12px Arial";
    ctx.textAlign = "left";

    const drawInfoLine = (label, value, color) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.font = "bold 11px Arial";
        ctx.fillText(label.toUpperCase(), infoX, infoY);
        ctx.shadowBlur = 0;
        ctx.fillStyle = THEME.textPrimary;
        ctx.font = "bold 14px Arial";
        ctx.fillText(value, infoX + 160, infoY);
        ctx.restore();
        infoY += infoLineHeight;
    };

    drawInfoLine("OS Release", stats.release.substring(0, 20), THEME.primary);
    drawInfoLine("CPU Cores", `${stats.cpuCores} Cores`, THEME.blueSky);
    drawInfoLine("CPU Speed", `${stats.cpuSpeed} MHz`, THEME.primaryLight);
    drawInfoLine("Total Memory", formatSize(stats.ramTotal), THEME.white);
    drawInfoLine("Free Memory", formatSize(stats.ramTotal - stats.ramUsed), THEME.blueIce);

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = THEME.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(infoX - 20, perfY + 75);
    ctx.lineTo(infoX - 20, perfY + perfH - 20);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = THEME.primary;
    ctx.shadowBlur = 10;
    ctx.fillStyle = THEME.primary;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`DASHBOARD GENERATED: ${new Date().toLocaleString().toUpperCase()}`, W / 2, H - 25);
    ctx.shadowBlur = 0;
    ctx.fillStyle = THEME.textTertiary;
    ctx.font = "9px Arial";
    ctx.fillText("Powered by Trina Quantum Engine", W / 2, H - 10);
    ctx.restore();

    return canvas.toBuffer('image/png');
}

function getNetworkStats() {
    try {
        const interfaces = os.networkInterfaces();
        let totalRx = 0;
        let totalTx = 0;
        let activeInterface = 'N/A';
        let ip = 'N/A';

        for (const [name, addrs] of Object.entries(interfaces)) {
            if (name.toLowerCase().includes('lo')) continue;

            for (const addr of addrs) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    activeInterface = name;
                    ip = addr.address;
                    break;
                }
            }
        }

        try {
            const netstat = execSync("cat /proc/net/dev 2>/dev/null || echo ''").toString();
            const lines = netstat.split('\n');

            for (const line of lines) {
                if (line.includes(':') && !line.includes('lo:')) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 10) {
                        totalRx += parseInt(parts[1]) || 0;
                        totalTx += parseInt(parts[9]) || 0;
                    }
                }
            }
        } catch (e) {}

        return {
            totalRx,
            totalTx,
            activeInterface,
            ip
        };
    } catch (e) {
        return {
            totalRx: 0,
            totalTx: 0,
            activeInterface: 'N/A',
            ip: 'N/A'
        };
    }
}

let handler = async (m, {
    sock
}) => {
    try {
        const loadingMsg = await m.reply("Generating dashboard...");

        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        const end = performance.now();
        const latency = (end - start).toFixed(2);

        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const loadAvg = os.loadavg();
        const cpuPercent = Math.min(100, (loadAvg[0] * 100) / cpus.length).toFixed(1);

        let diskTotal = 0,
            diskUsed = 0;
        try {
            const df = execSync("df -k --output=size,used / 2>/dev/null").toString();
            const lines = df.trim().split("\n");
            if (lines.length > 1) {
                const [total, used] = lines[1].trim().split(/\s+/).map(Number);
                diskTotal = total * 1024;
                diskUsed = used * 1024;
            }
        } catch (e) {}

        const networkStats = getNetworkStats();

        const stats = {
            ping: latency,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            nodeVersion: process.version,
            uptimeBot: formatTime(process.uptime()),
            uptimeServer: formatTime(os.uptime()),
            cpuModel: cpus[0].model.trim(),
            cpuSpeed: cpus[0].speed,
            cpuCores: cpus.length,
            cpuLoad: cpuPercent,
            ramTotal: totalMem,
            ramUsed: totalMem - freeMem,
            diskTotal: diskTotal,
            diskUsed: diskUsed,
            networkRx: networkStats.totalRx,
            networkTx: networkStats.totalTx,
            networkInterface: networkStats.activeInterface,
            networkIP: networkStats.ip
        };

        const imageBuffer = await renderDashboard(stats);

        const ramPercent = ((stats.ramUsed / stats.ramTotal) * 100).toFixed(1);
        const diskPercent = stats.diskTotal > 0 ? ((stats.diskUsed / stats.diskTotal) * 100).toFixed(1) : 0;
        const pingStatus = latency < 100 ? "🟢 EXCELLENT" : latency < 300 ? "🟡 GOOD" : "🔴 HIGH";
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `*Trina Speed Status* \n\n` +
                `*Latency:* ${latency}ms ${pingStatus}\n\n` +
                `*CPU:* ${stats.cpuLoad}% @ ${stats.cpuCores} Cores\n\n` +
                `*Memory:* ${formatSize(stats.ramUsed)} / ${formatSize(stats.ramTotal)} (${ramPercent}%)\n\n` +
                `*Storage:* ${formatSize(stats.diskUsed)} / ${formatSize(stats.diskTotal)} (${diskPercent}%)\n\n` +
                `*Network:* ↓ ${formatSize(stats.networkRx)} ↑ ${formatSize(stats.networkTx)}\n\n` +
                `*Uptime:* Bot ${stats.uptimeBot} | Server ${stats.uptimeServer}\n\n` +
                `_Powered by Trina_`
        }, {
            quoted: m
        });

        await sock.sendMessage(m.chat, {
            delete: loadingMsg.key
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ["ping","speed"];
handler.tags = ["info"];
handler.command = ["ping","speed"];

export default handler;