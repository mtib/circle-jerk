import { Box, Stack, Typography } from '@mui/material';
import * as React from 'react';
import { useGameContext } from '../contexts/Game';

const Scores = () => {
    const {
        loaded,
        interpState,
        name: playerName,
    } = useGameContext();

    const list = React.useMemo(() => {
        const scores = Object.entries(interpState) as [string, number][];
        scores.sort((a, b) => a[1] - b[1]);
        return scores;
    }, [interpState])

    if (!loaded) {
        return (
            <Typography>...</Typography>
        )
    }
    return (
        <Stack>
            <Box
                display="grid"
                columnGap="6px"
                gridTemplateColumns="auto auto"
                justifyContent="end"
                p="5px 10px"
            >
                {list.map(([name, score], index) => (
                    [
                        <Typography gridRow={index} gridColumn={1} justifySelf="end" key={`${name}-score`}>
                            {name === playerName ? '👉 ' : null}
                            {score}
                        </Typography>,
                        <Typography gridRow={index} gridColumn={2} justifySelf="start" fontWeight={700} key={`${name}-name`}>{name}</Typography>,
                    ]
                ))}
            </Box>
        </Stack>
    )
};

export default Scores;
