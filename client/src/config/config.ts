declare global {
    // eslint-disable-next-line no-unused-vars
    const process: {
        env: Record<string, string>,
    }
}

export const WEBSOCKET_URL_STRING = process.env['WEBSOCKET_URL'];
