// js/main.js

// Importamos la configuración de Firebase y los módulos necesarios
import { firebaseConfig } from './firebase-config.js';
import * as Auth from './auth.js';
import { 
    getAuthView, 
    getHomeView, 
    getCreateRaffleView, 
    getExploreView, 
    getRaffleCard,
    getRaffleDetailView
} from './components.js';

// Inicializamos Firebase con nuestra configuración
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos del DOM
const appContainer = document.getElementById('app-container');
const userInfoContainer = document.getElementById('user-info');
const mainNav = document.getElementById('nav-main');

// Variable global para cancelar la escucha de tickets en tiempo real
let unsubscribeFromTickets = null;

// --- MANEJO DE RUTAS (ROUTING) ---
const routes = {
    '/': getHomeView,
    '/login': getAuthView,
    '/create': getCreateRaffleView,
    '/explore': getExploreView,
};

async function router() {
    // Si hay una suscripción activa a los tickets, la cancelamos al cambiar de vista
    if (unsubscribeFromTickets) {
        unsubscribeFromTickets();
        unsubscribeFromTickets = null;
    }

    const path = window.location.hash.slice(1) || '/';
    const isRaffleDetail = path.startsWith('/raffle/');
    const view = isRaffleDetail ? getRaffleDetailView : routes[path];

    if (view) {
        if (isRaffleDetail) {
            const raffleId = path.split('/')[2];
            try {
                // 1. Obtenemos los datos generales de la rifa
                const raffleDoc = await db.collection('raffles').doc(raffleId).get();
                if (!raffleDoc.exists) {
                    appContainer.innerHTML = '<h2>Error: Rifa no encontrada</h2>';
                    return;
                }
                const raffleData = { id: raffleDoc.id, ...raffleDoc.data() };
                
                // 2. Mostramos el HTML base del detalle de la rifa
                appContainer.innerHTML = view(raffleData);
                const ticketsGrid = document.getElementById('tickets-grid');
                ticketsGrid.innerHTML = 'Cargando boletos...';

                // 3. Nos suscribimos a los cambios de los boletos EN TIEMPO REAL
                const ticketsCollection = db.collection('raffles').doc(raffleId).collection('tickets').orderBy('number');
                
                unsubscribeFromTickets = ticketsCollection.onSnapshot(snapshot => {
                    ticketsGrid.innerHTML = ''; // Limpiamos la cuadrícula
                    snapshot.forEach(doc => {
                        const ticketData = doc.data();
                        const ticketElement = document.createElement('div');
                        ticketElement.classList.add('ticket', ticketData.status);
                        ticketElement.textContent = ticketData.number;
                        ticketElement.dataset.id = ticketData.number;
                        ticketsGrid.appendChild(ticketElement);
                    });
                });
            } catch (error) {
                console.error("Error al obtener el detalle de la rifa:", error);
                appContainer.innerHTML = '<h2>Error al cargar la rifa.</h2>';
            }
        } else if (path === '/explore') {
            try {
                const rafflesSnapshot = await db.collection('raffles').orderBy('createdAt', 'desc').get();
                let rafflesHTML = '';
                
                if (rafflesSnapshot.empty) {
                    rafflesHTML = '<p>No hay rifas disponibles en este momento. ¡Crea una!</p>';
                } else {
                    rafflesSnapshot.forEach(doc => {
                        const raffleData = { id: doc.id, ...doc.data() };
                        rafflesHTML += getRaffleCard(raffleData);
                    });
                }
                appContainer.innerHTML = view(rafflesHTML);
            } catch (error) {
                console.error("Error al obtener las rifas:", error);
                appContainer.innerHTML = '<p>Error al cargar las rifas. Inténtalo de nuevo más tarde.</p>';
            }
        } else {
            const user = firebase.auth().currentUser;
            const userName = user ? user.displayName || user.email : 'Invitado';
            appContainer.innerHTML = (path === '/') ? view(userName) : view();
        }
        attachEventListeners(path);
    } else {
        appContainer.innerHTML = '<h2>Error 404: Página no encontrada</h2>';
    }
}

async function handleTicketFormSubmit(e) {
    e.preventDefault(); // Evita que la página se recargue

    const buyerName = document.getElementById('buyer-name').value;
    const buyerPhone = document.getElementById('buyer-phone').value;
    const status = document.getElementById('payment-status').value;
    const ticketNumber = document.getElementById('modal-ticket-number').textContent.replace('Boleto #', '');
    const raffleId = window.location.hash.slice(1).split('/')[2];
    
    if (!buyerName || !buyerPhone) {
        alert('El nombre y el celular son obligatorios.');
        return;
    }

    const dataToUpdate = {
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        status: status
    };

    try {
        const ticketRef = db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber);
        await ticketRef.update(dataToUpdate);
        
        document.getElementById('ticket-modal').style.display = 'none';

    } catch (error) {
        console.error("Error al actualizar el boleto:", error);
        alert("Hubo un error al guardar los cambios.");
    }
}

// --- MANEJO DE ESTADO DE AUTENTICACIÓN ---

Auth.onAuthStateChanged(user => {
    if (user) {
        updateUIForLoggedInUser(user);
        if (window.location.hash === '#/login' || window.location.hash === '') {
            window.location.hash = '/';
        } else {
            router();
        }
    } else {
        updateUIForLoggedOutUser();
        window.location.hash = '/login';
        router();
    }
});

