/* eslint-disable no-unused-vars */
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import * as React from 'react';
import { WEBSOCKET_URL_STRING } from '../config/config';
import { throttle } from 'lodash';

export type Callback<T extends WebsocketServerMessage['type']> = (event: WebsocketServerMessage & { type: T }) => unknown;
export type ChangeEventListener<T extends WebsocketServerMessage['type']> = (eventType: T, handler: Callback<T>) => void;
export type WebsocketContextValue = {
    websocket: WebSocket | null,
    addEventListener: ChangeEventListener<typeof LOG_TYPE> & ChangeEventListener<typeof UPDATE_STATE_TYPE> & ChangeEventListener<typeof CHAT_MESSAGE_TYPE>,
    removeEventListener: WebsocketContextValue['addEventListener'],
    ready: boolean,
    closed: boolean,
    sendMessage: (message: ClientMessage) => void,
}

const WebsocketContext = React.createContext<WebsocketContextValue | null>(null);

export const LOG_TYPE = "Log";
export const UPDATE_STATE_TYPE = "UpdateState";
export const CHAT_MESSAGE_TYPE = "ChatMessage";

export type ServerState = Record<string, number>;

export type UpdateStateMessage = {
    type: typeof UPDATE_STATE_TYPE,
    new_state: ServerState,
}
export type LogMessage = {
    type: typeof LOG_TYPE,
    message: string,
}
export type ChatMessageMessage = {
    type: typeof CHAT_MESSAGE_TYPE,
    message: string,
    username: string,
}

export type WebsocketServerMessage = UpdateStateMessage | LogMessage | ChatMessageMessage;

export const SET_NAME = "SetName";
export const ADD_COUNT = "AddCount";
export const SEND_MESSAGE = "SendMessage";

export const CLIENT_MESSAGE_TYPES = [
    SET_NAME,
    ADD_COUNT,
    SEND_MESSAGE,
] as const;

export type ClientMessage = {
    type: typeof CLIENT_MESSAGE_TYPES[number],
    data: unknown,
};

const WebsocketProvider = ({ children }) => {

    const [websocket, setWebsocket] = React.useState<WebSocket | null>(null);
    const [ready, setReady] = React.useState(false);
    const [closed, setClosed] = React.useState(false);

    const connect = React.useCallback(() => {
        const ws = new WebSocket(WEBSOCKET_URL_STRING);
        ws.addEventListener('open', () => {
            setReady(true);
            setClosed(false);
        })
        setWebsocket(ws);

        return () => {
            setReady(false);
            ws.close();
            setWebsocket(null);
        }
    }, []);

    React.useEffect(() => {
        return connect();
    }, [connect]);

    const [callbacks, setCallbacks] = React.useState<{ type: WebsocketServerMessage['type'], handler: Callback<WebsocketServerMessage['type']> }[]>([]);

    React.useEffect(() => {
        if (websocket === null) {
            return;
        }
        const handler = ({ data }) => {
            const parsed = JSON.parse(data) as WebsocketServerMessage;
            callbacks.forEach(({ type, handler }) => {
                if (type === parsed.type) {
                    handler(parsed);
                }
            });
        }
        websocket.addEventListener('message', handler);
        return () => {
            websocket.removeEventListener('message', handler);
        }
    }, [callbacks, websocket]);

    React.useEffect(() => {
        if (!websocket) {
            return;
        }
        const handler = () => {
            setClosed(true);
        };
        websocket.addEventListener('close', handler);
        websocket.addEventListener('error', handler);
        return () => {
            websocket.removeEventListener('close', handler);
            websocket.removeEventListener('error', handler);
        }
    }, [websocket]);

    const addEventListener: WebsocketContextValue['addEventListener'] = React.useCallback((eventName, callback) => {
        setCallbacks((currentCallbacks) => [...currentCallbacks, { type: eventName, handler: callback }]);
    }, []);

    const removeEventListener: WebsocketContextValue['removeEventListener'] = React.useCallback((eventName, callback) => {
        setCallbacks((currentCallbacks) => currentCallbacks.filter(({ type, handler }) => type !== eventName && callback !== handler));
    }, []);

    const sendMessage: WebsocketContextValue['sendMessage'] = React.useCallback((message) => {
        if (websocket === null || !ready) {
            return;
        }
        websocket.send(JSON.stringify(message));
    }, [ready, websocket]);

    React.useEffect(() => {
        if (!closed) {
            return;
        }
        const retry = throttle(async () => {
            const ws = new WebSocket(WEBSOCKET_URL_STRING);
            const giveUp = () => {
                ws.close();
            }
            ws.addEventListener('close', giveUp);
            ws.addEventListener('error', giveUp);
            const timeout = setTimeout(giveUp, 500);
            ws.addEventListener('open', () => {
                clearTimeout(timeout);
                ws.removeEventListener('close', giveUp);
                ws.removeEventListener('error', giveUp);
                setReady(true);
                setClosed(false);
                setWebsocket(ws);
            })
        }, 500);
        retry();
        const retryTimeout = setInterval(retry, 1000);

        return () => {
            clearInterval(retryTimeout);
        }
    }, [closed, connect]);

    const value = React.useMemo(() => ({
        websocket,
        addEventListener,
        removeEventListener,
        sendMessage,
        ready,
        closed,
    }), [addEventListener, closed, ready, removeEventListener, sendMessage, websocket]);

    return (
        <WebsocketContext.Provider value={value}>
            {children}
            <Dialog open={closed}>
                <DialogTitle>Something went wrong</DialogTitle>
                <DialogContent>The websocket closed, reload to try to reconnect</DialogContent>
                <DialogActions><Button onClick={() => {
                    window.location.reload();
                }}>Reload</Button></DialogActions>
            </Dialog>
        </WebsocketContext.Provider>
    )
};

export const useWebsocketContext = () => {
    const context = React.useContext(WebsocketContext);
    if (context === null) {
        throw new Error('Cant use WebsocketContext without WebsocketProvider');
    }
    return context;
}

export default WebsocketProvider;
