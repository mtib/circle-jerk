import { Box, Typography } from '@mui/material';
import * as React from 'react';
import GameProvider from '../contexts/Game';
import Chat from './Chat';
import Circle from './Circle';
import Logs from './Logs';
import Scores from './Scores';

const Layout = () => {

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: '100px auto 300px',
                gridTemplateColumns: '400px auto 400px',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: '100vh',
            }}
        >
            <Box
                sx={{
                    gridRow: '1/2',
                    gridColumn: '1/4'
                }}
            >
                <Typography textAlign="center" variant="h2">Circle Jerk</Typography>
            </Box>
            <GameProvider>
                <Box
                    sx={{
                        gridRow: '2/3',
                        gridColumn: '2/3'
                    }}
                >
                    <Circle />
                </Box>
                <Box
                    sx={{
                        gridRow: '2/3',
                        gridColumn: '3/4'
                    }}
                >
                    <Scores />
                </Box>
                <Box
                    sx={{
                        gridRow: '3/4',
                        gridColumn: '2/4',
                    }}
                >
                    <Chat />
                </Box>
            </GameProvider>
            <Box
                sx={{
                    gridRow: '2/4',
                    gridColumn: '1/2',
                }}
                overflow="hidden"
            >
                <Logs />
            </Box>
        </Box>
    );
};

export default Layout;
