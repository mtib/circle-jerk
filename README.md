# Circle-Jerk

Light Websocket-based cooperative clicker game

## Server

Written in Rust.

```sh
cd server
cargo build
cargo run # runs ws on port 7776
```

## Client

Written in Typescript + React.

```sh
cd client
yarn
# configure .env to point to where the server is running
yarn build
yarn start
```
