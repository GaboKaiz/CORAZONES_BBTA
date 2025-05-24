import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [heartTriggers, setHeartTriggers] = useState([]);
  const audioRef = useRef(null); // Add a ref for the audio element

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
      length: 500,
      duration: 2,
      velocity: 100,
      effect: -0.75,
      size: 30,
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
      this.acceleration = new Point();
      this.age = 0;
    }
    initialize(x, y, dx, dy) {
      this.position.x = x;
      this.position.y = y;
      this.velocity.x = dx;
      this.velocity.y = dy;
      this.acceleration.x = dx * settings.particles.effect;
      this.acceleration.y = dy * settings.particles.effect;
      this.age = 0;
    }
    update(deltaTime) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.velocity.x += this.acceleration.x * deltaTime;
      this.velocity.y += this.acceleration.y * deltaTime;
      this.age += deltaTime;
    }
    draw(context, image) {
      const ease = (t) => (--t) * t * t + 1;
      const size = image.width * ease(this.age / settings.particles.duration);
      context.globalAlpha = 1 - this.age / settings.particles.duration;
      context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
    }
  }

  class ParticlePool {
    constructor(length) {
      this.particles = new Array(length).fill(null).map(() => new Particle());
      this.firstActive = 0;
      this.firstFree = 0;
      this.duration = settings.particles.duration;
    }
    add(x, y, dx, dy) {
      this.particles[this.firstFree].initialize(x, y, dx, dy);
      this.firstFree++;
      if (this.firstFree === this.particles.length) this.firstFree = 0;
      if (this.firstActive === this.firstFree) this.firstActive++;
      if (this.firstActive === this.particles.length) this.firstActive = 0;
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
    draw(context, image) {
      let i;
      if (this.firstActive < this.firstFree) {
        for (i = this.firstActive; i < this.firstFree; i++) this.particles[i].draw(context, image);
      }
      if (this.firstFree < this.firstActive) {
        for (i = this.firstActive; i < this.particles.length; i++) this.particles[i].draw(context, image);
        for (i = 0; i < this.firstFree; i++) this.particles[i].draw(context, image);
      }
    }
  }

  // Configuración para los corazones
  useEffect(() => {
    const canvases = document.getElementsByClassName('heart-canvas');
    const heartInstances = Array.from(canvases).map((canvas) => {
      const context = canvas.getContext('2d');
      const particles = new ParticlePool(settings.particles.length);
      const particleRate = settings.particles.length / settings.particles.duration;
      const pointOnHeart = (t) => new Point(160 * Math.pow(Math.sin(t), 3), 130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25);
      let time;

      const image = (() => {
        const dummyCanvas = document.createElement('canvas');
        const ctx = dummyCanvas.getContext('2d');
        dummyCanvas.width = settings.particles.size;
        dummyCanvas.height = settings.particles.size;

        const to = (t) => {
          const point = pointOnHeart(t);
          point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
          point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
          return point;
        };

        ctx.beginPath();
        let t = -Math.PI;
        let point = to(t);
        ctx.moveTo(point.x, point.y);
        while (t < Math.PI) {
          t += 0.01;
          point = to(t);
          ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.fillStyle = '#ff69b4';
        ctx.fill();
        const img = new Image();
        img.src = dummyCanvas.toDataURL();
        return img;
      })();

      const render = () => {
        requestAnimationFrame(render);
        const newTime = new Date().getTime() / 1000;
        const deltaTime = newTime - (time || newTime);
        time = newTime;

        context.clearRect(0, 0, canvas.width, canvas.height);

        const amount = particleRate * deltaTime;
        for (let i = 0; i < amount; i++) {
          const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
          const dir = pos.clone().length(settings.particles.velocity);
          particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
        }

        particles.update(deltaTime);
        particles.draw(context, image);
      };

      const onResize = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      };
      window.addEventListener('resize', onResize);
      onResize();
      render();

      return { canvas, particles, render };
    });

    return () => {
      window.removeEventListener('resize', heartInstances.forEach(instance => instance.onResize));
    };
  }, [heartTriggers]);

  const handleInteraction = (e) => {
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    if (!clientX || !clientY) return;

    // Play audio on first interaction
    if (audioRef.current) {
      audioRef.current.play().catch((error) => console.log('Error al reproducir música:', error));
    }

    setHeartTriggers((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), x: clientX, y: clientY }]);

    setTimeout(() => {
      setHeartTriggers((prev) => prev.slice(1));
    }, 5000);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
    >
      {/* Música de fondo */}
      <audio id="background-music" ref={audioRef} loop>
        <source src="Myke Towers - Diosa.mp3" type="audio/mp3" />
        Tu navegador no soporta el elemento de audio.
      </audio>

      {/* Canvas para los mensajes que caen */}
      <canvas id="canvas" ref={canvasRef}></canvas>

      {/* Canvas para los corazones al interactuar */}
      {heartTriggers.map((trigger) => (
        <canvas
          key={trigger.id}
          className="heart-canvas absolute"
          style={{ top: trigger.y - 150, left: trigger.x - 150, width: 300, height: 300 }}
        ></canvas>
      ))}

      {/* Título principal */}
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