function updateUIForLoggedInUser(user) {
    mainNav.style.display = 'block';
    userInfoContainer.innerHTML = `
        <span>${user.displayName || user.email}</span>
        <button id="logout-btn" class="btn">Cerrar Sesión</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());
}

function updateUIForLoggedOutUser() {
    mainNav.style.display = 'none';
    userInfoContainer.innerHTML = '';
}

// --- MANEJO DE EVENTOS ---

function attachEventListeners(path) {
    const isRaffleDetail = path.startsWith('/raffle/');

    if (path === '/login') {
        const authForm = document.getElementById('auth-form');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const toggleLink = document.getElementById('auth-toggle-link');
        let isLogin = true;

        authForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (isLogin) {
                Auth.loginUser(email, password).catch(err => alert(err.message));
            } else {
                Auth.registerUser(email, password).catch(err => alert(err.message));
            }
        });

        googleLoginBtn.addEventListener('click', Auth.loginWithGoogle);
        
        const toggleAuthMode = e => {
            e.preventDefault();
            isLogin = !isLogin;
            document.getElementById('auth-title').innerText = isLogin ? 'Iniciar Sesión' : 'Registrarse';
            document.getElementById('auth-action-btn').innerText = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';
            document.getElementById('auth-toggle-text').innerHTML = isLogin ? '¿No tienes cuenta? <a href="#" id="auth-toggle-link">Regístrate</a>' : '¿Ya tienes cuenta? <a href="#" id="auth-toggle-link">Inicia Sesión</a>';
            document.getElementById('auth-toggle-link').addEventListener('click', toggleAuthMode);
        };
        toggleLink.addEventListener('click', toggleAuthMode);

    } else if (path === '/create') {
        const createRaffleForm = document.getElementById('create-raffle-form');
        createRaffleForm.addEventListener('submit', handleCreateRaffle);
        
    } else if (isRaffleDetail) {
        // --- ESTE ES EL BLOQUE QUE FALTABA ---
        const ticketsGrid = document.getElementById('tickets-grid');
        const modal = document.getElementById('ticket-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        const ticketForm = document.getElementById('ticket-form');

        // Evento para abrir el modal al hacer clic en un boleto
        if (ticketsGrid) {
            ticketsGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('ticket')) {
                    const ticketNumber = e.target.dataset.id;
                    openTicketModal(ticketNumber);
                }
            });
        }

        // Eventos para cerrar el modal
        if (modal) {
            closeModalBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'ticket-modal') {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Evento para guardar los datos del formulario del modal
        if (ticketForm) {
            ticketForm.addEventListener('submit', handleTicketFormSubmit);
        }
    }
}

async function openTicketModal(ticketNumber) {
    const modal = document.getElementById('ticket-modal');
    const modalTitle = document.getElementById('modal-ticket-number');
    const buyerNameInput = document.getElementById('buyer-name');
    const buyerPhoneInput = document.getElementById('buyer-phone');
    const paymentStatusSelect = document.getElementById('payment-status');
    
    // Extraemos el ID de la rifa desde la URL actual
    const raffleId = window.location.hash.slice(1).split('/')[2];
    if (!raffleId) return;

    try {
        // Consultamos la información actual del boleto en Firestore
        const ticketRef = db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber);
        const doc = await ticketRef.get();

        if (doc.exists) {
            const data = doc.data();
            // Llenamos el formulario con los datos existentes
            modalTitle.textContent = `Boleto #${data.number}`;
            buyerNameInput.value = data.buyerName || '';
            buyerPhoneInput.value = data.buyerPhone || '';
            paymentStatusSelect.value = data.status === 'available' ? 'pending' : data.status;

            // Mostramos el modal
            modal.style.display = 'flex';
        } else {
            console.error("No se encontró el boleto");
            alert("Error: No se encontró el boleto.");
        }
    } catch (error) {
        console.error("Error al obtener datos del boleto:", error);
    }
}

async function handleCreateRaffle(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Debes iniciar sesión para crear una rifa.');
        return;
    }

    const raffle = {
        name: document.getElementById('raffle-name').value,
        prize: document.getElementById('raffle-prize').value,
        ticketPrice: parseFloat(document.getElementById('ticket-price').value),
        paymentDeadline: document.getElementById('payment-deadline').value,
        drawDate: document.getElementById('draw-date').value,
        paymentMethods: document.getElementById('payment-methods').value.split(',').map(item => item.trim()),
        ownerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        const raffleRef = await db.collection('raffles').add(raffle);
        const batch = db.batch();
        for (let i = 0; i < 100; i++) {
            const ticketNumber = i.toString().padStart(2, '0');
            const ticketRef = db.collection('raffles').doc(raffleRef.id).collection('tickets').doc(ticketNumber);
            batch.set(ticketRef, {
                number: ticketNumber,
                status: 'available',
                buyerName: null,
                buyerPhone: null,
            });
        }
        await batch.commit();
        alert('¡Rifa creada con éxito!');
        window.location.hash = `#/raffle/${raffleRef.id}`;
    } catch (error) {
        console.error("Error al crear la rifa: ", error);
        alert('Hubo un error al crear la rifa.');
    }
}

// --- INICIALIZACIÓN ---
window.addEventListener('hashchange', router);

window.addEventListener('load', router);


