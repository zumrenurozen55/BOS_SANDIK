let yoff = 0.0;
let darkClouds = []; 
let inkSpots = [];       
let clearingSpots = [];  
let appState = "INTRO";  

let beyazImg;               
let beyazVid; 
let gerginVid; 
let hayalKirikligiImg; 

let beyzImgPos = { x: 0, y: 0 }; 
let characterAlpha = 0;     
let characterTargetAlpha = 1; 

let noiseOffX = 0;
let noiseOffY = 1000; 

let driftX = 0; 
let driftY = 0;
let isStoryPaused = false; 

let fadeTimer = 0;
let isFading = false;
let currentFadeIntensity = 0; 

let mahcubFog = []; 
let finalFadeOutActive = false; 

let inkGrowth = 0;
let showEndInk = false;

// DOĞAL BEYAZ SİS EFEKTİ (Artık invert'e ihtiyaç duymadan bembeyaz çizilecek)
class WhiteFogParticle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = width / 2 + random(-width * 0.3, width * 0.3);
        this.y = height / 2 + random(-height * 0.2, height * 0.3);
        this.size = random(150, 400); 
        this.noiseOffX = random(1000); 
        this.noiseOffY = random(1000);
    }
    update() {
        this.x += map(noise(this.noiseOffX), 0, 1, -0.4, 0.4);
        this.y += map(noise(this.noiseOffY), 0, 1, -0.2, 0.2);
        this.noiseOffX += 0.001; 
        this.noiseOffY += 0.001;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
        }
    }
    display(alpha) {
        let gradient = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size / 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha / 255})`); 
        gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.5 / 255})`); 
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        drawingContext.fillStyle = gradient;
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
    }
}

