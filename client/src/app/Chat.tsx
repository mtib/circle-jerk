import { Button, Stack, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { useGameContext } from '../contexts/Game';
import { Callback, CHAT_MESSAGE_TYPE, SEND_MESSAGE, useWebsocketContext } from '../contexts/Websocket';

const Chat = () => {
    const { sendMessage, addEventListener, removeEventListener } = useWebsocketContext();
    const { name } = useGameContext();

    const [messages, setMessages] = React.useState<{
        time: Date,
        message: string,
        sender: string,
    }[]>([]);

    React.useEffect(() => {
        const handler: Callback<typeof CHAT_MESSAGE_TYPE> = (data) => {
            setMessages(messages => [...messages, {
                time: new Date(),
                message: data.message,
                sender: data.username,
            }]);
        };

        addEventListener(CHAT_MESSAGE_TYPE, handler);
        return () => {
            removeEventListener(CHAT_MESSAGE_TYPE, handler);
        }
    }, [addEventListener, removeEventListener]);

    const [tempMessage, setTempMessage] = React.useState('');

    const onSend = React.useCallback(() => {
        const trimmedTempMessage = tempMessage.trim();
        if (!trimmedTempMessage || !name) {
            return;
        }
        setMessages(current => [...current, {
            sender: name,
            message: trimmedTempMessage,
            time: new Date(),
        }]);
        sendMessage({
            type: SEND_MESSAGE,
            data: trimmedTempMessage,
        })
        setTempMessage('');
    }, [name, sendMessage, tempMessage]);

    const messagesRef = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        const messagesEl = messagesRef.current;
        if (!messagesEl) {
            return;
        }
        messagesEl.scrollTop = 99999999999999;
    }, [messages]);

    return (
        <Stack height="100%" width="100%" p="10px 8px" gap="5px">
            <Stack flexGrow={1} sx={{ overflowX: 'hidden', overflowY: 'auto' }} ref={messagesRef}>
                {messages.map(({ time, message, sender }) => (
                    <Stack direction="row" key={time.getTime()} gap="10px">
                        <Typography flexShrink={0} noWrap textOverflow="initial">{time.toLocaleTimeString()}</Typography>
                        <Typography flexShrink={0} fontWeight={700} noWrap textOverflow="initial">{`${sender}:`}</Typography>
                        <Typography flexShrink={1} minWidth={0} sx={{ wordBreak: 'break-word' }}>{message}</Typography>
                    </Stack>
                ))}
            </Stack>
            <Stack direction="row" gap="6px">
                <TextField
                    sx={{
                        flexGrow: 1,
                    }}
                    value={tempMessage}
                    onChange={(event) => {
                        setTempMessage(event.target.value)
                    }}
                    onKeyUp={(event) => {
                        if (event.key === 'Enter') {
                            onSend();
                        }
                    }}
                    disabled={name === null}
                />
                <Button onClick={onSend}>Send</Button>
            </Stack>
        </Stack>
    )
};

export default Chat;
