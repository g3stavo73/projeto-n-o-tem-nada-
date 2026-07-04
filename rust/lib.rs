use wasm_bindgen::prelude::*;

struct Rng {
    state: u64,
}

impl Rng {
    fn new(seed: u64) -> Self {
        Rng { state: seed.wrapping_add(1) }
    }

    fn next_f32(&mut self) -> f32 {
        self.state = self.state
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        ((self.state >> 33) as f32) / (u32::MAX as f32)
    }

    fn range(&mut self, lo: f32, hi: f32) -> f32 {
        lo + self.next_f32() * (hi - lo)
    }
}

#[derive(Clone)]
struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    r: f32,
    g: f32,
    b: f32,
    alpha: f32,
    size: f32,
    rotation: f32,
    rot_speed: f32,
    life: f32,
    decay: f32,
    gravity: f32,
    drag: f32,
    kind: u8,
}

#[wasm_bindgen]
pub struct ParticleSystem {
    particles: Vec<Particle>,
    width: f32,
    height: f32,
    rng: Rng,
}

#[wasm_bindgen]
impl ParticleSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32) -> ParticleSystem {
        ParticleSystem {
            particles: Vec::with_capacity(2000),
            width,
            height,
            rng: Rng::new(42),
        }
    }

    pub fn resize(&mut self, width: f32, height: f32) {
        self.width = width;
        self.height = height;
    }

    pub fn spawn_burst(&mut self, x: f32, y: f32, count: u32) {
        for i in 0..count {
            self.rng.state = self.rng.state.wrapping_add(i as u64 + 1);

            let angle = self.rng.range(0.0, std::f32::consts::TAU);
            let speed = self.rng.range(80.0, 600.0);
            let vx = angle.cos() * speed;
            let vy = angle.sin() * speed - self.rng.range(0.0, 200.0);

            let (r, g, b) = self.heart_color();
            let kind_roll = self.rng.range(0.0, 1.0);
            let kind = if kind_roll < 0.5 { 1u8 }
                       else if kind_roll < 0.75 { 2 }
                       else { 3 };

            self.particles.push(Particle {
                x,
                y,
                vx,
                vy,
                r, g, b,
                alpha: 1.0,
                size: self.rng.range(12.0, 36.0),
                rotation: self.rng.range(0.0, std::f32::consts::TAU),
                rot_speed: self.rng.range(-4.0, 4.0),
                life: 1.0,
                decay: self.rng.range(0.4, 0.9),
                gravity: self.rng.range(80.0, 200.0),
                drag: self.rng.range(0.88, 0.96),
                kind,
            });
        }
    }

    pub fn spawn_hearts(&mut self, count: u32) {
        for i in 0..count {
            self.rng.state = self.rng.state.wrapping_add(i as u64 + 7);

            let x = self.rng.range(0.0, self.width);
            let y = self.rng.range(-80.0, -10.0);
            let (r, g, b) = self.heart_color();

            self.particles.push(Particle {
                x,
                y,
                vx: self.rng.range(-30.0, 30.0),
                vy: self.rng.range(60.0, 180.0),
                r, g, b,
                alpha: self.rng.range(0.6, 1.0),
                size: self.rng.range(10.0, 28.0),
                rotation: self.rng.range(0.0, std::f32::consts::TAU),
                rot_speed: self.rng.range(-1.5, 1.5),
                life: 1.0,
                decay: self.rng.range(0.08, 0.18),
                gravity: 0.0,
                drag: 1.0,
                kind: 1,
            });
        }
    }

    pub fn spawn_celebration(&mut self, count: u32) {
        let cx = self.width * 0.5;
        let cy = self.height * 0.4;
        for i in 0..count {
            self.rng.state = self.rng.state.wrapping_add(i as u64 + 13);

            let angle = self.rng.range(0.0, std::f32::consts::TAU);
            let speed = self.rng.range(200.0, 900.0);

            let (r, g, b) = self.celebration_color();
            let kind_roll = self.rng.range(0.0, 1.0);
            let kind = if kind_roll < 0.6 { 1u8 }
                       else if kind_roll < 0.8 { 2 }
                       else { 0 };

            self.particles.push(Particle {
                x: cx + self.rng.range(-50.0, 50.0),
                y: cy + self.rng.range(-50.0, 50.0),
                vx: angle.cos() * speed,
                vy: angle.sin() * speed - 300.0,
                r, g, b,
                alpha: 1.0,
                size: self.rng.range(14.0, 40.0),
                rotation: self.rng.range(0.0, std::f32::consts::TAU),
                rot_speed: self.rng.range(-5.0, 5.0),
                life: 1.0,
                decay: self.rng.range(0.25, 0.55),
                gravity: self.rng.range(120.0, 280.0),
                drag: self.rng.range(0.90, 0.97),
                kind,
            });
        }
    }

    pub fn update(&mut self, dt: f32) {
        let dt = dt.max(0.0).min(0.05);
        for p in &mut self.particles {
            p.vx *= p.drag;
            p.vy = p.vy * p.drag + p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rot_speed * dt;
            p.life -= p.decay * dt;
            p.alpha = (p.life * p.life).max(0.0);
            p.size = p.size * (0.95_f32).powf(dt * 30.0);
        }
        self.particles.retain(|p| p.life > 0.0 && p.size > 1.0);
    }

    pub fn get_data(&self) -> Vec<f32> {
        let mut buf = Vec::with_capacity(self.particles.len() * 9);
        for p in &self.particles {
            buf.push(p.x);
            buf.push(p.y);
            buf.push(p.r);
            buf.push(p.g);
            buf.push(p.b);
            buf.push(p.alpha);
            buf.push(p.size);
            buf.push(p.rotation);
            buf.push(p.kind as f32);
        }
        buf
    }

    pub fn particle_count(&self) -> u32 {
        self.particles.len() as u32
    }

    pub fn clear(&mut self) {
        self.particles.clear();
    }

    fn heart_color(&mut self) -> (f32, f32, f32) {
        let palettes: [(f32,f32,f32); 8] = [
            (1.0, 0.18, 0.27),
            (1.0, 0.34, 0.47),
            (1.0, 0.55, 0.68),
            (1.0, 0.75, 0.80),
            (0.95, 0.20, 0.60),
            (0.85, 0.10, 0.40),
            (1.0, 0.88, 0.20),
            (1.0, 0.95, 0.95),
        ];
        let i = (self.rng.range(0.0, palettes.len() as f32) as usize)
            .min(palettes.len() - 1);
        palettes[i]
    }

    fn celebration_color(&mut self) -> (f32, f32, f32) {
        let palettes: [(f32,f32,f32); 10] = [
            (1.0, 0.18, 0.27),
            (1.0, 0.55, 0.0),
            (1.0, 0.90, 0.0),
            (0.15, 0.85, 0.40),
            (0.10, 0.65, 1.0),
            (0.60, 0.20, 1.0),
            (1.0, 0.20, 0.80),
            (0.95, 0.20, 0.55),
            (0.40, 1.0, 0.80),
            (1.0, 0.75, 0.80),
        ];
        let i = (self.rng.range(0.0, palettes.len() as f32) as usize)
            .min(palettes.len() - 1);
        palettes[i]
    }
}
