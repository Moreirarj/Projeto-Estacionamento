// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBVqZbmF-5EjESHnkrcOdPcqhEi7AP5Hec",
  authDomain: "estacionamento-friendely.firebaseapp.com",
  projectId: "estacionamento-friendely",
  storageBucket: "estacionamento-friendely.firebasestorage.app",
  messagingSenderId: "470983133846",
  appId: "1:470983133846:web:7c8fc5abe2b14289d310b7",
  measurementId: "G-XM9VNG5P9F"
};
// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);

// Export para usar em outros arquivos
export { app, db };