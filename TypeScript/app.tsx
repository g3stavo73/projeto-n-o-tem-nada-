import { useState, useRef, useCallback, useEffect } from 'react';
import { Router as WouterRouter, Route, Switch } from 'wouter';
import { Particles, ParticlesRef } from './components/Particles';
import { Question } from './components/Question';
import { Buttons } from './components/Buttons';
import { FinalScreen } from './components/FinalScreen';
import { CodeShowcase } from './pages/CodeShowcase';
import { ConfigPage } from './pages/ConfigPage';
import './styles/app.scss';

function ProposalPage() {
  const [phase, setPhase] = useState<'question' | 'celebrating' | 'done'>('question');
  const particlesRef = useRef<ParticlesRef>(null);

  useEffect(() => { document.title = 'Sarah 💕'; }, []);

  const handleYes = useCallback((x: number, y: number) => {
    setPhase('celebrating');
    particlesRef.current?.triggerExplosion(x, y);
  }, []);

  const handleExplosionDone = useCallback(() => {
    setPhase('done');
  }, []);

  return (
    <div className="app-container">
      <Particles ref={particlesRef} phase={phase} onExplosionDone={handleExplosionDone} />
      {phase !== 'done' && (
        <>
          <Question />
          <Buttons onYes={handleYes} />
        </>
      )}
      {phase === 'done' && <FinalScreen />}
      {phase === 'question' && (
        <nav className="bottom-links">
          <a href={import.meta.env.BASE_URL.replace(/\/$/, '') + '/code'} className="code-link" data-testid="link-code">
            &lt;/&gt; como foi feito
          </a>
          <a href={import.meta.env.BASE_URL.replace(/\/$/, '') + '/config'} className="code-link" data-testid="link-config">
            ⎘ configuração
          </a>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Switch>
        <Route path="/" component={ProposalPage} />
        <Route path="/code" component={CodeShowcase} />
        <Route path="/config" component={ConfigPage} />
      </Switch>
    </WouterRouter>
  );
}

export default App; 
