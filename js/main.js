// js/main.js

// Importamos la configuración de Firebase y los módulos necesarios
import { firebaseConfig } from './firebase-config.js';
import * as Auth from './auth.js';
import { 
    paymentMethods,
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
            const user = firebase.auth().currentUser;
            if (!user) {
                appContainer.innerHTML = "<h2>Debes iniciar sesión para ver tus rifas.</h2>";
                return;
            }
        
            try {
                const rafflesSnapshot = await db.collection('raffles')
                    .where('ownerId', '==', user.uid)
                    .orderBy('createdAt', 'desc')
                    .get();
                
                let rafflesHTML = '';
                
                if (rafflesSnapshot.empty) {
                    rafflesHTML = '<h2>No has creado ninguna rifa todavía.</h2><p>¡Haz clic en "Crear Rifa" para empezar!</p>';
                } else {
                    const raffleCardPromises = rafflesSnapshot.docs.map(async (doc) => {
                        const raffleData = { id: doc.id, ...doc.data() };
                        const ticketsSnapshot = await db.collection('raffles').doc(raffleData.id).collection('tickets').where('status', '!=', 'available').get();
                        raffleData.soldPercentage = ticketsSnapshot.size;
                        return getRaffleCard(raffleData);
                    });
                    const resolvedRaffleCards = await Promise.all(raffleCardPromises);
                    rafflesHTML = resolvedRaffleCards.join('');
                }
        
                const adminViewHTML = `
                    <div class="explore-container">
                        <h2>Administrar Mis Rifas</h2>
                        <div id="raffles-list">
                            ${rafflesHTML}
                        </div>
                    </div>
                `;
                appContainer.innerHTML = adminViewHTML;
        
                // --- INICIO DEL CÓDIGO AÑADIDO ---
                // Se ejecuta DESPUÉS de que el HTML de las tarjetas se ha insertado en la página
                const rafflesList = document.getElementById('raffles-list');
                if (rafflesList) {
                    rafflesList.addEventListener('click', (e) => {
                        const deleteButton = e.target.closest('.btn-delete-raffle');
                        if (deleteButton) {
                            const card = deleteButton.closest('.raffle-card');
                            const raffleId = card.dataset.id;
                            handleDeleteRaffle(raffleId, card); // Llamamos a la función para borrar
                        }
                    });
                }
                // --- FIN DEL CÓDIGO AÑADIDO ---
        
            } catch (error) {
                console.error("Error al obtener las rifas:", error);
                appContainer.innerHTML = '<p>Error al cargar tus rifas.</p>';
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

async function handleClearTicket() {
    const ticketNumber = document.getElementById('modal-ticket-number').textContent.replace('Boleto #', '');
    const raffleId = window.location.hash.slice(1).split('/')[2];

    // Pedimos confirmación al usuario antes de borrar
    const isConfirmed = confirm(`¿Estás seguro de que quieres limpiar el boleto #${ticketNumber}? Se borrarán los datos del comprador y quedará disponible.`);

    if (!isConfirmed) {
        return; // Si el usuario cancela, no hacemos nada
    }

    // Datos para resetear el boleto
    const dataToClear = {
        buyerName: null,
        buyerPhone: null,
        status: 'available'
    };

    try {
        const ticketRef = db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber);
        await ticketRef.update(dataToClear); // Actualizamos el boleto en Firestore

        console.log(`Boleto #${ticketNumber} limpiado correctamente.`);

        // Cerramos el modal
        document.getElementById('ticket-modal').style.display = 'none';

    } catch (error) {
        console.error("Error al limpiar el boleto:", error);
        alert("Hubo un error al limpiar el boleto.");
    }
}

async function handleShare(type) {
    const formView = document.getElementById('ticket-form');
    const isFormVisible = formView.style.display !== 'none';

    // Seleccionamos los botones correctos dependiendo de qué vista está activa
    const shareBtnId = type === 'whatsapp' 
        ? (isFormVisible ? 'whatsapp-share-btn' : 'whatsapp-share-btn-info')
        : (isFormVisible ? 'generic-share-btn' : 'generic-share-btn-info');
    
    const shareBtn = document.getElementById(shareBtnId);
    if (!shareBtn) return;
    
    const originalText = shareBtn.textContent;
    shareBtn.textContent = 'Generando...';
    shareBtn.disabled = true;

    try {
        const raffleId = window.location.hash.slice(1).split('/')[2];
        
        // --- INICIO DE LA CORRECCIÓN ---
        // Leemos el número del boleto desde el título que esté visible
        const ticketNumberId = isFormVisible ? 'modal-ticket-number-form' : 'modal-ticket-number-info';
        const ticketNumber = document.getElementById(ticketNumberId).textContent.replace('Boleto #', '');
        // --- FIN DE LA CORRECCIÓN ---

        const raffleDoc = await db.collection('raffles').doc(raffleId).get();
        const ticketDoc = await db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber).get();
        if (!raffleDoc.exists || !ticketDoc.exists) throw new Error("Datos no encontrados");
        
        const raffleData = raffleDoc.data();
        const ticketData = ticketDoc.data();

        // Rellenar la plantilla (esta parte ya estaba bien)
        document.getElementById('template-prize').textContent = raffleData.prize;
        document.getElementById('template-buyer').textContent = ticketData.buyerName;
        document.getElementById('template-manager').textContent = raffleData.manager;
        document.getElementById('template-lottery').textContent = raffleData.lottery;
        document.getElementById('template-draw-date').textContent = new Date(raffleData.drawDate).toLocaleDateString('es-CO');
        document.getElementById('template-number').textContent = ticketData.number;
        
        // Lógica para llenar los métodos de pago (esta parte ya estaba bien)
        const paymentMethodsContainer = document.getElementById('template-payment-methods');
        let paymentHTML = '';
        raffleData.paymentMethods.forEach(pm => {
            const methodDetails = paymentMethods.find(m => m.value === pm.method);
            if (methodDetails) {
                let detailsText = '';
                if (pm.method === 'nequi' || pm.method === 'daviplata') {
                    detailsText = `Celular: ${pm.phoneNumber}`;
                } else if (pm.method === 'bre-b') {
                    detailsText = `Llave: ${pm.key}`;
                } else if (pm.accountNumber) {
                    detailsText = `${pm.accountType.charAt(0).toUpperCase() + pm.accountType.slice(1)}: ${pm.accountNumber}`;
                } else {
                    detailsText = methodDetails.name;
                }
                paymentHTML += `<div style="display: flex; align-items: center; margin-bottom: 8px;"><img src="${methodDetails.icon}" alt="${methodDetails.name}" style="height: 24px; margin-right: 10px;"><span style="font-weight: 500;">${detailsText}</span></div>`;
            }
        });
        paymentMethodsContainer.innerHTML = paymentHTML;

        // El resto de la lógica para generar y compartir la imagen queda igual...
        const templateElement = document.getElementById('ticket-template');
        const canvas = await html2canvas(templateElement, { useCORS: true, scale: 2 });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const fileName = `boleto-${ticketData.number}-${raffleData.name.replace(/\s+/g, '-')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareText = `¡Hola ${ticketData.buyerName}! Aquí está tu boleto #${ticketData.number} para la rifa. ¡Mucha suerte!`;

        if (type === 'whatsapp') {
            const viewContainer = document.getElementById('modal-view-container');
            const imageUrl = URL.createObjectURL(blob);
            viewContainer.innerHTML = `
                <div class="ticket-preview-wrapper">
                    <h4>¡Boleto listo para WhatsApp!</h4>
                    <p>1. Mantén presionada la imagen y elige "Copiar imagen".</p>
                    <p>2. Haz clic en el botón para abrir WhatsApp y pega la imagen en el chat.</p>
                    <a href="https://wa.me/?text=${encodeURIComponent(shareText)}" target="_blank" class="btn btn-whatsapp" style="margin-top:1rem; width: auto;">Abrir WhatsApp</a>
                    <img src="${imageUrl}" alt="Boleto de Rifa">
                </div>
            `;
        } else {
            const shareData = { files: [file], title: `Boleto: ${raffleData.name}`, text: shareText };
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }
    } catch (error) {
        console.error("Error al generar/compartir imagen:", error);
        alert("Hubo un error al procesar la imagen.");
    } finally {
        shareBtn.textContent = originalText;
        shareBtn.disabled = false;
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
    mainNav.style.display = 'block'; // Muestra el contenedor de navegación
    
    // ESTA LÍNEA ES LA QUE "RELLENA" EL HEADER
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
    
        // Lógica para los métodos de pago (sin cambios)
        const paymentGrid = document.querySelector('.payment-options-grid');
        if (paymentGrid) {
            paymentGrid.addEventListener('click', (e) => {
                const option = e.target.closest('.payment-option');
                if (!option) return;
    
                option.classList.toggle('selected');
                
                const bankDetailsWrapper = document.getElementById('bank-account-details');
                const nequiDetails = document.getElementById('nequi-details');
                const daviplataDetails = document.getElementById('daviplata-details');
                const brebDetails = document.getElementById('bre-b-details');
                const traditionalBanks = ['av-villas', 'bancolombia', 'bbva', 'bogota', 'caja-social', 'davivienda', 'falabella', 'finandina', 'itau', 'lulo', 'pibank', 'powwi', 'uala'];
                
                const selectedOptions = Array.from(document.querySelectorAll('.payment-option.selected')).map(el => el.dataset.value);
    
                nequiDetails.style.display = selectedOptions.includes('nequi') ? 'block' : 'none';
                daviplataDetails.style.display = selectedOptions.includes('daviplata') ? 'block' : 'none';
                brebDetails.style.display = selectedOptions.includes('bre-b') ? 'block' : 'none';
    
                const selectedBanks = selectedOptions.filter(val => traditionalBanks.includes(val));
                if (selectedBanks.length > 0) {
                    bankDetailsWrapper.style.display = 'block';
                    document.getElementById('bank-list').textContent = selectedBanks.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ');
                } else {
                    bankDetailsWrapper.style.display = 'none';
                }
            });
        }
    
        // --- AÑADE ESTA LÓGICA NUEVA PARA LOS BOTONES DE PRECIO ---
        const priceOptionsContainer = document.querySelector('.predefined-options');
        if (priceOptionsContainer) {
            priceOptionsContainer.addEventListener('click', (e) => {
                // Se asegura de que se hizo clic en un botón de opción de precio
                if (e.target.classList.contains('price-option-btn')) {
                    const price = e.target.dataset.price;
                    const priceInput = document.getElementById('ticket-price');
                    priceInput.value = price;
                }
            });
        }
    } else if (isRaffleDetail) {
    const ticketsGrid = document.getElementById('tickets-grid');
    const modal = document.getElementById('ticket-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // Listener para ABRIR el modal
    if (ticketsGrid) {
        ticketsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('ticket')) {
                const ticketNumber = e.target.dataset.id;
                openTicketModal(ticketNumber);
            }
        });
    }

    // Listeners para CERRAR Y RESETEAR el modal
    if (modal) {
        closeModalBtn.addEventListener('click', () => closeAndResetModal());
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'ticket-modal') {
                closeAndResetModal();
            }
        });
    }
}

