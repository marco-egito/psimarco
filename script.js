// COLE SUA CONFIG FIREBASE AQUI
const firebaseConfig = {
    apiKey: "AIzaSyAjgzXuxHtOO32rzLGCmgOVN5gV8OzeImE",
    authDomain: "natal2025-4b00f.firebaseapp.com",
    projectId: "natal2025-4b00f",
    storageBucket: "natal2025-4b00f.firebasestorage.app",
    messagingSenderId: "111045410547",
    appId: "1:1011045410547:web:10305de407f87442f17986",
    measurementId: "G-YCPLK7YY9B"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const fieldValue = firebase.firestore.FieldValue;

// --- ELEMENTOS E VARIÁVEIS GLOBAIS ---
const guestsCollection = db.collection('guests');
const pollDocRef = db.collection('poll').doc('food_and_drink_poll');
// Nenhuma URL de script é mais necessária.

// --- LISTENER PRINCIPAL (EM TEMPO REAL) ---
guestsCollection.orderBy('name').onSnapshot(snapshot => {
    const guestListContainer = document.getElementById('guest-list-container');
    guestListContainer.innerHTML = '';
    
    // --- LÓGICA DE CÁLCULO ATUALIZADA CONFORME SEU PEDIDO ---
    const adultosConfirmados = snapshot.docs.filter(doc => doc.data().presence_confirmed && !doc.data().isChild);
    const numeroDePagantes = adultosConfirmados.length > 3 ? adultosConfirmados.length - 3 : 0;

    // Calcula os valores por pessoa para a Entrada e Final
    const valorEntradaPorPessoa = numeroDePagantes > 0 ? 1500 / numeroDePagantes : 0;
    const valorFinalPorPessoa = numeroDePagantes > 0 ? 500 / numeroDePagantes : 0;
    
    // ATUALIZAÇÃO 1: Adiciona o número de confirmados e pagantes ao texto.
    const pagantesTexto = `${numeroDePagantes} pagantes confirmados`;
    
    // ATUALIZAÇÃO 2: Altera os textos dos cards de rateio.
    document.getElementById('entry-cost-per-person').innerHTML = `Valor da Entrada (R$ 1.500,00): <strong>${valorEntradaPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> por pessoa <br><small>(${pagantesTexto})</small>`;
    document.getElementById('final-cost-per-person').innerHTML = `Valor restante (R$ 500,00): <strong>${valorFinalPorPessoa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> por pessoa <br><small>(${pagantesTexto})</small>`;
    
    // ATUALIZAÇÃO 3: Calcula o valor que ainda falta para a ENTRADA.
    let totalPagoEntrada = 0;
    snapshot.docs.forEach(doc => {
        const guest = doc.data();
        if (guest.paidEntry) {
            totalPagoEntrada += valorEntradaPorPessoa;
        }
    });

    const valorFaltaEntrada = 1500 - totalPagoEntrada;
    document.getElementById('amount-remaining').innerHTML = `<strong>Faltam (Entrada): ${valorFaltaEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>`;
    
    // Renderiza cada convidado na lista
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


// --- FUNÇÃO DE RENDERIZAÇÃO (COM LÓGICA DE DESCONFIRMAR) ---
function renderGuest(doc) {
    const guest = doc.data();
    const guestItem = document.createElement('div');
    guestItem.className = `guest-item ${guest.paidEntry && guest.paidFinal ? 'paid' : (guest.presence_confirmed ? 'presence-confirmed' : '')}`;
    
    let actionContent = '';
    
    if (guest.paidEntry && guest.paidFinal) {
        actionContent = `<span>✅ Pagamento Completo</span>`;
        //Desativei o check
    } else if (guest.presence_confirmed) {
        actionContent = `
            <div class="payment-controls">
                <div class="payment-checkboxes">
                    <div class="payment-option">
                      <input type="checkbox" id="entry_${doc.id}" ${guest.paidEntry ? 'checked' : ''} onchange="updatePaymentStatus('${doc.id}', 'paidEntry', this.checked)" disabled> 
                        <label for="entry_${doc.id}">Pago Entrada</label>
                    </div>
                    <div class="payment-option">
                       <input type="checkbox" id="final_${doc.id}" ${guest.paidFinal ? 'checked' : ''} onchange="updatePaymentStatus('${doc.id}', 'paidFinal', this.checked)">
            
                        <label for="final_${doc.id}">Pago Final</label>
                    </div>
                </div>
                <button class="deconfirm-btn" onclick="togglePresence('${doc.id}', true)">Desconfirmar</button>
            </div>`;

    } else {
        actionContent = `<button class="presence-btn" onclick="togglePresence('${doc.id}', false)">Confirmar Presença</button>`;
    }

    guestItem.innerHTML = `
        <div class="guest-info">
            <span>${guest.name}</span>
            <div class="editable-checkbox">
                <input type="checkbox" id="child_${doc.id}" ${guest.isChild ? 'checked' : ''} onchange="toggleChildStatus('${doc.id}', this.checked)">
                <label for="child_${doc.id}">É criança?</label>
            </div>
        </div>
        ${actionContent}`;
    
    document.getElementById('guest-list-container').appendChild(guestItem);
}


// --- FUNÇÕES CHAMADAS VIA ONCLICK ---
const togglePresence = (docId, currentState) => {
    guestsCollection.doc(docId).update({ presence_confirmed: !currentState });
};
const toggleChildStatus = (docId, isChecked) => guestsCollection.doc(docId).update({ isChild: isChecked });
const updatePaymentStatus = (docId, field, isChecked) => {
    guestsCollection.doc(docId).update({ [field]: isChecked });
};

// --- LÓGICA DE VOTAÇÃO DA ENQUETE ---
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
