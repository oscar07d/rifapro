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
				const raffleDoc = await db.collection('raffles').doc(raffleId).get();
				if (!raffleDoc.exists) {
					appContainer.innerHTML = '<h2>Error: Rifa no encontrada</h2>';
					return;
				}
				const raffleData = { id: raffleDoc.id, ...raffleDoc.data() };

				appContainer.innerHTML = view(raffleData);
				const ticketsGrid = document.getElementById('tickets-grid');
				ticketsGrid.innerHTML = 'Cargando boletos...';

				const ticketsCollection = db.collection('raffles').doc(raffleId).collection('tickets').orderBy('number');

				unsubscribeFromTickets = ticketsCollection.onSnapshot(snapshot => {
					ticketsGrid.innerHTML = ''; 
					snapshot.forEach(doc => {
						const ticketData = doc.data();
						const ticketElement = document.createElement('div');
						ticketElement.classList.add('ticket', ticketData.status);
						ticketElement.textContent = ticketData.number;
						ticketElement.dataset.id = ticketData.number;
						ticketsGrid.appendChild(ticketElement);
					});
				});

				// --- Lógica actualizada para el botón de compartir ---
				const shareStatusBtn = document.getElementById('share-status-btn');
				if (shareStatusBtn) {
					shareStatusBtn.addEventListener('click', () => openSimpleStatusModal(raffleData));
				}

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
    e.preventDefault();

    const buyerName = document.getElementById('buyer-name').value;
    const buyerPhone = document.getElementById('buyer-phone').value;
    const status = document.getElementById('payment-status').value;
    
    // --- LÍNEA CORREGIDA ---
    // Leemos el número desde el ID del título del formulario, que siempre está visible aquí.
    const ticketNumber = document.getElementById('modal-ticket-number-form').textContent.replace('Boleto #', '');
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
        
        console.log(`Boleto #${ticketNumber} actualizado correctamente.`);
        
        // Cerramos y reseteamos el modal
        closeAndResetModal();

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
    const isFormVisible = document.getElementById('ticket-form').style.display !== 'none';
    
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
        const ticketNumberId = isFormVisible ? 'modal-ticket-number-form' : 'modal-ticket-number-info';
        const ticketNumber = document.getElementById(ticketNumberId).textContent.replace('Boleto #', '');
        
        const raffleDoc = await db.collection('raffles').doc(raffleId).get();
        const ticketDoc = await db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber).get();
        if (!raffleDoc.exists || !ticketDoc.exists) throw new Error("Datos no encontrados");
        
        const raffleData = raffleDoc.data();
        const ticketData = ticketDoc.data();

        // Rellenar la plantilla completa
        document.getElementById('template-prize').textContent = raffleData.prize;
        document.getElementById('template-buyer').textContent = ticketData.buyerName;
        document.getElementById('template-manager').textContent = raffleData.manager;
        document.getElementById('template-lottery').textContent = raffleData.lottery;
        document.getElementById('template-draw-date').textContent = new Date(raffleData.drawDate).toLocaleDateString('es-CO');
        document.getElementById('template-number').textContent = ticketData.number;
		
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

                // Convertimos la ruta del SVG a la ruta del PNG
                const pngPath = methodDetails.icon.replace('/banks/', '/banks/png-banks/').replace('.svg', '.png');
                
                paymentHTML += `
                    <div style="display: flex; align-items: center; height: 28px; line-height: 28px; margin-bottom: 8px;">
                        <img src="${pngPath}" alt="${methodDetails.name}" style="height: 22px; max-height: 22px; width: auto; margin-right: 10px; vertical-align: middle;">
                        <span style="font-weight: 500; font-size: 1rem; vertical-align: middle;">${detailsText}</span>
                    </div>
                `;
            }
        });
        paymentMethodsContainer.innerHTML = paymentHTML;

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

