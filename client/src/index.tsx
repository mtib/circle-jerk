import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/App';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const element = document.getElementById('app');
if (element === null) {
    throw new Error('Cant find root element');
}
const root = ReactDOM.createRoot(element);
root.render(<App />)
