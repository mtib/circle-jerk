import * as React from 'react';
import WebsocketProvider from '../contexts/Websocket';
import Layout from './Layout';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material';

const App = () => {
    return (
        <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
            <CssBaseline />
            <WebsocketProvider>
                <Layout />
            </WebsocketProvider>
        </ThemeProvider>
    )
}

export default React.memo(App);
