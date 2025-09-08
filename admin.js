// ATENÇÃO: Cole aqui a MESMA configuração do seu projeto Firebase que você usou no script.js
const firebaseConfig = {
apiKey: "AIzaSyAjgzXuxHtOO32rzLGCmgOVN5gV8OzeImE",
  authDomain: "natal2025-4b00f.firebaseapp.com",
  projectId: "natal2025-4b00f",
  storageBucket: "natal2025-4b00f.firebasestorage.app",
  messagingSenderId: "1011045410547",
  appId: "1:1011045410547:web:10305de407f87442f17986",
  measurementId: "G-YCPLK7YY9B"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- LISTA DE CONVIDADOS ---
// Array com todos os nomes e status de confirmação
const guestData = [
    { id: 1, name: 'Gelmi', confirmed: false },
    { id: 2, name: 'Renata', confirmed: false },
    { id: 3, name: 'Letícia', confirmed: false },
    { id: 4, name: 'Ana clara', confirmed: true },
    { id: 5, name: 'Adriana', confirmed: false },
    { id: 6, name: 'Eduardo', confirmed: false },
    { id: 7, name: 'Cecília', confirmed: true },
    { id: 8, name: 'Vanderlei', confirmed: false },
    { id: 9, name: 'Cristiano', confirmed: false },
    { id: 10, name: 'Roberta', confirmed: false },
    { id: 11, name: 'Ryan', confirmed: false },
    { id: 12, name: 'Caio', confirmed: false },
    { id: 13, name: 'Loren', confirmed: true },
    { id: 14, name: 'Lindalva', confirmed: true },
    { id: 15, name: 'Gustavo', confirmed: true },
    { id: 16, name: 'Natália', confirmed: true },
    // O número 17 foi pulado na lista original
    { id: 18, name: 'Natal', confirmed: true },
    { id: 19, name: 'Dade', confirmed: true },
    { id: 20, name: 'Edinilson', confirmed: false },
    { id: 21, name: 'Elma', confirmed: true },
    { id: 22, name: 'Paulo', confirmed: true },
    { id: 23, name: 'Michelle', confirmed: true },
    { id: 24, name: 'Fagner', confirmed: true },
    { id: 25, name: 'João Pedro', confirmed: true },
    { id: 26, name: 'Walex', confirmed: true },
    { id: 27, name: 'Lara', confirmed: true },
    { id: 28, name: 'Paulo (Michel)', confirmed: false },
    { id: 29, name: 'Sara', confirmed: false },
    { id: 30, name: 'Michel', confirmed: false },
    { id: 31, name: 'Marco Aurélio', confirmed: false },
    { id: 32, name: 'Joilson', confirmed: false },
    { id: 33, name: 'Gabriela', confirmed: false },
    { id: 34, name: 'Jurandir', confirmed: false },
    { id: 35, name: 'Francione', confirmed: false },
    { id: 36, name: 'Isabele', confirmed: false },
    { id: 37, name: 'Sofia', confirmed: false },
    { id: 38, name: 'Pedrinho', confirmed: false },
    { id: 39, name: 'Eva', confirmed: false },
    { id: 40, name: 'Alice', confirmed: true },
    { id: 41, name: 'Miguel', confirmed: true },
    { id: 42, name: 'Valtinho', confirmed: false },
    { id: 43, name: 'Roni', confirmed: false },
    { id: 44, name: 'Telma', confirmed: false },
    { id: 45, name: 'Anderson', confirmed: false },
    { id: 46, name: 'Felipe', confirmed: false },
    { id: 47, name: 'Heloísa', confirmed: false },
    { id: 48, name: 'Delmi', confirmed: false },
    { id: 49, name: 'Larsen', confirmed: false },
    { id: 50, name: 'Ana Alice', confirmed: false },
    { id: 51, name: 'André', confirmed: true },
    { id: 52, name: 'Conceição', confirmed: true },
    { id: 53, name: 'Ângela', confirmed: true },
    { id: 54, name: 'João Felipe', confirmed: true },
    { id: 55, name: 'Camila', confirmed: true },
    { id: 56, name: 'Vani', confirmed: true },
    { id: 57, name: 'Michelle (Camila)', confirmed: true }
];


// --- FUNÇÃO PARA POPULAR O BANCO DE DADOS ---
const populateDbBtn = document.getElementById('populateDbBtn');
const statusDiv = document.getElementById('status');

populateDbBtn.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja adicionar todos os 57 convidados ao banco de dados? Esta ação não deve ser repetida.')) {
        return;
    }

    statusDiv.textContent = 'Adicionando convidados... Por favor, aguarde.';
    populateDbBtn.disabled = true;

    // Usamos um "batch" para enviar todos os dados de uma vez, o que é mais eficiente.
    const batch = db.batch();

    guestData.forEach(guest => {
        // Cria uma referência para um novo documento na coleção 'guests'.
        // Usar .doc() sem argumento gera um ID aleatório, o que é uma boa prática.
        const docRef = db.collection('guests').doc(); 
        batch.set(docRef, guest);
    });

    try {
        await batch.commit();
        statusDiv.textContent = 'Sucesso! Todos os convidados foram adicionados ao banco de dados.';
        statusDiv.style.color = 'green';
        console.log('Banco de dados populado com sucesso!');
    } catch (error) {
        statusDiv.textContent = 'Erro ao adicionar convidados. Verifique o console para mais detalhes.';
        statusDiv.style.color = 'red';
        console.error("Erro ao escrever o batch: ", error);
    }
});