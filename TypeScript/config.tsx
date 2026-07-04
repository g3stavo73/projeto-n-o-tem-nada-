/// <reference types="vite/client" />
import { useState, useCallback } from 'react';
import '../styles/config.scss';

// ── Raw file imports via Vite ─────────────────────────────────────────────────
// Each ?raw import returns the file's full content as a string at build time.

// 🦀 Rust
import rawCargoToml  from '../../particles-wasm/Cargo.toml?raw';
import rawLibRs      from '../../particles-wasm/src/lib.rs?raw';

// ⚛️ TypeScript / React
import rawParticles  from '../particles.ts?raw';
import rawApp        from '../App.tsx?raw';
import rawMain       from '../main.tsx?raw';
import rawQuestion   from '../components/Question.tsx?raw';
import rawButtons    from '../components/Buttons.tsx?raw';
import rawParticlesCmp from '../components/Particles.tsx?raw';
import rawFinalScreen  from '../components/FinalScreen.tsx?raw';
import rawCodeShowcase from './CodeShowcase.tsx?raw';
import rawConfigPage   from './ConfigPage.tsx?raw';

// 🎨 SCSS / CSS
import rawIndexCss    from '../index.css?raw';
import rawVariables   from '../styles/_variables.scss?raw';
import rawAppScss     from '../styles/app.scss?raw';
import rawQuestionScss from '../styles/question.scss?raw';
import rawButtonsScss  from '../styles/buttons.scss?raw';
import rawParticlesScss from '../styles/particles.scss?raw';
import rawFinalScss    from '../styles/final.scss?raw';
import rawCodeScss     from '../styles/code.scss?raw';
import rawConfigScss   from '../styles/config.scss?raw';

// ⚙️ Config
import rawPackageJson  from '../../package.json?raw';
import rawViteConfig   from '../../vite.config.ts?raw';
import rawTsConfig     from '../../tsconfig.json?raw';

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'rust' | 'typescript' | 'scss' | 'css' | 'json' | 'toml';

interface FileEntry {
  name: string;
  path: string;
  lang: Lang;
  content: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  cls: string;
  files: FileEntry[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'rust', label: 'Rust / WASM', icon: '🦀', cls: 'cfg-cat-rust',
    files: [
      { name: 'Cargo.toml',  path: 'particles-wasm/Cargo.toml',  lang: 'toml',       content: rawCargoToml },
      { name: 'lib.rs',      path: 'particles-wasm/src/lib.rs',   lang: 'rust',       content: rawLibRs     },
    ],
  },
  {
    id: 'ts', label: 'TypeScript / React', icon: '⚛️', cls: 'cfg-cat-ts',
    files: [
      { name: 'particles.ts',     path: 'src/particles.ts',                  lang: 'typescript', content: rawParticles     },
      { name: 'App.tsx',          path: 'src/App.tsx',                       lang: 'typescript', content: rawApp           },
      { name: 'main.tsx',         path: 'src/main.tsx',                      lang: 'typescript', content: rawMain          },
      { name: 'Question.tsx',     path: 'src/components/Question.tsx',       lang: 'typescript', content: rawQuestion      },
      { name: 'Buttons.tsx',      path: 'src/components/Buttons.tsx',        lang: 'typescript', content: rawButtons       },
      { name: 'Particles.tsx',    path: 'src/components/Particles.tsx',      lang: 'typescript', content: rawParticlesCmp  },
      { name: 'FinalScreen.tsx',  path: 'src/components/FinalScreen.tsx',    lang: 'typescript', content: rawFinalScreen   },
      { name: 'CodeShowcase.tsx', path: 'src/pages/CodeShowcase.tsx',        lang: 'typescript', content: rawCodeShowcase  },
      { name: 'ConfigPage.tsx',   path: 'src/pages/ConfigPage.tsx',          lang: 'typescript', content: rawConfigPage    },
    ],
  },
  {
    id: 'scss', label: 'SCSS / CSS', icon: '🎨', cls: 'cfg-cat-scss',
    files: [
      { name: 'index.css',         path: 'src/index.css',                lang: 'css',  content: rawIndexCss      },
      { name: '_variables.scss',   path: 'src/styles/_variables.scss',   lang: 'scss', content: rawVariables      },
      { name: 'app.scss',          path: 'src/styles/app.scss',          lang: 'scss', content: rawAppScss        },
      { name: 'question.scss',     path: 'src/styles/question.scss',     lang: 'scss', content: rawQuestionScss   },
      { name: 'buttons.scss',      path: 'src/styles/buttons.scss',      lang: 'scss', content: rawButtonsScss    },
      { name: 'particles.scss',    path: 'src/styles/particles.scss',    lang: 'scss', content: rawParticlesScss  },
      { name: 'final.scss',        path: 'src/styles/final.scss',        lang: 'scss', content: rawFinalScss      },
      { name: 'code.scss',         path: 'src/styles/code.scss',         lang: 'scss', content: rawCodeScss       },
      { name: 'config.scss',       path: 'src/styles/config.scss',       lang: 'scss', content: rawConfigScss     },
    ],
  },
  {
    id: 'config', label: 'Configurações', icon: '⚙️', cls: 'cfg-cat-config',
    files: [
      { name: 'package.json',   path: 'package.json',   lang: 'json', content: rawPackageJson },
      { name: 'vite.config.ts', path: 'vite.config.ts', lang: 'typescript', content: rawViteConfig  },
      { name: 'tsconfig.json',  path: 'tsconfig.json',  lang: 'json', content: rawTsConfig    },
    ],
  },
];

// ── Syntax highlighter ────────────────────────────────────────────────────────