function closeAndResetModal() {
    const modal = document.getElementById('ticket-modal');
    const viewContainer = document.getElementById('modal-view-container');
    if (modal) {
        modal.style.display = 'none';
    }
    // Restaura el contenido original del modal para la próxima vez que se abra
    if (viewContainer) {
        viewContainer.innerHTML = `
            <form id="ticket-form" style="display: block;">
                <h3 id="modal-ticket-number-form" class="modal-title">Boleto #00</h3>
                <div class="form-group">
                    <label for="buyer-name">Nombre del Comprador</label>
                    <input type="text" id="buyer-name" required>
                </div>
                <div class="form-group">
                    <label for="buyer-phone">Número de Celular</label>
                    <input type="tel" id="buyer-phone" required>
                </div>
                <div class="form-group">
                    <label for="payment-status">Estado del Pago</label>
                    <select id="payment-status">
                        <option value="pending">Pendiente</option>
                        <option value="partial">Pago Parcial</option>
                        <option value="paid">Pagado Total</option>
                    </select>
                </div>
                <div class="modal-buttons">
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    <button type="button" id="clear-ticket-btn-form" class="btn btn-danger">Limpiar Boleto</button>
                </div>
                <div class="modal-buttons" style="margin-top: 0.5rem;">
                    <button type="button" id="whatsapp-share-btn" class="btn btn-whatsapp">WhatsApp</button>
                    <button type="button" id="generic-share-btn" class="btn btn-secondary">Compartir</button>
                </div>
            </form>
            <div id="ticket-info-view" style="display: none;">
                <h3 id="modal-ticket-number-info" class="modal-title">Boleto #00</h3>
                <div class="form-group">
                    <label>A nombre de:</label>
                    <p id="info-buyer-name" class="info-text"></p>
                </div>
                <div class="form-group">
                    <label>Número de Celular</label>
                    <p id="info-buyer-phone" class="info-text"></p>
                </div>
                <div class="form-group">
                    <label>Estado del Pago</label>
                    <p id="info-payment-status" class="info-text"></p>
                </div>
                <div class="modal-buttons">
                    <button type="button" id="clear-ticket-btn-info" class="btn btn-danger">Limpiar Boleto</button>
                </div>
                <div class="modal-buttons" style="margin-top: 0.5rem;">
                    <button type="button" id="whatsapp-share-btn-info" class="btn btn-whatsapp">WhatsApp</button>
                    <button type="button" id="generic-share-btn-info" class="btn btn-secondary">Compartir</button>
                </div>
            </div>
        `;
    }
}

// Dejaremos esta función preparada para el siguiente paso

function openSimpleStatusModal(raffleData) {
    const modal = document.getElementById('status-modal');
    if (!modal) return;

    const titleTypeSelect = document.getElementById('status-title-type');
    const prizeOptions = document.getElementById('prize-options-wrapper');
    const statusForm = document.getElementById('status-form');
    const closeModalBtn = modal.querySelector('.close-status-modal');

    titleTypeSelect.onchange = () => {
        prizeOptions.style.display = titleTypeSelect.value === 'prize' ? 'block' : 'none';
    };

    closeModalBtn.onclick = () => modal.style.display = 'none';

    statusForm.onsubmit = (e) => {
        e.preventDefault();
        const settings = {
            titleType: document.getElementById('status-title-type').value,
            prizePrefix: document.getElementById('status-prize-prefix').value
        };
        generateFinalStatusImage(raffleData, settings);
        modal.style.display = 'none';
    };

    modal.style.display = 'flex';
}

