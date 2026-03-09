/* =========================================
   THREE.JS — NETWORK NODE BACKGROUND
   ========================================= */
(function initThree() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 28;

  /* ---- Particles ---- */
  const COUNT = 180;
  const CONNECT_D = 8;   // max distance for connections
  const positions = [];
  const velocities = [];

  for (let i = 0; i < COUNT; i++) {
    positions.push(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20
    );
    velocities.push(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.01
    );
  }

  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(positions);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.18,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true
  });

  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---- Lines (connections) ---- */
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = COUNT * COUNT;
  const linePos = new Float32Array(maxLines * 6);
  const lineColors = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4 })
  );
  scene.add(lineMat);

  /* ---- Floating geometric shapes ---- */
  function addShape(geometry, color, x, y, z, scale = 1) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    scene.add(mesh);
    return mesh;
  }

  const shapes = [
    addShape(new THREE.IcosahedronGeometry(3, 0), 0x00ff88, -18, 6, -5, 1),
    addShape(new THREE.OctahedronGeometry(2.5, 0), 0x00d4ff, 16, -5, -3, 1),
    addShape(new THREE.TorusGeometry(2.8, 0.4, 8, 20), 0x7c3aed, 0, 10, -8, 1),
    addShape(new THREE.TetrahedronGeometry(2, 0), 0x00ff88, 20, 8, -6, 1),
  ];

  /* ---- Mouse parallax ---- */
  let mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---- Resize ---- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---- Animate ---- */
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    // Move particles
    for (let i = 0; i < COUNT; i++) {
      pPos[i * 3] += velocities[i * 3];
      pPos[i * 3 + 1] += velocities[i * 3 + 1];
      pPos[i * 3 + 2] += velocities[i * 3 + 2];

      // Bounce
      if (Math.abs(pPos[i * 3]) > 30) velocities[i * 3] *= -1;
      if (Math.abs(pPos[i * 3 + 1]) > 20) velocities[i * 3 + 1] *= -1;
      if (Math.abs(pPos[i * 3 + 2]) > 10) velocities[i * 3 + 2] *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Update connections
    let lineIdx = 0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = pPos[i * 3] - pPos[j * 3];
        const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
        const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (d < CONNECT_D) {
          const alpha = 1 - d / CONNECT_D;
          linePos[lineIdx * 6] = pPos[i * 3];
          linePos[lineIdx * 6 + 1] = pPos[i * 3 + 1];
          linePos[lineIdx * 6 + 2] = pPos[i * 3 + 2];
          linePos[lineIdx * 6 + 3] = pPos[j * 3];
          linePos[lineIdx * 6 + 4] = pPos[j * 3 + 1];
          linePos[lineIdx * 6 + 5] = pPos[j * 3 + 2];

          lineColors[lineIdx * 6] = 0;
          lineColors[lineIdx * 6 + 1] = alpha;
          lineColors[lineIdx * 6 + 2] = alpha * 0.53;
          lineColors[lineIdx * 6 + 3] = 0;
          lineColors[lineIdx * 6 + 4] = alpha;
          lineColors[lineIdx * 6 + 5] = alpha * 0.53;
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;

    // Rotate shapes
    shapes.forEach((s, i) => {
      s.rotation.x += 0.003 + i * 0.001;
      s.rotation.y += 0.004 + i * 0.001;
    });

    // Camera parallax
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
})();

/* =========================================
   TYPED.JS — HERO ROLE TEXT
   ========================================= */
new Typed('#typed-role', {
  strings: [
    'Ingeniero de Desarrollo de Software y DevOps',
    'Desarrollador de extremo a extremo',
    'Back-end (Node.js / APIs)',
    'Nube y CI/CD',
    'Automatización y buenas prácticas'
  ],
  typeSpeed: 50,
  backSpeed: 30,
  backDelay: 2000,
  loop: true,
  smartBackspace: true
});

/* =========================================
   GSAP SCROLL ANIMATIONS
   ========================================= */
gsap.registerPlugin(ScrollTrigger);

// About section
gsap.from('.about-avatar', {
  scrollTrigger: { trigger: '.about', start: 'top 70%' },
  x: -50, opacity: 0, duration: .8, ease: 'power2.out'
});
gsap.from('.about-text p', {
  scrollTrigger: { trigger: '.about', start: 'top 65%' },
  x: 50, opacity: 0, duration: .8, stagger: .15, ease: 'power2.out'
});
gsap.from('.stat', {
  scrollTrigger: { trigger: '.stats-row', start: 'top 80%' },
  y: 20, opacity: 0, duration: .6, stagger: .12, ease: 'back.out(1.5)'
});

// Counter animation
document.querySelectorAll('.stat-num').forEach(el => {
  const target = +el.dataset.target;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = Math.round(this.targets()[0].val);
        }
      });
    },
    once: true
  });
});

// Skills – intersection observer (respects transition delays from data-delay)
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = +(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.skill-category').forEach(el => skillObserver.observe(el));

// Projects
const projectObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = +(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      projectObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.project-card').forEach(el => projectObserver.observe(el));

// Section titles
gsap.utils.toArray('.section-title').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 80%' },
    y: 30, opacity: 0, duration: .7, ease: 'power2.out'
  });
});

// Contact section
gsap.from('.contact-item', {
  scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  x: -40, opacity: 0, duration: .6, stagger: .12, ease: 'power2.out'
});
gsap.from('.contact-form', {
  scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  x: 40, opacity: 0, duration: .8, ease: 'power2.out'
});

/* =========================================
   NAVBAR SCROLL EFFECT
   ========================================= */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* =========================================
   HAMBURGER MENU
   ========================================= */
document.getElementById('hamburger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

/* =========================================
   CONTACT FORM — BASIC FEEDBACK
   ========================================= */
document.getElementById('contact-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"] span');
  const orig = btn.textContent;
  btn.textContent = '✓ Mensaje enviado!';
  btn.parentElement.style.background = '#00cc6a';
  setTimeout(() => {
    btn.textContent = orig;
    btn.parentElement.style.background = '';
    this.reset();
  }, 3000);
});

/* =========================================
   CARD GLOW FOLLOW MOUSE
   ========================================= */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.querySelector('.card-glow').style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(0,255,136,.1) 0%, transparent 60%)`;
  });
  card.addEventListener('mouseleave', e => {
    card.querySelector('.card-glow').style.background =
      'radial-gradient(circle at 50% 0%, rgba(0,255,136,.05) 0%, transparent 70%)';
  });
});
