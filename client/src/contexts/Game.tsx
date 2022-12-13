import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import * as React from 'react';
import { ADD_COUNT, Callback, ServerState, SET_NAME, UPDATE_STATE_TYPE, useWebsocketContext } from './Websocket';
import { throttle } from 'lodash';

export type GameContextValue = {
    state: ServerState,
    interpState: ServerState,
    totalScore: number,
    interpTotalScore: number,
    name: string | null,
    loaded: boolean,
    // eslint-disable-next-line no-unused-vars
    addValue: (diff: number) => void,
}

const GameContext = React.createContext<GameContextValue | null>(null);
const NAME_KEY = 'player-name';
const INTERVAL_MS = 1000;

const GameProvider = ({ children }) => {

    const { addEventListener, removeEventListener, sendMessage, ready, closed } = useWebsocketContext();

    const [state, setState] = React.useState<null | ServerState>(null);
    const [interpState, setInterpState] = React.useState<null | ServerState>(null);

    const [name, setName] = React.useState<string | null>(null);

    React.useEffect(() => {
        const item = localStorage.getItem(NAME_KEY);
        if (item) {
            setName(item);
        }
    }, []);

    React.useEffect(() => {
        if (name) {
            localStorage.setItem(NAME_KEY, name);
        }
    }, [name]);

    React.useEffect(() => {
        if (name) {
            sendMessage({
                type: SET_NAME,
                data: name,
            });
        }
    }, [name, sendMessage]);

    React.useEffect(() => {
        setInterpState(current => {
            if (current === null && state !== null) {
                return state;
            }
            if (current !== null && state !== null) {
                if (Object.keys(current).length !== Object.keys(state).length) {
                    return state;
                }
            }
            return current;
        })
    }, [state]);

    React.useEffect(() => {
        const handler: Callback<typeof UPDATE_STATE_TYPE> = (data) => {
            setState(data.new_state);
        };
        addEventListener(UPDATE_STATE_TYPE, handler);
        return () => {
            removeEventListener(UPDATE_STATE_TYPE, handler);
        }
    }, [addEventListener, removeEventListener]);

    const totalScore = React.useMemo(() => state ? Object.values(state).reduce((acc, next) => acc + next, 0) : 0, [state]);
    const interpTotalScore = React.useMemo(() => interpState ? Object.values(interpState).reduce((acc, next) => acc + next, 0) : 0, [interpState]);

    const [unsynchedDiff, setUnsynchedDiff] = React.useState(0);

    const updateServerThrottled = React.useMemo(() => throttle((add: number) => {
        sendMessage({
            type: ADD_COUNT,
            data: add,
        });
        setUnsynchedDiff(0);
    }, INTERVAL_MS, { leading: false, trailing: true }), [sendMessage]);

    React.useEffect(() => {
        if (unsynchedDiff === 0) {
            return () => { };
        }
        updateServerThrottled(unsynchedDiff);
    }, [unsynchedDiff, updateServerThrottled]);

    React.useEffect(() => {
        if (!interpState || !state || Object.keys(state).some(player => interpState[player] === undefined)) {
            return () => { };
        }
        const players = Object.keys(interpState);
        const difference = Object.fromEntries(players.map(player => [player, state[player] - interpState[player]] as const));
        const differenceSum = Object.values(difference).reduce((acc, next) => acc + next, 0);

        if (differenceSum === 0) {
            return () => { };
        }

        const interval = setTimeout(() => {
            setInterpState(current => current === null ? null : Object.fromEntries(Object.entries(current)
                .map(([player, current]) => [player, Math.ceil(current + Math.min(difference[player], 1))] as const)))
        }, INTERVAL_MS / 7);

        return () => {
            clearTimeout(interval);
        }
    }, [interpState, state]);

    const addValue: GameContextValue['addValue'] = React.useCallback((diff) => {
        if (name === null) {
            throw new Error('Cant play without name');
        }
        setUnsynchedDiff((currentUnsynchedDiff) => currentUnsynchedDiff + diff);
        setState((currentState) => ({ ...currentState, [name]: (currentState?.[name] || 0) + diff }))
        setInterpState((currentInterpState) => ({ ...currentInterpState, [name]: (currentInterpState?.[name] || 0) + diff }))
    }, [name]);

    const value = React.useMemo(() => ({
        state: state || {},
        totalScore,
        loaded: state !== null,
        addValue,
        name,
        interpState: interpState || {},
        interpTotalScore,
    }), [addValue, interpState, interpTotalScore, name, state, totalScore]);

    const [temporaryName, setTemporaryName] = React.useState('');

    return (
        <GameContext.Provider value={value}>
            {children}
            <Dialog open={name === null && ready && !closed}>
                <DialogTitle>Choose a name</DialogTitle>
                <DialogContent>
                    <TextField value={temporaryName} onChange={(event) => setTemporaryName(event.target.value)}></TextField>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setName(temporaryName);
                        }}
                        disabled={!temporaryName}
                    >
                        Go
                    </Button>
                </DialogActions>
            </Dialog>
        </GameContext.Provider>
    )
}

export const useGameContext = () => {
    const context = React.useContext(GameContext);
    if (context === null) {
        throw new Error('Cannot use GameContext without GameProvider');
    }
    return context;
}

export default GameProvider;
