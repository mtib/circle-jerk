use std::{
    collections::HashMap,
    net::TcpStream,
    sync::{Arc, Mutex},
};

use tokio::sync::mpsc::{self, Sender};
use websocket::{
    server::upgrade::WsUpgrade,
    sync::{server::upgrade::Buffer, Server},
    Message,
};

type Name = String;
type Count = usize;
type State = HashMap<Name, Count>;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
enum ServerMessage {
    UpdateState { new_state: State },
    Log { message: String },
    ChatMessage { message: String, username: String },
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
enum ClientMessage {
    SetName { data: String },
    AddCount { data: usize },
    SendMessage { data: String },
}

#[derive(Debug, Clone)]
enum IntercomMessage {
    Proxy { message: ServerMessage },
}

impl<'a> From<&ServerMessage> for Message<'a> {
    fn from(update: &ServerMessage) -> Self {
        Message::text(serde_json::to_string(update).expect("Failed to serialize"))
    }
}

async fn handle_connection(
    connection: WsUpgrade<TcpStream, Option<Buffer>>,
    state: Arc<Mutex<State>>,
    list_of_connections: Arc<Mutex<Vec<Connection>>>,
    id: usize,
) {
    let mut client = connection.accept().unwrap();
    let own_name = Arc::new(Mutex::new(None as Option<String>));

    let (send, mut recv) = mpsc::channel(10);

    {
        let mut list = list_of_connections.lock().unwrap();
        list.push(Connection {
            id,
            sender: send,
            user: None,
        })
    }

    {
        let initial_state = state.lock().unwrap();

        let _ = client.send_message(&Message::from(&ServerMessage::UpdateState {
            new_state: initial_state.clone(),
        }));
        let _ = client.send_message(&Message::from(&ServerMessage::Log {
            message: format!("You are connection id {}", id),
        }));
    }

    let (mut client_receiver, client_sender) = client.split().unwrap();

    let client_sender_mutex = Arc::new(Mutex::new(client_sender));

    let client_reply_mutex = Arc::clone(&client_sender_mutex);
    let list_of_connections_client_reply_mutex = Arc::clone(&list_of_connections);
    let client_reply_own_name_mutex = Arc::clone(&own_name);
    tokio::task::spawn_blocking(move || {
        let mutate_self = |f: Box<dyn Fn(&mut Connection)>| {
            let mut list = list_of_connections_client_reply_mutex.lock().unwrap();
            let mut item = list.iter_mut().find(|con| con.id == id).unwrap();
            f(&mut item);
        };
        for message in client_receiver.incoming_messages() {
            if let Ok(msg) = message {
                let data = match &msg {
                    websocket::OwnedMessage::Text(text) => text.as_bytes().to_owned(),
                    websocket::OwnedMessage::Binary(data) => data.clone(),
                    _ => {
                        // Ignore other message types
                        continue;
                    }
                };
                match serde_json::from_slice::<ClientMessage>(&data) {
                    Ok(parsed_message) => match parsed_message {
                        ClientMessage::SetName { data: new_name } => {
                            let new_name_owner = new_name.clone();
                            *client_reply_own_name_mutex.lock().unwrap() =
                                Some(new_name_owner.clone());
                            mutate_self(Box::new(move |con| {
                                con.user = Some(new_name.clone());
                            }));
                            let list = list_of_connections_client_reply_mutex.lock().unwrap();
                            list.iter().filter(|con| con.id != id).for_each(|con| {
                                con.sender
                                    .try_send(IntercomMessage::Proxy {
                                        message: ServerMessage::Log {
                                            message: format!(
                                                "{} logged in",
                                                &new_name_owner.clone()
                                            ),
                                        },
                                    })
                                    .ok();
                            });
                        }
                        ClientMessage::AddCount { data: diff } => {
                            let name_opt = client_reply_own_name_mutex.lock().unwrap();
                            let mut state_handle = state.lock().unwrap();
                            if let Some(name) = name_opt.as_ref() {
                                let val = state_handle.get_mut(name);
                                if let Some(prev) = val {
                                    *prev += diff;
                                } else {
                                    state_handle.insert(name.clone(), diff);
                                }
                                let list = list_of_connections_client_reply_mutex.lock().unwrap();
                                list.iter().filter(|con| con.id != id).for_each(|con| {
                                    con.sender
                                        .try_send(IntercomMessage::Proxy {
                                            message: ServerMessage::UpdateState {
                                                new_state: state_handle.clone(),
                                            },
                                        })
                                        .ok();
                                });
                            }
                        }
                        ClientMessage::SendMessage { data: chat_message } => {
                            let name_opt = client_reply_own_name_mutex.lock().unwrap();
                            if let Some(name) = name_opt.as_ref() {
                                let list = list_of_connections_client_reply_mutex.lock().unwrap();
                                list.iter().filter(|con| con.id != id).for_each(|con| {
                                    con.sender
                                        .try_send(IntercomMessage::Proxy {
                                            message: ServerMessage::ChatMessage {
                                                message: (&chat_message).clone(),
                                                username: name.clone(),
                                            },
                                        })
                                        .ok();
                                });
                            }
                        }
                    },
                    Err(e) => {
                        let _ = client_reply_mutex
                            .lock()
                            .unwrap()
                            .send_message(&Message::from(&ServerMessage::Log {
                                message: format!("Failed to parse your message {:?}: {:?}", e, msg),
                            }));
                    }
                }
            } else {
                break;
            }
        }
        // Kill self by removing from list
        {
            let mut list = list_of_connections_client_reply_mutex.lock().unwrap();
            *list = list
                .iter()
                .filter(|con| con.id != id)
                .map(Connection::clone)
                .collect();
        }
    });

    tokio::spawn(async move {
        loop {
            let data = recv.recv().await;

            if let Some(msg) = data {
                match msg {
                    IntercomMessage::Proxy {
                        message: inner_message,
                    } => {
                        let _ = client_sender_mutex
                            .lock()
                            .unwrap()
                            .send_message(&Message::from(&inner_message));
                    }
                }
            } else {
                // Removed myself from list_of_connections
                let list = list_of_connections.lock().unwrap();
                let msg = {
                    let name_opt = own_name.lock().unwrap();
                    if let Some(name) = name_opt.as_ref() {
                        format!("{} has logged off", name)
                    } else {
                        format!("Connection id {} has logged off", id)
                    }
                };
                list.iter().for_each(|other| {
                    other
                        .sender
                        .try_send(IntercomMessage::Proxy {
                            message: ServerMessage::Log {
                                message: msg.clone(),
                            },
                        })
                        .ok();
                });
                return;
            }
        }
    });
}

#[derive(Debug, Clone)]
struct Connection {
    id: usize,
    sender: Sender<IntercomMessage>,
    user: Option<Name>,
}

#[tokio::main]
async fn main() {
    let server = Server::bind("127.0.0.1:7776").expect("Failed to bind");

    let state = Arc::new(Mutex::new(HashMap::<Name, Count>::new()));
    let list_of_connections = Arc::new(Mutex::new(Vec::<Connection>::new()));
    let mut id = 0;

    for connection in server.filter_map(Result::ok) {
        let connection_id = id;
        id += 1;
        tokio::spawn(handle_connection(
            connection,
            Arc::clone(&state),
            Arc::clone(&list_of_connections),
            connection_id,
        ));
    }
}
