// ATENÇÃO: Cole aqui a configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// --- LÓGICA DA LISTA DE CONVIDADOS ---

const guestListContainer = document.getElementById('guest-list-container');
const guestsCollection = db.collection('guests');

// Função para renderizar a lista na tela
const renderGuestList = (doc) => {
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.classList.add('guest-item');
    guestItem.setAttribute('data-id', doc.id);

    const guestName = document.createElement('span');
    guestName.textContent = `${guest.id} - ${guest.name}`;
    guestItem.appendChild(guestName);

    if (guest.confirmed) {
        guestItem.classList.add('confirmed');
        const checkmark = document.createElement('span');
        checkmark.textContent = '✅ Confirmado';
        guestItem.appendChild(checkmark);
    } else {
        const uploadButton = document.createElement('button');
        uploadButton.textContent = 'Enviar Comprovante';
        uploadButton.classList.add('upload-btn');
        uploadButton.addEventListener('click', () => openUploadModal(guest.name, doc.id));
        guestItem.appendChild(uploadButton);
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


// --- LÓGICA DO MODAL DE UPLOAD ---

const modal = document.getElementById('uploadModal');
const guestNameEl = document.getElementById('guestName');
const closeButton = document.querySelector('.close-button');
const submitReceiptBtn = document.getElementById('submitReceiptBtn');
const receiptFile = document.getElementById('receiptFile');
const uploadStatus = document.getElementById('uploadStatus');
let currentGuestDocId = null;

// Abre o modal
function openUploadModal(name, docId) {
    guestNameEl.textContent = name;
    currentGuestDocId = docId;
    uploadStatus.textContent = '';
    receiptFile.value = ''; // Limpa o campo de arquivo
    modal.style.display = 'block';
}

// Fecha o modal
closeButton.onclick = () => {
    modal.style.display = 'none';
};
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Lógica para enviar o comprovante
submitReceiptBtn.addEventListener('click', () => {
    const file = receiptFile.files[0];
    if (!file) {
        uploadStatus.textContent = 'Por favor, selecione um arquivo.';
        return;
    }
    if (!currentGuestDocId) {
        uploadStatus.textContent = 'Erro: Convidado não identificado.';
        return;
    }

    uploadStatus.textContent = 'Enviando...';
    submitReceiptBtn.disabled = true;

    // Cria uma referência no Firebase Storage
    const storageRef = storage.ref(`receipts/${currentGuestDocId}-${new Date().getTime()}-${file.name}`);
    
    // Faz o upload do arquivo
    const task = storageRef.put(file);

    task.on('state_changed',
        (snapshot) => {
            // Acompanha o progresso do upload (opcional)
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadStatus.textContent = 'Enviando: ' + progress.toFixed(0) + '%';
        },
        (error) => {
            // Lida com erros
            console.error(error);
            uploadStatus.textContent = 'Erro ao enviar. Tente novamente.';
            submitReceiptBtn.disabled = false;
        },
        () => {
            // Upload concluído com sucesso
            uploadStatus.textContent = 'Comprovante enviado! Aguardando confirmação.';
            
            // O ideal é você confirmar manualmente no Firestore após ver o comprovante.
            // Para automatizar, você pode usar uma Cloud Function ou simplesmente
            // marcar como confirmado no banco de dados aqui.
            // Para simplicidade, vamos deixar o status apenas como "enviado".
            // Para confirmar:
            // guestsCollection.doc(currentGuestDocId).update({ confirmed: true });
            
            setTimeout(() => {
                modal.style.display = 'none';
                submitReceiptBtn.disabled = false;
            }, 2000);
        }
    );
});