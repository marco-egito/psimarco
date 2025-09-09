// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const fieldValue = firebase.firestore.FieldValue; // Importante para a enquete

// --- ELEMENTOS GLOBAIS ---
const guestListContainer = document.getElementById('guest-list-container');
const guestsCollection = db.collection('guests');
const modal = document.getElementById('uploadModal');
const submitReceiptBtn = document.getElementById('submitReceiptBtn');


// --- LÓGICA PRINCIPAL DA LISTA DE CONVIDADOS (EM TEMPO REAL) ---
guestsCollection.orderBy('name').onSnapshot(snapshot => {
    guestListContainer.innerHTML = '';
    
    const valorRestante = 2000;
    const costPerPersonElement = document.getElementById('cost-per-person');

    const adultosConfirmados = snapshot.docs.filter(doc => {
        const guest = doc.data();
        return guest.presence_confirmed === true && !guest.isChild;
    });

    const numeroDePagantesBruto = adultosConfirmados.length;
    const numeroDePagantesFinal = numeroDePagantesBruto - 3;

    if (numeroDePagantesFinal > 0) {
        const valorPorPessoa = valorRestante / numeroDePagantesFinal;
        const valorFormatado = valorPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        costPerPersonElement.innerHTML = `Valor por pessoa (rateio): <strong>${valorFormatado}</strong> (${numeroDePagantesFinal} pagantes)`;
    } else {
        costPerPersonElement.innerHTML = "Aguardando mais confirmações para o rateio...";
    }

    snapshot.docs.forEach(doc => renderGuest(doc));
});


// --- FUNÇÃO PARA RENDERIZAR CADA CONVIDADO ---
function renderGuest(doc) {
    // ... (Esta função continua exatamente a mesma da última vez)
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.classList.add('guest-item');
    guestItem.setAttribute('data-id', doc.id);
    const guestInfo = document.createElement('div');
    guestInfo.classList.add('guest-info');
    const guestName = document.createElement('span');
    guestName.textContent = guest.name;
    guestInfo.appendChild(guestName);
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
    guestItem.appendChild(guestInfo);
    if (guest.amountPaid > 0) {
        guestItem.classList.add('paid');
        const paidInfo = document.createElement('span');
        const valorPagoFormatado = guest.amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        paidInfo.innerHTML = `✅ ${valorPagoFormatado}`;
        guestItem.appendChild(paidInfo);
    } else if (guest.presence_confirmed) {
        guestItem.classList.add('presence-confirmed');
        const uploadButton = createButton('Enviar Comprovante', 'upload-btn', () => openUploadModal(guest.name, doc.id));
        guestItem.appendChild(uploadButton);
    } else {
        const confirmButton = createButton('Confirmar Presença', 'presence-btn', () => {
            guestsCollection.doc(doc.id).update({ presence_confirmed: true });
        });
        guestItem.appendChild(confirmButton);
    }
    guestListContainer.appendChild(guestItem);
}

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
    // ... (Esta função continua exatamente a mesma da última vez)
    e.preventDefault();
    const newGuestNameInput = document.getElementById('newGuestName');
    const newGuestIsChildCheckbox = document.getElementById('newGuestIsChild');
    const addGuestBtn = document.getElementById('addGuestBtn');
    const addGuestStatus = document.getElementById('addGuestStatus');
    const guestName = newGuestNameInput.value.trim();
    if (!guestName) return;
    addGuestBtn.disabled = true;
    addGuestStatus.textContent = "Adicionando...";
    const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec"; // ATENÇÃO: COLOQUE SUA URL AQUI
    const payload = {
        action: 'addGuest', name: guestName, isChild: newGuestIsChildCheckbox.checked
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
            addGuestStatus.textContent = 'Erro ao adicionar. Tente novamente.';
        })
        .finally(() => {
            addGuestBtn.disabled = false;
            setTimeout(() => { addGuestStatus.textContent = ''; }, 3000);
        });
});

// --- LÓGICA DO MODAL E UPLOAD DE COMPROVANTE ---
// ... (Esta seção continua exatamente a mesma da última vez)
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
    const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec"; // ATENÇÃO: COLOQUE SUA URL AQUI
    uploadStatus.textContent = 'Enviando...';
    submitReceiptBtn.disabled = true;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const payload = {
            action: 'uploadReceipt', fileData: reader.result, fileName: file.name,
            fileType: file.type, guestId: currentGuestDocId
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

// --------------------------------------------------
// --- NOVA LÓGICA DA ENQUETE ---
// --------------------------------------------------
const pollDocRef = db.collection('poll').doc('food_and_drink_poll');
const voteMonthlyBtn = document.getElementById('vote-monthly-btn');
const voteOnTheDayBtn = document.getElementById('vote-on-the-day-btn');
const monthlyBar = document.getElementById('monthly-bar');
const onTheDayBar = document.getElementById('on-the-day-bar');
const monthlyVotes = document.getElementById('monthly-votes');
const onTheDayVotes = document.getElementById('on-the-day-votes');
const pollStatus = document.getElementById('poll-status');

// 1. Ouve as mudanças nos votos em tempo real
pollDocRef.onSnapshot(doc => {
    if (!doc.exists) return;

    const data = doc.data();
    const votesMonthly = data.votes_monthly || 0;
    const votesOnTheDay = data.votes_on_the_day || 0;
    const totalVotes = votesMonthly + votesOnTheDay;

    // Atualiza os textos
    monthlyVotes.textContent = `${votesMonthly} votos`;
    onTheDayVotes.textContent = `${votesOnTheDay} votos`;

    // Calcula e atualiza as barras de porcentagem
    const monthlyPercent = totalVotes > 0 ? (votesMonthly / totalVotes) * 100 : 0;
    const onTheDayPercent = totalVotes > 0 ? (votesOnTheDay / totalVotes) * 100 : 0;

    monthlyBar.style.width = `${monthlyPercent}%`;
    onTheDayBar.style.width = `${onTheDayPercent}%`;
});

// 2. Função para registrar um voto
function handleVote(option) {
    // Desabilita os botões para prevenir cliques duplos
    voteMonthlyBtn.disabled = true;
    voteOnTheDayBtn.disabled = true;
    pollStatus.textContent = "Registrando seu voto...";

    const fieldToUpdate = option === 'monthly' ? 'votes_monthly' : 'votes_on_the_day';

    pollDocRef.update({
        [fieldToUpdate]: fieldValue.increment(1) // Incrementa o voto no Firebase
    })
    .then(() => {
        // Salva no navegador que o usuário já votou
        localStorage.setItem('voted_food_poll', 'true');
        pollStatus.textContent = "Obrigado pelo seu voto!";
    })
    .catch(error => {
        pollStatus.textContent = "Erro ao votar. Tente novamente.";
        // Reabilita os botões em caso de erro
        voteMonthlyBtn.disabled = false;
        voteOnTheDayBtn.disabled = false;
    });
}

// 3. Adiciona os eventos de clique aos botões
voteMonthlyBtn.addEventListener('click', () => handleVote('monthly'));
voteOnTheDayBtn.addEventListener('click', () => handleVote('on_the_day'));

// 4. Verifica se o usuário já votou ao carregar a página
function checkIfVoted() {
    if (localStorage.getItem('voted_food_poll') === 'true') {
        voteMonthlyBtn.disabled = true;
        voteOnTheDayBtn.disabled = true;
        pollStatus.textContent = "Você já votou nesta enquete.";
    }
}

// Roda a verificação assim que a página carrega
checkIfVoted();