const TS_KEYWORDS = /\b(const|let|var|function|return|export|default|import|from|as|interface|type|class|new|if|else|for|while|do|switch|case|break|continue|async|await|extends|implements|readonly|public|private|protected|static|abstract|void|boolean|string|number|null|undefined|true|false|this|super|typeof|instanceof|in|of|throw|try|catch|finally)\b/g;

const RUST_KEYWORDS = /\b(pub|fn|impl|struct|use|mut|self|let|const|return|match|if|else|for|while|loop|type|enum|trait|where|as|mod|crate|super|false|true|move|ref|dyn|unsafe|extern|async|await|Box|Vec|Option|Result|Some|None|Ok|Err|String|str|usize|u8|u16|u32|u64|i8|i16|i32|i64|f32|f64|bool)\b/g;

const TOML_KEYWORDS = /^(\[.*\])/gm;

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code: string, lang: Lang): string {
  let s = escHtml(code);

  // comments first (before keyword pass to avoid re-coloring inside comments)
  if (lang === 'rust') {
    s = s.replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>');
    s = s.replace(/(#\[[^\]]*\])/g, '<span class="at">$1</span>');
  } else if (lang === 'typescript' || lang === 'json') {
    s = s.replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>');
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cm">$1</span>');
  } else if (lang === 'scss' || lang === 'css') {
    s = s.replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>');
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cm">$1</span>');
  } else if (lang === 'toml') {
    s = s.replace(/(#[^\n]*)/g, '<span class="cm">$1</span>');
    s = s.replace(TOML_KEYWORDS, '<span class="tp">$1</span>');
  }

  // strings (avoid re-coloring already-spanned content)
  s = s.replace(/(?<!span[^>]*>)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="str">$1</span>');

  // keywords
  if (lang === 'rust') {
    s = s.replace(RUST_KEYWORDS, '<span class="kw">$1</span>');
  } else if (lang === 'typescript') {
    s = s.replace(TS_KEYWORDS, '<span class="kw">$1</span>');
  }

  // numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="nb">$1</span>');

  return s;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfigPage() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  // Which categories are open in the sidebar
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(CATEGORIES.map(c => c.id))
  );
  // Currently selected file
  const [selected, setSelected] = useState<FileEntry | null>(null);
  // Copy state: filename → 'copied' | undefined
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const toggleCat = useCallback((id: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleCopy = useCallback((file: FileEntry) => {
    navigator.clipboard.writeText(file.content).then(() => {
      setCopiedFile(file.path);
      setTimeout(() => setCopiedFile(null), 2000);
    });
  }, []);

  const lineCount = selected
    ? selected.content.split('\n').length
    : 0;

  const catForSelected = selected
    ? CATEGORIES.find(c => c.files.some(f => f.path === selected.path))
    : null;

  return (
    <div className="cfg-page">
      {/* ── Top bar ── */}
      <header className="cfg-topbar">
        <a href={`${base}/`} className="cfg-back" data-testid="link-config-back">
          ← voltar
        </a>
        <h1 className="cfg-title">Configuração</h1>
        <span className="cfg-subtitle">
          {CATEGORIES.reduce((n, c) => n + c.files.length, 0)} arquivos
          &nbsp;·&nbsp;
          clique para copiar
        </span>
      </header>

      <div className="cfg-body">
        {/* ── Sidebar ── */}
        <nav className="cfg-sidebar" aria-label="Arquivos">
          {CATEGORIES.map(cat => {
            const isOpen = openCats.has(cat.id);
            return (
              <div key={cat.id} className={`cfg-cat ${cat.cls}`}>
                <button
                  className="cfg-cat-header"
                  onClick={() => toggleCat(cat.id)}
                  data-testid={`cat-${cat.id}`}
                  aria-expanded={isOpen}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`cfg-cat-arrow${isOpen ? ' open' : ''}`}>▶</span>
                </button>
                {isOpen && (
                  <ul className="cfg-file-list" role="listbox">
                    {cat.files.map(file => (
                      <li
                        key={file.path}
                        className={`cfg-file-item${selected?.path === file.path ? ' active' : ''}`}
                        onClick={() => setSelected(file)}
                        role="option"
                        aria-selected={selected?.path === file.path}
                        data-testid={`file-${file.name}`}
                      >
                        <span
                          className="cfg-file-dot"
                          style={{
                            background:
                              cat.id === 'rust'   ? 'hsl(20,80%,65%)' :
                              cat.id === 'ts'     ? 'hsl(210,70%,70%)' :
                              cat.id === 'scss'   ? 'hsl(320,55%,72%)' :
                                                    'hsl(140,40%,60%)',
                          }}
                        />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Viewer ── */}
        <main className={`cfg-viewer ${catForSelected ? catForSelected.cls : ''}`}>
          {!selected ? (
            <div className="cfg-viewer-empty">
              <span style={{ fontSize: '2rem' }}>📂</span>
              <span>Selecione um arquivo no painel à esquerda</span>
            </div>
          ) : (
            <>
              <div className="cfg-viewer-header">
                <span className="cfg-viewer-path">{selected.path}</span>
                <span className="cfg-lang-badge" data-lang={selected.lang}>
                  {selected.lang}
                </span>
                <span className="cfg-line-count">{lineCount} linhas</span>
                <button
                  className={`cfg-copy-btn${copiedFile === selected.path ? ' copied' : ''}`}
                  onClick={() => handleCopy(selected)}
                  data-testid="btn-copy"
                >
                  {copiedFile === selected.path ? '✓ Copiado!' : '⎘ Copiar'}
                </button>
              </div>
              <div className="cfg-code-wrap">
                <pre
                  className="cfg-code"
                  dangerouslySetInnerHTML={{ __html: highlight(selected.content, selected.lang) }}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
