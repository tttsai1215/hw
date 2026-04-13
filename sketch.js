// --- 全域變數宣告 ---
var gridSize = 50;       // 方格大小
var targetX, targetY;    // 寶藏位置 (X, Y)
var timer = 30;          // 倒數計時 (秒)
var gameState = "START"; // 遊戲狀態: "START", "PLAYING", "GAMEOVER"
var isWon = false;       // 是否獲勝

// 煙火特效相關變數
var particles = [];      // 粒子陣列

// 按鈕相關變數 (位置與大小)
var btnW = 200;
var btnH = 60;
var btnX, btnY;

// --- 初始設定 ---
function setup() {
    // 建立全螢幕畫布
    createCanvas(windowWidth, windowHeight);
    
    // 在 setup 中設定 HSB，以利於顏色和大小映射，這也是粒子系統所需要的
    colorMode(HSB, 360, 100, 100);
    
    // 設定文字對齊方式
    textAlign(CENTER, CENTER);
    
    // 根據視窗大小計算按鈕位置
    updateButtonPosition();
}

// --- 視窗縮放監聽 ---
function windowResized() {
    // 調整畫布大小符合新的視窗
    resizeCanvas(windowWidth, windowHeight); 
    
    // 重新計算按鈕位置
    updateButtonPosition(); 
    
    // 如果在遊戲中縮放，為了確保寶藏不出界，重新初始化網格
    if (gameState == "PLAYING") {
        initGame(); 
    }
}

// 更新按鈕位置的函式
function updateButtonPosition() {
    btnX = width / 2 - btnW / 2;
    btnY = height / 2 + 80;
}

// --- 繪圖迴圈 ---
function draw() {
    background(15); // HSB模式下的深色背景，亮度設低一點以突顯煙火

    if (gameState == "START") {
        drawStartScreen();
    } else if (gameState == "PLAYING") {
        playGame();
    } else if (gameState == "GAMEOVER") {
        drawGameOverScreen();
    }
}

// --- 畫面 1: 開始畫面 ---
function drawStartScreen() {
    background(0);
    
    fill(255, 215, 0); // HSB下的暗金黃色
    textSize(40);
    text("🕵️ 幸運色塊獵人", width / 2, height / 2 - 100);
    
    fill(200); // 灰白色
    textSize(18);
    text("任務：在 30 秒內找出隱藏的方塊！\n(調整視窗大小會重新開始遊戲)", width / 2, height / 2 - 10);
    
    drawButton("開始遊戲");
}

// --- 畫面 2: 遊戲主畫面 ---
function playGame() {
    // 倒數計時邏輯
    if (frameCount % 60 == 0 && timer > 0) {
        timer--;
    }
    if (timer == 0) {
        gameState = "GAMEOVER";
        isWon = false;
    }

    // 雙層迴圈繪製網格
    for (var x = 0; x < width; x += gridSize) {
        for (var y = 0; y < height; y += gridSize) {
            
            stroke(50); // HSB下的深灰色格線
            noFill();
            rect(x, y, gridSize, gridSize);

            // 雷達互動邏輯：滑鼠滑過時顯示提示
            if (mouseX > x && mouseX < x + gridSize && 
                mouseY > y && mouseY < y + gridSize) {
                
                var d = dist(x, y, targetX, targetY);
                
                // 距離映射顏色與大小
                var hueVal = map(d, 0, width/2, 0, 240);
                var size = map(d, 0, width/2, gridSize * 0.9, 5);
                
                noStroke();
                fill(hueVal, 80, 100, 0.8);
                ellipse(x + gridSize/2, y + gridSize/2, size);
            }
        }
    }
    
    // 上方資訊列 (固定顯示倒數時間)
    fill(0, 0, 0, 0.7); // HSB模式下的半透明黑底
    noStroke();
    rect(0, 0, width, 50);
    
    fill(0, 0, 100); // 白色字
    textSize(24);
    if (timer < 10) fill(0, 100, 100); // 最後10秒變紅色警告
    text("⏱️ 剩餘時間: " + timer, width / 2, 25);
}

