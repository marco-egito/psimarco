// COLE SUA CONFIG FIREBASE AQUI
const firebaseConfig = {
    apiKey: "AIzaSyAjgzXuxHtOO32rzLGCmgOVN5gV8OzeImE",
    authDomain: "natal2025-4b00f.firebaseapp.com",
    projectId: "natal2025-4b00f",
    storageBucket: "natal2025-4b00f.firebasestorage.app",
    messagingSenderId: "1011045410547",
    appId: "1:1011045410547:web:10305de407f87442f17986",
    measurementId: "G-YCPLK7YY9B"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const fieldValue = firebase.firestore.FieldValue;

const guestsCollection = db.collection('guests');
const pollDocRef = db.collection('poll').doc('food_and_drink_poll');

// Ouve a lista de convidados
guestsCollection.orderBy('name').onSnapshot(snapshot => {
    document.getElementById('guest-list-container').innerHTML = '';
    const adultosConfirmados = snapshot.docs.filter(doc => doc.data().presence_confirmed && !doc.data().isChild);
    const numeroDePagantesFinal = adultosConfirmados.length - 3;
    const costEl = document.getElementById('cost-per-person');
    if (numeroDePagantesFinal > 0) {
        const valorPorPessoa = 2000 / numeroDePagantesFinal;
        costEl.innerHTML = `Valor por pessoa (rateio): <strong>${valorPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> (${numeroDePagantesFinal} pagantes)`;
    } else {
        costEl.innerHTML = "Aguardando mais confirmações para o rateio...";
    }
    snapshot.docs.forEach(doc => renderGuest(doc));
}, error => {
    console.error("Erro no listener do Firestore (guests): ", error);
});

// Ouve a enquete
pollDocRef.onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data(), vMonthly = data.votes_monthly || 0, vDay = data.votes_on_the_day || 0, total = vMonthly + vDay;
    document.getElementById('monthly-votes').textContent = `${vMonthly} votos`;
    document.getElementById('on-the-day-votes').textContent = `${vDay} votos`;
    document.getElementById('monthly-bar').style.width = `${total > 0 ? (vMonthly / total) * 100 : 0}%`;
    document.getElementById('on-the-day-bar').style.width = `${total > 0 ? (vDay / total) * 100 : 0}%`;
});

function renderGuest(doc) {
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.className = `guest-item ${guest.amountPaid > 0 ? 'paid' : (guest.presence_confirmed ? 'presence-confirmed' : '')}`;
    guestItem.setAttribute('data-id', doc.id);
    let buttons = '';
    if (guest.amountPaid > 0) {
        buttons = `<span>✅ ${guest.amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>`;
    } else if (guest.presence_confirmed) {
        buttons = `<button class="upload-btn" onclick="openUploadModal('${guest.name}', '${doc.id}')">Enviar Comprovante</button>`;
    } else {
        buttons = `<button class="presence-btn" onclick="confirmPresence('${doc.id}')">Confirmar Presença</button>`;
    }
    guestItem.innerHTML = `
        <div class="guest-info">
            <span>${guest.name}</span>
            <div class="editable-checkbox">
                <input type="checkbox" id="child_${doc.id}" ${guest.isChild ? 'checked' : ''} onchange="toggleChildStatus('${doc.id}', this.checked)">
                <label for="child_${doc.id}">É criança?</label>
            </div>
        </div>
        ${buttons}`;
    document.getElementById('guest-list-container').appendChild(guestItem);
}

// Funções chamadas via onclick
const confirmPresence = (docId) => guestsCollection.doc(docId).update({ presence_confirmed: true });
const toggleChildStatus = (docId, isChecked) => guestsCollection.doc(docId).update({ isChild: isChecked });

let currentGuestDocId = null;
function openUploadModal(name, docId) {
    document.getElementById('guestName').textContent = name;
    currentGuestDocId = docId;
    document.getElementById('uploadStatus').textContent = '';
    document.getElementById('receiptFile').value = '';
    document.getElementById('uploadModal').style.display = 'block';
}

// Event Listeners para elementos que não mudam
document.querySelector('.close-button').onclick = () => document.getElementById('uploadModal').style.display = 'none';
window.onclick = (event) => { if (event.target == document.getElementById('uploadModal')) { document.getElementById('uploadModal').style.display = 'none'; } };

const scriptURL = "https://script.google.com/macros/s/AKfycbzgoIXEOZopMWYDEJg8Uc_elZIvV-HC54ea_EPEo-wyeJmCWsApZa2JjmEVL6HF1zbX/exec"; // SUA URL AQUI

document.getElementById('addGuestForm').addEventListener('submit', e => {
    e.preventDefault();
    const nameInput = document.getElementById('newGuestName'), isChildCheck = document.getElementById('newGuestIsChild');
    const name = nameInput.value.trim();
    if (!name) return;
    const btn = document.getElementById('addGuestBtn'), statusEl = document.getElementById('addGuestStatus');
    btn.disabled = true; statusEl.textContent = "Adicionando...";
    const payload = {action: 'addGuest', name: name, isChild: isChildCheck.checked};
    fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(res => res.json()).then(res => {
            if (res.status === "success") { statusEl.textContent = res.message; e.target.reset(); } 
            else { throw new Error(res.message); }
        }).catch(err => statusEl.textContent = 'Erro ao adicionar.').finally(() => {
            btn.disabled = false; setTimeout(() => { statusEl.textContent = ''; }, 3000);
        });
});

document.getElementById('submitReceiptBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('receiptFile'), statusEl = document.getElementById('uploadStatus');
    const file = fileInput.files[0];
    if (!file || !currentGuestDocId) return;
    statusEl.textContent = 'Enviando...'; document.getElementById('submitReceiptBtn').disabled = true;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const payload = {action: 'uploadReceipt', fileData: reader.result, fileName: file.name, fileType: file.type, guestId: currentGuestDocId};
        fetch(scriptURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(res => res.json()).then(res => {
                statusEl.textContent = res.message;
                setTimeout(() => { document.getElementById('uploadModal').style.display = 'none'; }, 2500);
            }).catch(err => statusEl.textContent = 'Erro ao enviar.').finally(() => document.getElementById('submitReceiptBtn').disabled = false);
    };
});

const handleVote = (option) => {
    const btns = document.querySelectorAll('#poll-options button');
    btns.forEach(b => b.disabled = true);
    const statusEl = document.getElementById('poll-status');
    statusEl.textContent = "Registrando seu voto...";
    pollDocRef.update({ [option === 'monthly' ? 'votes_monthly' : 'votes_on_the_day']: fieldValue.increment(1) })
    .then(() => {
        localStorage.setItem('voted_food_poll', 'true');
        statusEl.textContent = "Obrigado pelo seu voto!";
    }).catch(err => {
        statusEl.textContent = "Erro ao votar. Tente novamente.";
        btns.forEach(b => b.disabled = false);
    });
};

document.getElementById('vote-monthly-btn').addEventListener('click', () => handleVote('monthly'));
document.getElementById('vote-on-the-day-btn').addEventListener('click', () => handleVote('on_the_day'));

if (localStorage.getItem('voted_food_poll') === 'true') {
    document.querySelectorAll('#poll-options button').forEach(b => b.disabled = true);
    document.getElementById('poll-status').textContent = "Você já votou nesta enquete.";
}