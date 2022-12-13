import { Stack, Typography } from '@mui/material';
import * as React from 'react';
import { useGameContext } from '../contexts/Game';

const Scores = () => {
    const {
        loaded,
        interpState,
    } = useGameContext();

    const list = React.useMemo(() => {
        const scores = Object.entries(interpState) as [string, number][];
        scores.sort((a, b) => b[1] - a[1]);
        return scores;
    }, [interpState])

    if (!loaded) {
        return (
            <Typography>...</Typography>
        )
    }
    return (
        <Stack>
            <Typography>Scores</Typography>
            {list.map(([name, score]) => (
                <Stack key={name} direction="row" gap="10px">
                    <Typography fontWeight={700}>{name}</Typography>
                    <Typography>{score}</Typography>
                </Stack>
            ))}
        </Stack>
    )
};

export default Scores;
