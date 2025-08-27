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
		
		const getIconSvg = (methodName) => {
			const style = `style="height: 22px; max-height: 22px; width: auto; margin-right: 10px; vertical-align: middle;"`;
			switch (methodName) {
				case 'efectivo':
					return `<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2504.18 2318">
								<defs>
									<style>
									.cls-1 {
										fill: #388e3c;
									}

									.cls-2 {
										fill: #7fc481;
									}

									.cls-3 {
										fill: #1b5e20;
									}

									.cls-4 {
										fill: #a3d3a5;
									}

									.cls-5 {
										fill: #1b5d1f;
									}
									</style>
								</defs>
								<g>
									<rect class="cls-3" x="154.03" y="392.57" width="2196.12" height="1225.03" transform="translate(-299.96 593.9) rotate(-23.92)"/>
									<path class="cls-2" d="M2168.59,1125.2L725.89,1765.02c-42.04-94.79-152.96-137.55-247.75-95.52l-243.71-549.54c94.79-42.04,137.55-152.96,95.52-247.75L1772.64,232.39c42.04,94.79,152.96,137.55,247.75,95.52l243.71,549.54c-94.79,42.04-137.55,152.96-95.52,247.75Z"/>
									<circle class="cls-5" cx="1868.01" cy="731.93" r="122.78"/>
									<circle class="cls-5" cx="638.65" cy="1277.26" r="122.78"/>
									<circle class="cls-5" cx="1249.26" cy="998.7" r="359.97"/>
								</g>
								<g>
									<rect class="cls-1" x="308.07" y="1092.98" width="2196.12" height="1225.03"/>
									<path class="cls-4" d="M2195.23,2186.85H617.02c0-103.69-84.06-187.75-187.75-187.75v-601.16c103.69,0,187.75-84.06,187.75-187.75h1578.21c0,103.69,84.06,187.75,187.75,187.75v601.16c-103.69,0-187.75,84.06-187.75,187.75Z"/>
									<circle class="cls-1" cx="2079.9" cy="1705.49" r="122.78"/>
									<circle class="cls-1" cx="735.01" cy="1705.61" r="122.78"/>
									<circle class="cls-1" cx="1406.12" cy="1698.52" r="359.97"/>
								</g>
								</svg>`;
				case 'nequi':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #200020;
									}

									.cls-2 {
										fill: #ca0080;
									}

									.cls-3 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<rect class="cls-3" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<path class="cls-2" d="M65.45,56.59h-20.97c-2.45,0-4.43,1.98-4.43,4.43v17.82c0,2.45,1.98,4.43,4.43,4.43h20.97c2.45,0,4.43-1.98,4.43-4.43v-17.82c0-2.45-1.98-4.43-4.43-4.43Z"/>
									<path class="cls-1" d="M193.62,56.59h-18.09c-2.45,0-4.43,2.03-4.43,4.43v72.3c0,1.49-1.92,2.03-2.61,.69L126.44,58.51c-.69-1.23-1.92-1.92-3.42-1.92h-30.09c-2.45,0-4.43,2.03-4.43,4.43v115.52c0,2.45,2.03,4.43,4.43,4.43h18.09c2.45,0,4.43-2.03,4.43-4.43V102.06c0-1.49,1.92-2.03,2.61-.69l43.22,77.74c.69,1.23,1.92,1.92,3.42,1.92h28.76c2.45,0,4.43-2.03,4.43-4.43V60.97c0-2.45-2.03-4.43-4.43-4.43h.16v.05Z"/>
								</g>
								</svg>`;
				case 'bre-b':
					return `<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 2644.03 2644.03">
								<defs>
									<style>
									.cls-1 {
										fill: #32005e;
									}

									.cls-2 {
										clip-path: url(#clippath-2);
									}

									.cls-3 {
										fill: url(#Degradado_sin_nombre_11);
									}

									.cls-4 {
										clip-path: url(#clippath-1);
									}

									.cls-5 {
										clip-path: url(#clippath-4);
									}

									.cls-6 {
										clip-path: url(#clippath);
									}

									.cls-7 {
										fill: none;
									}

									.cls-8 {
										clip-path: url(#clippath-3);
									}
									</style>
									<clipPath id="clippath">
									<path class="cls-7" d="M829.65,1431.01c-8.21-54.95-48.85-101.19-104.22-119.62,13.25-6.82,38.29-22.09,56.59-51.46,28.15-45.15,23.18-95.98,12.88-126.1-22.6-65.89-98.04-112.09-186.53-109.32H332.31c-11.7,0-19.94,11.4-16.33,22.47,26.34,80.45,52.68,160.9,79.02,241.35,5.55,16.87,5.64,35.05,.29,51.96-26.51,83.98-53.02,168.01-79.52,252-3.49,11.15,4.88,22.43,16.54,22.3l324.96-3.49c15.32,.08,68.5-1.6,114.49-41.15,11.61-10.01,69.26-62.44,57.9-138.94Zm-372.42-298.24l167.55-1.18c34.92,7.24,59.37,38.33,58.19,72.04-1.26,36.99-33.03,68.21-72.33,68.5-37.11,.08-74.22,.21-111.33,.29-6.1,0-11.53-3.91-13.42-9.72-12.67-39.01-25.33-77.97-38-116.97-2.06-6.35,2.65-12.92,9.34-12.96Zm196.79,372.84c-65.01,.42-130.02,.8-195.07,1.18-7.87,.08-13.55-7.57-11.23-15.11,11.74-38.37,23.52-76.79,35.26-115.16,2.06-6.82,8.37-11.44,15.48-11.44h146.26c38.5,2.78,67.95,34.76,67.83,71.07-.08,32.95-24.45,62.57-58.53,69.47Z"/>
									</clipPath>
									<linearGradient id="Degradado_sin_nombre_11" data-name="Degradado sin nombre 11" x1="279.69" y1="1317.49" x2="2381.06" y2="1317.49" gradientUnits="userSpaceOnUse">
									<stop offset="0" stop-color="#00c4ff"/>
									<stop offset="1" stop-color="#00ff6d"/>
									</linearGradient>
									<clipPath id="clippath-1">
									<path class="cls-7" d="M989.8,1339.67v259.42c0,8.57-6.95,15.52-15.52,15.52h-86.67c-8.57,0-15.52-6.95-15.52-15.52v-451.99c0-8.57,6.95-15.52,15.52-15.52h86.67c8.57,0,15.52,6.95,15.52,15.52v83.54c2.06-10.16,9.67-41.11,38.11-66.57,27.81-24.89,58.57-29.34,68.98-30.39h122.23c11.64,0,16.8,14.47,7.92,21.99-23.92,20.26-48.81,48.14-65.99,85.58-1.43,3.12-2.77,6.22-4.02,9.29-3.43,8.43-11.6,13.93-20.7,13.97l-76.58,.34c-6.71,.25-26.62,1.88-44.39,16.92-25.6,21.68-25.64,53.36-25.57,57.89Z"/>
									</clipPath>
									<clipPath id="clippath-2">
									<path class="cls-7" d="M1624.31,1336.46c-4.04-42.96-9.21-91.9-43.84-135.15-59.33-74.05-160.57-71.53-177.77-71.11-21.71,.55-92.4,3.37-151.1,57.69-50.7,46.83-62.57,105.19-68.84,137-8.54,43.09-5.18,79.15-1.94,99.68,2.99,18.98,8.33,52.89,28.95,87.48,36.23,60.76,96.27,84.15,115.12,91.35,9.47,3.58,131.2,47.59,225.78-26.38,30.08-23.52,47.88-51.54,58.19-72.46,3.83-7.7-.25-17-8.58-19.31l-73.72-20.7c-9.17-2.57-19.1,1.05-23.94,9.21-3.07,5.18-7.11,10.65-12.41,15.78-27.31,26.34-66.86,23.39-87.48,21.88-18.68-1.39-40.23-2.99-61.77-17.38-40.27-26.89-46.28-71.4-47.25-80.7,106.5,.08,212.95,.21,319.45,.29,5.51,0,10.14-4.12,10.73-9.64,1.85-17.55,2.95-40.73,.42-67.53Zm-328.37-14.81c2.19-9.21,13.67-53.77,55.33-77.17,25.88-14.52,51.71-14.35,63.03-14.18,12.2,.25,33.16,.63,53.4,12.24,39.64,22.76,46.62,71.32,47.59,79.1h-219.35Z"/>
									</clipPath>
									<clipPath id="clippath-3">
									<path class="cls-7" d="M1831.06,1360.25h-147.24c-7.46,0-13.51-6.05-13.51-13.51v-66.89c0-7.46,6.05-13.51,13.51-13.51h147.24c4.98,0,9.43,3.13,11.11,7.82l11.46,31.98c1.66,4.62,1.66,9.68,0,14.3l-11.46,31.98c-1.68,4.69-6.13,7.82-11.11,7.82Z"/>
									</clipPath>
									<clipPath id="clippath-4">
									<path class="cls-7" d="M2327.58,1431.01c-8.2-54.95-48.85-101.19-104.22-119.62,13.25-6.82,38.29-22.09,56.59-51.46,28.15-45.15,23.18-95.98,12.88-126.1-22.6-65.89-98.04-112.09-186.53-109.32h-276.07c-11.7,0-19.94,11.4-16.33,22.47,26.34,80.45,52.68,160.9,79.02,241.35,5.55,16.87,5.64,35.05,.29,51.96-26.51,83.98-53.02,168.01-79.52,252-3.49,11.15,4.88,22.43,16.54,22.3l324.96-3.49c15.32,.08,68.5-1.6,114.49-41.15,11.61-10.01,69.26-62.44,57.9-138.94Zm-372.42-298.24l167.55-1.18c34.92,7.24,59.37,38.33,58.19,72.04-1.26,36.99-33.03,68.21-72.33,68.5-37.11,.08-74.22,.21-111.33,.29-6.1,0-11.53-3.91-13.42-9.72-12.67-39.01-25.33-77.97-38-116.97-2.06-6.35,2.65-12.92,9.34-12.96Zm196.79,372.84c-65.01,.42-130.02,.8-195.07,1.18-7.87,.08-13.55-7.57-11.23-15.11,11.74-38.37,23.52-76.79,35.26-115.16,2.06-6.82,8.37-11.44,15.48-11.44h146.26c38.5,2.78,67.95,34.76,67.83,71.07-.08,32.95-24.45,62.57-58.53,69.47Z"/>
									</clipPath>
								</defs>
								<rect class="cls-1" width="2644.03" height="2644.03" rx="375.83" ry="375.83"/>
								<g>
									<g class="cls-6">
									<rect class="cls-3" x="279.69" y="1000.4" width="2101.37" height="634.18"/>
									</g>
									<g class="cls-4">
									<rect class="cls-3" x="279.69" y="1000.4" width="2101.37" height="634.18"/>
									</g>
									<g class="cls-2">
									<rect class="cls-3" x="279.69" y="1000.4" width="2101.37" height="634.18"/>
									</g>
									<g class="cls-8">
									<rect class="cls-3" x="279.69" y="1000.4" width="2101.37" height="634.18"/>
									</g>
									<g class="cls-5">
									<rect class="cls-3" x="279.69" y="1000.4" width="2101.37" height="634.18"/>
									</g>
								</g>
								</svg>`;
				case 'daviplata':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										fill: none;
										stroke: #fff;
										stroke-miterlimit: 10;
										stroke-width: 1.08px;
									}

									.cls-3 {
										fill: #e1251b;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="daviplata">
									<rect class="cls-3" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<path class="cls-1" d="M30.16,122.39c0-1.71-.02-3.42,0-5.14,.02-1.17,.14-2.36,1.64-2.37s1.64,1.14,1.64,2.35c0,3.11,.02,6.2-.02,9.31,0,.84,.19,1.23,1.05,1.35,3.67,.52,7.25,.31,10.62-1.42,3.87-1.98,6.22-7.76,1.29-11.96-2.78-2.37-6.06-2.95-9.44-3.23-2.82-.23-5.61,.09-8.33,.9-.96,.28-1.91,.44-2.31-.77-.38-1.16,.26-1.98,1.25-2.4,2.16-.94,4.46-1.11,6.77-1.16,4.18-.1,8.28,.41,12.11,2.26,3.48,1.68,6.01,4.25,6.65,8.39,.7,4.57-1.82,9.13-6.26,11.2-4.49,2.1-9.2,2.33-13.98,1.48-1.9-.34-2.55-1.28-2.69-3.32,0-.1,0-.22,0-.32v-5.13h0Zm39.11-14.57c1.51,0,2.65,.81,3.72,1.74,2.14,1.88,3.72,4.24,5.21,6.68,2.14,3.52,3.94,7.21,5.51,11.04,.2,.48,.36,1,.45,1.52,.2,1.25-.19,2.26-1.4,2.67-1.27,.44-1.87-.46-2.29-1.52-1.84-4.69-3.97-9.24-6.7-13.45-.86-1.33-1.8-2.59-3.05-3.57-.94-.73-1.84-.76-2.81-.04-1.32,.98-2.28,2.3-3.16,3.67-2.65,4.07-4.73,8.46-6.54,12.99-.46,1.17-.92,2.4-2.5,1.9-1.24-.39-1.77-1.89-1.14-3.48,2.35-5.94,5.14-11.62,9.16-16.55,1.47-1.79,3.1-3.4,5.54-3.61h0Z"/>
										<path class="cls-1" d="M95.79,131.58c-1.25-.03-2.24-.67-3.15-1.49-1.69-1.52-2.97-3.39-4.15-5.33-2.46-4.07-4.44-8.4-6.12-12.88-.28-.75-.57-1.52-.34-2.34,.25-.86,.68-1.57,1.64-1.68,.94-.1,1.38,.53,1.67,1.34,1.03,2.85,2.17,5.65,3.47,8.36,1.3,2.73,2.63,5.44,4.54,7.78,1.83,2.24,3.04,2.29,4.84,.05,2.89-3.61,4.7-7.86,6.51-12.11,.58-1.36,1.06-2.77,1.61-4.15,.32-.78,.79-1.42,1.73-1.26,.93,.15,1.4,.82,1.57,1.73,.11,.58,.07,1.17-.14,1.73-2.16,5.78-4.68,11.38-8.3,16.36-.78,1.06-1.66,2.04-2.7,2.84-.79,.63-1.66,1.07-2.69,1.05h0Z"/>
										<path class="cls-1" d="M117.35,119.92c0,3.04,.02,6.08,0,9.12,0,1.75-.64,2.57-1.87,2.53-1.2-.04-1.87-.94-1.87-2.61,0-6.14,0-12.28,0-18.42,0-1.69,.66-2.61,1.84-2.64,1.21-.04,1.9,.9,1.91,2.71,.02,3.1,0,6.19,0,9.29Z"/>
										<g>
										<path class="cls-1" d="M123.77,119.33c0-2.08-.07-3.77-.13-5.31h2.66l.13,2.79h.07c1.21-1.98,3.13-3.16,5.78-3.16,3.93,0,6.89,3.33,6.89,8.27,0,5.85-3.56,8.74-7.4,8.74-2.15,0-4.04-.94-5.01-2.56h-.07v8.84h-2.93v-17.62Zm2.93,4.34c0,.44,.07,.84,.13,1.21,.54,2.05,2.32,3.46,4.44,3.46,3.13,0,4.94-2.56,4.94-6.29,0-3.26-1.71-6.05-4.84-6.05-2.02,0-3.9,1.45-4.47,3.67-.1,.37-.2,.81-.2,1.21v2.79Z"/>
										<path class="cls-1" d="M142.9,106.42h2.96v23.87h-2.96v-23.87Z"/>
										<path class="cls-1" d="M159.84,130.29l-.24-2.05h-.1c-.91,1.28-2.66,2.42-4.98,2.42-3.3,0-4.98-2.32-4.98-4.67,0-3.93,3.5-6.09,9.78-6.05v-.34c0-1.34-.37-3.77-3.7-3.77-1.51,0-3.09,.47-4.24,1.21l-.67-1.95c1.34-.87,3.3-1.45,5.35-1.45,4.98,0,6.19,3.4,6.19,6.66v6.09c0,1.41,.07,2.79,.27,3.9h-2.69Zm-.44-8.31c-3.23-.07-6.89,.5-6.89,3.67,0,1.92,1.28,2.82,2.79,2.82,2.12,0,3.46-1.34,3.93-2.72,.1-.3,.17-.64,.17-.94v-2.82Z"/>
										<path class="cls-1" d="M170.47,109.34v4.67h4.24v2.25h-4.24v8.78c0,2.02,.57,3.16,2.22,3.16,.77,0,1.35-.1,1.72-.2l.13,2.22c-.57,.24-1.48,.4-2.62,.4-1.38,0-2.49-.44-3.19-1.24-.84-.87-1.14-2.32-1.14-4.24v-8.88h-2.52v-2.25h2.52v-3.9l2.89-.77Z"/>
										<path class="cls-1" d="M187.04,130.29l-.24-2.05h-.1c-.91,1.28-2.66,2.42-4.98,2.42-3.3,0-4.98-2.32-4.98-4.67,0-3.93,3.5-6.09,9.78-6.05v-.34c0-1.34-.37-3.77-3.7-3.77-1.51,0-3.09,.47-4.24,1.21l-.67-1.95c1.34-.87,3.3-1.45,5.35-1.45,4.98,0,6.19,3.4,6.19,6.66v6.09c0,1.41,.07,2.79,.27,3.9h-2.69Zm-.44-8.31c-3.23-.07-6.89,.5-6.89,3.67,0,1.92,1.28,2.82,2.79,2.82,2.12,0,3.46-1.34,3.93-2.72,.1-.3,.17-.64,.17-.94v-2.82Z"/>
										</g>
										<path class="cls-2" d="M113.61,102.75s16.59-16.01,35.95-24.16c14.88-6.27,25.55,.04,29.69,3.3,.77,.61,1.9,.05,1.9-.93v-.03s0-.09,0-.13c-.06-.44-.27-3.07,3.33-2.66s9.08,.19,9.87,.16c.07,0,.14,0,.21,.01,.53,.08,2.72,.5,2.46,2.1s-1.36,8.48-1.71,10.67c-.07,.41,.09,.82,.41,1.08l10.91,8.92c.77,.63,1.42,1.38,1.92,2.24,1.44,2.45,3.49,7.4-1.27,10.04-5.57,3.09-10.25,1.98-11.47,1.6-.15-.05-.3,.07-.28,.23,.15,1.62,1.07,8.81,5.86,15.49,5.44,7.58,4.83,14.98-1.06,21.48s-13.65,7.76-25.22,6.21c-.87-.12-1.75-.16-2.62-.08-7.81,.7-11.34,4.77-24.72-.09-3.39-1.21-30.41,8.31-31.16-21.38"/>
										<circle class="cls-1" cx="113.51" cy="102.8" r="1.06"/>
										<circle class="cls-1" cx="116.61" cy="136.82" r="1.06"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'bancolombia':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #27c139;
									}

									.cls-2 {
										fill: #ffe600;
									}

									.cls-3 {
										fill: #f9f9f9;
									}

									.cls-4 {
										clip-path: url(#clippath);
									}

									.cls-5 {
										fill: none;
									}

									.cls-6 {
										fill: #c54aed;
									}

									.cls-7 {
										fill: #212120;
									}
									</style>
									<clipPath id="clippath">
									<rect class="cls-5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									</clipPath>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="bancolombia">
									<rect class="cls-7" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g class="cls-4">
										<path class="cls-2" d="M121.6,250.27c-6.46-20.73-20.42-50.51-50.26-74.63-43.84-35.43-93.56-35.23-112.92-33.5l-1.14-12.73c20.89-1.87,74.62-2.08,122.09,36.29,32.33,26.13,47.44,58.35,54.43,80.77l-12.2,3.8Z"/>
										<path class="cls-6" d="M-78.87,205.82s-.09,0-.14,0c-3.53-.07-6.33-3-6.25-6.52,.34-15.91,4.89-29.49,13.15-39.29,24.57-29.12,79.79-28.68,131.3,1.04,3.06,1.76,4.11,5.67,2.34,8.73-1.76,3.06-5.67,4.1-8.73,2.34-45.4-26.19-94.9-27.86-115.15-3.87-6.36,7.54-9.86,18.37-10.14,31.32-.07,3.48-2.92,6.25-6.38,6.25Z"/>
										<path class="cls-1" d="M96.39,348.47c-1.5,0-3.01-.53-4.23-1.6-2.65-2.34-2.9-6.37-.56-9.02,7.49-8.49,20.5-26.53,23.48-52.06,4.11-35.14-12.96-61.24-20.49-70.83-2.18-2.78-1.7-6.79,1.08-8.97,2.77-2.18,6.79-1.7,8.97,1.08,8.51,10.83,27.79,40.34,23.13,80.2-3.39,28.98-18.12,49.42-26.6,59.03-1.26,1.43-3.02,2.16-4.79,2.16Z"/>
										<g>
										<path class="cls-3" d="M164.71,30.47c-26.25,3.24-51.61,8.02-77.03,15.39-3.31,1.04-5.35,4.74-4.51,8.03,1.86,7.32,2.79,11,4.68,18.34,.8,3.11,3.92,4.7,7.09,3.65,25.97-7.99,52-13.46,78.86-17.44,3.08-.41,4.76-3.6,3.63-6.79-2.38-6.73-3.58-10.09-6.02-16.78-1.04-2.84-3.84-4.71-6.71-4.4Z"/>
										<path class="cls-3" d="M186.66,71.24c-41.1,5.24-81.12,15.4-119.07,32.2-2.77,1.31-4.42,4.79-3.84,7.86,1.49,7.85,2.24,11.78,3.75,19.65,.65,3.36,3.79,4.91,6.89,3.4,38.54-17.66,79.27-28.9,121.06-35.6,2.66-.44,4.01-3.48,2.99-6.62-2.1-6.5-3.17-9.75-5.34-16.22-1.01-3.01-3.74-5.02-6.45-4.66Z"/>
										<path class="cls-3" d="M186.17,115.03c-25.66,5.57-50.75,12.28-75.59,20.82-3.15,1.16-4.92,4.48-4.1,7.54,1.98,7.29,2.96,10.95,4.96,18.26,.94,3.43,4.8,5.19,8.35,3.84,24.84-8.9,49.91-16.67,75.55-22.9,2.46-.6,3.67-3.48,2.76-6.46-2.02-6.56-3.04-9.84-5.11-16.37-1.02-3.21-3.99-5.31-6.82-4.73Z"/>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'davivienda':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										fill: #e1251b;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="dvivienda">
									<rect class="cls-2" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g id="Capa_2-2" data-name="Capa 2">
										<g id="Capa_1-2" data-name="Capa 1-2">
										<path class="cls-1" d="M118.3,190.65c-7.47-.05-14.9-1.08-22.1-3.07-24,5.31-42.5-4.53-49.95-16.65-6.44-10.58-5.05-24.15,3.41-33.21,5.15-6.59,8.39-14.47,9.35-22.79h-3.26c-10.91,.54-19.48-2.97-21.81-8.96-1.56-3.94-1.17-10.47,9.3-19.48,26.34-21.81,60.71-40.7,75.08-40.7,6.86,0,18.74,4.43,32.96,12.17-.21-1.72,.24-3.46,1.27-4.87,1.74-1.82,4.22-2.72,6.72-2.43h13c2.55-.27,5.08,.69,6.82,2.58,1.59,3.12,1.68,6.79,.24,9.98-.92,3.74-1.56,7.55-1.9,11.39,2.58,1.9,10.91,8.08,15.82,12.27h0c10.47,8.81,10.86,15.34,9.3,19.48-2.34,5.99-10.91,9.49-21.81,8.96h-3.26c.94,8.34,4.2,16.25,9.4,22.83,8.42,9.05,9.79,22.6,3.36,33.16-7.25,11.73-25.51,21.57-49.86,16.26-7.19,1.98-14.6,3.01-22.06,3.07Zm-21.76-6.77h.49c6.99,1.96,14.21,2.97,21.47,3.02,7.28-.04,14.51-1.06,21.52-3.02h.93c22.74,5.11,39.78-3.8,46.59-14.95,5.77-9.3,4.49-21.34-3.12-29.21-6.13-7.69-9.72-17.1-10.27-26.92v-1.95h1.95l5.26,.29c9.2,.44,16.51-2.24,18.26-6.67s-1.61-9.01-8.52-14.85h0c-5.75-4.87-16.31-12.61-16.41-12.71l-.83-.58v-.97c.32-4.38,1-8.73,2.04-13,.73-2.82,1.27-5.65,.24-6.96-1.09-.97-2.55-1.4-3.99-1.17h-12.9c-1.41-.16-2.81,.31-3.85,1.27-.66,1.14-.77,2.52-.29,3.75v.54c0,.39,.24,.83,.34,1.27l.97,4.04-3.6-2.04c-14.85-8.52-27.8-13.58-34.52-13.63-12.03,.05-44.74,16.6-72.74,40.22-6.91,5.84-9.74,11.25-8.28,15.24s9.06,7.11,18.26,6.67l7.21-.39v1.95c-.49,9.76-3.99,19.14-10.03,26.83-7.59,7.88-8.89,19.89-3.16,29.21,6.82,11.15,23.86,20.06,46.55,14.95l.44-.19Z"/>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'nu':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										fill: #8f0dc0;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="nu">
									<rect class="cls-2" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<path class="cls-1" d="M61.49,78.58c5.62-5.9,13.06-9.35,21.82-9.35,17.05,0,28.35,12.45,30.51,31.09,.7,6.06,.69,14.59,.69,24.48,0,1.01,0,2.04,0,3.08v37.04h-23.44v-27.4s-.05-23.45-.19-27.83c-.63-19.09-11.93-31.08-29.38-31.09-5.27,5.56-8.09,12.37-8.5,22.77-.06,1.45-.04,6.59-.02,13.37,0,3.51,.02,7.46,.02,11.56,.02,17.86,0,38.63,0,38.63H29.54v-42.17c0-1.44-.03-2.9-.05-4.36-.05-2.94-.11-5.91,.05-8.84,.26-4.89,1.11-9.71,3.4-14.18,5.23-10.24,15.94-16.83,27.36-16.83,.4,0,.8,0,1.19,.03Z"/>
										<path class="cls-1" d="M206.91,126.88c.16-2.94,.11-5.9,.05-8.84-.03-1.46-.05-2.92-.05-4.36v-42.17h-23.44s-.02,20.77,0,38.63c0,4.1,.01,8.05,.02,11.56,.02,6.78,.03,11.92-.02,13.37-.42,10.4-3.24,17.2-8.5,22.77-17.45-.01-28.75-12.01-29.38-31.09-.14-4.38-.2-15.26-.2-27.85v-27.4l-23.43,.02v37.04c0,1.04,0,2.07,0,3.08,0,9.89-.01,18.43,.69,24.48,2.16,18.65,13.46,31.09,30.51,31.09,8.75,0,16.2-3.45,21.82-9.35,.39,.02,.79,.03,1.19,.03,11.42,0,22.13-6.59,27.36-16.83,2.28-4.47,3.13-9.28,3.4-14.18Z"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'av-villas':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										fill: red;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="av-villas">
									<rect class="cls-2" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<path class="cls-1" d="M177.87,71.12c12.29-12.54,25.89-22.11,40.01-24.86,0,0-1.99-.19-5.5,.02-58.73,14.04-92.96,112.84-92.96,112.84,0,0,0,.53-3.2,0-3.2-47.92-59.77-61.76-59.77-61.76,0,0,32.31-8.75,59.77,21.3,15.6-28.96,33.18-46.48,49.13-57.05-22.33-12.14-56.49-11.27-88.66,4.6C31.9,88.3,7.92,131.09,23.13,161.79c15.21,30.7,63.85,37.67,108.65,15.57,44.79-22.09,68.77-64.88,53.55-95.58-1.96-3.95-4.47-7.51-7.46-10.66Zm-97.44,95.15c-22.35-1.54-39.73-12.35-38.81-24.14,.91-11.79,19.77-20.11,42.11-18.57,7.46,.52,14.34,2.07,20.19,4.34-.39-.03-.78-.07-1.17-.1-23.76-1.64-43.62,4.61-44.34,13.98-.72,9.35,17.95,18.27,41.72,19.9,3.27,.22,6.46,.28,9.54,.22-7.64,3.41-17.99,5.14-29.25,4.36Z"/>
									</g>
								</g>
								</svg>`;
				case 'bbva':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										clip-path: url(#clippath-2);
									}

									.cls-3 {
										clip-path: url(#clippath-6);
									}

									.cls-4 {
										clip-path: url(#clippath-1);
									}

									.cls-5 {
										clip-path: url(#clippath-4);
									}

									.cls-6 {
										clip-path: url(#clippath);
									}

									.cls-7 {
										fill: none;
									}

									.cls-8 {
										clip-path: url(#clippath-3);
									}

									.cls-9 {
										clip-path: url(#clippath-5);
									}
									</style>
									<clipPath id="clippath">
									<rect class="cls-7" y="0" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									</clipPath>
									<clipPath id="clippath-1">
									<polygon class="cls-7" points="254.19 -44.26 81.91 275.3 -111.54 279.55 -111.54 -44.26 254.19 -44.26"/>
									</clipPath>
									<clipPath id="clippath-2">
									<rect class="cls-7" x="-116.54" y="-49.26" width="375.73" height="333.82"/>
									</clipPath>
									<clipPath id="clippath-3">
									<rect class="cls-7" x="-116.54" y="-49.26" width="375.73" height="333.82"/>
									</clipPath>
									<clipPath id="clippath-4">
									<polygon class="cls-7" points="524.04 -44.26 524.04 290.12 77.8 281.82 254.19 -44.26 524.04 -44.26"/>
									</clipPath>
									<clipPath id="clippath-5">
									<rect class="cls-7" x="72.8" y="-49.26" width="456.24" height="344.39"/>
									</clipPath>
									<clipPath id="clippath-6">
									<rect class="cls-7" x="72.8" y="-49.26" width="456.24" height="344.39"/>
									</clipPath>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="bbva">
									<g class="cls-6">
										<g>
										<g>
											<g class="cls-4">
											<g class="cls-2">
												<g class="cls-8">
												<image width="784" height="697" transform="translate(-116.66 -49.7) scale(.48)" xlink:href="data:image/png;base64,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"/>
												</g>
											</g>
											</g>
											<g class="cls-5">
											<g class="cls-9">
												<g class="cls-3">
												<image width="952" height="719" transform="translate(72.46 -49.7) scale(.48)" xlink:href="data:image/png;base64,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"/>
												</g>
											</g>
											</g>
										</g>
										<g>
											<path class="cls-1" d="M159.78,93.52l-14.83,28.23c-.32,.6-1.24,.6-1.55,0l-14.83-28.23c-.14-.29-.43-.46-.75-.46h-7.19c-.49,0-.8,.52-.57,.95l23.37,43.76c.32,.6,1.18,.6,1.52,0l23.37-43.76c.23-.43-.09-.95-.57-.95h-7.19c-.34,0-.63,.17-.78,.46h0Z"/>
											<path class="cls-1" d="M168.2,131.21l14.83-28.23c.32-.6,1.24-.6,1.55,0l14.83,28.23c.14,.29,.43,.46,.75,.46h7.19c.49,0,.8-.52,.57-.95l-23.37-43.76c-.32-.6-1.18-.6-1.52,0l-23.37,43.76c-.23,.43,.09,.95,.57,.95h7.19c.32-.03,.63-.2,.78-.46h0Z"/>
											<path class="cls-1" d="M66.81,113.87c3.1-1.55,5.03-4.92,5.03-9.03,0-7.04-5.49-11.82-13.22-11.82h-22.22c-.49,0-.86,.37-.86,.86v43.44c0,.49,.37,.86,.86,.86h21.27c10.64,0,16.24-4.57,16.24-13.54s-7.1-10.78-7.1-10.78h0Zm-22.94-14.29h13.2c4.86,0,7.33,2.07,7.33,5.92s-2.47,5.92-7.33,5.92h-13.2c-.46,0-.86-.37-.86-.86v-10.12c0-.49,.37-.86,.86-.86h0Zm13.37,32.06h-13.37c-.49,0-.86-.37-.86-.86v-11.99c0-.46,.37-.86,.86-.86h13.37c6.38,0,9.23,1.81,9.23,6.84-.03,5.09-2.79,6.87-9.23,6.87h0Z"/>
											<path class="cls-1" d="M112.43,113.87c3.1-1.55,5.03-4.92,5.03-9.03,0-7.04-5.49-11.82-13.22-11.82h-22.25c-.49,0-.86,.37-.86,.86v43.44c0,.49,.37,.86,.86,.86h21.27c10.64,0,16.24-4.57,16.24-13.54,.03-8.74-7.07-10.78-7.07-10.78h0Zm-22.94-14.29h13.2c4.86,0,7.33,2.07,7.33,5.92s-2.47,5.92-7.33,5.92h-13.2c-.49,0-.86-.37-.86-.86v-10.12c0-.49,.37-.86,.86-.86h0Zm13.34,32.06h-13.37c-.46,0-.86-.37-.86-.86v-11.99c0-.46,.37-.86,.86-.86h13.37c6.38,0,9.23,1.81,9.23,6.84s-2.79,6.87-9.23,6.87h0Z"/>
										</g>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'bogota':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: url(#Degradado_sin_nombre_14);
									}
									</style>
									<linearGradient id="Degradado_sin_nombre_14" data-name="Degradado sin nombre 14" x1="118.22" y1="236.44" x2="118.22" y2="0" gradientUnits="userSpaceOnUse">
									<stop offset="0" stop-color="#0042aa"/>
									<stop offset=".59" stop-color="#005fc8"/>
									<stop offset="1" stop-color="#006fd8"/>
									</linearGradient>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="bogota">
									<rect class="cls-1" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<image width="155" height="164" transform="translate(29.55 31.18)" xlink:href="data:image/png;base64,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"/>
										<image width="124" height="122" transform="translate(82.55 83.18)" xlink:href="data:image/png;base64,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"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'caja-social':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #376ab2;
									}

									.cls-2 {
										fill: #fff;
									}

									.cls-3 {
										fill: #e63022;
									}

									.cls-4 {
										fill: #e63326;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="caja-social">
									<rect class="cls-1" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<g>
										<ellipse class="cls-3" cx="118.07" cy="93.47" rx="3.66" ry="4.77"/>
										<ellipse class="cls-3" cx="135.21" cy="100.64" rx="4.77" ry="3.66" transform="translate(-31.56 125.09) rotate(-45)"/>
										<ellipse class="cls-3" cx="142.64" cy="117.94" rx="4.77" ry="3.66"/>
										<ellipse class="cls-3" cx="135.5" cy="135.24" rx="3.66" ry="4.77" transform="translate(-55.94 135.42) rotate(-45)"/>
										<ellipse class="cls-3" cx="118.11" cy="142.41" rx="3.66" ry="4.77"/>
										<ellipse class="cls-3" cx="100.85" cy="135" rx="4.77" ry="3.66" transform="translate(-65.93 110.85) rotate(-45)"/>
										<ellipse class="cls-3" cx="93.67" cy="117.94" rx="4.77" ry="3.66"/>
										<ellipse class="cls-3" cx="100.85" cy="100.87" rx="3.66" ry="4.77" transform="translate(-41.79 100.85) rotate(-45)"/>
										</g>
										<g>
										<ellipse class="cls-2" cx="132.76" cy="82.6" rx="7.82" ry="5.77" transform="translate(2.35 168.87) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="153.59" cy="103.39" rx="7.82" ry="5.77" transform="translate(-26.39 59.94) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="153.44" cy="132.56" rx="5.77" ry="7.82" transform="translate(-31 216.81) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="132.76" cy="153.36" rx="5.77" ry="7.82" transform="translate(-45.08 55.81) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="103.55" cy="153.36" rx="7.82" ry="5.77" transform="translate(-79.01 183.59) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="82.61" cy="132.56" rx="7.82" ry="5.77" transform="translate(-40.98 37.05) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="82.7" cy="103.21" rx="5.77" ry="7.82" transform="translate(-45.59 135.38) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="103.37" cy="82.6" rx="5.77" ry="7.82" transform="translate(-22.29 41.15) rotate(-20.37)"/>
										</g>
										<g>
										<ellipse class="cls-4" cx="117.91" cy="63.41" rx="8.08" ry="12.29"/>
										<ellipse class="cls-4" cx="154.51" cy="81.34" rx="10.46" ry="7.92" transform="translate(-12.26 133.08) rotate(-45)"/>
										<ellipse class="cls-4" cx="81.6" cy="81.34" rx="7.92" ry="10.46" transform="translate(-33.61 81.53) rotate(-45)"/>
										<ellipse class="cls-4" cx="81.6" cy="154.25" rx="10.46" ry="7.92" transform="translate(-85.17 102.88) rotate(-45)"/>
										<ellipse class="cls-4" cx="154.51" cy="154.53" rx="7.92" ry="10.46" transform="translate(-64.02 154.52) rotate(-45)"/>
										<ellipse class="cls-4" cx="118.01" cy="172.87" rx="8.08" ry="12.29"/>
										<ellipse class="cls-4" cx="63.58" cy="117.94" rx="12.29" ry="8.08"/>
										<ellipse class="cls-4" cx="172.45" cy="117.94" rx="12.29" ry="8.08"/>
										</g>
										<g>
										<ellipse class="cls-2" cx="144.2" cy="54.7" rx="7.88" ry="5.15" transform="translate(34.39 162.99) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="181.98" cy="91.64" rx="7.88" ry="5.15" transform="translate(-20.52 69.08) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="181.9" cy="144.4" rx="5.15" ry="7.88" transform="translate(-25.16 249.58) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="144.62" cy="181.49" rx="5.15" ry="7.88" transform="translate(-54.13 61.7) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="91.88" cy="181.87" rx="7.88" ry="5.15" transform="translate(-111.73 189.61) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="54.47" cy="144.4" rx="7.88" ry="5.15" transform="translate(-46.86 27.99) rotate(-20.37)"/>
										<ellipse class="cls-2" cx="54.47" cy="91.47" rx="5.15" ry="7.88" transform="translate(-51.38 102.87) rotate(-65.37)"/>
										<ellipse class="cls-2" cx="91.77" cy="54.7" rx="5.15" ry="7.88" transform="translate(-13.3 35.37) rotate(-20.37)"/>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'falabella':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #c8d300;
									}

									.cls-2 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}

									.cls-3 {
										fill: #007937;
									}

									.cls-4 {
										fill: #154634;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="falabella">
									<rect class="cls-2" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<path class="cls-3" d="M148.08,202.31c-28.15,0-109.6-22.85-109.6-50.99s81.46-50.88,109.6-50.88,50.88,22.74,50.88,50.88-22.74,50.99-50.88,50.99"/>
										<path class="cls-1" d="M123.03,119.53c-18.32-11.04-62.36-58.06-51.21-76.38,11.15-18.32,73.18-.99,91.39,10.15,18.32,11.15,24.17,34.99,13.02,53.2-11.15,18.32-34.88,24.17-53.2,13.02"/>
										<path class="cls-4" d="M107.57,107.27c5.85,5.41,11.26,9.82,15.45,12.36,17.77,10.82,40.62,5.63,52.21-11.37-7.84-4.86-17.11-7.84-27.04-7.84-9.38,0-24.5,2.43-40.62,6.84"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'finandina':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}

									.cls-2 {
										fill: #ee252a;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="finandina">
									<rect class="cls-1" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g id="Grupo_3" data-name="Grupo 3">
										<path id="Trazado_23" data-name="Trazado 23" class="cls-2" d="M118.7,39.28c-29.98,0-57.41,16.87-70.93,43.63,6.5,7.12,27.5,23.56,51.25,17.17,5.73-1.59,11.09-4.31,15.75-8.01,15.19-11.59,24.49-28.83,65.38-23.67-15.07-18.45-37.64-29.14-61.46-29.12"/>
										<path id="Trazado_24" data-name="Trazado 24" class="cls-2" d="M140.48,164.36c-19.97,8.98-39.32,21.64-86.86-.09h0l.03,.04c25.18,35.94,74.73,44.66,110.67,19.48,8.59-6.02,15.91-13.68,21.52-22.54-20.08-6.67-32.83-2.5-45.35,3.12"/>
										<path id="Trazado_25" data-name="Trazado 25" class="cls-2" d="M158.58,90.53c18.72-4.22,22.85-13.93,22.09-18.82-4.78-.63-9.59-.93-14.41-.88-27.16-.05-45.92,21.23-46.36,21.63,4.06,.19,24.16,1.35,38.69-1.92"/>
										<path id="Trazado_26" data-name="Trazado 26" class="cls-2" d="M56.03,161.29c14.02,7.1,29.42,11.06,45.12,11.62h0c12.43-.5,24.57-3.85,35.5-9.78-8.74-3.13-20.08-7.95-37.11-7.85-22.1,.14-35.89,2.14-43.53,6.01"/>
										<path id="Trazado_27" data-name="Trazado 27" class="cls-2" d="M135.72,117.46c-3.83,2.98-8.27,5.08-13,6.13,37.19,2.64,65.05-15.25,68.59-35.7-1.84-.95-9.74-8.93-55.58,29.56"/>
										<path id="Trazado_28" data-name="Trazado 28" class="cls-2" d="M193.25,91.2s0,.03,0,.04c-4.55,26.05-42,39.69-84.29,33.8-24.18-3.37-47.18-12.56-67.03-26.77v.02h0c-4.16,15.7-3.42,32.3,2.11,47.58,.98,.46,21.8,13.89,94.64-1.79,18.09-3.68,36.81-2.9,54.53,2.27,6.58-17.8,6.6-37.35,.05-55.16"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'itau':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #ff6200;
									}

									.cls-2 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="itau">
									<rect class="cls-2" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<path class="cls-1" d="M108.78,42.47c-4.4,.11-7.62,.26-13.53,.64-2.73,.16-5.72,.4-7.82,.61-.53,.06-1.63,.16-2.45,.24-3.42,.33-8.51,.98-10.65,1.34-.45,.08-1.12,.18-1.49,.24s-1.02,.16-1.44,.24-1.13,.21-1.59,.29c-1.59,.27-4.28,.82-5.8,1.18-.42,.11-1.18,.29-1.68,.4s-.96,.22-1.01,.23c-2.83,.68-5.47,1.96-7.75,3.77-2.24,1.91-3.93,4.39-4.9,7.17-.15,.42-.32,.85-.35,.96-.16,.36-.87,3.43-1.38,5.95-.08,.42-.21,1.04-.29,1.39s-.18,.96-.25,1.34-.13,.87-.18,1.05c-.14,.55-.73,4.29-1.11,7.01-.36,2.63-.61,4.54-.82,6.48-.11,.96-.21,1.88-.23,2.06s-.11,1.11-.2,2.06-.19,2.11-.25,2.59c-.2,1.76-.7,9.45-.96,14.87-.19,4.02-.32,12.63-.25,17.32,.07,5.85,.21,11.08,.34,12.91,.05,.74,.14,2.29,.2,3.45s.13,2.65,.18,3.31c.22,3.32,.39,5.5,.48,6.19,.05,.42,.16,1.55,.24,2.48s.19,2.06,.24,2.49,.16,1.36,.24,2.07c.24,2.27,.42,3.76,.58,4.75,.08,.53,.21,1.43,.29,2.01,.28,2.11,.61,4.16,.96,6.05,.08,.42,.2,1.13,.29,1.59,.16,.96,.54,2.87,.81,4.08,.92,4.23,1.33,5.5,2.41,7.58,.26,.51,.54,1.01,.85,1.49,.16,.24,.4,.59,.53,.77,.86,1.13,1.86,2.15,2.98,3.02,.14,.11,.42,.32,.6,.45,.12,.11,.27,.2,.42,.27,.08,.03,.15,.08,.21,.14,.38,.36,3.01,1.62,4.14,1.96,.21,.07,.47,.15,.58,.2,.25,.11,1.66,.47,3.36,.85,.74,.17,1.5,.35,1.68,.4,.44,.11,3.22,.67,5.33,1.05,1.21,.22,3.56,.6,5.04,.81,.56,.08,1.27,.18,1.59,.24,1.16,.2,5.96,.76,8.97,1.05,1.08,.11,2.42,.23,2.98,.29,.9,.1,1.82,.17,6.24,.49,.66,.05,2.17,.13,3.36,.19s2.85,.14,3.7,.19c6.83,.39,26.37,.39,33.1,0,.84-.06,2.5-.13,3.7-.19,2.04-.1,2.79-.14,6-.39,4.11-.32,10.14-.9,12.19-1.19,.59-.09,1.59-.22,2.26-.32,2.45-.32,5.8-.83,7.73-1.18,2.1-.39,4.88-.96,5.33-1.05,.18-.05,.94-.23,1.68-.4,1.66-.38,3.1-.74,3.36-.85,.32-.11,.64-.23,.96-.33,.79-.26,3.4-1.5,3.62-1.71,.13-.12,.27-.23,.42-.32,.64-.39,1.23-.84,1.77-1.35,.76-.68,1.46-1.43,2.09-2.23,.09-.13,.32-.46,.51-.72,.14-.17,.26-.35,.36-.55,.09-.21,.21-.41,.33-.6,.19-.3,.35-.62,.49-.96,.07-.17,.14-.34,.23-.51,.18-.24,.85-2.15,1.14-3.23,.45-1.68,1.3-5.64,1.59-7.52,.08-.48,.16-.93,.19-1.01,.09-.21,.61-3.5,1.09-6.86,.11-.74,.21-1.48,.24-1.63,.08-.44,.42-3.39,.58-4.94,.08-.77,.18-1.65,.24-1.97s.16-1.35,.24-2.3,.18-2.12,.23-2.59,.14-1.57,.2-2.45,.14-1.95,.19-2.4,.16-2.11,.24-3.7,.18-3.53,.24-4.32c.43-6.98,.43-25.29,0-32.5-.05-.82-.13-2.42-.19-3.55s-.14-2.63-.19-3.31-.18-2.39-.29-3.79-.21-2.72-.24-2.93-.11-1.14-.19-2.06-.16-1.78-.19-1.91-.13-1.02-.24-1.97c-.25-2.29-.56-4.83-.64-5.12-.03-.13-.13-.9-.24-1.69-.47-3.59-1.34-8.6-2.09-11.99-.11-.48-.28-1.26-.38-1.73-.18-.91-.41-1.8-.69-2.69-.05-.11-.13-.36-.2-.58-.43-1.19-.94-2.34-1.55-3.45-.04-.06-.34-.51-.67-1.01-.99-1.35-2.16-2.57-3.47-3.62-2.07-1.53-4.37-2.55-7.35-3.29l-1.5-.37c-.35-.11-1.07-.26-2.59-.58l-1.3-.28c-1.85-.45-7.88-1.43-11.79-1.93-.79-.1-1.56-.2-1.73-.24-.29-.06-1.68-.2-4.51-.48-.79-.08-1.87-.19-2.4-.24s-1.48-.14-2.11-.2l-2.3-.18c-2.15-.18-8.12-.53-11.42-.67-6.37-.28-18.16-.36-25.49-.18h0Zm-42.27,64.84c.19,.09,.4,.16,.61,.2,.64,.18,1.24,.46,1.79,.83,.63,.5,1.19,1.1,1.65,1.76,.06,.14,.14,.27,.23,.4,.08,.14,.15,.28,.19,.43,.04,.17,.11,.33,.2,.48,.12,.18,.27,1.33,.27,2.17,.02,.73-.08,1.45-.29,2.15-.52,1.19-.77,1.59-1.42,2.27-.46,.53-1.04,.94-1.68,1.22-.47,.27-1,.46-1.54,.54-.21,.01-.41,.06-.61,.14-.07,.11-2.15,.11-2.15,0-.17-.09-.36-.14-.55-.14-.28-.04-.56-.1-.83-.19-.21-.09-.42-.18-.64-.26-.13-.04-.26-.1-.39-.17-.1-.08-.22-.15-.34-.2-.56-.28-1.71-1.55-2.04-2.26-.18-.38-.35-.74-.4-.82-.32-.65-.38-3.63-.08-4.32,.09-.18,.21-.49,.28-.67,.04-.13,.1-.26,.17-.38,.1-.14,.18-.28,.25-.43,.18-.36,1.33-1.59,1.49-1.59,.08-.03,.15-.08,.19-.15,.51-.36,1.08-.63,1.68-.8,.23-.05,.45-.12,.67-.21,.19-.06,.38-.1,.58-.12,.57-.06,2.55,.03,2.68,.11h0s0,.01,0,.01Zm104.56,6.69v4.84h-18.63v-6.49l1.04-.16c2.29-.35,3.72-.6,3.82-.64,.35-.09,.7-.15,1.05-.18s.71-.1,1.05-.19c.33-.09,.67-.16,1.01-.19,.48-.05,.97-.14,1.44-.25,.29-.07,.89-.17,1.34-.23,.34-.04,.68-.1,1.01-.18,.35-.09,.7-.16,1.05-.2,.4-.04,.81-.11,1.2-.2,.18-.05,.87-.18,1.54-.29s1.53-.25,1.91-.32,.82-.13,.96-.14h.21v4.82h0Zm-79.46,4.28v5.73h9.6v8.54h-9.61l.04,8.89c.03,9.59,0,9.11,.53,10.3,.5,1,1.39,1.75,2.47,2.07,.15,.03,.29,.09,.42,.17,.18,.14,4.07,.14,4.24,0,.25-.1,.52-.16,.79-.17l.64-.07v8.42l-.26,.11c-.94,.23-1.9,.38-2.87,.46-2.16,.25-6.09,.28-6.32,.04-.11-.06-.23-.09-.35-.09-.69-.06-1.38-.18-2.05-.38-.19-.09-.38-.15-.59-.19-.2-.04-.39-.11-.58-.19-.15-.09-.31-.16-.48-.2-.15-.04-.3-.1-.43-.18-.12-.09-.25-.17-.39-.24-.53-.25-1.02-.56-1.46-.93-.16-.15-.34-.27-.53-.37-.1,0-.83-.81-1.4-1.54-.52-.68-.96-1.43-1.32-2.21-.05-.13-.11-.26-.19-.38-.1-.21-.18-.44-.23-.67-.07-.28-.15-.55-.25-.82-.11-.31-.18-.63-.24-.96-.08-.4-.17-.8-.26-1.2-.07-.29-.11-3.67-.14-10.06l-.04-9.61h-5.55v-8.55h5.58v-9.68l.64-.07c.25-.02,.5-.06,.74-.14,.34-.1,.7-.16,1.05-.19,.36-.03,.71-.1,1.05-.2,.44-.11,.89-.18,1.34-.23,.45-.05,.9-.13,1.34-.24,.23-.08,.47-.12,.72-.13,.45-.05,.9-.13,1.34-.22,.96-.21,1.93-.36,2.91-.44,.04,.02,.07,2.63,.07,5.79h.03Zm31.81,4.84c1.34,.08,2.87,.25,2.98,.33,.17,.07,.35,.12,.53,.13,.92,.19,1.82,.46,2.69,.81,.83,.34,1.63,.75,2.4,1.21,.12,.09,.25,.17,.38,.23,.33,.22,.64,.46,.93,.73,.25,.23,.5,.44,.77,.64,.67,.71,1.29,1.46,1.85,2.26,.05,.11,.11,.22,.19,.32,.4,.66,.75,1.35,1.05,2.05,.04,.16,.11,.32,.18,.47,.1,.24,.19,.49,.25,.74,.03,.15,.08,.3,.14,.43,.09,.22,.15,.44,.19,.67,.04,.24,.1,.48,.16,.72,.09,.3,.15,.6,.2,.91,.11,.64,.14,3.02,.18,13.6l.04,12.84h-10.48v-1.13c0-.61-.04-1.51-.08-1.98l-.06-.86-.28,.38c-.74,.87-1.56,1.66-2.47,2.35-1.26,.83-1.59,1.03-1.94,1.14-.22,.06-.43,.14-.64,.25-.25,.11-.52,.19-.79,.24-.22,.04-.43,.11-.64,.19-.49,.36-6.53,.36-7.01,0-.25-.09-.51-.16-.77-.19-.32-.05-.65-.14-.96-.25-.15-.07-.57-.24-.9-.38-.39-.17-.76-.35-1.13-.56-.25-.16-.51-.31-.78-.45-.4-.22-.54-.35-1.63-1.44s-1.27-1.27-1.27-1.38c-.07-.17-.16-.32-.27-.47-.19-.28-.35-.58-.49-.88-.11-.27-.27-.59-.33-.72-.11-.25-.19-.5-.25-.77-.04-.22-.11-.43-.19-.64-.11-.13-.29-1.5-.29-2.09,.02-.21-.02-.42-.11-.61-.11-.11-.09-.5,.21-2.81,.03-.31,.09-.61,.18-.91,.08-.18,.14-.37,.18-.57,.15-.57,.37-1.12,.65-1.64,.09-.16,.2-.38,.26-.5s.13-.22,.18-.22,.07-.06,.07-.12c.36-.57,.77-1.11,1.24-1.59,.06-.06,.11-.14,.13-.22,.05-.11,.14-.19,.26-.23,.11-.03,.19-.09,.19-.12,0-.1,1.61-1.36,2.16-1.68,.39-.24,1.27-.69,2.55-1.31,.18-.1,1.98-.67,2.77-.89,.41-.11,.83-.2,1.25-.26,.28-.04,.55-.1,.82-.18,.43-.1,.86-.16,1.3-.18,.66-.06,1.48-.15,1.82-.2,1.36-.2,6.15-.16,6.66,.05,.17,.08,.18,.04,.11-.78,0-.31-.06-.61-.14-.9-.08-.12-.13-.26-.14-.4-.18-.59-.44-1.15-.78-1.66-.36-.48-.79-.92-1.26-1.3-.13-.05-.25-.13-.36-.22-.46-.32-.97-.56-1.52-.69-.2-.04-.36-.11-.36-.14,0-.42-6.2-.49-8.06-.08-.24,.05-.8,.15-1.25,.23-.34,.05-.68,.13-1.01,.23-.25,.09-.51,.15-.77,.19s-.52,.11-.77,.19c-.28,.1-.56,.18-.85,.24-.26,.05-.52,.13-.77,.23-.18,.09-.37,.16-.56,.21-.2,.04-.39,.11-.58,.2-.18,.08-.38,.15-.58,.19-.29,.07-.57,.16-.83,.29-.13,.07-.27,.13-.41,.18-.03,0-.05-2.01-.05-4.46,0-3.46,.03-4.46,.12-4.55,.19-.1,.39-.18,.6-.22,.2-.04,.39-.1,.57-.18,.23-.1,.47-.18,.72-.24,.25-.06,.49-.14,.72-.24,.21-.09,.43-.16,.66-.19,.25-.04,.49-.11,.72-.2,.29-.09,.58-.17,.87-.23,.31-.06,.61-.13,.91-.2,.11-.03,.64-.11,1.2-.19,.44-.05,.87-.13,1.3-.23,.56-.17,5.58-.49,6.72-.42l1.54,.09h.02Zm-52.93,20.01v19.1h-11.23v-38.19h11.23v19.1h0Zm84.83-7.2c0,11.36,.05,13.56,.28,13.87,.07,.13,.12,.27,.14,.42,.13,.72,.76,1.76,1.47,2.48,.27,.3,.58,.55,.93,.76,.14,.03,.25,.09,.25,.12,.23,.14,.48,.25,.75,.32,.62,.19,1.26,.27,1.91,.23,.47,.02,.93-.02,1.39-.11,.21-.1,.44-.17,.66-.23,.34-.11,.66-.27,.96-.46,.54-.34,1.54-1.27,1.54-1.42,.07-.17,.17-.32,.29-.46,.12-.14,.22-.3,.29-.48,.04-.16,.1-.31,.18-.45,.12-.23,.2-.47,.26-.72,.01-.17,.06-.32,.14-.47,.24-.32,.28-2.23,.28-13.5v-11.79h11.23v38.19h-5.33c-4.14,0-5.35-.03-5.42-.12-.08-.67-.11-1.34-.11-2.02,0-.63-.03-1.26-.11-1.89-.04,0-.15,.11-.27,.26-.8,.98-1.7,1.87-2.71,2.65-.46,.3-.95,.57-1.45,.79-.39,.19-.83,.41-.96,.48-.26,.11-.54,.18-.82,.24-.22,.03-.44,.1-.64,.19-.1,.14-1.79,.29-3.47,.29s-2.99-.11-3.39-.28c-.27-.1-.54-.18-.82-.25-.25-.05-.49-.14-.72-.24-.16-.09-.32-.15-.5-.2-.23-.06-.41-.14-.41-.18s-.17-.12-.39-.19-.38-.15-.38-.19-.11-.11-.23-.17c-.83-.37-2.7-2.13-3.48-3.26-.55-.81-1.01-1.68-1.37-2.58-.07-.22-.15-.43-.24-.64-.1-.25-.18-.51-.24-.77-.04-.22-.11-.43-.19-.64-.1-.33-.16-.67-.19-1.01-.04-.35-.11-.7-.22-1.04-.09-.14-.12-3.57-.14-13.8l-.03-13.6h11.24l.02,11.87h0Z"/>
										<path class="cls-1" d="M122.16,145.24c-.36,.03-.71,.08-1.05,.17-.25,.09-.51,.17-.77,.21-.31,.06-.61,.14-.91,.26-1.44,.64-2.14,1.04-2.62,1.54-.49,.54-.84,1.21-1,1.93-.02,.19-.07,.37-.14,.54-.11,.22-.07,.9,.11,1.79,.19,.96,.96,2.15,1.64,2.5,1.21,.64,1.44,.72,2.11,.83,1.21,.18,3.5,.08,4.01-.19,.09-.05,.44-.21,.79-.36,.35-.17,.69-.36,1.01-.59,.21-.16,.45-.35,.54-.42,.54-.41,1.55-2.08,1.69-2.77,.03-.16,.08-.31,.16-.45,.07-.09,.11-.96,.13-2.55l.04-2.42-.54-.07c-1.74-.08-3.48-.06-5.21,.04h.02s0,.01,0,.01Z"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'lulo':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #1b2132;
									}

									.cls-2 {
										fill: #e6ff00;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="lulo">
									<rect class="cls-1" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<polygon class="cls-2" points="139.82 182.96 96.63 182.96 53.48 182.96 53.48 139.82 53.48 96.63 53.48 53.48 96.63 53.48 139.82 53.48 139.82 96.63 96.63 96.63 96.63 139.82 139.82 139.82 139.82 96.63 182.96 96.63 182.96 139.82 182.96 182.96 139.82 182.96"/>
									</g>
								</g>
								</svg>`;
				case 'movii':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 236.44 236.44">
								<defs>
									<style>
									.cls-1 {
										fill: #fff;
									}

									.cls-2 {
										fill: #dd0059;
									}

									.cls-3 {
										clip-path: url(#clippath);
									}

									.cls-4 {
										fill: none;
									}
									</style>
									<clipPath id="clippath">
									<rect class="cls-4" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									</clipPath>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="movii">
									<rect class="cls-2" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g class="cls-3">
										<g id="Grupo_1036" data-name="Grupo 1036">
										<g id="Logo_Flat" data-name="Logo Flat">
											<path id="Trazado_4" data-name="Trazado 4" class="cls-1" d="M118.21,112.55V-49.3c.34-9.4-7.01-17.29-16.41-17.63-9.4-.34-17.29,7.01-17.63,16.41,0,.24-.01,.48-.01,.72V112.08c-.33,9.4,7.02,17.29,16.42,17.63s17.29-7.02,17.63-16.42c0-.25,.01-.49,.01-.74"/>
											<path id="Trazado_5" data-name="Trazado 5" class="cls-1" d="M33.24,129.61c-9.43,0-17.07-7.65-17.07-17.08,0-.43,.02-.85,.05-1.28V-49.82c0-9.4,7.62-17.02,17.02-17.02s17.02,7.62,17.02,17.02V111.26c.71,9.4-6.34,17.6-15.75,18.31-.42,.03-.85,.05-1.28,.05"/>
											<path id="Trazado_6" data-name="Trazado 6" class="cls-1" d="M156.05,127.19c-4.23-2.05-9.33-.29-11.38,3.94-1.97,4.06-.43,8.95,3.51,11.15,6.1,3.08,11.24,7.78,14.87,13.58-70.85,39.05-157.75,34.4-224.03-11.99-3.86-2.69-9.17-1.75-11.86,2.11s-1.75,9.17,2.11,11.86C.09,207.43,92.79,212.92,168.98,172.06c1.08,7.48-.14,15.12-3.5,21.89-2.16,4.18-.53,9.32,3.65,11.48,4.18,2.16,9.32,.53,11.48-3.65,.09-.17,.17-.34,.25-.52,13-27.33,2.05-60.04-24.79-74.04"/>
										</g>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'pibank':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #0f265c;
										fill-rule: evenodd;
									}

									.cls-2 {
										fill: #ffdc00;
									}

									.cls-3 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="pibank">
									<rect class="cls-3" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<g id="Group-16">
										<path class="cls-1" d="M78.54,183.85c-.27-.77-1.12-3.1-3.4-4.94-.51-.42-1.56-1.25-3.19-1.74-.35-.1-1.89-.54-3.87-.26-.61,.09-1.52,.22-2.57,.76-1.05,.54-1.75,1.23-2.15,1.68,.01-.64,.02-1.29,.03-1.94h-6.13v28.15h2.96c1.73,0,3.14-1.41,3.14-3.15v-6.38c.34,.4,.9,.97,1.71,1.45,.18,.11,.95,.55,2.18,.83,2.79,.63,5.14-.25,5.46-.37,.29-.12,1.67-.67,3.05-1.97,.29-.27,1.64-1.57,2.55-3.77,1.67-4.05,.42-7.79,.23-8.35Zm-5.52,3.96c0,.56-.06,2.32-1.47,3.64-1.36,1.28-3.06,1.26-3.53,1.24-.48-.01-2.06-.09-3.32-1.34-1.39-1.39-1.35-3.21-1.34-3.8,.02-.61,.05-2.19,1.28-3.47,1.31-1.37,3.04-1.41,3.49-1.41,.57,0,2.39,.08,3.71,1.55,1.24,1.37,1.19,3.03,1.18,3.59Z"/>
										<polygon id="Fill-4" class="cls-1" points="81.47 197.97 87.56 197.97 87.56 177.41 81.47 177.41 81.47 197.97"/>
										<path id="Fill-5" class="cls-1" d="M101.85,192.7c1.42,0,2.56-.45,3.46-1.36,.94-.9,1.38-2.14,1.38-3.66s-.45-2.75-1.38-3.66c-.89-.9-2.03-1.36-3.46-1.36s-2.56,.45-3.5,1.36c-.89,.9-1.34,2.14-1.34,3.66s.45,2.75,1.34,3.66c.93,.9,2.07,1.36,3.5,1.36m8.09-12.71c1.91,2.1,2.85,4.65,2.85,7.69s-.94,5.63-2.85,7.73c-1.91,2.1-4.19,3.13-6.87,3.13s-4.63-.82-6.06-2.51v1.93h-6.1v-28.15h3.02c1.7,0,3.07,1.39,3.07,3.11v6.41c1.42-1.69,3.45-2.51,6.06-2.51s4.96,1.07,6.87,3.17"/>
										<path id="Fill-7" class="cls-1" d="M125.04,192.7c1.42,0,2.6-.45,3.5-1.36,.89-.9,1.34-2.14,1.34-3.66s-.45-2.75-1.34-3.66c-.89-.9-2.07-1.36-3.5-1.36s-2.6,.45-3.5,1.36c-.89,.9-1.34,2.14-1.34,3.66s.45,2.75,1.34,3.66c.89,.9,2.07,1.36,3.5,1.36h0Zm4.84-15.3h6.1v20.56h-6.1v-1.93c-1.42,1.69-3.46,2.51-6.06,2.51s-4.96-1.03-6.87-3.13c-1.91-2.1-2.85-4.69-2.85-7.73s.94-5.59,2.85-7.69c1.91-2.1,4.19-3.17,6.87-3.17s4.63,.82,6.06,2.51v-1.93Z"/>
										<path id="Fill-9" class="cls-1" d="M156.64,179.09c1.46,1.52,2.19,3.58,2.19,6.25v12.62h-6.1v-11.72c0-2.43-1.46-3.74-3.54-3.74-2.32,0-3.78,1.44-3.78,4.23v11.22h-6.1v-20.56h6.1v1.93c1.22-1.69,3.17-2.51,5.81-2.51,2.15,0,3.98,.74,5.41,2.26"/>
										<path id="Fill-11" class="cls-1" d="M180.99,197.97h-6.91l-6.5-9.09v9.09h-6.1v-28.15h3.02c1.7,0,3.07,1.39,3.07,3.11v13.49l6.1-9h7.11l-7.4,10.28,7.6,10.28Z"/>
										</g>
										<circle class="cls-2" cx="118.72" cy="97.05" r="64.8"/>
									</g>
									</g>
								</g>
								</svg>`;
				case 'powwi':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #d9e0fa;
									}

									.cls-2, .cls-3 {
										fill: #fff;
									}

									.cls-4 {
										fill: #ff3c77;
									}

									.cls-5 {
										fill: #344ddd;
									}

									.cls-3 {
										stroke: #000;
										stroke-miterlimit: 10;
									}

									.cls-6 {
										fill: #3f59e2;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="powwi">
									<rect class="cls-3" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<g>
										<g>
											<path class="cls-6" d="M192.67,99.74c0,4.86-.51,9.42-1.48,13.7-.79,3.49-1.88,6.78-3.25,9.89-10.69,24.24-38.24,36.64-69.17,36.64s-58.85-12.28-69.1-36.95c5.76-5.9,9.43-14.88,9.43-24.94s-3.66-19-9.4-24.91c9.68-23.86,34.39-39.44,62.65-39.44h13.38c27.55,0,51.9,15.73,61.98,39.91,1.14,2.74,2.1,5.59,2.86,8.54,1.34,5.22,2.06,10.75,2.06,16.53l.03,1.02Z"/>
											<g>
											<path class="cls-5" d="M191.2,113.43c-.79,3.49-1.88,6.78-3.25,9.89-5.73-5.87-9.4-14.86-9.4-24.95s3.57-18.86,9.18-24.73c1.14,2.74,2.1,5.59,2.86,8.54,0,0-.02-.02-.03-.03-4.08,3.38-6.78,9.35-6.78,16.14s2.6,12.52,6.54,15.93c.3-.25,.6-.52,.88-.8Z"/>
											<path class="cls-6" d="M210.74,97.75c0,2.85-2.31,5.17-5.17,5.17-2.35,0-4.33-1.57-4.96-3.71l-3.61,1c-.45,5.42-2.63,10.15-5.8,13.23-.29,.28-.58,.55-.88,.8-3.94-3.41-6.54-9.28-6.54-15.93s2.7-12.76,6.78-16.14c0,0,.02,.02,.03,.03,3.38,2.95,5.77,7.71,6.36,13.22l3.63,1.02c.58-2.21,2.6-3.84,4.99-3.84,2.86,0,5.17,2.31,5.17,5.17Z"/>
											</g>
											<g>
											<path class="cls-6" d="M53.57,98.08c0,6.71-2.64,12.61-6.63,16.01-.03-.03-.06-.06-.1-.09-3.48-3.03-5.91-7.97-6.41-13.68l-3.63-1.02c-.66,2.09-2.62,3.61-4.93,3.61-2.86,0-5.17-2.31-5.17-5.17s2.31-5.17,5.17-5.17c2.42,0,4.45,1.67,5.02,3.91l3.57-.99c.58-5.57,2.98-10.38,6.41-13.35,.03-.03,.06-.05,.09-.08,3.98,3.41,6.61,9.31,6.61,16Z"/>
											<path class="cls-5" d="M59.1,98.08c0,10.06-3.67,19.03-9.43,24.94-1.18-2.84-2.13-5.84-2.83-9.01,.03,.03,.06,.06,.1,.09,3.99-3.41,6.63-9.31,6.63-16.01s-2.63-12.59-6.61-16c-.03,.03-.06,.05-.09,.08,.71-3.11,1.66-6.11,2.83-8.98,5.74,5.9,9.4,14.87,9.4,24.91Z"/>
											</g>
										</g>
										<g>
											<path class="cls-5" d="M120.01,140.11h-.51c-50.06,0-55.42-19.08-55.42-47.9h0c0-17.43,10.69-31.55,28.12-31.55h53.22c17.43,0,28.55,14.13,28.55,31.55h0c0,28.83-8.28,47.91-53.95,47.91Z"/>
											<path class="cls-2" d="M119.89,140.34h-.46c-49.73,0-53.14-21.1-53.14-47.13h0c0-15.73,12.76-28.49,28.49-28.49h48.05c15.73,0,28.49,12.76,28.49,28.49h0c0,26.03-5.25,47.13-51.43,47.13Z"/>
										</g>
										<g>
											<ellipse class="cls-6" cx="94.1" cy="93.14" rx="5.71" ry="7.74"/>
											<path class="cls-6" d="M153.14,95.98c-.59,0-1.16-.3-1.48-.84-.08-.13-1.93-3.14-5.49-3.16-.02,0-.03,0-.05,0-3.49,0-5.37,2.88-5.45,3.01-.51,.8-1.57,1.04-2.37,.53-.8-.51-1.04-1.57-.53-2.37,1.09-1.72,4.06-4.61,8.35-4.61,.02,0,.05,0,.07,0,5.51,.04,8.31,4.65,8.42,4.84,.48,.82,.22,1.87-.6,2.35-.28,.16-.58,.24-.88,.24Z"/>
										</g>
										<g>
											<circle class="cls-1" cx="81.53" cy="109.81" r="4.82"/>
											<circle class="cls-1" cx="155.5" cy="109.81" r="4.82"/>
										</g>
										<g>
											<path class="cls-6" d="M98.46,107.12c6.68,.76,14.24,1.24,22.52,1.18,8.02-.06,15.35-.63,21.86-1.44,.25,1.08,2.66,12.4-4.79,20.15-5.43,5.64-12.74,5.9-16.67,6.04-4.15,.15-12.34,.44-18.25-5.65-7.59-7.81-4.88-19.41-4.66-20.28Z"/>
											<path class="cls-4" d="M135.6,127.36c-3.45,2.25-8.79,3.7-14.77,3.7-5.09,0-9.71-1.04-13.11-2.75,3.1-2.67,8.47-4.44,14.57-4.44,5.34,0,10.12,1.35,13.31,3.48Z"/>
										</g>
										</g>
										<g>
										<path class="cls-4" d="M56.44,203.71c-2.13,0-3.86-1.73-3.86-3.86v-29.54c0-2.13,1.73-3.86,3.86-3.86h10.54c.16,0,.32,0,.48,.03,5.89,.73,10.51,5.48,11,11.29,.53,6.27-3.99,12.1-10.28,13.28-.23,.04-.47,.07-.71,.07h-7.16v8.74c0,2.13-1.73,3.86-3.86,3.86Zm3.86-20.33h6.75c2.28-.57,3.89-2.7,3.7-4.97-.18-2.12-1.87-3.87-4.05-4.24h-6.4v9.21Z"/>
										<path class="cls-4" d="M91.57,203.26c-4.62,0-7.8-2.6-8.98-3.75-3.6-3.51-3.92-7.85-4.03-9.28-.1-1.39-.34-8.55,5.26-12.94,2.81-2.21,5.64-2.74,7.51-2.8h0c1.36-.04,4.87,.14,8.1,2.66,4.64,3.63,4.92,9.17,5.01,10.99,.09,1.74,.32,6.35-3,10.35-1.14,1.37-4.34,4.58-9.42,4.76-.15,0-.3,0-.45,0Zm.06-21.47s-.07,0-.08,0c-1.13,.03-2.22,.45-3.22,1.24-2.74,2.15-2.52,6.2-2.48,6.66,.07,.98,.22,3.02,1.84,4.6,.54,.53,2.03,1.75,4.06,1.67,2.14-.08,3.56-1.52,4.07-2.13,1.5-1.81,1.39-4,1.33-5.31-.06-1.21-.2-4.03-2.22-5.61-1.34-1.05-2.9-1.12-3.3-1.12Zm-.19-3.65h0Z"/>
										<path class="cls-4" d="M116.11,203.28s-.03,0-.04,0c-1.62-.02-3.05-1.04-3.6-2.56l-7.43-20.74c-.72-2.01,.32-4.22,2.33-4.94,2.01-.72,4.22,.33,4.94,2.33l3.92,10.93,4.15-10.82c.57-1.48,1.99-2.47,3.58-2.48,.01,0,.02,0,.03,0,1.58,0,3,.96,3.58,2.42l4.53,11.25,4.38-11.03c.58-1.47,2.01-2.44,3.59-2.44h.02c1.59,0,3.01,.99,3.59,2.47l4.2,10.84,4.36-10.95c.59-1.47,2.01-2.43,3.59-2.43h.02c1.59,0,3.01,.99,3.59,2.47l4.24,10.93,4.24-10.93c.77-1.99,3.01-2.98,5-2.2,1.99,.77,2.98,3.01,2.2,5l-7.84,20.22c-.58,1.49-2.01,2.47-3.6,2.47h0c-1.6,0-3.03-.98-3.6-2.47l-4.29-11.06-4.37,10.96c-.59,1.47-2.01,2.43-3.59,2.43h-.02c-1.59,0-3.01-.99-3.58-2.47l-4.19-10.82-4.31,10.85c-.58,1.47-2,2.44-3.58,2.44h0c-1.58,0-3-.96-3.59-2.42l-4.47-11.09-4.36,11.36c-.57,1.5-2.01,2.48-3.61,2.48Z"/>
										<circle class="cls-4" cx="180.08" cy="168.6" r="4.23"/>
										<path class="cls-4" d="M180.05,202.81c-2.02,0-3.65-1.63-3.65-3.65v-20.48c0-2.02,1.63-3.65,3.65-3.65s3.65,1.63,3.65,3.65v20.48c0,2.02-1.63,3.65-3.65,3.65Z"/>
										</g>
									</g>
									</g>
								</g>
								</svg>`;
				case 'uala':
					return `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237.44 237.44">
								<defs>
									<style>
									.cls-1 {
										fill: #022a9b;
									}

									.cls-2 {
										fill: #fff;
										stroke: #000;
										stroke-miterlimit: 10;
									}

									.cls-3 {
										fill: #ff5874;
									}
									</style>
								</defs>
								<g id="Capa_1-2" data-name="Capa 1">
									<g id="uala">
									<rect class="cls-2" x=".5" y=".5" width="236.44" height="236.44" rx="33.61" ry="33.61"/>
									<g>
										<path class="cls-3" d="M164.91,92.36c-1.63,.73-3.41,1.67-5.27,2.86-6.27,4.02-9.93,8.79-13.76,14.16-7.54,10.58-8.26,13.06-14.17,21.75-6.93,10.19-11.1,16.32-17.56,21.53,1.2-1.08,1.85-1.8,1.85-1.82-.04,0-4.11,4.35-10.83,6.8-2.41,.88-8.18,2.9-15.31,1.23-7.72-1.81-12.17-6.74-13.76-8.56-1.34-1.53-2.42-3.39-3.82-6.25,2.24-.25,4.65-1.28,9.1-5.25,7.36-6.56,11.42-13.17,11.58-13.41,13.9-22.62,23.38-33.51,25.91-36.35,.59-.67,1.17-1.33,1.76-1.97-.02,.03-.02,.04-.01,.05,.17,.2,4.17-4.76,11.43-7.31,1.89-.66,8.53-2.9,16.51-.59,8,2.32,12.47,7.75,14.22,9.94,.8,1,1.49,2.03,2.13,3.19Z"/>
										<path class="cls-1" d="M116,150.84s-.65,.74-1.85,1.82c-2.09,1.89-5.84,4.91-10.68,7.28-12.27,6.02-24.26,4.39-27.83,3.83-17.6-2.77-28.29-14.14-32.1-18.2-2.45-2.6-8.55-9.55-12.53-20.17-1.82-4.86-4.06-11.06-2.82-18.81,.53-3.3,1.31-7.8,5.11-11.46,4.3-4.15,9.64-4.51,11.16-4.59,1.44-.07,7.21-.38,11.92,3.67,3.42,2.94,4.53,6.67,5.05,8.41,1.04,3.51,.38,4.85,.91,10.7,0,0,.41,4.41,1.53,9.32,1.48,6.46,3.59,11.08,5.97,16.21,.95,2.05,1.74,3.76,2.44,5.21,1.4,2.86,2.48,4.72,3.82,6.25,1.59,1.82,6.04,6.75,13.76,8.56,7.13,1.67,12.9-.35,15.31-1.23,6.72-2.45,10.79-6.8,10.83-6.8Z"/>
										<path class="cls-1" d="M209.25,126.01c-.03,4.29-.08,10.53-4.74,15.44-4.85,5.1-11.43,5.33-12.69,5.35-1.13,0-8.55,.12-12.84-5.05-1.92-2.31-2.5-5.82-3.67-12.84-.88-5.31-.53-5.61-1.22-9.78-1.15-6.97-3.11-12.13-4.74-16.36-1.84-4.76-3.05-7.89-4.44-10.41-.64-1.16-1.33-2.19-2.13-3.19-1.75-2.19-6.22-7.62-14.22-9.94-7.98-2.31-14.62-.07-16.51,.59-7.26,2.55-11.26,7.51-11.43,7.31-.01-.01-.01-.02,.01-.05,.16-.58,4.62-6.07,12.03-9.84,6.95-3.53,13.29-3.94,17.43-4.12,3.66-.16,12.81-.19,23.39,4.12,3.75,1.53,11.14,5.01,18.34,12.08,7.94,7.78,11.42,15.75,13.3,20.18,2.24,5.26,4.18,9.98,4.13,16.51Z"/>
									</g>
									</g>
								</g>
								</svg>`;
				default:
					return '';
			}
		};
        
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
                
                paymentHTML += `
                    <div style="height: 28px; line-height: 28px; margin-bottom: 8px;">
                        <img src="${methodDetails.icon}" alt="${methodDetails.name}" style="height: 22px; max-height: 22px; width: auto; margin-right: 10px; vertical-align: middle;">
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

