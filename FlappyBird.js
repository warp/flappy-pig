// FlappyBird.js - A Flappy Bird clone with flying pigs

class FlappyBird {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.width = 320;
    this.height = 480;
    this.isRunning = false;
    this.score = 0;
    this.highScore = localStorage.getItem("flappyPigHighScore") || 0;
    this.gravity = 0.25;
    this.animationFrame = null;

    // Set canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game elements
    this.pig = {
      x: 50,
      y: this.height / 2,
      width: 40,
      height: 30,
      velocity: 0,
      jumpStrength: -5,
      rotation: 0,
    };

    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpawnInterval = 1500; // milliseconds
    this.lastPipeSpawn = 0;
    this.minPipeSpacing = 100; // Minimum horizontal distance between pipes

    // Background elements
    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height / 2),
        width: 60 + Math.random() * 40,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

    // Game state
    this.gameState = "start"; // start, playing, gameOver

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.jump = this.jump.bind(this);
    this.reset = this.reset.bind(this);
    this.spawnPipe = this.spawnPipe.bind(this);
    this.checkCollision = this.checkCollision.bind(this);

    // Event listeners
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.handleInput();
      }
    });

    this.canvas.addEventListener("click", () => {
      this.handleInput();
    });

    // Initial render
    this.render();
  }

  handleInput() {
    if (this.gameState === "start") {
      this.gameState = "playing";
      this.start();
    } else if (this.gameState === "playing") {
      this.jump();
    } else if (this.gameState === "gameOver") {
      this.reset();
      this.gameState = "start";
      this.render();
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      cancelAnimationFrame(this.animationFrame);
    }
  }

  reset() {
    this.score = 0;
    this.pig.y = this.height / 2;
    this.pig.velocity = 0;
    this.pig.rotation = 0;
    this.pipes = [];
    this.lastPipeSpawn = 0;
    this.stop();
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    this.update(timestamp);
    this.render();

    this.animationFrame = requestAnimationFrame(this.gameLoop);
  }

  update(timestamp) {
    if (this.gameState !== "playing") return;

    // Update pig
    this.pig.velocity += this.gravity;
    this.pig.y += this.pig.velocity;

    // Rotate pig based on velocity
    this.pig.rotation = Math.min(
      Math.PI / 4,
      Math.max(-Math.PI / 4, this.pig.velocity * 0.1)
    );

    // Check for collisions with ground or ceiling
    if (this.pig.y + this.pig.height > this.height) {
      this.pig.y = this.height - this.pig.height;
      this.gameOver();
    }

    if (this.pig.y < 0) {
      this.pig.y = 0;
      this.pig.velocity = 0;
    }

    // Spawn pipes
    if (
      !this.lastPipeSpawn ||
      timestamp - this.lastPipeSpawn > this.pipeSpawnInterval
    ) {
      this.spawnPipe();
      this.lastPipeSpawn = timestamp;
    }

    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= 2;

      // Remove pipes that are off screen
      if (pipe.x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1);
      }

      // Check for collision
      if (this.checkCollision(pipe)) {
        this.gameOver();
        return;
      }

      // Check for score
      if (!pipe.scored && pipe.x + this.pipeWidth < this.pig.x) {
        pipe.scored = true;
        this.score++;
      }
    }

    // Update clouds
    this.clouds.forEach((cloud) => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width;
        cloud.y = Math.random() * (this.height / 2);
      }
    });
  }

  jump() {
    this.pig.velocity = this.pig.jumpStrength;
  }

  spawnPipe() {
    // Check if there's enough space from the last pipe
    if (this.pipes.length > 0) {
      const lastPipe = this.pipes[this.pipes.length - 1];
      if (this.width - lastPipe.x < this.minPipeSpacing) {
        return; // Don't spawn a new pipe if there isn't enough space
      }
    }

    const gapPosition = Math.random() * (this.height - this.pipeGap - 100) + 50;

    this.pipes.push({
      x: this.width,
      gapStart: gapPosition,
      gapEnd: gapPosition + this.pipeGap,
      scored: false,
    });
  }

  checkCollision(pipe) {
    // Simple AABB collision detection
    if (
      this.pig.x + this.pig.width > pipe.x &&
      this.pig.x < pipe.x + this.pipeWidth &&
      (this.pig.y < pipe.gapStart || this.pig.y + this.pig.height > pipe.gapEnd)
    ) {
      return true;
    }

    return false;
  }

  gameOver() {
    this.gameState = "gameOver";

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("flappyPigHighScore", this.highScore);
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = "#87CEEB"; // Sky blue
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw clouds
    this.ctx.fillStyle = "#FFFFFF";
    this.clouds.forEach((cloud) => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
      this.ctx.arc(
        cloud.x + cloud.width / 4,
        cloud.y - cloud.width / 6,
        cloud.width / 4,
        0,
        Math.PI * 2
      );
      this.ctx.arc(
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 3,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });

    // Draw ground
    this.ctx.fillStyle = "#8B4513"; // Brown
    this.ctx.fillRect(0, this.height - 20, this.width, 20);

    this.ctx.fillStyle = "#7CFC00"; // Lawn green
    this.ctx.fillRect(0, this.height - 20, this.width, 5);

    // Draw pipes
    this.ctx.fillStyle = "#228B22"; // Forest green
    this.pipes.forEach((pipe) => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapStart);

      // Bottom pipe
      this.ctx.fillRect(
        pipe.x,
        pipe.gapEnd,
        this.pipeWidth,
        this.height - pipe.gapEnd
      );

      // Pipe caps
      this.ctx.fillStyle = "#32CD32"; // Lime green
      this.ctx.fillRect(pipe.x - 3, pipe.gapStart - 15, this.pipeWidth + 6, 15);
      this.ctx.fillRect(pipe.x - 3, pipe.gapEnd, this.pipeWidth + 6, 15);
      this.ctx.fillStyle = "#228B22";
    });

    // Draw pig
    this.ctx.save();
    this.ctx.translate(
      this.pig.x + this.pig.width / 2,
      this.pig.y + this.pig.height / 2
    );
    this.ctx.rotate(this.pig.rotation);

    // Pig body
    this.ctx.fillStyle = "#FFC0CB"; // Pink
    this.ctx.beginPath();
    this.ctx.ellipse(
      0,
      0,
      this.pig.width / 2,
      this.pig.height / 2,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Pig legs
    this.ctx.fillStyle = "#FFC0CB";
    // Front legs
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.pig.width / 4,
      this.pig.height / 3,
      this.pig.width / 8,
      this.pig.height / 4,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.pig.width / 4,
      this.pig.height / 3,
      this.pig.width / 8,
      this.pig.height / 4,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    // Back legs
    this.ctx.beginPath();
    this.ctx.ellipse(
      -this.pig.width / 4,
      this.pig.height / 3,
      this.pig.width / 8,
      this.pig.height / 4,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(
      -this.pig.width / 4,
      this.pig.height / 3,
      this.pig.width / 8,
      this.pig.height / 4,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Pig face
    this.ctx.fillStyle = "#FFC0CB";
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.pig.width / 2 - 5,
      0,
      this.pig.width / 4,
      this.pig.height / 3,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Pig snout
    this.ctx.fillStyle = "#FFB6C1"; // Lighter pink
    this.ctx.beginPath();
    this.ctx.ellipse(this.pig.width / 2, 0, 10, 7, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Pig nostrils
    this.ctx.fillStyle = "#FF69B4"; // Hot pink
    this.ctx.beginPath();
    this.ctx.ellipse(this.pig.width / 2 + 3, -2, 2, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(this.pig.width / 2 + 3, 2, 2, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Pig eyes
    this.ctx.fillStyle = "#000000";
    this.ctx.beginPath();
    this.ctx.ellipse(this.pig.width / 3, -5, 2, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Pig ears
    this.ctx.fillStyle = "#FF69B4";
    this.ctx.beginPath();
    this.ctx.moveTo(-this.pig.width / 3, -this.pig.height / 3);
    this.ctx.lineTo(-this.pig.width / 6, -this.pig.height / 1.5);
    this.ctx.lineTo(0, -this.pig.height / 3);
    this.ctx.fill();

    // Pig wings
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.beginPath();

    // Main wing shape
    this.ctx.moveTo(-this.pig.width / 6, 0);
    this.ctx.quadraticCurveTo(
      -this.pig.width / 1.2,
      -this.pig.height / 2,
      -this.pig.width / 1.5,
      -this.pig.height
    );
    this.ctx.quadraticCurveTo(
      -this.pig.width / 3,
      -this.pig.height / 2,
      -this.pig.width / 6,
      0
    );
    this.ctx.fill();

    // Wing feathers
    this.ctx.strokeStyle = "#DDDDDD";
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const featherY = -this.pig.height / 2 - (i * this.pig.height) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(-this.pig.width / 6, 0);
      this.ctx.quadraticCurveTo(
        -this.pig.width / 1.2,
        featherY,
        -this.pig.width / 1.5,
        featherY - this.pig.height / 4
      );
      this.ctx.stroke();
    }

    this.ctx.restore();

    // Draw score
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.score.toString(), this.width / 2, 50);

    // Draw game state messages
    if (this.gameState === "start") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "30px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Flappy Pig", this.width / 2, this.height / 3);

      this.ctx.font = "20px Arial";
      this.ctx.fillText(
        "Click or Press Space to Start",
        this.width / 2,
        this.height / 2
      );

      this.ctx.font = "16px Arial";
      this.ctx.fillText(
        "High Score: " + this.highScore,
        this.width / 2,
        this.height / 2 + 40
      );
    } else if (this.gameState === "gameOver") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "30px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Game Over", this.width / 2, this.height / 3);

      this.ctx.font = "20px Arial";
      this.ctx.fillText(
        "Score: " + this.score,
        this.width / 2,
        this.height / 2
      );
      this.ctx.fillText(
        "High Score: " + this.highScore,
        this.width / 2,
        this.height / 2 + 40
      );

      this.ctx.font = "16px Arial";
      this.ctx.fillText(
        "Click or Press Space to Restart",
        this.width / 2,
        this.height / 2 + 80
      );
    }
  }
}

// Initialize the game when the page loads
window.addEventListener("load", () => {
  const game = new FlappyBird("gameCanvas");
});
