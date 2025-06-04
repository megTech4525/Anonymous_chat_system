import './index.css';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjws2n_R3akeE8ekdFFG2GdiSdR1DJwXA",
  authDomain: "chat-system-32e01.firebaseapp.com",
  projectId: "chat-system-32e01",
  storageBucket: "chat-system-32e01.appspot.com",
  messagingSenderId: "829392361987",
  appId: "1:829392361987:web:72c633093d175f89630c36",
  measurementId: "G-VJDHQHFRQ7",
  databaseURL: "https://chat-system-32e01-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Sign in anonymously and track user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        signInAnonymously(auth)
          .then((result) => setCurrentUser(result.user))
          .catch((error) => console.error("Sign-in error:", error));
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  // Send message
  const handleSend = () => {
    if (!currentUser) return;
    if (message.trim() !== '') {
      const chatRef = ref(database, 'messages/');
      push(chatRef, {
        text: message,
        timestamp: Date.now(),
        senderId: currentUser.uid
      });
      setMessage('');
    }
  };

  // Fetch messages + auto-delete old ones
  useEffect(() => {
    const chatRef = ref(database, 'messages/');
    onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const chatArray = [];

      if (data) {
        for (const key in data) {
          const msg = data[key];
          const age = now - msg.timestamp;

          if (age > oneDay) {
            const messageRef = ref(database, `messages/${key}`);
            remove(messageRef);
          } else {
            chatArray.push({
              id: key,
              text: msg.text,
              timestamp: msg.timestamp,
              senderId: msg.senderId || null
            });
          }
        }
      }

      setMessages(chatArray);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className='body'>
          <div className='head'>
            <h3>Chat Anonymously</h3>
          </div>
          <div className='msgg'>
            <div className='messages'>
              {messages.map((msg) => {
                const isMe = currentUser && msg.senderId === currentUser.uid;
                return (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${isMe ? 'sent' : 'received'}`}
                  >
                    {msg.text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className='chatinput'>
            <input
              type='text'
              value={message}
              onChange={handleChange}
              placeholder='Chat here...'
            />
            <span onClick={handleSend}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </span>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