function preload() {
    // DİKKAT: Bu dosyalar After Effects'ten SİYAH ARKA PLANLI olarak çıkmış olmalı!
    beyazImg = loadImage('https://zumrenurozen55.github.io/BOS_SANDIK/BEYAZ.png');
    hayalKirikligiImg = loadImage('https://zumrenurozen55.github.io/BOS_SANDIK/beyaz.hayal.kirikligi.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    beyzImgPos.x = width / 2;
    
    for (let i = 0; i < 6; i++) {
        darkClouds.push(createNewCloud());
    }

    beyazVid = createVideo(['https://zumrenurozen55.github.io/BOS_SANDIK/beyaz3.mahcup.webm']);
    beyazVid.elt.muted = true; 
    beyazVid.elt.setAttribute('playsinline', ''); 
    beyazVid.elt.setAttribute('webkit-playsinline', '');
    beyazVid.elt.setAttribute('crossOrigin', 'anonymous');
    beyazVid.hide(); 
    
    gerginVid = createVideo(['https://zumrenurozen55.github.io/BOS_SANDIK/beyaz_animasyon1.mp4']);
    gerginVid.elt.muted = true; 
    gerginVid.elt.setAttribute('playsinline', '');
    gerginVid.elt.setAttribute('webkit-playsinline', '');
    gerginVid.elt.setAttribute('crossOrigin', 'anonymous');
    gerginVid.hide();
    
    for (let i = 0; i < 8; i++) {
        mahcubFog.push(new WhiteFogParticle());
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

// Ekranı karartan DOĞAL SİYAH mürekkep damlası
class InkSpot {
    constructor(x, y) { this.x = x; this.y = y; this.targetSize = max(width, height) * 2.5; this.currentSize = 0; this.growth = 0; }
    update() { this.growth = lerp(this.growth, 15, 0.02); this.currentSize += this.growth; }
    display() { noStroke(); let gradient = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentSize / 2); gradient.addColorStop(0, 'rgba(20, 20, 25, 1)'); gradient.addColorStop(0.7, 'rgba(20, 20, 25, 0.5)'); gradient.addColorStop(1, 'rgba(20, 20, 25, 0)'); drawingContext.fillStyle = gradient; ellipse(this.x, this.y, this.currentSize, this.currentSize); }
}

class ClearingSpot {
    constructor(x, y) { this.x = x; this.y = y; this.targetSize = max(width, height) * 2.5; this.currentSize = 0; this.growth = 0; }
    update() { this.growth = lerp(this.growth, 12, 0.015); this.currentSize += this.growth; }
    display() { noStroke(); let gradient = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentSize / 2); gradient.addColorStop(0, 'rgba(30, 30, 35, 1)'); gradient.addColorStop(0.6, 'rgba(30, 30, 35, 0.8)'); gradient.addColorStop(1, 'rgba(30, 30, 35, 0)'); drawingContext.fillStyle = gradient; ellipse(this.x, this.y, this.currentSize, this.currentSize); }
}

function draw() {
    // 1. AŞAMA: İNTRO (Aydınlık Dünya)
    if (appState === "INTRO" || appState === "TO_BLACK") {
        background(240, 240, 240); // Doğal beyaz arka plan
        
        noStroke();
        for (let c of darkClouds) {
            c.x += c.vx; c.y += c.vy;
            if (c.x < 0 || c.x > width) c.vx *= -1; if (c.y < 0 || c.y > height) c.vy *= -1;
            c.alpha = lerp(c.alpha, c.targetAlpha, c.lerpSpeed);
            let gradient = drawingContext.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size / 2); gradient.addColorStop(0, `rgba(25, 25, 30, ${c.alpha / 255})`); gradient.addColorStop(1, `rgba(25, 25, 30, 0)`); drawingContext.fillStyle = gradient; ellipse(c.x, c.y, c.size, c.size);
        }
        let globalAlpha = map(noise(frameCount * 0.002), 0, 1, 80, 200); 
        let lineWeight = map(noise(frameCount * 0.005), 0, 1, 0.5, 1.8); strokeWeight(lineWeight);
        drawWave(height * 0.1, height * 0.35, yoff, globalAlpha); drawWave(height * 0.65, height * 0.9, yoff + 100, globalAlpha);
        yoff += 0.0008; 
    }
    
    // 2. AŞAMA: HİKAYE EKRANI (Doğal Siyah Dünya - Invert Olmadan!)
    else {
        background(20, 20, 25); // Doğal koyu arka plan
    }

    if (appState === "TO_BLACK" || appState === "TO_WHITE" || appState === "STORY_READY" || appState === "STORY_MAHCUP" || appState === "STORY_GERGIN" || appState === "HAYAL_KIRIKLIGI") {
        for (let spot of inkSpots) { spot.update(); spot.display(); }
    }

    if (appState === "TO_WHITE" || appState === "STORY_READY" || appState === "STORY_MAHCUP" || appState === "STORY_GERGIN" || appState === "HAYAL_KIRIKLIGI") {
        for (let spot of clearingSpots) { spot.update(); spot.display(); }
    }

    if (showEndInk) {
        inkGrowth += 0.2; 
        noStroke();
        let grad = drawingContext.createRadialGradient(width/2, height/2, 0, width/2, height/2, inkGrowth);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        drawingContext.fillStyle = grad;
        ellipse(width/2, height/2, inkGrowth*2, inkGrowth*2);
    }

    if (appState === "STORY_READY" || appState === "STORY_MAHCUP" || appState === "STORY_GERGIN" || appState === "HAYAL_KIRIKLIGI") {
        
        if (!isStoryPaused || appState === "HAYAL_KIRIKLIGI") {
            let lerpFactor = (finalFadeOutActive) ? 0.06 : 0.015; 
            characterAlpha = lerp(characterAlpha, characterTargetAlpha, lerpFactor);

            driftX = map(noise(noiseOffX), 0, 1, -6, 6); 
            driftY = map(noise(noiseOffY), 0, 1, -4, 4); 
            noiseOffX += 0.005; 
            noiseOffY += 0.005;

            if (!finalFadeOutActive && (appState === "STORY_MAHCUP" || appState === "STORY_GERGIN" || (appState === "STORY_READY" && characterTargetAlpha > 0))) {
                if (!isFading) {
                    if (fadeTimer <= 0) {
                        fadeTimer = random(200, 500); 
                        isFading = true;
                        currentFadeIntensity = random(0.2, 0.5); 
                    } else {
                        fadeTimer--;
                    }
                } else {
                    characterTargetAlpha = 1 - currentFadeIntensity;
                    if (characterAlpha <= characterTargetAlpha + 0.05) {
                        characterTargetAlpha = 1;
                        isFading = false;
                    }
                }
            }

            if (appState === "STORY_MAHCUP") {
                for (let fog of mahcubFog) {
                    fog.update();
                }
            }
        }

        if (appState === "STORY_MAHCUP") {
            for (let fog of mahcubFog) {
                fog.display(characterAlpha * 255); 
            }
        }
        
        if (finalFadeOutActive) {
            characterTargetAlpha = 0; 
        }

        push();
        imageMode(CENTER);
        
        // FİLTRE YOK, BLEND MODE YOK! DOĞRUDAN ÇİZİM.
        tint(255, 255, 255, characterAlpha * 255); 
        
        let currentAsset;
        if (appState === "STORY_READY") currentAsset = beyazImg;
        else if (appState === "STORY_MAHCUP") currentAsset = beyazVid;
        else if (appState === "STORY_GERGIN") currentAsset = gerginVid;
        else if (appState === "HAYAL_KIRIKLIGI") currentAsset = hayalKirikligiImg;

        if (currentAsset) {
            let assetWidth = currentAsset.width || 1000;
            let assetHeight = currentAsset.height || 1000;
            if (assetWidth === 0) assetWidth = 1000;
            if (assetHeight === 0) assetHeight = 1000;

            let scaleFactor = (height * 0.80) / assetHeight; 
            let drawW = assetWidth * scaleFactor;
            let drawH = assetHeight * scaleFactor;
            let drawY = height - (drawH / 2);

            image(currentAsset, beyzImgPos.x + driftX, drawY + driftY, drawW, drawH);
        }
        pop();
    }
}

