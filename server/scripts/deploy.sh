#!/bin/bash

cross build --target x86_64-unknown-linux-gnu --release
scp target/x86_64-unknown-linux-gnu/release/server root@feeds.mtib.dev:./containers/circle/circle-server/circle-server
