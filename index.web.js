import { createRoot } from 'react-dom/client';
import App from './src/App';

const container = document.getElementById('root');
if (!container) throw new Error('Application root is missing.');
createRoot(container).render(<App />);