async function openTicketModal(ticketNumber) {
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;

    // Buscamos los elementos del modal
    const modalTitleForm = document.getElementById('modal-ticket-number-form');
    const modalTitleInfo = document.getElementById('modal-ticket-number-info');
    const formView = document.getElementById('ticket-form');
    const infoView = document.getElementById('ticket-info-view');

    const raffleId = window.location.hash.slice(1).split('/')[2];
    if (!raffleId) return;

    try {
        const ticketRef = db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber);
        const doc = await ticketRef.get();

        if (doc.exists) {
            const data = doc.data();
            
            // Actualizamos títulos y decidimos qué vista mostrar
            modalTitleForm.textContent = `Boleto #${data.number}`;
            modalTitleInfo.textContent = `Boleto #${data.number}`;

            if (data.status === 'available') {
                infoView.style.display = 'none';
                formView.style.display = 'block';
                formView.querySelector('#buyer-name').value = '';
                formView.querySelector('#buyer-phone').value = '';
                formView.querySelector('#payment-status').value = 'pending';
            } else {
                formView.style.display = 'none';
                infoView.style.display = 'block';
                infoView.querySelector('#info-buyer-name').textContent = data.buyerName || 'No disponible';
                infoView.querySelector('#info-buyer-phone').textContent = data.buyerPhone || 'No disponible';
                const statusMap = { 'pending': 'Pendiente', 'partial': 'Pago Parcial', 'paid': 'Pagado Total' };
                infoView.querySelector('#info-payment-status').textContent = statusMap[data.status] || data.status;
            }
            
            modal.style.display = 'flex'; // Mostramos el modal

            // --- INICIO DE LA SECCIÓN AÑADIDA ---
            // Asignamos los listeners a los botones CADA VEZ que el modal se abre
            const form = document.getElementById('ticket-form');
            const clearBtnForm = document.getElementById('clear-ticket-btn-form');
            const clearBtnInfo = document.getElementById('clear-ticket-btn-info');
            const whatsappBtn = document.getElementById('whatsapp-share-btn');
            const genericBtn = document.getElementById('generic-share-btn');
            const whatsappBtnInfo = document.getElementById('whatsapp-share-btn-info');
            const genericBtnInfo = document.getElementById('generic-share-btn-info');

            if (form) form.addEventListener('submit', handleTicketFormSubmit);
            if (clearBtnForm) clearBtnForm.addEventListener('click', handleClearTicket);
            if (clearBtnInfo) clearBtnInfo.addEventListener('click', handleClearTicket);
            if (whatsappBtn) whatsappBtn.addEventListener('click', () => handleShare('whatsapp'));
            if (genericBtn) genericBtn.addEventListener('click', () => handleShare('generic'));
            if (whatsappBtnInfo) whatsappBtnInfo.addEventListener('click', () => handleShare('whatsapp'));
            if (genericBtnInfo) genericBtnInfo.addEventListener('click', () => handleShare('generic'));
            // --- FIN DE LA SECCIÓN AÑADIDA ---
            
        } else {
            alert("Error: No se encontró el boleto.");
        }
    } catch (error) {
        console.error("Error al obtener datos del boleto:", error);
        alert("Hubo un error al obtener los datos del boleto.");
    }
}

