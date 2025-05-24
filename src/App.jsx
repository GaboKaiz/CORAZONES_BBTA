import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [heartTriggers, setHeartTriggers] = useState([]);
  const audioRef = useRef(null);

  // Configuración para los mensajes que caen
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const texts = 'Te amo Te amo'.split('');
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f584b7';
      ctx.font = `${fontSize}px arial`;

      for (let i = 0; i < drops.length; i++) {
        const text = texts[Math.floor(Math.random() * texts.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height || Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33);

    return () => clearInterval(intervalId);
  }, []);

  // Configuración para los corazones al interactuar
  const settings = {
    particles: {
      length: 100,
      duration: 0.8,
      velocity: 300,
      spread: 2 * Math.PI,
      size: 2,
    },
    text: {
      duration: 3.0, // Extended duration for longer display
      fontSize: 40,  // Larger font size
      color: '#ff3333', // Vibrant red color
    },
    fadeOutParticles: {
      length: 50,
      duration: 1.0,
      velocity: 150,
      size: 5,
    },
  };

  class Point {
    constructor(x, y) {
      this.x = x || 0;
      this.y = y || 0;
    }
    clone() {
      return new Point(this.x, this.y);
    }
    length(length) {
      if (typeof length === 'undefined') return Math.sqrt(this.x * this.x + this.y * this.y);
      this.normalize();
      this.x *= length;
      this.y *= length;
      return this;
    }
    normalize() {
      const length = this.length();
      this.x /= length;
      this.y /= length;
      return this;
    }
  }

  class Particle {
    constructor() {
      this.position = new Point();
      this.velocity = new Point();
      this.age = 0;
      this.length = Math.random() * 60 + 30;
    }
    initialize(x, y, angle) {
      this.position.x = x;
      this.position.y = y;
      const speed = settings.particles.velocity * (Math.random() * 0.5 + 0.5);
      this.velocity.x = Math.cos(angle) * speed;
      this.velocity.y = Math.sin(angle) * speed;
      this.age = 0;
    }
    update(deltaTime) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.age += deltaTime;
      this.velocity.x *= 0.92;
      this.velocity.y *= 0.92;
    }
    draw(context) {
      const alpha = 1 - this.age / settings.particles.duration;
      if (alpha <= 0) return;
      context.globalAlpha = alpha;
      context.strokeStyle = '#ff69b4';
      context.lineWidth = settings.particles.size;
      context.beginPath();
      context.moveTo(this.position.x, this.position.y);
      context.lineTo(
        this.position.x - this.velocity.x * this.length * (1 - this.age / settings.particles.duration),
        this.position.y - this.velocity.y * this.length * (1 - this.age / settings.particles.duration)
      );
      context.stroke();
    }
  }

  class FadeOutParticle {
    constructor() {
      this.position = new Point();
      this.velocity = new Point();
      this.age = 0;
      this.size = Math.random() * 10 + 5;
    }
    initialize(x, y, angle) {
      this.position.x = x;
      this.position.y = y;
      const speed = settings.fadeOutParticles.velocity * (Math.random() * 0.5 + 0.5);
      this.velocity.x = Math.cos(angle) * speed;
      this.velocity.y = Math.sin(angle) * speed;
      this.age = 0;
    }
    update(deltaTime) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.age += deltaTime;
      this.velocity.x *= 0.95;
      this.velocity.y *= 0.95;
    }
    draw(context) {
      const alpha = 1 - this.age / settings.fadeOutParticles.duration;
      if (alpha <= 0) return;
      context.globalAlpha = alpha;
      context.fillStyle = '#ff3333';
      context.beginPath();
      context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
      context.fill();
    }
  }

  class ParticlePool {
    constructor(length) {
      this.particles = new Array(length).fill(null).map(() => new Particle());
      this.firstActive = 0;
      this.firstFree = 0;
      this.duration = settings.particles.duration;
    }
    add(x, y) {
      const angleStep = settings.particles.spread / settings.particles.length;
      for (let i = 0; i < settings.particles.length; i++) {
        const angle = i * angleStep;
        this.particles[this.firstFree].initialize(x, y, angle);
        this.firstFree++;
        if (this.firstFree === this.particles.length) this.firstFree = 0;
        if (this.firstActive === this.firstFree) this.firstActive++;
        if (this.firstActive === this.particles.length) this.firstActive = 0;
      }
    }
    update(deltaTime) {
      let i;
      if (this.firstActive < this.firstFree) {
        for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].update(deltaTime);
      }
      if (this.firstFree < this.firstActive) {
        for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].update(deltaTime);
        for (i = 0; i < this.firstFree; i++) this.particles[i].update(deltaTime);
      }
      while (this.particles[this.firstActive].age >= this.duration && this.firstActive !== this.firstFree) {
        this.firstActive++;
        if (this.firstActive === this.particles.length) this.firstActive = 0;
      }
    }
    draw(context) {
      let i;
      if (this.firstActive < this.firstFree) {
        for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].draw(context);
      }
      if (this.firstFree < this.firstActive) {
        for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].draw(context);
        for (i = 0; i < this.firstFree; i++) this.particles[i].draw(context);
      }
    }
  }

  class FadeOutParticlePool {
    constructor(length) {
      this.particles = new Array(length).fill(null).map(() => new FadeOutParticle());
      this.firstActive = 0;
      this.firstFree = 0;
      this.duration = settings.fadeOutParticles.duration;
    }
    add(x, y) {
      const angleStep = 2 * Math.PI / settings.fadeOutParticles.length;
      for (let i = 0; i < settings.fadeOutParticles.length; i++) {
        const angle = i * angleStep;
        this.particles[this.firstFree].initialize(x, y, angle);
        this.firstFree++;
        if (this.firstFree === this.particles.length) this.firstFree = 0;
        if (this.firstActive === this.firstFree) this.firstActive++;
        if (this.firstActive === this.particles.length) this.firstActive = 0;
      }
    }
    update(deltaTime) {
      let i;
      if (this.firstActive < this.firstFree) {
        for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].update(deltaTime);
      }
      if (this.firstFree < this.firstActive) {
        for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].update(deltaTime);
        for (i = 0; i < this.firstFree; i++) this.particles[i].update(deltaTime);
      }
      while (this.particles[this.firstActive].age >= this.duration && this.firstActive !== this.firstFree) {
        this.firstActive++;
        if (this.firstActive === this.particles.length) this.firstActive = 0;
      }
    }
    draw(context) {
      let i;
      if (this.firstActive < this.firstFree) {
        for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].draw(context);
      }
      if (this.firstFree < this.firstActive) {
        for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].draw(context);
        for (i = 0; i < this.firstFree; i++) this.particles[i].draw(context);
      }
    }
  }

  // Configuración para los corazones y texto
  useEffect(() => {
    const canvases = document.getElementsByClassName('heart-canvas');
    const heartInstances = Array.from(canvases).map((canvas) => {
      const context = canvas.getContext('2d');
      const particles = new ParticlePool(settings.particles.length);
      const fadeOutParticles = new FadeOutParticlePool(settings.fadeOutParticles.length);
      let time;
      let textAge = 0;
      let showText = false;
      let showFadeOut = false;

      const render = () => {
        requestAnimationFrame(render);
        const newTime = new Date().getTime() / 1000;
        const deltaTime = newTime - (time || newTime);
        time = newTime;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!showText) {
          particles.update(deltaTime);
          particles.draw(context);
          if (particles.firstActive === particles.firstFree) {
            showText = true;
          }
        }

        if (showText && !showFadeOut) {
          textAge += deltaTime;
          const alpha = 1 - textAge / settings.text.duration;
          if (alpha <= 0) {
            showFadeOut = true;
            fadeOutParticles.add(canvas.width / 2, canvas.height / 2);
          } else {
            context.globalAlpha = alpha;
            context.fillStyle = settings.text.color;
            context.font = `${settings.text.fontSize}px 'Dancing Script', cursive`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Te amo ❤️❤️', canvas.width / 2, canvas.height / 2); // Added heart symbols
          }
        }

        if (showFadeOut) {
          fadeOutParticles.update(deltaTime);
          fadeOutParticles.draw(context);
          if (fadeOutParticles.firstActive === fadeOutParticles.firstFree) {
            return; // Stop rendering when fade-out particles are done
          }
        }
      };

      const onResize = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      };

      window.addEventListener('resize', onResize);
      onResize();
      particles.add(canvas.width / 2, canvas.height / 2);
      render();

      return { canvas, particles, render, onResize };
    });

    return () => {
      heartInstances.forEach(instance => {
        window.removeEventListener('resize', instance.onResize);
      });
    };
  }, [heartTriggers]);

  const handleInteraction = (e) => {
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    if (!clientX || !clientY) return;

    if (audioRef.current) {
      audioRef.current.play().catch((error) => console.log('Error al reproducir música:', error));
    }

    setHeartTriggers((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), x: clientX, y: clientY }]);

    setTimeout(() => {
      setHeartTriggers((prev) => prev.slice(1));
    }, (settings.particles.duration + settings.text.duration + settings.fadeOutParticles.duration) * 1000);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
    >
      <audio id="background-music" ref={audioRef} loop>
        <source src="Myke Towers - Diosa.mp3" type="audio/mp3" />
        Tu navegador no soporta el elemento de audio.
      </audio>

      <canvas id="canvas" ref={canvasRef}></canvas>

      {heartTriggers.map((trigger) => (
        <canvas
          key={trigger.id}
          className="heart-canvas absolute"
          style={{ top: trigger.y - 150, left: trigger.x - 150, width: 300, height: 300 }}
        ></canvas>
      ))}

      <h1 className="text-4xl md:text-5xl font-dancing text-pink-400 text-center mb-8 glow">
        Para mi amor eterno
      </h1>

      <p className="text-md md:text-lg text-pink-300 text-center mt-4 font-dancing">
        Toca para corazones
      </p>
    </div>
  );
}

export default App;