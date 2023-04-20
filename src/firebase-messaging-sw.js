importScripts("https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js");
importScripts(
  "https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCI0yjnNuT8VWJG4ow38-iY231ZoTGxV-o",
  authDomain: "lessgo-alor.firebaseapp.com",
  projectId: "lessgo-alor",
  storageBucket: "lessgo-alor.appspot.com",
  messagingSenderId: "766412584747",
  appId: "1:766412584747:web:5f84a1aaf533f01013776e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (!payload.data.body) {
    return;
  }

  const messageData = JSON.parse(payload.data.body).notification;

  if (messageData) {
    return self.registration.showNotification(messageData.title,
      messageData
    );
  }
});
