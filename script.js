// ATENÇÃO: Cole aqui a configuração do seu projeto Firebase
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
const storage = firebase.storage();

const guestListContainer = document.getElementById('guest-list-container');
const guestsCollection = db.collection('guests');

// --- LÓGICA DA LISTA DE CONVIDADOS ---
const renderGuestList = (doc) => {
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.classList.add('guest-item');
    guestItem.setAttribute('data-id', doc.id);

    const guestName = document.createElement('span');
    guestName.textContent = `${guest.id} - ${guest.name}`;
    guestItem.appendChild(guestName);

    // Estado 1: Pagamento Confirmado (Verde)
    if (guest.confirmed) {
        guestItem.classList.add('paid');
        const checkmark = document.createElement('span');
        checkmark.innerHTML = '✅ Pagamento Confirmado';
        guestItem.appendChild(checkmark);
    } 
    // Estado 2: Presença Confirmada, aguardando pagamento (Amarelo)
    else if (guest.presence_confirmed) {
        guestItem.classList.add('presence-confirmed');
        const uploadButton = document.createElement('button');
        uploadButton.textContent = 'Enviar Comprovante';
        uploadButton.classList.add('upload-btn');
        uploadButton.addEventListener('click', () => openUploadModal(guest.name, doc.id));
        guestItem.appendChild(uploadButton);
    } 
    // Estado 3: Ainda não confirmou a presença (Branco)
    else {
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirmar Presença';
        confirmButton.classList.add('presence-btn');
        confirmButton.addEventListener('click', () => {
            // Atualiza o documento no Firestore
            guestsCollection.doc(doc.id).update({ presence_confirmed: true });
        });
        guestItem.appendChild(confirmButton);
    }

    guestListContainer.appendChild(guestItem);
};

// Escuta por mudanças na coleção de convidados em tempo real
guestsCollection.orderBy('id').onSnapshot(snapshot => {
    guestListContainer.innerHTML = ''; // Limpa a lista antes de renderizar
    snapshot.docs.forEach(doc => {
        renderGuestList(doc);
    });
});

// --- LÓGICA DO MODAL DE UPLOAD (sem alterações) ---
// ... (o código do modal continua o mesmo de antes) ...
const modal = document.getElementById('uploadModal');
const guestNameEl = document.getElementById('guestName');
const closeButton = document.querySelector('.close-button');
const submitReceiptBtn = document.getElementById('submitReceiptBtn');
const receiptFile = document.getElementById('receiptFile');
const uploadStatus = document.getElementById('uploadStatus');
let currentGuestDocId = null;

function openUploadModal(name, docId) {
    guestNameEl.textContent = name;
    currentGuestDocId = docId;
    uploadStatus.textContent = '';
    receiptFile.value = '';
    modal.style.display = 'block';
}

closeButton.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

// Cole esta nova versão da função no seu script.js

submitReceiptBtn.addEventListener('click', () => {
    const file = receiptFile.files[0];
    if (!file) {
        uploadStatus.textContent = 'Por favor, selecione um arquivo.';
        return;
    }

    // Cole a URL do seu App da Web do Google Apps Script aqui
    const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec";

    uploadStatus.textContent = 'Enviando...';
    submitReceiptBtn.disabled = true;

    // Usa o FileReader para converter a imagem para texto (base64)
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
        const fileData = reader.result;
        const fileInfo = {
            fileName: file.name,
            fileType: file.type,
            fileData: fileData // O arquivo convertido
        };

        // Envia os dados para a nossa "ponte" (Google Apps Script)
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors', // Importante para evitar erros de CORS com Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fileInfo)
        })
        .then(response => {
            // Como usamos 'no-cors', não conseguimos ler a resposta detalhada,
            // mas um envio bem-sucedido já é suficiente.
            uploadStatus.textContent = 'Comprovante enviado com sucesso!';

            // Importante: Após o envio, você ainda precisa ir no Firebase e
            // marcar manualmente o campo "confirmed" da pessoa como "true"
            // para o card dela ficar verde.
            setTimeout(() => {
                modal.style.display = 'none';
                submitReceiptBtn.disabled = false;
            }, 2500);

        })
        .catch(error => {
            console.error('Erro ao enviar o arquivo:', error);
            uploadStatus.textContent = 'Erro ao enviar. Tente novamente.';
            submitReceiptBtn.disabled = false;
        });
    };

    reader.onerror = error => {
        console.error('Erro ao ler o arquivo:', error);
        uploadStatus.textContent = 'Erro ao processar o arquivo.';
        submitReceiptBtn.disabled = false;
    };
});