function drawWave(minH, maxH, offset, gAlpha) {
    let xoff = 0;
    for (let x = 0; x <= width; x += 5) {
        let y1 = map(noise(xoff, offset), 0, 1, minH, maxH);
        let y2 = map(noise(xoff + 0.02, offset), 0, 1, minH, maxH);
        let gapNoise = noise(xoff * 1.5, offset, frameCount * 0.0008); 
        let localAlpha = map(gapNoise, 0.3, 0.6, 0, 255); localAlpha = constrain(localAlpha, 0, 255);
        let finalAlpha = min(gAlpha, localAlpha); if (finalAlpha > 5) { stroke(30, 30, 35, finalAlpha); line(x, y1, x + 5, y2); }
        xoff += 0.02;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    beyzImgPos.x = width / 2; 
}

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("btn-start");
    const uiLayer = document.getElementById("ui-layer");
    
    const btnYes = document.getElementById("btn-yes");
    const btnNo = document.getElementById("btn-no");
    const choiceLayer = document.getElementById("choice-layer");

    startBtn.addEventListener("click", () => {
        uiLayer.classList.add("fade-out");
        
        // NOT: Bu kod hala duruyor çünkü Adım 1'de yazdığımız yeni Siyah/Beyaz CSS'i tetikleyecek!
        document.body.classList.add("inverted");
        
        beyazVid.elt.loop = true;
        beyazVid.elt.play(); 
        
        gerginVid.elt.loop = true;
        gerginVid.elt.play(); 

        setTimeout(() => { appState = "TO_BLACK"; inkSpots.push(new InkSpot(width/2, height/2)); inkSpots.push(new InkSpot(width * 0.2, height * 0.8)); inkSpots.push(new InkSpot(width * 0.8, height * 0.2)); }, 500);
        setTimeout(() => { appState = "TO_WHITE"; clearingSpots.push(new ClearingSpot(width * 0.3, height * 0.3)); clearingSpots.push(new ClearingSpot(width * 0.7, height * 0.7)); clearingSpots.push(new ClearingSpot(width / 2, height * 0.9)); }, 4500); 
        
        setTimeout(() => { 
            appState = "STORY_READY"; 
            setTimeout(() => {
                const line1 = document.getElementById("line-1");
                if(line1) line1.style.opacity = "1";
                
                setTimeout(() => {
                    if(line1) line1.style.opacity = "0"; 
                    characterTargetAlpha = 0; 
                    
                    setTimeout(() => {
                        characterAlpha = 0; 
                        characterTargetAlpha = 1; 

                        appState = "STORY_MAHCUP"; 
                        beyazVid.elt.currentTime = 0; 
                        
                        setTimeout(() => {
                            const line2 = document.getElementById("line-2");
                            if(line2) line2.style.opacity = "1";

                            setTimeout(() => {
                                if(line2) line2.style.opacity = "0";

                                setTimeout(() => {
                                    const line3 = document.getElementById("line-3");
                                    if(line3) line3.style.opacity = "1";

                                    setTimeout(() => {
                                        if(line3) line3.style.opacity = "0";
                                    }, 3500);

                                }, 2500); 
                            }, 3000); 
                        }, 500);

                        setTimeout(() => {
                            finalFadeOutActive = true; 
                            
                            setTimeout(() => {
                                appState = "STORY_GERGIN"; 
                                finalFadeOutActive = false; 
                                characterAlpha = 0; 
                                characterTargetAlpha = 1; 
                                
                                beyazVid.elt.pause(); 
                                gerginVid.elt.currentTime = 0; 
                                
                                setTimeout(() => {
                                    const line4 = document.getElementById("line-4");
                                    if(line4) line4.style.opacity = "1";

                                    setTimeout(() => {
                                        if(line4) line4.style.opacity = "0";

                                        setTimeout(() => {
                                            const line5 = document.getElementById("line-5");
                                            if(line5) line5.style.opacity = "1";

                                            setTimeout(() => {
                                                if(line5) line5.style.opacity = "0";
                                            }, 3500);

                                        }, 1500); 

                                    }, 3500);

                                }, 1000);

                                setTimeout(() => {
                                    const line6 = document.getElementById("line-6");
                                    if(line6) line6.style.opacity = "1";
                                }, 11000);

                                setTimeout(() => {
                                    isStoryPaused = true; 
                                    gerginVid.elt.pause();    
                                    
                                    if(choiceLayer) choiceLayer.classList.add("visible");

                                }, 14000);

                            }, 2000); 
                            
                        }, 12000); 
                        
                    }, 6000); 
                    
                }, 3000); 
            }, 1500); 
        }, 9000); 
    });

    btnNo.addEventListener("click", () => {
        btnNo.classList.add("glitch-shake");
        
        setTimeout(() => {
            choiceLayer.style.opacity = "0";
            choiceLayer.style.pointerEvents = "none";
            document.getElementById("line-6").style.opacity = "0";
            
            appState = "HAYAL_KIRIKLIGI";
            isStoryPaused = false; 
            characterAlpha = 0;
            characterTargetAlpha = 1;
            
            setTimeout(() => {
                document.getElementById("line-7").style.opacity = "1";
                showEndInk = true; 
            }, 2000);

        }, 800); 
    });

    btnYes.addEventListener("click", () => {
        console.log("Kullanıcı 'Evet' dedi.");
    });
});