async function handleCreateRaffle(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Debes iniciar sesión para crear una rifa.');
        return;
    }

    const selectedOptions = document.querySelectorAll('.payment-option.selected');
    if (selectedOptions.length === 0) {
        alert('Por favor, selecciona al menos un método de pago.');
        return;
    }

    const paymentMethodsData = [];
    // Lista de bancos que usan la plantilla genérica de cuenta
    const traditionalBanks = ['av-villas', 'bancolombia', 'bbva', 'bogota', 'caja-social', 'davivienda', 'falabella', 'finandina', 'itau', 'lulo', 'pibank', 'powwi', 'uala'];
    
    // Usamos un bucle para poder hacer validaciones y detener el proceso si algo falla
    for (const option of selectedOptions) {
        const methodValue = option.dataset.value;
        const methodInfo = { method: methodValue };

        if (methodValue === 'nequi') {
            methodInfo.phoneNumber = document.getElementById('nequi-phone-number').value;
        } else if (methodValue === 'daviplata') {
            methodInfo.phoneNumber = document.getElementById('daviplata-phone-number').value;
        } else if (methodValue === 'bre-b') {
            const brebKey = document.getElementById('bre-b-key').value;
            // Validación específica para Bre-B
            if (!brebKey.startsWith('@')) {
                alert('La llave de Bre-B debe empezar con "@". Por favor, corrígela.');
                return; // Detenemos el envío del formulario
            }
            methodInfo.key = brebKey;
        } else if (traditionalBanks.includes(methodValue)) {
            // Todos los bancos tradicionales comparten los mismos datos del formulario genérico
            methodInfo.accountType = document.getElementById('bank-account-type').value;
            methodInfo.accountNumber = document.getElementById('bank-account-number').value;
        }
        
        paymentMethodsData.push(methodInfo);
    }

    const raffle = {
        name: document.getElementById('raffle-name').value,
        prize: document.getElementById('raffle-prize').value,
        manager: document.getElementById('raffle-manager').value, // <-- NUEVO DATO
        lottery: document.getElementById('raffle-lottery').value, // <-- NUEVO DATO
        ticketPrice: parseFloat(document.getElementById('ticket-price').value),
        paymentDeadline: document.getElementById('payment-deadline').value,
        drawDate: document.getElementById('draw-date').value,
        paymentMethods: paymentMethodsData,
        ownerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }

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

async function handleDeleteRaffle(raffleId, cardElement) {
    const raffleName = cardElement.querySelector('h3').textContent;
    const isConfirmed = confirm(`¿Estás seguro de que quieres eliminar la rifa "${raffleName}"?\n\n¡Esta acción es irreversible y borrará todos los boletos asociados!`);

    if (!isConfirmed) {
        return;
    }

    try {
        // Paso 1: Borrar todos los boletos de la subcolección
        const ticketsSnapshot = await db.collection('raffles').doc(raffleId).collection('tickets').get();
        const batch = db.batch();
        ticketsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('Todos los boletos de la subcolección han sido eliminados.');

        // Paso 2: Borrar el documento principal de la rifa
        await db.collection('raffles').doc(raffleId).delete();
        console.log('Documento de la rifa eliminado.');

        // Paso 3: Eliminar la tarjeta de la vista
        cardElement.style.transition = 'opacity 0.5s ease';
        cardElement.style.opacity = '0';
        setTimeout(() => cardElement.remove(), 500);

        alert(`La rifa "${raffleName}" ha sido eliminada con éxito.`);

    } catch (error) {
        console.error("Error al eliminar la rifa:", error);
        alert("Hubo un error al intentar eliminar la rifa.");
    }
}
