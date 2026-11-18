import { createRoot } from 'react-dom/client';
import App from './src/App';
import { startOffline } from './src/lib/webOffline';

const container = document.getElementById('root');
if (!container) throw new Error('Application root is missing.');
createRoot(container).render(<App />);
startOffline();
