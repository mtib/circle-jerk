import { Stack, Typography } from '@mui/material';
import * as React from 'react';
import { useGameContext } from '../contexts/Game';

const Circle = () => {
    const { interpTotalScore, loaded, addValue } = useGameContext();
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
                    }}
                    onClick={() => addValue(1)}
                >
                    {loaded ? '⚪️' : '...'}
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