async function generateFinalStatusImage(raffleData, settings) {
    const shareBtn = document.getElementById('share-status-btn');
    shareBtn.textContent = 'Generando...';
    shareBtn.disabled = true;

    try {
        // 1. Crear el lienzo HTML dinámico
        const statusTemplate = document.createElement('div');
        statusTemplate.id = 'status-template-generator';
        statusTemplate.style.cssText = `
            position:absolute; left:-9999px;
            width:1080px; height:1920px;
            color:white;
            padding:50px 40px; box-sizing:border-box;
            display:flex; flex-direction:column;
            font-family:'Poppins', sans-serif;
            background:linear-gradient(160deg,#4A00E0 0%,#8E2DE2 100%);
        `;

        // 2. Título
        let titleHTML = '';
        if (settings.titleType === 'prize') {
            titleHTML = settings.prizePrefix.replace(
                '{premio}',
                `<span style="font-weight:800;">${raffleData.prize}</span>`
            );
        } else {
            titleHTML = raffleData.name;
        }

        // 3. Tickets
        const ticketsSnapshot = await db.collection('raffles')
            .doc(raffleData.id)
            .collection('tickets')
            .orderBy('number')
            .get();

        let ticketsHTML = '';
        ticketsSnapshot.forEach(doc => {
            const ticket = doc.data();
            const isAvailable = ticket.status === 'available';
            const classes = isAvailable
                ? 'background-color:#fff;color:#2c2c2c;'
                : 'background-color:rgba(0,0,0,0.6);color:transparent;';
            const content = isAvailable ? ticket.number : '';
            ticketsHTML += `
                <div style="
                    border-radius:16px;
                    display:flex; justify-content:center; align-items:center;
                    font-weight:600; aspect-ratio:1/1;
                    font-size:2rem; ${classes}
                ">${content}</div>`;
        });

        // 4. Métodos de pago
        let paymentHTML = raffleData.paymentMethods.map(pm => {
			const methodDetails = paymentMethods.find(m => m.value === pm.method);
			if (!methodDetails) return '';

			const pngPath = methodDetails.icon.replace('/banks/', '/banks/png-banks/').replace('.svg', '.png');
			let detailsText = '';
			if (pm.accountNumber) {
				detailsText = `${pm.accountType.charAt(0).toUpperCase() + pm.accountType.slice(1)}: ${pm.accountNumber}`;
			} else if (pm.phoneNumber) {
				detailsText = `Cel: ${pm.phoneNumber}`;
			} else {
				detailsText = methodDetails.name;
			}

			return `
			  <div style="display:flex;align-items:center;gap:6px;">
				<img src="${pngPath}" 
					 alt="${methodDetails.name}" 
					 style="width:clamp(30px, 6vw, 60px);height:auto;object-fit:contain;" />
				<span style="font-size:clamp(30px, 1.5vw, 16px);">
				  <strong>${methodDetails.name}:</strong> ${detailsText}
				</span>
			  </div>
			`;
		}).join('');

        // 5. Plantilla final
        statusTemplate.innerHTML = `
            <div style="flex:1;display:flex;flex-direction:column;">
                <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:40px;">
                    <!-- LOGO SVG más grande -->
                    <svg xmlns="http://www.w3.org/2000/svg"
						 viewBox="0 0 1010.84 231.45"
						 preserveAspectRatio="xMidYMid meet"
						 style="height:72px; margin-bottom:16px; display:block;"
						 fill="white">
					  <defs>
						<style>
						  .cls-1,.cls-2{stroke-miterlimit:10;stroke-width:7.4px;}
						  /* Forzamos el trazo a blanco */
						  .cls-1,.cls-2,.cls-3{stroke:#fff;stroke-linecap:round;}
						  .cls-1,.cls-3{fill:none;}
						  .cls-2{fill:#fff;}
						  .cls-3{stroke-linejoin:round;stroke-width:12.52px;}
						</style>
					  </defs>
					  <g id="Capa_1-2" data-name="Capa 1">
						<g>
						  <g>
							<path d="M218.07,54.14h-28.47c-2.24-1.48-4.26-3.36-5.98-5.61-5.16-6.74-6.44-15.22-3.67-22.95l-3.43-4.4c-5.13,2.5-10.89,3.47-16.69,2.74-5.8-.72-11.14-3.06-15.51-6.74l-47.45,36.96h-20.38L145.99,0l3.84,4.94c2.85,3.66,6.95,5.99,11.54,6.56,4.6,.57,9.14-.69,12.8-3.53l4.94-3.85,15.61,20.05-2.06,3.63c-2.43,4.3-2.09,9.2,.91,13.12s7.64,5.53,12.42,4.3l4.28-1.09,7.8,10.01Z"/>
							<path d="M266.01,130.5l3.86-1.61v-31.52h-6.26c-14.87,0-26.97-12.1-26.97-26.97v-6.26H33.24v6.26c0,14.87-12.11,26.97-26.98,26.97H0v31.52l3.86,1.61c8.7,3.62,11.86,11.51,11.92,17.69,.05,6.18-2.97,14.13-11.62,17.9l-4.16,1.82v30.3H6.26c14.87,0,26.98,12.1,26.98,26.98v6.26H236.64v-6.26c0-14.88,12.1-26.98,26.97-26.98h6.26v-30.3l-4.17-1.82c-8.64-3.77-11.66-11.72-11.61-17.9,.06-6.18,3.22-14.07,11.92-17.69Zm-24.44,17.58c-.1,11.73,5.86,22.08,15.78,27.8v10.31c-16.77,2.68-30.06,15.96-32.74,32.74H45.26c-2.68-16.78-15.96-30.06-32.74-32.74v-10.31c9.92-5.72,15.88-16.07,15.78-27.8-.1-11.54-6.05-21.64-15.78-27.25v-11.43c16.78-2.68,30.06-15.97,32.74-32.74H224.61c2.68,16.77,15.97,30.06,32.74,32.74v11.43c-9.73,5.61-15.68,15.71-15.78,27.25Z"/>
							<polygon class="cls-3" points="127.86 104.58 147.23 126.8 176.51 123.43 161.37 148.72 173.62 175.53 144.89 168.95 123.18 188.88 120.56 159.52 94.9 145.03 122.01 133.47 127.86 104.58"/>
							<line class="cls-2" x1="53.61" y1="117.05" x2="53.61" y2="180.05"/>
							<line class="cls-1" x1="220.68" y1="117.05" x2="220.68" y2="180.05"/>
							<path d="M170.04,54.14h-9.96l-9.78-10.87c-1.37-1.52-1.25-3.86,.27-5.23,1.52-1.36,3.86-1.24,5.23,.28l14.24,15.82Z"/>
						  </g>
						  <g>
							<path d="M376.56,167.69h-15.45v58.6h-29.84V74.1h59.46c29.62,0,48.51,20.39,48.51,46.79,0,21.25-12.45,37.35-32.41,43.14l32.63,62.25h-33.06l-29.84-58.6Zm8.59-25.54c15.03,0,23.83-8.59,23.83-21.04s-8.8-21.25-23.83-21.25h-24.04v42.29h24.04Z"/>
							<path d="M473.58,68.3c9.87,0,17.6,7.94,17.6,17.82s-7.73,17.39-17.6,17.39-17.6-7.94-17.6-17.39,7.94-17.82,17.6-17.82Zm-14.17,157.98V120.68h28.55v105.61h-28.55Z"/>
							<path d="M551.28,109.09v11.59h23.83v24.47h-23.83v81.14h-28.76v-81.14h-17.6v-24.47h17.6v-12.02c0-23.83,15.02-39.28,38.42-39.28,6.01,0,11.81,1.07,14.17,2.15v24.04c-1.5-.43-4.29-1.07-9.02-1.07-6.44,0-14.81,2.79-14.81,14.6Z"/>
							<path d="M616.11,165.54l25.97-3.86c6.01-.86,7.94-3.86,7.94-7.51,0-7.51-5.8-13.74-17.82-13.74s-19.32,7.94-20.18,17.17l-25.33-5.37c1.72-16.53,16.96-34.77,45.29-34.77,33.48,0,45.93,18.89,45.93,40.14v51.94c0,5.58,.64,13.09,1.29,16.74h-26.19c-.64-2.79-1.07-8.59-1.07-12.66-5.37,8.37-15.45,15.67-31.12,15.67-22.54,0-36.27-15.24-36.27-31.77,0-18.89,13.95-29.41,31.55-31.98Zm33.91,18.03v-4.72l-23.83,3.65c-7.3,1.07-13.09,5.15-13.09,13.31,0,6.22,4.51,12.23,13.74,12.23,12.02,0,23.18-5.8,23.18-24.47Z"/>
							<path d="M733.3,168.97v57.31h-29.62V74.1h56.88c30.05,0,50.01,19.96,50.01,47.44s-19.96,47.44-50.01,47.44h-27.26Zm23.61-25.54c14.81,0,23.83-8.59,23.83-21.68s-9.02-21.89-23.83-21.89h-23.4v43.57h23.4Z"/>
							<path d="M891.07,149.01c-3.22-.64-6.01-.86-8.59-.86-14.6,0-27.26,7.08-27.26,29.84v48.3h-28.55V120.68h27.69v15.67c6.44-13.95,21.04-16.53,30.05-16.53,2.36,0,4.51,.21,6.65,.43v28.76Z"/>
							<path d="M1010.84,173.48c0,32.41-23.83,56.02-55.38,56.02s-55.38-23.61-55.38-56.02,23.83-56.02,55.38-56.02,55.38,23.4,55.38,56.02Zm-28.55,0c0-19.96-12.88-30.05-26.83-30.05s-26.83,10.09-26.83,30.05,12.88,30.05,26.83,30.05,26.83-10.09,26.83-30.05Z"/>
						  </g>
						</g>
					  </g>
					</svg>

                    <div style="text-align:center;padding:25px;background:rgba(255,255,255,0.15);border-radius:20px;">
                        <h2 style="margin:0;font-size:4rem;font-weight:700;line-height:1.2;color:white;">
                            ${titleHTML}
                        </h2>
                    </div>
                </div>

                <div style="flex-grow:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
                    <h3 style="text-align:center;margin:0 0 40px 0;font-weight:600;font-size:2.5rem;color:white;">
                        ¡Números disponibles!
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:15px;">
                        ${ticketsHTML}
                    </div>
                </div>

                <div style="padding:25px;background:rgba(255,255,255,0.15);border-radius:20px;text-align:left;color:white;">
                    <p style="margin:0 0 20px 0;font-size:1.8rem;text-align:center;color:white;">
                        <strong>Juega:</strong> ${new Date(raffleData.drawDate).toLocaleDateString('es-CO')} con Loteria de ${raffleData.lottery}
                    </p>
                    <div style="
						display:grid;
						grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
						gap:10px;
						align-items:center;
						border-top: 1px solid rgba(255,255,255,0.3);
						border-bottom: 1px solid rgba(255,255,255,0.3);
						padding: 15px 5px;
					">
						${paymentHTML}
					</div>
					<p style="font-size: 2rem; margin: 10px 0 5px 0; text-align: center;"><strong>Precio del boleto:</strong> $${raffleData.ticketPrice.toLocaleString('es-CO')}</p>
                    <p style="margin:20px 0 10px 0;font-size:1.6rem;opacity:0.9;text-align:center;color:white;">
                        Rifa organizada por: ${raffleData.manager}
                    </p>
                    <div style="height:30px;opacity:0.9;display:flex;align-items:center;justify-content:center;">
						<p style="margin:0;font-size:1.4rem;color:white;opacity:0.8;">Desarrollado por </p>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 879.14 85.62" style="height:100%;" fill="white">
						  <g id="Capa_1-2" data-name="Capa 1">
							<g id="Imagotipo">
							  <g>
								<path d="M110.22,49.35l-10.41,10.41c3.95,8.61,12.65,14.6,22.74,14.6h0c13.81,0,25.47-8.41,25.47-22.22,0,0,1.07-16.23-15.49-19.61-9.39-1.91-13.45-5.24-15.19-7.53-1.22-1.61-1.55-3.78-.7-5.62,.72-1.56,2.29-3.12,5.74-3.12,9.24,0,12.17,8.74,12.17,8.74l10.63-10.63C141.2,5.88,132.57,0,122.56,0h0C108.75,0,99.88,10.27,99.88,24.07c0,0-.21,11.49,13.34,18.14,.92,.45,1.88,.82,2.85,1.14,1.89,.63,5.2,1.73,5.4,1.79,.93,.32,9.06,2.11,9.31,6.62,.22,3.99-2.48,6.99-8.78,5.75-4.32-.85-11.77-8.18-11.77-8.18Z"/>
								<polygon points="248.32 27.08 233.59 74.35 211.15 74.35 237.1 0 259.54 0 285.5 74.35 263.06 74.35 248.32 27.08"/>
								<path d="M199.2,50.32l13.15,13.15c-6.73,6.72-16.02,10.89-26.29,10.89-20.53,0-37.17-16.64-37.17-37.17S165.53,0,186.05,0C196.32,0,205.61,4.16,212.34,10.89l-13.15,13.15c-3.36-3.36-8.01-5.45-13.14-5.45-10.26,0-18.59,8.32-18.59,18.59s8.32,18.59,18.59,18.59c5.13,0,9.78-2.08,13.14-5.45Z"/>
								<path d="M305.28,46.55h0v27.8h-16.53V0h29.39c14.64,0,24.06,10.04,24.06,23.22,0,10.04-5.54,17.68-14.64,20.92l15.06,30.21h-18.2l-10.74-22.52c-1.55-3.23-4.82-5.28-8.4-5.28Zm9.73-14.23c6.8,0,10.46-3.77,10.46-9,0-5.54-3.66-9-10.46-9h-9.73v17.99h9.73Z"/>
								<path d="M414.41,7.4C409.84,2.83,403.53,0,396.56,0,382.61,0,371.31,11.31,371.31,25.25v23.85c0,13.95,11.31,25.25,25.25,25.25s25.25-11.31,25.25-25.25V25.25c0-6.97-2.83-13.29-7.4-17.85Zm-7.91,41.38c0,6.28-3.65,11.38-9.94,11.38s-9.94-5.1-9.94-11.38V25.57c0-6.28,3.65-11.38,9.94-11.38s9.94,5.23,9.94,11.38v23.21Z"/>
								<path d="M470.58,15.17c-6.03,6.38-21.1,25.09-23.58,59.18h-17.79c2.66-39.31,22.21-59.3,22.21-59.3h-27.55V.22h46.72V15.17Z"/>
								<path d="M495.95,.11l-21.79,.22V74.46h21.79c20.53,0,37.17-16.64,37.17-37.17S516.48,.11,495.95,.11Zm4.41,56.81h-9.28V17.1l9.28-.12c8.74,0,15.83,8.95,15.83,19.98s-7.09,19.97-15.83,19.97Z"/>
							  </g>
							  <g>
								<path d="M61.98,0C41.45,0,24.81,16.64,24.81,37.17s16.64,37.17,37.17,37.17,37.17-16.64,37.17-37.17S82.51,0,61.98,0Zm0,55.76c-10.26,0-18.59-8.32-18.59-18.59s8.32-18.59,18.59-18.59,18.59,8.32,18.59,18.59-8.32,18.59-18.59,18.59Z"/>
								<path d="M59.72,78.01c-6.25,4.78-14.07,7.61-22.54,7.61C16.64,85.62,0,68.98,0,48.44,0,30.45,12.79,15.44,29.78,12c-5.44,6.95-8.68,15.69-8.68,25.17,0,21.78,17.13,39.65,38.62,40.83Z"/>
							  </g>
							  <g>
								<path d="M610.03,22.98h-6.69c-.27-5.34-2.18-9.41-5.72-12.21-3.55-2.8-8.33-4.21-14.34-4.21-5.67,0-10.1,1.18-13.27,3.55-3.18,2.37-4.76,5.71-4.76,10.03,0,1.55,.19,2.92,.56,4.1,.37,1.18,1.05,2.21,2.03,3.09,.98,.88,1.89,1.61,2.74,2.18,.84,.57,2.21,1.15,4.1,1.72,1.89,.57,3.41,1.01,4.56,1.32,1.15,.3,2.97,.73,5.47,1.27,2.7,.61,4.9,1.11,6.59,1.52,1.69,.41,3.61,.95,5.78,1.62,2.16,.68,3.9,1.35,5.22,2.03,1.32,.68,2.69,1.52,4.1,2.53,1.42,1.01,2.5,2.13,3.24,3.34,.74,1.22,1.37,2.65,1.87,4.31,.51,1.66,.76,3.5,.76,5.52,0,4.93-1.37,9.05-4.1,12.36-2.74,3.31-6.06,5.61-9.98,6.89-3.92,1.28-8.28,1.93-13.07,1.93-8.98,0-16.03-2.19-21.13-6.59-5.1-4.39-7.65-10.44-7.65-18.14v-.61h6.59c0,6.55,2.01,11.48,6.03,14.79,4.02,3.31,9.58,4.97,16.67,4.97,6.21,0,11.11-1.32,14.69-3.95,3.58-2.63,5.37-6.28,5.37-10.94s-1.71-7.75-5.12-9.68c-3.41-1.92-9.85-4-19.3-6.23-3.04-.67-5.29-1.22-6.74-1.62-1.45-.41-3.39-1.11-5.83-2.13-2.43-1.01-4.24-2.11-5.42-3.29-1.18-1.18-2.25-2.79-3.19-4.81-.95-2.03-1.42-4.39-1.42-7.09,0-6.08,2.25-10.89,6.74-14.44,4.49-3.55,10.62-5.32,18.39-5.32s14.08,1.87,18.75,5.62c4.66,3.75,7.16,9.27,7.5,16.57Z"/>
								<path d="M643.06,22.27v5.17h-10.74V60.47c0,1.76,.03,2.99,.1,3.7,.07,.71,.29,1.55,.66,2.53,.37,.98,1.03,1.64,1.98,1.98,.94,.34,2.23,.51,3.85,.51,.95,0,2.33-.1,4.15-.3v5.47c-2.09,.27-3.95,.41-5.57,.41-6.28,0-9.9-1.99-10.84-5.98-.4-1.69-.61-5.5-.61-11.45V27.44h-9.22v-5.17h9.22V6.36h6.28v15.91h10.74Z"/>
								<path d="M694.33,22.27v52.08h-5.88v-9.63c-3.85,7.43-9.97,11.15-18.34,11.15-5.54,0-9.91-1.6-13.12-4.81-3.21-3.21-4.81-7.92-4.81-14.14V22.27h6.38v31.92c0,5.4,1,9.44,2.99,12.11,1.99,2.67,5.39,4,10.18,4,5.07,0,9.05-1.84,11.96-5.52,2.9-3.68,4.36-8.26,4.36-13.73V22.27h6.28Z"/>
								<path d="M752.49,2.2V74.35h-5.78v-10.23c-1.55,3.85-3.97,6.77-7.24,8.76-3.28,1.99-7.11,2.99-11.5,2.99-7.23,0-12.95-2.48-17.17-7.45-4.22-4.97-6.33-11.67-6.33-20.11s2.11-15.06,6.33-20.06c4.22-5,9.88-7.5,16.97-7.5,9.05,0,15.23,3.75,18.54,11.25V2.2h6.18Zm-24.01,23.81c-5.34,0-9.61,2.01-12.82,6.03-3.21,4.02-4.81,9.41-4.81,16.16s1.6,12.36,4.81,16.41c3.21,4.05,7.51,6.08,12.92,6.08s9.91-1.99,13.12-5.98c3.21-3.98,4.81-9.46,4.81-16.41,0-6.21-1.52-11.48-4.56-15.81-3.04-4.32-7.53-6.48-13.48-6.48Z"/>
								<path d="M771.33,1.9V12.34h-6.38V1.9h6.38Zm0,20.37v52.08h-6.38V22.27h6.38Z"/>
								<path d="M805.78,20.75c7.5,0,13.46,2.5,17.88,7.5,4.42,5,6.64,11.75,6.64,20.27s-2.2,15.12-6.59,20.01c-4.39,4.9-10.37,7.35-17.94,7.35s-13.6-2.48-18.09-7.45c-4.49-4.97-6.74-11.67-6.74-20.11s2.25-15.06,6.74-20.06c4.49-5,10.52-7.5,18.09-7.5Zm13.17,11.4c-3.31-4.02-7.74-6.03-13.27-6.03s-9.97,2.01-13.27,6.03c-3.31,4.02-4.96,9.41-4.96,16.16s1.64,12.33,4.91,16.31c3.28,3.99,7.78,5.98,13.53,5.98s9.93-1.99,13.17-5.98c3.24-3.98,4.86-9.39,4.86-16.21s-1.66-12.24-4.97-16.26Z"/>
								<path d="M877.32,37.47h-6.18c-.61-7.56-5.3-11.35-14.08-11.35-3.72,0-6.67,.78-8.87,2.33-2.2,1.55-3.29,3.65-3.29,6.28,0,1.28,.24,2.4,.71,3.34,.47,.95,1.01,1.71,1.62,2.28,.61,.57,1.67,1.13,3.19,1.67,1.52,.54,2.84,.96,3.95,1.27,1.11,.3,2.92,.73,5.42,1.27,2.23,.54,4.02,.98,5.37,1.32,1.35,.34,3.02,.93,5.02,1.77,1.99,.85,3.56,1.76,4.71,2.74,1.15,.98,2.14,2.3,2.99,3.95,.84,1.66,1.27,3.53,1.27,5.62,0,4.8-1.91,8.66-5.72,11.6-3.82,2.94-8.8,4.41-14.95,4.41-6.69,0-11.89-1.62-15.6-4.86-3.72-3.24-5.64-7.84-5.78-13.78h6.18c0,4.32,1.35,7.63,4.05,9.93,2.7,2.3,6.48,3.44,11.35,3.44,4.26,0,7.68-.93,10.28-2.79,2.6-1.86,3.9-4.31,3.9-7.35,0-1.62-.42-3.04-1.27-4.26-.85-1.22-1.98-2.18-3.39-2.89-1.42-.71-2.82-1.28-4.21-1.72-1.39-.44-2.85-.83-4.41-1.17-.47-.07-.81-.13-1.01-.2-.47-.13-1.55-.39-3.24-.76-1.69-.37-2.87-.64-3.55-.81-.68-.17-1.76-.49-3.24-.96-1.49-.47-2.57-.91-3.24-1.32-.68-.41-1.54-.98-2.58-1.72-1.05-.74-1.82-1.54-2.33-2.38-.51-.84-.95-1.84-1.32-2.99-.37-1.15-.56-2.43-.56-3.85,0-4.52,1.71-8.11,5.12-10.74,3.41-2.63,8.09-3.95,14.03-3.95s10.71,1.42,14.29,4.26c3.58,2.84,5.37,6.96,5.37,12.36Z"/>
							  </g>
							</g>
						  </g>
						</svg>
					  </div>
					</div>
				  </div>
				`;

        document.body.appendChild(statusTemplate);

        // 6. Captura sin forzar width/height
        const canvas = await html2canvas(statusTemplate, { useCORS: true, scale: 1 });
        document.body.removeChild(statusTemplate);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `estado-rifa.png`, { type: 'image/png' });

        const shareData = { files: [file] };
        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            const link = document.createElement('a');
            link.download = `estado-rifa.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
    } catch (error) {
        console.error("Error al generar imagen de estado:", error);
        alert("Hubo un error al generar la imagen.");
    } finally {
        shareBtn.textContent = 'Compartir Estado de la Rifa';
        shareBtn.disabled = false;
    }
}