// --- 畫面 3: 結束畫面 ---
function drawGameOverScreen() {
    // 為了讓背景看得到剛才的棋盤，重新畫一次並加上半透明黑色遮罩
    playGame(); 
    fill(0, 0, 0, 0.8);
    noStroke();
    rect(0, 0, width, height);

    if (isWon) {
        // --- 持續發射機制：每 20 幀在畫面隨機位置再打一發煙火 ---
        if (frameCount % 20 === 0) {
            var randomX = width / 2 + random(-width/2.5, width/2.5);
            var randomY = height / 2 + random(-height/2.5, height/3);
            createFireworkBurst(randomX, randomY);
        }

        // 更新並繪製煙火粒子
        for (var i = particles.length - 1; i >= 0; i--) { 
            particles[i].update();
            particles[i].show();
            if (particles[i].isDead()) {
                particles.splice(i, 1);
            }
        }

        fill(0, 0, 100); // 白色字
        stroke(0);
        strokeWeight(4);
        textSize(50);
        text("🎉 任務完成！", width / 2, height / 2 - 50);
        textSize(20);
        noStroke();
        text("你找到了幸運色塊！", width / 2, height / 2 + 10);
        
    } else {
        fill(0, 100, 100); // 紅色字
        textSize(50);
        text("💀 時間到...", width / 2, height / 2 - 50);
        
        fill(0, 0, 100); // 白色字
        textSize(20);
        text("寶藏格座標 (X, Y): (" + floor(targetX/gridSize) + ", " + floor(targetY/gridSize) + ")", width / 2, height / 2 + 10);
        
        // 標示出正確的寶藏位置
        noFill();
        stroke(0, 0, 100);
        strokeWeight(2);
        rect(targetX, targetY, gridSize, gridSize);
    }
    
    drawButton("再玩一次");
}

// --- 輔助函式：自訂粒子物件原型 ---
function FireworkParticle(x, y, hue) {
  this.pos = createVector(x, y);
  
  // 【修改點】誇張的擴散速度 (原本 2~6 改為 4~15)
  this.vel = p5.Vector.random2D().mult(random(4, 15)); 
  this.acc = createVector(0, 0.15); // 稍微加強一點重力
  this.lifespan = 255; 
  this.hue = hue; 
  this.history = []; 

  this.update = function() {
    this.vel.add(this.acc); 
    this.vel.mult(0.96); // 增加一點空氣阻力讓末端減速更明顯
    this.pos.add(this.vel); 
    this.lifespan -= 4; 

    var v = createVector(this.pos.x, this.pos.y);
    this.history.push(v);
    if (this.history.length > 6) { // 稍微拉長軌跡
      this.history.splice(0, 1);
    }
  };

  this.isDead = function() {
    return this.lifespan < 0;
  };

  this.show = function() {
    noFill();
    // 軌跡透明度隨壽命淡出，加強飽和度與亮度
    stroke(this.hue, 100, 100, map(this.lifespan, 0, 255, 0, 0.9)); 
    strokeWeight(1.5); // 讓線條稍微粗一點點
    beginShape();
    for (var i = 0; i < this.history.length; i++) {
      var pos = this.history[i];
      vertex(pos.x, pos.y);
    }
    endShape();
  };
}

// --- 輔助函式：建立煙火爆炸 ---
function createFireworkBurst(x, y) {
    // 【修改點】移除 particles = []; 讓多發煙火可以共存
    for (var i = 0; i < 150; i++) { // 【修改點】粒子數量增加到 150
        particles.push(new FireworkParticle(x, y, random(360))); 
    }
}

// --- 介面函式：繪製按鈕 ---
function drawButton(label) {
    if (mouseX > btnX && mouseX < btnX + btnW && 
        mouseY > btnY && mouseY < btnY + btnH) {
        fill(0, 80, 80); 
        cursor(HAND);
    } else {
        fill(0, 80, 50); 
        cursor(ARROW);
    }
    
    stroke(0, 0, 100); 
    strokeWeight(2);
    rect(btnX, btnY, btnW, btnH, 10);
    
    fill(0, 0, 100); 
    noStroke();
    textSize(24);
    text(label, btnX + btnW/2, btnY + btnH/2);
}

// --- 事件函式 ---
function mousePressed() { 
    if (gameState == "START" || gameState == "GAMEOVER") {
        if (mouseX > btnX && mouseX < btnX + btnW && 
            mouseY > btnY && mouseY < btnY + btnH) {
            initGame();
        }
    }
    else if (gameState == "PLAYING") {
        if (mouseX > targetX && mouseX < targetX + gridSize &&
            mouseY > targetY && mouseY < targetY + gridSize) {
            isWon = true;
            gameState = "GAMEOVER";
            
            // 勝利特效：第一發主煙火在寶藏中心點爆炸
            createFireworkBurst(targetX + gridSize/2, targetY + gridSize/2);
        }
    }
}

// --- 遊戲初始化 ---
function initGame() {
    var cols = floor(width / gridSize);
    var rows = floor(height / gridSize);
    
    targetX = floor(random(cols)) * gridSize;
    targetY = floor(random(rows)) * gridSize;
    
    timer = 30;
    isWon = false;
    gameState = "PLAYING";
    
    // 【修改點】重新開始時，清空殘留的煙火粒子
    particles = [];
    
    cursor(ARROW); 
    
    console.log("新回合開始，寶藏位置格座標 (X, Y):", floor(targetX/gridSize), floor(targetY/gridSize));
}