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

    // --- INÍCIO DA LÓGICA DE CÁLCULO DO VALOR POR PESSOA ---
    const valorTotal = 3000;
    const costPerPersonElement = document.getElementById('cost-per-person');

    // 1. Filtra para encontrar apenas os adultos confirmados
    const adultosConfirmados = snapshot.docs.filter(doc => {
        const guest = doc.data();
        return guest.confirmed === true && guest.isChild === false;
    });

    // 2. Conta quantos são
    const numeroDePagantes = adultosConfirmados.length;

    // 3. Calcula o valor e exibe na tela
    if (numeroDePagantes > 0) {
        const valorPorPessoa = valorTotal / numeroDePagantes;
        // Formata o valor como moeda brasileira (R$ XX,XX)
        const valorFormatado = valorPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        costPerPersonElement.innerHTML = `🎉 Valor por pessoa (adulto): <strong>${valorFormatado}</strong>`;
    } else {
        costPerPersonElement.innerHTML = "Aguardando confirmações para calcular o valor por pessoa...";
    }
    // --- FIM DA LÓGICA DE CÁLCULO ---


    // Renderiza a lista de convidados (lógica que já existia)
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

// Substitua a função de envio de comprovante por esta

submitReceiptBtn.addEventListener('click', () => {
    const file = receiptFile.files[0];
    if (!file || !currentGuestDocId) {
        uploadStatus.textContent = 'Erro: Arquivo ou convidado não selecionado.';
        return;
    }

    const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec"; // Certifique-se que sua URL está aqui

    uploadStatus.textContent = 'Enviando e confirmando...';

    submitReceiptBtn.disabled = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
        const fileData = reader.result;
        const fileInfo = {
            fileName: file.name,
            fileType: file.type,
            fileData: fileData,
            guestId: currentGuestDocId // <-- Enviando o ID do convidado!
        };

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(fileInfo)
        })
        .then(res => res.json()) // Agora podemos ler a resposta!
        .then(response => {
            if (response.status === "success") {
                uploadStatus.textContent = 'Sucesso! Presença confirmada!';
                // O site vai atualizar sozinho por causa do onSnapshot,
                // mas fechamos o modal após um tempo.
                setTimeout(() => {
                    modal.style.display = 'none';
                    submitReceiptBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(response.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            uploadStatus.textContent = 'Erro ao confirmar. Tente novamente.';
            submitReceiptBtn.disabled = false;
        });
    };

    reader.onerror = error => {
        console.error('Erro ao ler o arquivo:', error);
        uploadStatus.textContent = 'Erro ao processar o arquivo.';
        submitReceiptBtn.disabled = false;
    };
});