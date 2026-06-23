import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// DTF Global tokens (source — no build needed, Vite handles raw CSS)
import '../../tokens/src/primitives.css';
import '../../tokens/src/extras.css';
import '../../tokens/src/semantic.css';
import '../../tokens/src/surfaces.css';
// DTF Component CSS (tokens first, then component)
import '../../components/src/button/index.css';
import '../../components/src/icon-button/icon-button.tokens.css';
import '../../components/src/icon-button/icon-button.css';
import '../../components/src/split-button/split-button.tokens.css';
import '../../components/src/split-button/split-button.css';
import '../../components/src/menu-button/menu-button.tokens.css';
import '../../components/src/menu-button/menu-button.css';
import '../../components/src/toggle/toggle.tokens.css';
import '../../components/src/toggle/toggle.css';
import '../../components/src/checkbox/checkbox.tokens.css';
import '../../components/src/checkbox/checkbox.css';
import '../../components/src/radio/radio.tokens.css';
import '../../components/src/radio/radio.css';
import '../../components/src/input/index.css';
import '../../components/src/textarea/textarea.tokens.css';
import '../../components/src/textarea/textarea.css';
import '../../components/src/select/select.tokens.css';
import '../../components/src/select/select.css';
import '../../components/src/slider/slider.tokens.css';
import '../../components/src/slider/slider.css';
import '../../components/src/datepicker/datepicker.tokens.css';
import '../../components/src/datepicker/datepicker.css';
import '../../components/src/file-upload/index.css';
import '../../components/src/avatar/index.css';
import '../../components/src/badge/index.css';
import '../../components/src/tooltip/index.css';
import '../../components/src/alert/index.css';
import '../../components/src/toast/index.css';
import '../../components/src/progress-bar/index.css';
import '../../components/src/progress-ring/index.css';
import '../../components/src/spinner/index.css';
import '../../components/src/skeleton/index.css';
import '../../components/src/kbd/index.css';
import '../../components/src/card/index.css';
import '../../components/src/divider/index.css';
import './demo.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
