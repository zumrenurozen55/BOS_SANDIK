let yoff = 0.0;
let darkClouds = []; 
let inkSpots = [];       // Siyaha çeviren damlalar
let clearingSpots = [];  // Beyaza (boşluğa) çeviren damlalar
let appState = "INTRO";  // INTRO, TO_BLACK, TO_WHITE, STORY_READY

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < 6; i++) {
        darkClouds.push(createNewCloud());
    }
}

function createNewCloud() {
    return {
        x: random(width),
        y: random(height),
        vx: random(-0.2, 0.2), 
        vy: random(-0.2, 0.2),
        size: random(150, 350),
        alpha: 0,
        targetAlpha: random(15, 45), 
        lerpSpeed: random(0.005, 0.015) 
    };
}

// 1. Siyaha Boyayan Mürekkep Damlası
class InkSpot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetSize = max(width, height) * 2.5;
        this.currentSize = 0;
        this.growth = 0;
    }

    update() {
        this.growth = lerp(this.growth, 15, 0.02); 
        this.currentSize += this.growth;
    }

    display() {
        noStroke();
        let gradient = drawingContext.createRadialGradient(
            this.x, this.y, 0, 
            this.x, this.y, this.currentSize / 2
        );
        // CSS tüm renkleri zıtladığı için beyaz çiziyoruz, ekranda siyah görünüyor.
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        drawingContext.fillStyle = gradient;
        ellipse(this.x, this.y, this.currentSize, this.currentSize);
    }
}

// 2. Beyaza (Boşluğa) Döndüren Mürekkep Damlası
class ClearingSpot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetSize = max(width, height) * 2.5;
        this.currentSize = 0;
        this.growth = 0;
    }

    update() {
        this.growth = lerp(this.growth, 12, 0.015); // Karanlıktan çıkış biraz daha ağır, uyuşuk
        this.currentSize += this.growth;
    }

    display() {
        noStroke();
        let gradient = drawingContext.createRadialGradient(
            this.x, this.y, 0, 
            this.x, this.y, this.currentSize / 2
        );
        // CSS hala zıt (invert) durumunda olduğu için Siyah çiziyoruz, ekranda bembeyaz görünüyor.
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); 
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        drawingContext.fillStyle = gradient;
        ellipse(this.x, this.y, this.currentSize, this.currentSize);
    }
}

function draw() {
    background(240, 240, 240); 

    // Arkadaki sisler ve dalgalar sadece Intro'da ve kararma evresinde görünür
    if (appState === "INTRO" || appState === "TO_BLACK") {
        noStroke();
        for (let c of darkClouds) {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < 0 || c.x > width) c.vx *= -1;
            if (c.y < 0 || c.y > height) c.vy *= -1;
            c.alpha = lerp(c.alpha, c.targetAlpha, c.lerpSpeed);
            
            let gradient = drawingContext.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size / 2);
            gradient.addColorStop(0, `rgba(25, 25, 30, ${c.alpha / 255})`);
            gradient.addColorStop(1, `rgba(25, 25, 30, 0)`);
            drawingContext.fillStyle = gradient;
            ellipse(c.x, c.y, c.size, c.size);
        }

        let globalAlpha = map(noise(frameCount * 0.002), 0, 1, 80, 200); 
        let lineWeight = map(noise(frameCount * 0.005), 0, 1, 0.5, 1.8);
        strokeWeight(lineWeight);
        drawWave(height * 0.1, height * 0.35, yoff, globalAlpha);
        drawWave(height * 0.65, height * 0.9, yoff + 100, globalAlpha);
        yoff += 0.0008; 
    }

    // Ekranı Siyaha Boyama Evresi
    if (appState === "TO_BLACK" || appState === "TO_WHITE" || appState === "STORY_READY") {
        for (let spot of inkSpots) {
            spot.update();
            spot.display();
        }
    }

    // Ekranı Tekrar Beyaza (Boşluğa) Boyama Evresi
    if (appState === "TO_WHITE" || appState === "STORY_READY") {
        for (let spot of clearingSpots) {
            spot.update();
            spot.display();
        }
    }
}

function drawWave(minH, maxH, offset, gAlpha) {
    let xoff = 0;
    for (let x = 0; x <= width; x += 5) {
        let y1 = map(noise(xoff, offset), 0, 1, minH, maxH);
        let y2 = map(noise(xoff + 0.02, offset), 0, 1, minH, maxH);
        let gapNoise = noise(xoff * 1.5, offset, frameCount * 0.0008); 
        let localAlpha = map(gapNoise, 0.3, 0.6, 0, 255);
        localAlpha = constrain(localAlpha, 0, 255);
        let finalAlpha = min(gAlpha, localAlpha);
        if (finalAlpha > 5) {
            stroke(30, 30, 35, finalAlpha);
            line(x, y1, x + 5, y2);
        }
        xoff += 0.02;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// --- ETKİLEŞİM VE SAHNE AKIŞI ---
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("btn-start");
    const uiLayer = document.getElementById("ui-layer");

    startBtn.addEventListener("click", () => {
        // 1. Arayüz Kaybolur, Zıtlık (Invert) Başlar
        uiLayer.classList.add("fade-out");
        document.body.classList.add("inverted");

        // 2. Siyaha Boyama (İlk Damlalar)
        setTimeout(() => {
            appState = "TO_BLACK";
            inkSpots.push(new InkSpot(width/2, height/2));
            inkSpots.push(new InkSpot(width * 0.2, height * 0.8));
            inkSpots.push(new InkSpot(width * 0.8, height * 0.2));
        }, 500);

        // 3. Beyaza (Boşluğa) Dönüş (İkinci Damlalar)
        setTimeout(() => {
            console.log("Karanlık yuttu... Şimdi aydınlanıyor/boşalıyor.");
            appState = "TO_WHITE";
            clearingSpots.push(new ClearingSpot(width * 0.3, height * 0.3));
            clearingSpots.push(new ClearingSpot(width * 0.7, height * 0.7));
            clearingSpots.push(new ClearingSpot(width / 2, height * 0.9));
        }, 4500); // 4.5 saniye sonra beyaza dönüş başlar

        // 4. Hikaye İçin Hazır
        setTimeout(() => {
            appState = "STORY_READY";
            console.log("Ekran bembeyaz. Beyaz'ın hikayesi için zemin hazır.");
            // Burada Beyaz'ı veya metinleri sahneye çıkaracağız.
        }, 9000); // Toplam 9 saniyelik sinematik bir intro
    });
});