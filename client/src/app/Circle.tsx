import { Stack, Typography } from '@mui/material';
import * as React from 'react';
import { useGameContext } from '../contexts/Game';

const unclicked = '⚪️';
const clicked = '⚫️';
const loading = '...';

const Circle = () => {
    const { interpTotalScore, loaded, addValue } = useGameContext();
    const [icon, setIcon] = React.useState<typeof unclicked | typeof clicked | typeof loading>(loading);

    React.useEffect(() => {
        if (loaded) {
            setIcon(unclicked)
        }
    }, [loaded])

    return (
        <Stack justifyContent="center" alignItems="center" height="100%" gap="10px">
            <Stack direction="row">
                <Typography
                    borderRadius="100%"
                    fontSize="100px"
                    component="span"
                    width="100px"
                    height="100px"
                    lineHeight="1.06"
                    textAlign="center"
                    sx={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'filter 0.15s ease-in-out',
                        '&:hover': {
                            filter: 'drop-shadow(0 0 20px #888)',
                        },
                    }}
                    onMouseDown={() => setIcon(clicked)}
                    onMouseUp={() => setIcon(unclicked)}
                    onClick={() => addValue(1)}
                >
                    {icon}
                </Typography>
                {loaded && (
                    <Typography
                        fontSize="100px"
                        component="span"
                        width="100px"
                        height="100px"
                        lineHeight="1.06"
                        textAlign="center"
                        sx={{
                            userSelect: 'none',
                        }}
                    >
                        👈
                    </Typography>
                )}
            </Stack>
            <Typography
                component="span"
                textAlign="center"
                fontSize="30px"
            >
                {interpTotalScore}
            </Typography>
        </Stack >
    )
}

export default Circle;
