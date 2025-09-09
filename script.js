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

// --- ELEMENTOS GLOBAIS ---
const guestListContainer = document.getElementById('guest-list-container');
const guestsCollection = db.collection('guests');
const modal = document.getElementById('uploadModal');
const submitReceiptBtn = document.getElementById('submitReceiptBtn');


// --- LÓGICA PRINCIPAL EM TEMPO REAL ---
// ALTERAÇÃO AQUI: orderBy('name') para ordenar em ordem alfabética
guestsCollection.orderBy('name').onSnapshot(snapshot => {
    guestListContainer.innerHTML = ''; // Limpa a lista antes de renderizar
    
    // --- LÓGICA DE CÁLCULO DO VALOR POR PESSOA ---
    const valorTotal = 3000;
    const costPerPersonElement = document.getElementById('cost-per-person');

    // Filtra para encontrar apenas os adultos pagantes que confirmaram presença
    const adultosPagantes = snapshot.docs.filter(doc => {
        const guest = doc.data();
        return guest.presence_confirmed === true && 
               !guest.isChild &&
               (guest.isPaying === undefined || guest.isPaying === true);
    });

    const numeroDePagantes = adultosPagantes.length;

    if (numeroDePagantes > 0) {
        const valorPorPessoa = valorTotal / numeroDePagantes;
        const valorFormatado = valorPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        costPerPersonElement.innerHTML = `Valor por pessoa (adulto): <strong>${valorFormatado}</strong> (${numeroDePagantes} pagantes)`;
    } else {
        costPerPersonElement.innerHTML = "Aguardando confirmações de pagantes para calcular o valor...";
    }
    // --- FIM DA LÓGICA DE CÁLCULO ---

    // Renderiza cada convidado na lista
    snapshot.docs.forEach(doc => renderGuest(doc));
});


// --- FUNÇÃO PARA RENDERIZAR CADA CONVIDADO ---
function renderGuest(doc) {
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.classList.add('guest-item');
    guestItem.setAttribute('data-id', doc.id);

    const guestInfo = document.createElement('div');
    guestInfo.classList.add('guest-info');
    
    const guestName = document.createElement('span');
    // Remove o número 'id' do início do nome para uma lista mais limpa
    guestName.textContent = guest.name; 
    guestInfo.appendChild(guestName);

    // --- LÓGICA DO CHECKBOX EDITÁVEL ---
    const childCheckboxContainer = document.createElement('div');
    childCheckboxContainer.classList.add('editable-checkbox');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `child_${doc.id}`;
    checkbox.checked = guest.isChild === true;
    
    checkbox.addEventListener('change', () => {
        guestsCollection.doc(doc.id).update({ isChild: checkbox.checked });
    });

    const label = document.createElement('label');
    label.htmlFor = `child_${doc.id}`;
    label.textContent = 'É criança?';
    
    childCheckboxContainer.appendChild(checkbox);
    childCheckboxContainer.appendChild(label);
    guestInfo.appendChild(childCheckboxContainer);
    // --- FIM DA LÓGICA DO CHECKBOX ---

    guestItem.appendChild(guestInfo);

    if (guest.amountPaid > 0) {
        guestItem.classList.add('paid');
        const paidInfo = document.createElement('span');
        const valorPagoFormatado = guest.amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        paidInfo.innerHTML = `✅ ${valorPagoFormatado}`;
        guestItem.appendChild(paidInfo);
    } 
    else if (guest.presence_confirmed) {
        guestItem.classList.add('presence-confirmed');
        const uploadButton = createButton('Enviar Comprovante', 'upload-btn', () => openUploadModal(guest.name, doc.id));
        guestItem.appendChild(uploadButton);
    } 
    else {
        const confirmButton = createButton('Confirmar Presença', 'presence-btn', () => {
            guestsCollection.doc(doc.id).update({ presence_confirmed: true });
        });
        guestItem.appendChild(confirmButton);
    }
    guestListContainer.appendChild(guestItem);
}

// Função auxiliar para criar botões
function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
}

// --- LÓGICA DO FORMULÁRIO DE ADICIONAR CONVIDADO ---
const addGuestForm = document.getElementById('addGuestForm');
addGuestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newGuestNameInput = document.getElementById('newGuestName');
    const newGuestIsChildCheckbox = document.getElementById('newGuestIsChild');
    const addGuestBtn = document.getElementById('addGuestBtn');
    const addGuestStatus = document.getElementById('addGuestStatus');
    const guestName = newGuestNameInput.value.trim();
    if (!guestName) return;

    addGuestBtn.disabled = true;
    addGuestStatus.textContent = "Adicionando...";

    // ATENÇÃO: COLOQUE A URL DO SEU APP DA WEB AQUI
    const scriptURL = "URL_DO_SEU_APP_DA_WEB_AQUI";
    const payload = {
        action: 'addGuest',
        name: guestName,
        isChild: newGuestIsChildCheckbox.checked
    };

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(response => {
            if (response.status === "success") {
                addGuestStatus.textContent = response.message;
                addGuestForm.reset();
            } else { throw new Error(response.message); }
        })
        .catch(error => {
            console.error('Erro:', error);
            addGuestStatus.textContent = 'Erro ao adicionar. Tente novamente.';
        })
        .finally(() => {
            addGuestBtn.disabled = false;
            setTimeout(() => { addGuestStatus.textContent = ''; }, 3000);
        });
});

// --- LÓGICA DO MODAL E UPLOAD DE COMPROVANTE ---
let currentGuestDocId = null;
function openUploadModal(name, docId) {
    const guestNameEl = document.getElementById('guestName');
    const uploadStatus = document.getElementById('uploadStatus');
    const receiptFile = document.getElementById('receiptFile');
    guestNameEl.textContent = name;
    currentGuestDocId = docId;
    uploadStatus.textContent = '';
    receiptFile.value = '';
    modal.style.display = 'block';
}

const closeButton = document.querySelector('.close-button');
closeButton.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

submitReceiptBtn.addEventListener('click', () => {
    const receiptFile = document.getElementById('receiptFile');
    const uploadStatus = document.getElementById('uploadStatus');
    const file = receiptFile.files[0];
    if (!file || !currentGuestDocId) { return; }

    // ATENÇÃO: COLOQUE A URL DO SEU APP DA WEB AQUI
    const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec"; 
    uploadStatus.textContent = 'Enviando...';
    submitReceiptBtn.disabled = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const payload = {
            action: 'uploadReceipt',
            fileData: reader.result,
            fileName: file.name,
            fileType: file.type,
            guestId: currentGuestDocId
        };
        fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(response => {
                uploadStatus.textContent = response.message;
                setTimeout(() => { modal.style.display = 'none'; }, 2500);
            })
            .catch(error => { uploadStatus.textContent = 'Erro ao enviar.'; })
            .finally(() => { submitReceiptBtn.disabled = false; });
    };
});