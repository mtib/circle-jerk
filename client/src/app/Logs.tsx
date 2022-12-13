import { Box, Stack, Typography } from '@mui/material';
import * as React from 'react';
import { Callback, LOG_TYPE, useWebsocketContext } from '../contexts/Websocket';

const Logs = () => {
    const { addEventListener, removeEventListener } = useWebsocketContext();
    const [logs, setLogs] = React.useState<{ message: string, time: Date }[]>([]);

    React.useEffect(() => {
        const handler: Callback<typeof LOG_TYPE> = (data) => {
            setLogs((current) => [...current, { message: data.message, time: new Date() }])
        };
        addEventListener(LOG_TYPE, handler);
        return () => {
            removeEventListener(LOG_TYPE, handler);
        }
    }, [addEventListener, removeEventListener]);

    const logRef = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        const logEl = logRef.current;
        if (!logEl) {
            return;
        }
        logEl.scrollTop = 999999999;
    }, [logs])

    return (
        <Box height="100%" overflow="auto" ref={logRef}>
            <Stack>
                {logs.map(({ message, time }) => (
                    <Stack key={time.getTime()} direction="row" gap="10px" p="5px 10px" minWidth={0}>
                        <Typography color="#777">
                            {time.toLocaleTimeString()}
                        </Typography>
                        <Typography minWidth={0} color="#777">
                            {message}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
}

export default Logs;
