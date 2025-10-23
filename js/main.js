// js/main.js

// ? Configuraci�n base
import { app } from './firebase-init.js';

// ? Firebase Auth
import {
  getAuth,
  updateProfile,
  updateEmail,
  GoogleAuthProvider,
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ? Firestore (base de datos)
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  orderBy,
  onSnapshot,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ? Firebase Storage (para subir fotos de perfil, QR, etc.)
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ? Funciones auxiliares de autenticaci�n
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
  handleGoogleRedirect,
  sendPasswordResetEmail
} from './auth.js';

// ? Componentes de interfaz
import {
  paymentMethods,
  getAuthView,
  getHomeView,
  getCreateRaffleView,
  getExploreView,
  getRaffleCard,
  getRaffleDetailView,
  getCollaboratorModal,
  getStatisticsListView,
  getStatisticsDetailView,
  getParticipantsListView,
  getSettingsView,
  getEditProfileView,
  getSecurityView,
  getCollaboratorsView
} from './components.js';

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
}

document.body.insertAdjacentHTML("beforeend", getCollaboratorModal());

// Inicializamos Firebase con nuestra configuración
firebase.initializeApp(app);
// const storage = firebase.storage();

// Elementos del DOM
const appContainer = document.getElementById('app-container');

appContainer.addEventListener('click', (e) => {
    // Si el elemento en el que hiciste clic (o su padre) es el bot�n de regresar...
    if (e.target.closest('.app-back-btn')) {
        e.preventDefault(); // Evita que el enlace "#" recargue la p�gina
        window.history.back(); // ...simplemente ve a la p�gina anterior.
    }
});

const userInfoContainer = document.getElementById('user-info');
const mainNav = document.getElementById('nav-main');

// Variable global para cancelar la escucha de tickets en tiempo real
let currentUser = null;
let unsubscribeFromTickets = null;

// --- MANEJO DE RUTAS (ROUTING) ---
const routes = {
    '/': getHomeView,
    '/login': getAuthView,
    '/create': getCreateRaffleView,
    '/explore': getExploreView,
	'/statistics': getStatisticsListView,
	'/settings': getSettingsView,
	'/edit-profile': getEditProfileView,
	'/security': getSecurityView,
	'/collaborators': getCollaboratorsView
};

async function createTicketsForRaffle(raffleId) {
    const ticketsRef = db.collection("raffles").doc(raffleId).collection("tickets");

    const batch = db.batch();
    for (let i = 0; i < 100; i++) {
        const num = i.toString().padStart(2, "0"); // genera "00", "01", ..., "99"
        const ticketDoc = ticketsRef.doc(num);
        batch.set(ticketDoc, {
            number: num,
            status: "available" // todos los boletos empiezan libres
        });
    }

    await batch.commit();
    console.log("✅ 100 boletos creados para la rifa:", raffleId);
}

async function router() {
    if (unsubscribeFromTickets) {
        unsubscribeFromTickets();
        unsubscribeFromTickets = null;
    }

    const path = window.location.hash.slice(1) || '/';
	
	if (path === '/login') {
        document.body.classList.add('login-page');
    } else {
        document.body.classList.remove('login-page');
    }
	
    const user = currentUser;
    
    if (!user && path !== '/login') {
        window.location.hash = '/login';
        return;
    }

    // Detectamos rutas din�micas
    const isRaffleDetail = path.startsWith('/raffle/');
    const isStatisticsDetail = path.startsWith('/statistics/');
    const isParticipantsList = path.startsWith('/participants/');

    // Vistas base (solo si es una ruta plana registrada en routes)
    const view = isRaffleDetail
        ? getRaffleDetailView
        : (isStatisticsDetail ? getStatisticsDetailView : routes[path]);

    if (isRaffleDetail || isStatisticsDetail || isParticipantsList || view) {

        if (isRaffleDetail) {
			// ---------------------- DETALLE DE RIFA ----------------------
			const raffleId = path.split('/')[2].split('?')[0]; 
			const urlParams = new URLSearchParams(path.split('?')[1] || '');
			const ticketNumber = urlParams.get('ticket');

			const user = currentUser;
			console.log("RaffleId limpio:", raffleId, "Ticket:", ticketNumber, "Usuario:", user?.uid);

			try {
				if (!user) {
					appContainer.innerHTML = '<h2>Debes iniciar sesi�n para administrar rifas.</h2>';
					return;
				}

				console.log("RaffleId que intento abrir:", raffleId, "Usuario:", user.uid);

				// ?? Obtener documento de la rifa (modular)
				const raffleRef = doc(db, "raffles", raffleId);
				const raffleSnap = await getDoc(raffleRef);
				if (!raffleSnap.exists()) {
					appContainer.innerHTML = '<h2>Error: Rifa no encontrada</h2>';
					return;
				}
				const raffleData = { id: raffleSnap.id, ...raffleSnap.data() };

				// Renderizar vista de detalle
				appContainer.innerHTML = getRaffleDetailView(raffleData);

				// ?? Suscripci�n en tiempo real a tickets (modular)
				const ticketsGrid = document.getElementById('tickets-grid');
				if (ticketsGrid) {
					ticketsGrid.innerHTML = 'Cargando boletos...';
					
					const ticketsRef = collection(db, "raffles", raffleId, "tickets");
					const q = query(ticketsRef, orderBy("number"));

					// ?? Suscripci�n en tiempo real a tickets
					unsubscribeFromTickets = onSnapshot(q, snapshot => {
						ticketsGrid.innerHTML = '';
						if (snapshot.empty) {
							ticketsGrid.innerHTML = '<p>No se encontraron boletos para esta rifa.</p>';
							return;
						}
						snapshot.forEach(docSnap => {
							const ticketData = docSnap.data();
							const ticketElement = document.createElement('div');
							ticketElement.className = `ticket ${ticketData.status}`;
							ticketElement.textContent = ticketData.number;
							ticketElement.dataset.id = ticketData.number;
							ticketsGrid.appendChild(ticketElement);
						});

						// ?? Si hay ?ticket= en la URL, abre ese modal autom�ticamente
						if (ticketNumber) {
							console.log("Abrir modal autom�tico para ticket:", ticketNumber);
							openTicketModal(raffleId, ticketNumber).catch(err => {
								console.error("Error al abrir modal autom�tico:", err);
							});
						}
					}, error => {
						console.error("Error al suscribirse a los boletos:", error);
						ticketsGrid.innerHTML = '<p style="color: red; text-align: center;">Error al cargar los boletos. Revisa las reglas de seguridad de Firestore.</p>';
					});
				}

				// Bot�n compartir estado
				const shareStatusBtn = document.getElementById('share-status-btn');
				if (shareStatusBtn) {
					shareStatusBtn.addEventListener('click', () => openSimpleStatusModal(raffleData));
				}

			} catch (error) {
				console.error("Error al obtener el detalle de la rifa:", error);
				appContainer.innerHTML = '<h2>Error al cargar la rifa.</h2>';
			}
		} else if (isStatisticsDetail) {
			// ---------------------- DETALLE DE ESTAD�STICAS ----------------------
			const raffleId = path.split('/')[2].split('?')[0];
			const urlParams = new URLSearchParams(path.split('?')[1] || '');
			const ticketNumber = urlParams.get('ticket');

			try {
				// ?? Obtener rifa
				const raffleRef = doc(db, "raffles", raffleId);
				const raffleSnap = await getDoc(raffleRef);

				if (!raffleSnap.exists()) {
					appContainer.innerHTML = '<h2>Rifa no encontrada</h2>';
					return;
				}
				const raffleData = { id: raffleSnap.id, ...raffleSnap.data() };

				appContainer.innerHTML = getStatisticsDetailView(raffleData);

				// ?? Obtener tickets de la rifa
				const ticketsRef = collection(db, "raffles", raffleId, "tickets");
				const ticketsSnapshot = await getDocs(ticketsRef);

				let paidCount = 0, partialCount = 0, pendingCount = 0, availableCount = 0;
				const tickets = [];

				ticketsSnapshot.forEach(docSnap => {
					const ticket = docSnap.data();
					tickets.push(ticket);
					switch (ticket.status) {
						case 'paid': paidCount++; break;
						case 'partial': partialCount++; break;
						case 'pending': pendingCount++; break;
						case 'available': availableCount++; break;
					}
				});

				const ticketPrice = raffleData.ticketPrice || 0;
				const paidRevenue = paidCount * ticketPrice;
				const partialRevenue = partialCount * ticketPrice;
				const pendingRevenue = pendingCount * ticketPrice;

				document.getElementById('stats-revenue-paid').textContent = `$${paidRevenue.toLocaleString('es-CO')}`;
				document.getElementById('stats-revenue-partial').textContent = `$${partialRevenue.toLocaleString('es-CO')}`;
				document.getElementById('stats-revenue-pending').textContent = `$${pendingRevenue.toLocaleString('es-CO')}`;

				document.getElementById('stats-count-available').textContent = availableCount;
				document.getElementById('stats-count-paid').textContent = paidCount;
				document.getElementById('stats-count-partial').textContent = partialCount;
				document.getElementById('stats-count-pending').textContent = pendingCount;

				const participantsBtn = document.getElementById('show-participants-list-btn');
				const container = document.getElementById('participants-list-container');
				const listContainer = document.getElementById('participants-list');

				if (participantsBtn && container && listContainer) {
					participantsBtn.addEventListener('click', () => {
						if (container.style.display === 'none') {
							container.style.display = 'block';
							participantsBtn.textContent = 'Ocultar Lista de Participantes';
							renderParticipantsList(tickets, listContainer, "all");
						} else {
							container.style.display = 'none';
							participantsBtn.textContent = 'Ver Lista de Participantes';
						}
					});
				}

				const statCards = document.querySelectorAll('.stat-card.clickable');
				statCards.forEach(card => {
					card.addEventListener('click', () => {
						if (container && participantsBtn && listContainer) {
							const status = card.dataset.status;
							container.style.display = 'block';
							participantsBtn.textContent = 'Ocultar Lista de Participantes';
							renderParticipantsList(tickets, listContainer, status);
						}
					});
				});

			} catch (error) {
				console.error("Error al cargar estad�sticas:", error);
				appContainer.innerHTML = '<p>Error al cargar la p�gina de estad�sticas.</p>';
			}
		} else if (isParticipantsList) {
			// ---------------------- LISTA DE PARTICIPANTES ----------------------
			const raffleId = path.split('/')[2];
			try {
				// ?? Obtener la rifa
				const raffleRef = doc(db, "raffles", raffleId);
				const raffleSnap = await getDoc(raffleRef);

				if (!raffleSnap.exists()) {
					appContainer.innerHTML = '<h2>Rifa no encontrada</h2>';
					return;
				}
				const raffleData = { id: raffleSnap.id, ...raffleSnap.data() };

				// ?? Obtener solo tickets con comprador
				const ticketsRef = collection(db, "raffles", raffleId, "tickets");
				const q = query(ticketsRef, where("buyerName", "!=", ""));
				const ticketsSnapshot = await getDocs(q);

				const participants = [];
				ticketsSnapshot.forEach(docSnap => participants.push(docSnap.data()));

				// Renderizar la vista de participantes
				appContainer.innerHTML = getParticipantsListView(raffleData, participants);

				// ---------- Click en tarjeta para abrir detalle ----------
				document.querySelectorAll('.participant-card').forEach(card => {
					card.addEventListener('click', () => {
						const ticketNumber = card.dataset.ticket;
						const raffleId = card.dataset.raffle;
						window.location.hash = `/raffle/${raffleId}?ticket=${ticketNumber}`;
					});
				});

				// ---------- Filtro �nico y robusto ----------
				(() => {
					const searchInput = document.getElementById('search-participant');
					const statusFilter = document.getElementById('status-filter');

					if (!searchInput || !statusFilter) return;

					const statusLabelsRev = {
						'pagado': 'paid', 'pagados': 'paid', 'pagado(s)': 'paid',
						'parcial': 'partial', 'parciales': 'partial',
						'pendiente': 'pending', 'pendientes': 'pending',
						'disponible': 'available', 'disponibles': 'available',
						'todos': 'all', 'all': 'all',
						'paid': 'paid', 'partial': 'partial', 'pending': 'pending', 'available': 'available'
					};

					const normalize = str => (str || '')
						.toString()
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase();

					const getCards = () => Array.from(document.querySelectorAll('.participant-card'));

					const applyFilter = () => {
						const q = normalize(searchInput.value.trim());
						const selRaw = normalize(statusFilter.value.trim());
						const selectedKey = statusLabelsRev[selRaw] || selRaw || 'all';

						getCards().forEach(card => {
							const name = normalize(card.querySelector('.participant-name')?.textContent || '');
							const phone = normalize(card.querySelector('.participant-phone')?.textContent || '');
							const ticket = normalize(card.dataset.ticket || '');
							const status = normalize(card.dataset.status || '');

							const matchesSearch = !q || name.includes(q) || phone.includes(q) || ticket.includes(q);
							const matchesStatus = (selectedKey === 'all') || (status === selectedKey);

							card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
						});
					};

					searchInput.addEventListener('input', applyFilter);
					statusFilter.addEventListener('change', applyFilter);
					applyFilter();
				})();

			} catch (error) {
				console.error("Error al cargar participantes:", error);
				appContainer.innerHTML = '<p>Error al cargar la lista de participantes.</p>';
			}
		} else if (path === '/explore') {
			// ---------------------- EXPLORAR ----------------------
			const user = currentUser;
			if (!user) {
				appContainer.innerHTML = "<h2>Debes iniciar sesi�n para ver tus rifas.</h2>";
				return;
			}

			try {
				// ?? Consultar rifas que puede ver el usuario
				const rafflesRef = collection(db, "raffles");
				const q = query(
					rafflesRef,
					where("viewableBy", "array-contains", user.uid),
					orderBy("createdAt", "desc")
				);
				const rafflesSnapshot = await getDocs(q);

				let rafflesHTML = '';
				if (rafflesSnapshot.empty) {
					rafflesHTML = '<h2>No tienes rifas para administrar.</h2><p>Crea una nueva o pide que te a�adan como colaborador.</p>';
				} else {
					// ?? Construir las tarjetas de rifas
					const raffleCardPromises = rafflesSnapshot.docs.map(async (raffleDoc) => {
						const raffleData = { id: raffleDoc.id, ...raffleDoc.data() };

						// Contar boletos vendidos
						const ticketsRef = collection(db, "raffles", raffleData.id, "tickets");
						const ticketsSnapshot = await getDocs(
							query(ticketsRef, where("status", "!=", "available"))
						);
						raffleData.soldPercentage = ticketsSnapshot.size;

						return getRaffleCard(raffleData, user);
					});

					const resolvedRaffleCards = await Promise.all(raffleCardPromises);
					rafflesHTML = resolvedRaffleCards.join('');
				}

				// Mostrar vista
				appContainer.innerHTML = getExploreView(rafflesHTML);

			} catch (error) {
				console.error("Error al obtener las rifas:", error);
				appContainer.innerHTML = '<p>Error al cargar las rifas.</p>';
			}
		} else if (path === '/statistics') {
			// ---------------------- LISTA DE ESTAD�STICAS ----------------------
			const user = currentUser;
			if (!user) {
				appContainer.innerHTML = "<h2>Debes iniciar sesi�n para ver las estad�sticas.</h2>";
				return;
			}

			try {
				// ?? Consultar rifas del usuario
				const rafflesRef = collection(db, "raffles");
				const q = query(
					rafflesRef,
					where("viewableBy", "array-contains", user.uid),
					orderBy("createdAt", "desc")
				);
				const rafflesSnapshot = await getDocs(q);

				let rafflesHTML = '';
				if (rafflesSnapshot.empty) {
					rafflesHTML = '<h2>No tienes rifas para ver estad�sticas.</h2>';
				} else {
					rafflesHTML = `<div class="raffles-grid">`;
					rafflesSnapshot.forEach(raffleDoc => {
						const raffle = { id: raffleDoc.id, ...raffleDoc.data() };
						rafflesHTML += `
							<div class="raffle-card-simple">
								<h3>${raffle.name || 'Rifa sin nombre'}</h3>
								<p><strong>Premio:</strong> ${raffle.prize || 'No especificado'}</p>
								<a href="#/statistics/${raffle.id}" class="btn btn-primary">Ver Estad�sticas</a>
							</div>
						`;
					});
					rafflesHTML += `</div>`;
				}

				// Usamos la funci�n que arma el layout correcto
				appContainer.innerHTML = getStatisticsListView(rafflesHTML);

			} catch (error) {
				console.error("Error al obtener rifas para estad�sticas:", error);
				appContainer.innerHTML = '<p>Error al cargar las rifas.</p>';
			}
		} else if (path === '/collaborators') {
			try {
				appContainer.innerHTML = getCollaboratorsView();
				attachEventListeners('/collaborators');
			} catch (error) {
				console.error("Error al cargar la vista de colaboradores:", error);
				appContainer.innerHTML = '<p>Error al cargar la p�gina de colaboradores.</p>';
			}
		} else if (path === '/edit-profile') {
		// ---------------------- EDITAR PERFIL ----------------------
		try {
			const userRef = doc(db, "users", user.uid);
			const userSnap = await getDoc(userRef);

			const userData = userSnap.exists() ? userSnap.data() : {};
			const fullUserData = {
				uid: user.uid,
				email: user.email,
				photoURL: user.photoURL,
				displayName: userData.name || user.displayName,
			};

			appContainer.innerHTML = getEditProfileView(fullUserData);
		} catch (error) {
			console.error("Error al cargar perfil:", error);
			appContainer.innerHTML = '<p>Error al cargar el perfil.</p>';
		}

	} else if (path === '/security') {
		// ---------------------- SEGURIDAD ----------------------
		try {
			const userRef = doc(db, "users", user.uid);
			const userSnap = await getDoc(userRef);

			const userData = userSnap.exists() ? userSnap.data() : {};
			const fullUserData = { email: user.email, ...userData };

			appContainer.innerHTML = getSecurityView(fullUserData);
		} catch (error) {
			console.error("Error al cargar seguridad:", error);
			appContainer.innerHTML = '<p>Error al cargar la p�gina de seguridad.</p>';
		}

	} else {
		// ---------------------- VISTAS PLANAS ----------------------
		const user = currentUser;
		const userName = user ? user.displayName || user.email : 'Invitado';
		appContainer.innerHTML = (path === '/') ? view(userName) : view();
	}

	attachEventListeners(path);

	} else {
    appContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>Error 404: Página no encontrada</h2>
            
                <svg id="_0146_404_page_not_found_1" data-name=" 0146 404 page not found 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 452.46 438.46" style="max-width: 450px; height: auto; display: block; margin: 70px auto;">
                    <defs>
                        <style>
                        .cls-1 {
                            fill: #fff;
                        }

                        .cls-2 {
                            fill: #eea886;
                        }

                        .cls-3 {
                            stroke: #fff;
                            stroke-miterlimit: 10;
                        }

                        .cls-3, .cls-4 {
                            fill: none;
                        }

                        .cls-5 {
                            clip-path: url(#clippath-2);
                        }

                        .cls-6 {
                            opacity: .3;
                        }

                        .cls-6, .cls-7 {
                            fill: #7fd1ff;
                        }

                        .cls-8 {
                            clip-path: url(#clippath-1);
                        }

                        .cls-9 {
                            clip-path: url(#clippath-4);
                        }

                        .cls-10 {
                            fill: url(#Degradado_sin_nombre_4-2);
                        }

                        .cls-11 {
                            clip-path: url(#clippath);
                        }

                        .cls-12 {
                            fill: url(#Degradado_sin_nombre_17);
                        }

                        .cls-13 {
                            clip-path: url(#clippath-3);
                        }

                        .cls-14 {
                            fill: url(#Degradado_sin_nombre_4);
                        }

                        .cls-15 {
                            clip-path: url(#clippath-5);
                        }
                        </style>
                        <linearGradient id="Degradado_sin_nombre_4" data-name="Degradado sin nombre 4" x1="94.18" y1="318.59" x2="97.45" y2="226.11" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#eea886"/>
                        <stop offset="1" stop-color="#000"/>
                        </linearGradient>
                        <linearGradient id="Degradado_sin_nombre_4-2" data-name="Degradado sin nombre 4" x1="363.85" y1="313.29" x2="367.17" y2="219.46" xlink:href="#Degradado_sin_nombre_4"/>
                        <clipPath id="clippath">
                        <path class="cls-4" d="M102.43,141.55c3.23-3.58,6.66-7.51,10.3-11.79l23.29-27.26c3.66-4,7.02-8.27,10.04-12.77h21.99c-.62,5.91-.9,11.86-.85,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.18,8.83,.85,13.2h-22.09c.6-4.45,.88-8.93,.85-13.41v-5.18h-30.42c-6.99,0-10.04,.1-13.96,.42v-19.3Zm44.47-11.36c0-4.84,.22-10.73,.65-15.45-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44h0Z"/>
                        </clipPath>
                        <linearGradient id="Degradado_sin_nombre_17" data-name="Degradado sin nombre 17" x1="98.34" y1="136.42" x2="353.62" y2="136.42" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#09d"/>
                        <stop offset="1" stop-color="#001d96"/>
                        </linearGradient>
                        <clipPath id="clippath-1">
                        <path class="cls-4" d="M198.68,170.96c-3.42-3.37-6.09-7.43-7.83-11.91-2.83-7.88-4.25-16.2-4.19-24.58,0-11.28,2.68-22.96,6.77-29.73,6.54-10.95,17.7-16.96,31.22-16.96,10.42,0,19.54,3.54,26.08,10.04,3.43,3.37,6.1,7.43,7.83,11.91,2.84,7.91,4.26,16.27,4.19,24.68,0,11.28-2.68,23.08-6.76,29.84-6.44,10.73-17.72,16.74-31.35,16.74-10.52-.06-19.41-3.5-25.97-10.04h.01Zm10.05-37.29c0,19.21,5.47,29.08,16.1,29.08s15.88-9.66,15.88-28.69c-.06-18.47-5.68-28.15-16.05-28.15s-15.98,10.23-15.98,27.72l.06,.04h0Z"/>
                        </clipPath>
                        <clipPath id="clippath-2">
                        <path class="cls-4" d="M268.33,141.55c3.23-3.58,6.66-7.51,10.3-11.79l23.3-27.26c3.64-4,6.97-8.27,9.97-12.77h22.01c-.63,5.91-.92,11.86-.86,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.19,8.83,.86,13.2h-22.11c.6-4.45,.89-8.93,.86-13.41v-5.18h-30.37c-6.97,0-10.04,.1-13.96,.42v-19.3Zm44.47-11.36c0-4.84,.22-10.73,.65-15.45-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44Z"/>
                        </clipPath>
                        <clipPath id="clippath-3">
                        <path class="cls-4" d="M102.43,141.55c3.23-3.58,6.66-7.51,10.3-11.79l23.29-27.26c3.66-4,7.02-8.27,10.04-12.77h21.99c-.62,5.91-.9,11.86-.85,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.18,8.83,.85,13.2h-22.09c.6-4.45,.88-8.93,.85-13.41v-5.18h-30.42c-6.99,0-10.04,.1-13.96,.42v-19.3Zm44.47-11.36c0-4.84,.22-10.73,.65-15.45-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44h0Z"/>
                        </clipPath>
                        <clipPath id="clippath-4">
                        <path class="cls-4" d="M198.68,170.96c-3.42-3.37-6.09-7.43-7.83-11.91-2.83-7.88-4.25-16.2-4.19-24.58,0-11.28,2.68-22.96,6.77-29.73,6.54-10.95,17.7-16.96,31.22-16.96,10.42,0,19.54,3.54,26.08,10.04,3.43,3.37,6.1,7.43,7.83,11.91,2.84,7.91,4.26,16.27,4.19,24.68,0,11.28-2.68,23.08-6.76,29.84-6.44,10.73-17.72,16.74-31.35,16.74-10.52-.06-19.41-3.5-25.97-10.04h.01Zm10.05-37.29c0,19.21,5.47,29.08,16.1,29.08s15.88-9.66,15.88-28.69c-.06-18.47-5.68-28.15-16.05-28.15s-15.98,10.23-15.98,27.72l.06,.04h0Z"/>
                        </clipPath>
                        <clipPath id="clippath-5">
                        <path class="cls-3" d="M268.33,141.55c3.23-3.58,6.66-7.51,10.3-11.79l23.3-27.26c3.64-4,6.97-8.27,9.97-12.77h22.01c-.63,5.91-.92,11.86-.86,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.19,8.83,.86,13.2h-22.11c.6-4.45,.89-8.93,.86-13.41v-5.18h-30.37c-6.97,0-10.04,.1-13.96,.42v-19.3Zm44.47-11.36c0-4.84,.22-10.73,.65-15.45-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44Z"/>
                        </clipPath>
                    </defs>
                    <path id="background_404-page-not-found-1-24" data-name="background 404-page-not-found-1-24" class="cls-6" d="M137.89,295.91c29.67,13.04,63.23,12.84,95.64,12.41,17-.22,34.59-.56,50.07-7.6,21.52-9.8,35.5-30.83,54.38-45.07,21.68-16.37,49.43-23.43,70.45-40.63,38.88-31.8,44.62-89.1,12.83-127.98-3.19-3.9-6.7-7.53-10.49-10.85-11.12-9.73-24.39-16.6-37.55-23.36l-66.07-34c-15.48-7.96-31.36-16.05-48.64-18.22-14.58-1.82-29.33,.7-43.57,3.96-40.6,9.18-80.89,25.01-110.68,53.97-25.62,24.96-42.35,58.49-70.39,80.72-7.17,5.67-15.12,10.67-20.34,18.16-18.8,26.99,.24,61.46,24.66,75.3,33.82,19.14,64.25,47.62,99.7,63.19h0Z"/>
                    <g id="_404_404-page-not-found-1-24" data-name=" 404 404-page-not-found-1-24">
                        <ellipse class="cls-7" cx="226.23" cy="410.51" rx="226.23" ry="27.95"/>
                        <ellipse cx="226.23" cy="410.51" rx="226.23" ry="27.95"/>
                        <path class="cls-2" d="M102.3,137.46c-8.48-5.75-18.92-7.82-28.95-5.74-1.82,.28-3.53,1.02-4.99,2.14-3.4,2.87-2.87,8.21-3.77,12.6-1.1,5.41-4.73,10.04-6.04,15.38-.76,4.02-.8,8.14-.13,12.17,1.91,15.9,5.72,31.52,11.35,46.51l-15.78,207.91s16.14,2.61,48.88,5.22l3.47-197.99-4.03-98.19h-.01Z"/>
                        <polygon class="cls-14" points="84.35 258.71 105.25 343.25 105.25 221.32 95.96 193.69 84.35 258.71"/>
                        <path class="cls-2" d="M357.71,139.24c8.5-5.71,18.94-7.73,28.95-5.62,1.82,.29,3.54,1.02,5.01,2.14,3.39,2.87,2.87,8.21,3.76,12.61,1.12,5.41,4.75,10.04,6.05,15.38,.76,4.01,.8,8.13,.11,12.15-1.9,15.9-5.7,31.52-11.33,46.51l15.71,205.01s-17.58,2.96-48.98,5.93l-3.37-195.81,4.09-98.29h0Z"/>
                        <polygon class="cls-10" points="378.34 252.67 370.93 290.76 355.13 325.13 353.74 250.35 378.34 252.67"/>
                        <rect class="cls-7" x="75.53" y="69.45" width="303.75" height="191.35" rx="12.01" ry="12.01"/>
                        <rect x="75.53" y="69.45" width="303.75" height="191.35" rx="12.01" ry="12.01"/>
                        <rect class="cls-7" x="75.53" y="61.78" width="303.75" height="191.35" rx="12.01" ry="12.01"/>
                        <g id="_404" data-name="404">
                        <g>
                            <g class="cls-11">
                            <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <g class="cls-8">
                            <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <g class="cls-5">
                            <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <g>
                            <path class="cls-12" d="M224.63,181.99c-10.73-.06-19.95-3.63-26.67-10.33,0,0,0,0-.01-.01-3.53-3.49-6.24-7.6-8.03-12.23-2.89-8.04-4.32-16.43-4.26-24.95,0-11.41,2.71-23.29,6.91-30.24,6.72-11.25,18.11-17.44,32.08-17.44,10.72,0,19.99,3.57,26.79,10.33,3.55,3.49,6.27,7.62,8.06,12.26,2.9,8.07,4.33,16.49,4.26,25.05,0,11.48-2.71,23.4-6.9,30.35-6.57,10.94-18.31,17.22-32.21,17.22h0Zm-14.9-48.33c0,18.63,5.08,28.08,15.1,28.08s14.88-9.32,14.88-27.69c-.04-12.38-2.68-27.15-15.05-27.15-9.63,0-14.94,9.42-14.98,26.54,.02,.07,.03,.15,.03,.23h.02Z"/>
                            <path class="cls-12" d="M224.65,87.78c10.42,0,19.54,3.54,26.08,10.04,3.43,3.37,6.1,7.43,7.83,11.91,2.84,7.91,4.26,16.27,4.19,24.68,0,11.28-2.68,23.08-6.76,29.84-6.44,10.73-17.72,16.74-31.35,16.74-10.52-.06-19.4-3.5-25.96-10.03,0,0,0,0,0,0h-.01s0,0,0,0c-3.42-3.37-6.09-7.43-7.83-11.91-2.83-7.88-4.25-16.2-4.19-24.58,0-11.28,2.68-22.96,6.77-29.73,6.54-10.95,17.7-16.96,31.22-16.96m.18,74.96c10.63,0,15.88-9.66,15.88-28.69-.06-18.47-5.68-28.15-16.05-28.15s-15.98,10.23-15.98,27.72l.06,.04h0c0,19.21,5.47,29.08,16.1,29.08m-.18-76.96c-14.33,0-26.03,6.37-32.94,17.93-4.28,7.09-7.05,19.16-7.05,30.76-.06,8.62,1.39,17.12,4.31,25.26,0,.02,.01,.03,.02,.05,1.85,4.77,4.64,9.01,8.28,12.6,6.91,6.88,16.37,10.55,27.36,10.61,14.27,0,26.32-6.46,33.08-17.71,4.28-7.09,7.05-19.21,7.05-30.87,.07-8.66-1.38-17.19-4.31-25.36-1.86-4.82-4.65-9.07-8.31-12.66-6.88-6.84-16.65-10.61-27.48-10.61h0Zm-13.97,47.41c.05-9.65,1.99-25.29,13.98-25.29s14.01,14.22,14.05,26.16c0,26.68-10.45,26.68-13.88,26.68-9.33,0-14.07-9.06-14.1-26.93,.02-.21,0-.42-.05-.62h0Z"/>
                            </g>
                            <g>
                            <path class="cls-12" d="M145.96,180.02c-.29,0-.56-.12-.75-.34s-.28-.51-.24-.79c.59-4.36,.87-8.83,.84-13.27v-4.19h-29.42c-6.81,0-9.92,.09-13.88,.42-.03,0-.05,0-.08,0-.25,0-.49-.09-.68-.26-.21-.19-.32-.46-.32-.74v-19.28c0-.25,.09-.51,.26-.69,3.21-3.56,6.67-7.52,10.28-11.77l23.29-27.26c3.65-3.99,6.99-8.24,9.97-12.68,.19-.28,.5-.44,.83-.44h21.99c.28,0,.55,.12,.74,.33,.19,.21,.28,.49,.25,.77-.61,5.81-.89,11.77-.84,17.7v33.89h2.11c3.46-.03,6.99-.31,10.47-.85,.05,0,.1-.01,.15-.01,.24,0,.47,.08,.65,.24,.22,.19,.35,.47,.35,.76v19.54c0,.29-.12,.56-.34,.75-.18,.16-.42,.25-.66,.25-.04,0-.08,0-.12,0-3.46-.43-6.96-.64-10.4-.64h-2.21v4.37c-.1,4.39,.18,8.77,.84,13.05,.04,.29-.04,.58-.23,.8s-.47,.35-.76,.35h-22.09Zm-.1-38.39l.04-11.44c0-3.94,.14-8.21,.38-12-1.27,1.72-2.64,3.49-4.61,5.97l-14.38,17.48h18.57Z"/>
                            <path class="cls-12" d="M168.05,89.73c-.62,5.91-.9,11.86-.85,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.18,8.83,.85,13.2h-22.09c.6-4.45,.88-8.93,.85-13.41v-5.18h-30.42c-6.99,0-10.04,.1-13.96,.42v-19.3c3.23-3.58,6.66-7.51,10.3-11.79l23.29-27.26c3.66-4,7.02-8.27,10.04-12.77h21.99m-20.5,25.01c-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44h0c0-4.84,.22-10.73,.65-15.45m20.5-27.01h-21.99c-.67,0-1.29,.33-1.66,.89-2.95,4.39-6.26,8.61-9.85,12.53-.02,.02-.03,.03-.05,.05l-23.29,27.26c-3.61,4.25-7.07,8.2-10.27,11.75-.33,.37-.51,.84-.51,1.34v19.3c0,.56,.23,1.09,.64,1.47,.37,.34,.86,.53,1.36,.53,.05,0,.11,0,.16,0,3.93-.32,7.02-.41,13.8-.41h28.42v3.18c.03,4.41-.25,8.83-.83,13.14-.08,.57,.1,1.15,.48,1.58,.38,.43,.93,.68,1.51,.68h22.09c.58,0,1.14-.25,1.52-.7,.38-.44,.55-1.03,.46-1.61-.65-4.22-.92-8.54-.83-12.85v-3.42h1.21c3.4,0,6.86,.21,10.28,.63,.08,.01,.16,.02,.24,.02,.49,0,.96-.18,1.32-.5,.43-.38,.68-.93,.68-1.5v-19.54c0-.58-.25-1.14-.7-1.52-.37-.31-.83-.48-1.3-.48-.1,0-.2,0-.3,.02-3.43,.53-6.91,.81-10.33,.84h-1.09v-32.88c-.05-5.91,.23-11.82,.84-17.6,.06-.56-.12-1.13-.5-1.55-.38-.42-.92-.66-1.49-.66h0Zm-38.64,52.9l13.02-15.83c1.03-1.29,1.9-2.4,2.67-3.4-.13,2.9-.21,5.93-.21,8.79l-.03,10.44h-15.45Z"/>
                            </g>
                            <g>
                            <path class="cls-12" d="M310.66,180.02l.15-1.13c.59-4.41,.88-8.87,.85-13.27v-4.19h-29.37c-6.81,0-9.92,.09-13.88,.42l-1.08,.09v-20.75l.26-.31c3.19-3.54,6.65-7.5,10.28-11.77l23.3-27.26c3.6-3.96,6.92-8.22,9.9-12.67l.3-.45h23.66l-.12,1.11c-.63,5.87-.91,11.83-.85,17.69v33.89h2.11c3.46-.03,6.99-.31,10.47-.85l1.15-.18v21.84l-1.12-.14c-3.46-.43-6.96-.64-10.4-.64h-2.21v4.37c-.1,4.35,.19,8.74,.85,13.05l.18,1.15h-24.42Zm1.11-38.39l.04-11.44c0-3.94,.14-8.21,.38-12-1.27,1.72-2.64,3.49-4.61,5.97l-14.38,17.48h18.57Z"/>
                            <path class="cls-12" d="M333.91,89.73c-.63,5.91-.92,11.86-.86,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.19,8.83,.86,13.2h-22.11c.6-4.45,.89-8.93,.86-13.41v-5.18h-30.37c-6.97,0-10.04,.1-13.96,.42v-19.3c3.23-3.58,6.66-7.51,10.3-11.79l23.3-27.26c3.64-4,6.97-8.27,9.97-12.77h22.01m-20.46,25.01c-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44c0-4.84,.22-10.73,.65-15.45m22.68-27.01h-25.3l-.59,.89c-2.95,4.42-6.24,8.64-9.79,12.53l-.02,.02-.02,.02-23.3,27.26c-3.61,4.25-7.07,8.2-10.27,11.75l-.51,.57v22.24l2.16-.18c3.93-.32,7.02-.41,13.8-.41h28.37v3.18c.03,4.36-.25,8.78-.84,13.14l-.31,2.27h26.73l-.35-2.3c-.65-4.25-.93-8.58-.84-12.85v-3.42h1.21c3.4,0,6.86,.21,10.28,.63l2.24,.28v-24.13l-2.3,.35c-3.43,.53-6.91,.81-10.33,.84h-1.09v-32.88c-.06-5.85,.23-11.76,.85-17.6l.24-2.21h0Zm-40.82,52.9l13.02-15.83c1.03-1.29,1.9-2.4,2.67-3.4-.13,2.9-.21,5.93-.21,8.79l-.03,10.44h-15.45Z"/>
                            </g>
                        </g>
                        <g>
                            <g class="cls-13">
                            <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <g class="cls-9">
                            <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <g>
                            <g class="cls-15">
                                <rect class="cls-12" x="98.34" y="83.67" width="255.28" height="105.5"/>
                            </g>
                            <path class="cls-3" d="M268.33,141.55c3.23-3.58,6.66-7.51,10.3-11.79l23.3-27.26c3.64-4,6.97-8.27,9.97-12.77h22.01c-.63,5.91-.92,11.86-.86,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.19,8.83,.86,13.2h-22.11c.6-4.45,.89-8.93,.86-13.41v-5.18h-30.37c-6.97,0-10.04,.1-13.96,.42v-19.3Zm44.47-11.36c0-4.84,.22-10.73,.65-15.45-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44Z"/>
                            </g>
                            <path class="cls-1" d="M224.65,87.78c10.42,0,19.54,3.54,26.08,10.04,3.43,3.37,6.1,7.43,7.83,11.91,2.84,7.91,4.26,16.27,4.19,24.68,0,11.28-2.68,23.08-6.76,29.84-6.44,10.73-17.72,16.74-31.35,16.74-10.52-.06-19.4-3.5-25.96-10.03,0,0,0,0,0,0h-.01s0,0,0,0c-3.42-3.37-6.09-7.43-7.83-11.91-2.83-7.88-4.25-16.2-4.19-24.58,0-11.28,2.68-22.96,6.77-29.73,6.54-10.95,17.7-16.96,31.22-16.96m.18,74.96c10.63,0,15.88-9.66,15.88-28.69-.06-18.47-5.68-28.15-16.05-28.15s-15.98,10.23-15.98,27.72l.06,.04h0c0,19.21,5.47,29.08,16.1,29.08m-.18-76.96c-14.33,0-26.03,6.37-32.94,17.93-4.28,7.09-7.05,19.16-7.05,30.76-.06,8.62,1.39,17.12,4.31,25.26,0,.02,.01,.03,.02,.05,1.85,4.77,4.64,9.01,8.28,12.6,6.91,6.88,16.37,10.55,27.36,10.61,14.27,0,26.32-6.46,33.08-17.71,4.28-7.09,7.05-19.21,7.05-30.87,.07-8.66-1.38-17.19-4.31-25.36-1.86-4.82-4.65-9.07-8.31-12.66-6.88-6.84-16.65-10.61-27.48-10.61h0Zm-13.97,47.41c.05-9.65,1.99-25.29,13.98-25.29s14.01,14.22,14.05,26.16c0,26.68-10.45,26.68-13.88,26.68-9.33,0-14.07-9.06-14.1-26.93,.02-.21,0-.42-.05-.62h0Z"/>
                            <path class="cls-1" d="M168.05,89.73c-.62,5.91-.9,11.86-.85,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.18,8.83,.85,13.2h-22.09c.6-4.45,.88-8.93,.85-13.41v-5.18h-30.42c-6.99,0-10.04,.1-13.96,.42v-19.3c3.23-3.58,6.66-7.51,10.3-11.79l23.29-27.26c3.66-4,7.02-8.27,10.04-12.77h21.99m-20.5,25.01c-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44h0c0-4.84,.22-10.73,.65-15.45m20.5-27.01h-21.99c-.67,0-1.29,.33-1.66,.89-2.95,4.39-6.26,8.61-9.85,12.53-.02,.02-.03,.03-.05,.05l-23.29,27.26c-3.61,4.25-7.07,8.2-10.27,11.75-.33,.37-.51,.84-.51,1.34v19.3c0,.56,.23,1.09,.64,1.47,.37,.34,.86,.53,1.36,.53,.05,0,.11,0,.16,0,3.93-.32,7.02-.41,13.8-.41h28.42v3.18c.03,4.41-.25,8.83-.83,13.14-.08,.57,.1,1.15,.48,1.58,.38,.43,.93,.68,1.51,.68h22.09c.58,0,1.14-.25,1.52-.7,.38-.44,.55-1.03,.46-1.61-.65-4.22-.92-8.54-.83-12.85v-3.42h1.21c3.4,0,6.86,.21,10.28,.63,.08,.01,.16,.02,.24,.02,.49,0,.96-.18,1.32-.5,.43-.38,.68-.93,.68-1.5v-19.54c0-.58-.25-1.14-.7-1.52-.37-.31-.83-.48-1.3-.48-.1,0-.2,0-.3,.02-3.43,.53-6.91,.81-10.33,.84h-1.09v-32.88c-.05-5.91,.23-11.82,.84-17.6,.06-.56-.12-1.13-.5-1.55-.38-.42-.92-.66-1.49-.66h0Zm-38.64,52.9l13.02-15.83c1.03-1.29,1.9-2.4,2.67-3.4-.13,2.9-.21,5.93-.21,8.79l-.03,10.44h-15.45Z"/>
                            <path class="cls-1" d="M333.91,89.73c-.63,5.91-.92,11.86-.86,17.81v34.88h3.11c3.56-.03,7.1-.32,10.62-.86v19.54c-3.49-.43-7-.65-10.52-.65h-3.21v5.37c-.1,4.42,.19,8.83,.86,13.2h-22.11c.6-4.45,.89-8.93,.86-13.41v-5.18h-30.37c-6.97,0-10.04,.1-13.96,.42v-19.3c3.23-3.58,6.66-7.51,10.3-11.79l23.3-27.26c3.64-4,6.97-8.27,9.97-12.77h22.01m-20.46,25.01c-2.15,3-3.76,5.15-6.66,8.79l-15.71,19.1h21.68l.04-12.44c0-4.84,.22-10.73,.65-15.45m22.68-27.01h-25.3l-.59,.89c-2.95,4.42-6.24,8.64-9.79,12.53l-.02,.02-.02,.02-23.3,27.26c-3.61,4.25-7.07,8.2-10.27,11.75l-.51,.57v22.24l2.16-.18c3.93-.32,7.02-.41,13.8-.41h28.37v3.18c.03,4.36-.25,8.78-.84,13.14l-.31,2.27h26.73l-.35-2.3c-.65-4.25-.93-8.58-.84-12.85v-3.42h1.21c3.4,0,6.86,.21,10.28,.63l2.24,.28v-24.13l-2.3,.35c-3.43,.53-6.91,.81-10.33,.84h-1.09v-32.88c-.06-5.85,.23-11.76,.85-17.6l.24-2.21h0Zm-40.82,52.9l13.02-15.83c1.03-1.29,1.9-2.4,2.67-3.4-.13,2.9-.21,5.93-.21,8.79l-.03,10.44h-15.45Z"/>
                        </g>
                        </g>
                        <path class="cls-2" d="M88.4,134.95c1.23,.61,2.28,1.54,3.04,2.68,.63,1.35,.94,2.82,.9,4.3l.43,9.25c.19,1.52,.01,3.07-.53,4.51-.6,1.46-2.16,2.28-3.7,1.95,1.11,3.64,.68,7.58-1.19,10.89-.46,.69-.83,1.44-1.08,2.24-.12,.96-.07,1.93,.14,2.87,.66,4.7-.74,9.45-3.83,13.04-.47,.58-1.04,1.07-1.69,1.43-.85,.36-1.77,.56-2.7,.57l-4.22,.36c-.75,.25-1.56-.16-1.81-.92-.04-.12-.06-.24-.07-.36-3.2-10.16-4.66-20.79-4.3-31.44,.17-5.36,.81-10.7,1.92-15.95,.67-3.07,1.99-7.75,5.28-9,4.25-1.49,9.73,1.45,13.4,3.56v.02Z"/>
                        <path class="cls-2" d="M365.47,134.95c-1.23,.61-2.28,1.54-3.04,2.68-.63,1.35-.94,2.82-.9,4.3l-.43,9.25c-.19,1.52-.01,3.07,.53,4.51,.6,1.46,2.16,2.28,3.7,1.95-1.11,3.64-.68,7.57,1.18,10.89,.47,.69,.84,1.44,1.09,2.24,.12,.96,.07,1.93-.16,2.87-.64,4.7,.76,9.45,3.85,13.04,.47,.58,1.04,1.07,1.69,1.43,.85,.36,1.77,.56,2.7,.57l4.26,.42c.75,.25,1.56-.16,1.81-.92,.04-.12,.06-.24,.07-.36,3.2-10.16,4.66-20.79,4.3-31.44-.16-5.37-.81-10.71-1.94-15.95-.66-3.07-1.43-6.92-4.69-8.16-4.29-1.56-10.34,.56-14.02,2.67h0Z"/>
                    </g>
                    <g>
                        <g>
                        <path class="cls-1" d="M188.47,209.19h-3.59c-.28-.19-.54-.42-.75-.71-.65-.85-.81-1.92-.46-2.89l-.43-.55c-.65,.32-1.37,.44-2.1,.35-.73-.09-1.4-.39-1.96-.85l-5.98,4.66h-2.57l8.76-6.82,.48,.62c.36,.46,.88,.76,1.45,.83,.58,.07,1.15-.09,1.61-.44l.62-.49,1.97,2.53-.26,.46c-.31,.54-.26,1.16,.11,1.65s.96,.7,1.57,.54l.54-.14,.98,1.26Z"/>
                        <path class="cls-1" d="M194.52,218.81l.49-.2v-3.97h-.79c-1.87,0-3.4-1.53-3.4-3.4v-.79h-25.64v.79c0,1.87-1.53,3.4-3.4,3.4h-.79v3.97l.49,.2c1.1,.46,1.49,1.45,1.5,2.23,0,.78-.37,1.78-1.46,2.26l-.52,.23v3.82h.79c1.87,0,3.4,1.53,3.4,3.4v.79h25.64v-.79c0-1.88,1.53-3.4,3.4-3.4h.79v-3.82l-.53-.23c-1.09-.48-1.47-1.48-1.46-2.26,0-.78,.41-1.77,1.5-2.23Zm-3.08,2.22c-.01,1.48,.74,2.78,1.99,3.5v1.3c-2.11,.34-3.79,2.01-4.13,4.13h-22.61c-.34-2.12-2.01-3.79-4.13-4.13v-1.3c1.25-.72,2-2.03,1.99-3.5-.01-1.45-.76-2.73-1.99-3.43v-1.44c2.12-.34,3.79-2.01,4.13-4.13h22.61c.34,2.11,2.01,3.79,4.13,4.13v1.44c-1.23,.71-1.98,1.98-1.99,3.43Z"/>
                        <path class="cls-1" d="M176.51,226.96c-.1,0-.19-.02-.28-.05-.28-.11-.47-.37-.5-.67l-.29-3.29-2.87-1.62c-.26-.15-.42-.43-.4-.73,.02-.3,.2-.56,.48-.68l3.04-1.29,.65-3.23c.06-.29,.28-.53,.57-.61,.29-.08,.6,.02,.8,.24l2.17,2.49,3.28-.38c.3-.03,.59,.1,.75,.36,.16,.25,.17,.58,.01,.83l-1.7,2.83,1.37,3c.12,.27,.08,.59-.11,.83-.19,.23-.5,.34-.79,.27l-3.22-.74-2.43,2.23c-.15,.14-.34,.21-.53,.21Zm-1.78-6.22l1.84,1.04c.23,.13,.38,.36,.4,.62l.19,2.11,1.56-1.43c.19-.18,.46-.25,.71-.19l2.06,.47-.88-1.92c-.11-.24-.09-.51,.04-.73l1.09-1.82-2.1,.24c-.26,.03-.51-.07-.68-.27l-1.39-1.59-.42,2.07c-.05,.25-.23,.47-.46,.57l-1.95,.83Zm1.64-1.56h0Z"/>
                        <path class="cls-1" d="M167.74,225.52c-.26,0-.47-.21-.47-.47v-7.94c0-.26,.21-.47,.47-.47s.47,.21,.47,.47v7.94c0,.26-.21,.47-.47,.47Z"/>
                        <path class="cls-1" d="M188.8,225.52c-.26,0-.47-.21-.47-.47v-7.94c0-.26,.21-.47,.47-.47s.47,.21,.47,.47v7.94c0,.26-.21,.47-.47,.47Z"/>
                        <path class="cls-1" d="M182.42,209.19h-1.26l-1.23-1.37c-.17-.19-.16-.49,.03-.66,.19-.17,.49-.16,.66,.04l1.79,1.99Z"/>
                        </g>
                        <g>
                        <g>
                            <path class="cls-1" d="M202.69,234.56h.97c.24,0,.46,.05,.65,.15,.19,.1,.34,.23,.44,.41,.1,.18,.16,.38,.16,.6s-.05,.43-.16,.6c-.1,.18-.25,.31-.44,.41-.19,.1-.41,.15-.65,.15h-.97v-2.31Zm.95,2.03c.19,0,.35-.04,.49-.11,.14-.07,.25-.17,.33-.31s.12-.28,.12-.45-.04-.32-.12-.45-.19-.23-.33-.31c-.14-.07-.31-.11-.49-.11h-.62v1.74h.62Z"/>
                            <path class="cls-1" d="M206.95,236.11h-1.42c.02,.15,.09,.28,.2,.37,.12,.09,.26,.14,.43,.14,.21,0,.38-.07,.51-.21l.18,.2c-.08,.09-.18,.16-.3,.21-.12,.05-.25,.07-.39,.07-.19,0-.35-.04-.49-.11s-.25-.18-.33-.32c-.08-.14-.12-.29-.12-.46s.04-.32,.11-.46c.08-.14,.18-.24,.31-.32,.13-.08,.28-.11,.45-.11s.32,.04,.45,.11c.13,.08,.23,.18,.31,.32,.07,.14,.11,.29,.11,.47,0,.02,0,.06,0,.1Zm-1.24-.59c-.1,.09-.16,.21-.18,.36h1.12c-.02-.15-.08-.27-.18-.36s-.23-.14-.38-.14-.28,.05-.38,.14Z"/>
                            <path class="cls-1" d="M207.48,236.84c-.13-.04-.24-.09-.31-.15l.13-.25c.08,.06,.17,.1,.28,.13,.11,.03,.22,.05,.33,.05,.28,0,.42-.08,.42-.24,0-.05-.02-.09-.06-.13-.04-.03-.08-.05-.14-.07-.06-.01-.14-.03-.24-.05-.14-.02-.26-.05-.35-.08-.09-.03-.17-.08-.23-.15-.06-.07-.1-.16-.1-.29,0-.16,.07-.29,.2-.38,.13-.1,.31-.14,.53-.14,.12,0,.23,.01,.35,.04,.12,.03,.21,.07,.29,.12l-.14,.25c-.14-.09-.31-.14-.51-.14-.13,0-.24,.02-.31,.07-.07,.04-.11,.1-.11,.18,0,.06,.02,.1,.06,.14,.04,.03,.09,.06,.15,.07,.06,.02,.14,.03,.25,.05,.14,.02,.25,.05,.34,.08,.09,.03,.16,.07,.22,.14s.09,.16,.09,.28c0,.16-.07,.28-.2,.38-.14,.09-.32,.14-.55,.14-.14,0-.28-.02-.41-.06Z"/>
                            <path class="cls-1" d="M210.25,235.29c.13,.12,.19,.3,.19,.53v1.06h-.3v-.23c-.05,.08-.13,.14-.23,.19s-.21,.06-.35,.06c-.2,0-.35-.05-.47-.14-.12-.09-.18-.22-.18-.37s.06-.28,.17-.37c.11-.09,.29-.14,.54-.14h.5v-.06c0-.14-.04-.24-.12-.31-.08-.07-.2-.11-.35-.11-.1,0-.2,.02-.3,.05-.1,.03-.18,.08-.25,.14l-.13-.24c.09-.07,.2-.13,.32-.17,.13-.04,.26-.06,.4-.06,.24,0,.43,.06,.56,.18Zm-.32,1.28c.09-.05,.15-.13,.19-.23v-.24h-.49c-.27,0-.4,.09-.4,.27,0,.09,.03,.16,.1,.21,.07,.05,.16,.08,.28,.08s.23-.03,.31-.08Z"/>
                            <path class="cls-1" d="M211.58,235.19c.11-.05,.24-.08,.39-.08v.31s-.04,0-.07,0c-.17,0-.31,.05-.4,.15-.1,.1-.15,.25-.15,.44v.87h-.32v-1.75h.3v.29c.06-.1,.14-.18,.24-.23Z"/>
                            <path class="cls-1" d="M212.91,235.19c.11-.05,.24-.08,.39-.08v.31s-.04,0-.07,0c-.17,0-.31,.05-.4,.15-.1,.1-.15,.25-.15,.44v.87h-.32v-1.75h.3v.29c.06-.1,.14-.18,.24-.23Z"/>
                            <path class="cls-1" d="M213.95,236.78c-.14-.08-.25-.18-.33-.32-.08-.14-.12-.29-.12-.46s.04-.33,.12-.46c.08-.14,.19-.24,.33-.32,.14-.08,.3-.11,.47-.11s.33,.04,.47,.11c.14,.08,.25,.18,.32,.32,.08,.14,.12,.29,.12,.46s-.04,.33-.12,.46c-.08,.14-.19,.24-.32,.32-.14,.08-.29,.12-.47,.12s-.33-.04-.47-.12Zm.77-.24c.09-.05,.16-.12,.21-.22,.05-.09,.08-.2,.08-.32s-.03-.23-.08-.32c-.05-.09-.12-.17-.21-.22-.09-.05-.19-.08-.3-.08s-.21,.03-.3,.08c-.09,.05-.16,.12-.21,.22-.05,.09-.08,.2-.08,.32s.03,.23,.08,.32c.05,.09,.12,.17,.21,.22,.09,.05,.19,.08,.3,.08s.21-.03,.3-.08Z"/>
                            <path class="cls-1" d="M215.77,234.42h.32v2.45h-.32v-2.45Z"/>
                            <path class="cls-1" d="M216.69,234.42h.32v2.45h-.32v-2.45Z"/>
                            <path class="cls-1" d="M218.81,235.29c.13,.12,.19,.3,.19,.53v1.06h-.3v-.23c-.05,.08-.13,.14-.23,.19s-.21,.06-.35,.06c-.2,0-.35-.05-.47-.14-.12-.09-.18-.22-.18-.37s.06-.28,.17-.37c.11-.09,.29-.14,.54-.14h.5v-.06c0-.14-.04-.24-.12-.31-.08-.07-.2-.11-.35-.11-.1,0-.2,.02-.3,.05-.1,.03-.18,.08-.25,.14l-.13-.24c.09-.07,.2-.13,.32-.17,.13-.04,.26-.06,.4-.06,.24,0,.43,.06,.56,.18Zm-.32,1.28c.09-.05,.15-.13,.19-.23v-.24h-.49c-.27,0-.4,.09-.4,.27,0,.09,.03,.16,.1,.21,.07,.05,.16,.08,.28,.08s.23-.03,.31-.08Z"/>
                            <path class="cls-1" d="M221.25,234.42v2.45h-.3v-.28c-.07,.1-.16,.17-.27,.22-.11,.05-.23,.08-.36,.08-.17,0-.32-.04-.46-.11-.13-.07-.24-.18-.32-.32-.08-.14-.11-.29-.11-.47s.04-.33,.11-.47c.08-.13,.18-.24,.32-.31,.13-.07,.29-.11,.46-.11,.13,0,.24,.02,.35,.07,.11,.05,.19,.12,.26,.21v-.96h.32Zm-.6,2.12c.09-.05,.16-.12,.21-.22,.05-.09,.08-.2,.08-.32s-.03-.23-.08-.32c-.05-.09-.12-.17-.21-.22s-.19-.08-.3-.08-.21,.03-.3,.08c-.09,.05-.16,.12-.21,.22-.05,.09-.08,.2-.08,.32s.03,.23,.08,.32c.05,.09,.12,.17,.21,.22,.09,.05,.19,.08,.3,.08s.21-.03,.3-.08Z"/>
                            <path class="cls-1" d="M222.14,236.78c-.14-.08-.25-.18-.33-.32-.08-.14-.12-.29-.12-.46s.04-.33,.12-.46c.08-.14,.19-.24,.33-.32,.14-.08,.3-.11,.47-.11s.33,.04,.47,.11c.14,.08,.25,.18,.32,.32,.08,.14,.12,.29,.12,.46s-.04,.33-.12,.46c-.08,.14-.19,.24-.32,.32-.14,.08-.29,.12-.47,.12s-.33-.04-.47-.12Zm.77-.24c.09-.05,.16-.12,.21-.22,.05-.09,.08-.2,.08-.32s-.03-.23-.08-.32c-.05-.09-.12-.17-.21-.22-.09-.05-.19-.08-.3-.08s-.21,.03-.3,.08c-.09,.05-.16,.12-.21,.22-.05,.09-.08,.2-.08,.32s.03,.23,.08,.32c.05,.09,.12,.17,.21,.22,.09,.05,.19,.08,.3,.08s.21-.03,.3-.08Z"/>
                            <path class="cls-1" d="M226.5,234.78c.17,.14,.26,.34,.26,.59s-.09,.45-.26,.59c-.17,.14-.41,.21-.71,.21h-.57v.7h-.33v-2.31h.9c.3,0,.54,.07,.71,.21Zm-.24,.98c.11-.09,.17-.22,.17-.38s-.06-.3-.17-.38c-.11-.09-.27-.13-.48-.13h-.56v1.04h.56c.21,0,.37-.04,.48-.13Z"/>
                            <path class="cls-1" d="M227.47,236.78c-.14-.08-.25-.18-.33-.32-.08-.14-.12-.29-.12-.46s.04-.33,.12-.46c.08-.14,.19-.24,.33-.32,.14-.08,.3-.11,.47-.11s.33,.04,.47,.11c.14,.08,.25,.18,.32,.32,.08,.14,.12,.29,.12,.46s-.04,.33-.12,.46c-.08,.14-.19,.24-.32,.32-.14,.08-.29,.12-.47,.12s-.33-.04-.47-.12Zm.77-.24c.09-.05,.16-.12,.21-.22,.05-.09,.08-.2,.08-.32s-.03-.23-.08-.32c-.05-.09-.12-.17-.21-.22-.09-.05-.19-.08-.3-.08s-.21,.03-.3,.08c-.09,.05-.16,.12-.21,.22-.05,.09-.08,.2-.08,.32s.03,.23,.08,.32c.05,.09,.12,.17,.21,.22,.09,.05,.19,.08,.3,.08s.21-.03,.3-.08Z"/>
                            <path class="cls-1" d="M229.83,235.19c.11-.05,.24-.08,.39-.08v.31s-.04,0-.07,0c-.17,0-.31,.05-.4,.15-.1,.1-.15,.25-.15,.44v.87h-.32v-1.75h.3v.29c.06-.1,.14-.18,.24-.23Z"/>
                        </g>
                        <g id="Imagotipo">
                            <g>
                            <path class="cls-1" d="M234.71,236.09l-.31,.31c.12,.26,.38,.44,.68,.44h0c.41,0,.76-.25,.76-.66,0,0,.03-.48-.46-.58-.28-.06-.4-.16-.45-.22-.04-.05-.05-.11-.02-.17,.02-.05,.07-.09,.17-.09,.28,0,.36,.26,.36,.26l.32-.32c-.12-.25-.38-.43-.67-.43h0c-.41,0-.68,.31-.68,.72,0,0,0,.34,.4,.54,.03,.01,.06,.02,.08,.03,.06,.02,.16,.05,.16,.05,.03,0,.27,.06,.28,.2,0,.12-.07,.21-.26,.17-.13-.03-.35-.24-.35-.24Z"/>
                            <polygon class="cls-1" points="238.83 235.43 238.39 236.84 237.72 236.84 238.49 234.62 239.16 234.62 239.93 236.84 239.26 236.84 238.83 235.43"/>
                            <path class="cls-1" d="M237.36,236.12l.39,.39c-.2,.2-.48,.32-.78,.32-.61,0-1.11-.5-1.11-1.11s.5-1.11,1.11-1.11c.31,0,.58,.12,.78,.32l-.39,.39c-.1-.1-.24-.16-.39-.16-.31,0-.55,.25-.55,.55s.25,.55,.55,.55c.15,0,.29-.06,.39-.16Z"/>
                            <path class="cls-1" d="M240.52,236.01h0v.83h-.49v-2.22h.88c.44,0,.72,.3,.72,.69,0,.3-.17,.53-.44,.62l.45,.9h-.54l-.32-.67c-.05-.1-.14-.16-.25-.16Zm.29-.42c.2,0,.31-.11,.31-.27,0-.17-.11-.27-.31-.27h-.29v.54h.29Z"/>
                            <path class="cls-1" d="M243.78,234.84c-.14-.14-.32-.22-.53-.22-.42,0-.75,.34-.75,.75v.71c0,.42,.34,.75,.75,.75s.75-.34,.75-.75v-.71c0-.21-.08-.4-.22-.53Zm-.24,1.23c0,.19-.11,.34-.3,.34s-.3-.15-.3-.34v-.69c0-.19,.11-.34,.3-.34s.3,.16,.3,.34v.69Z"/>
                            <path class="cls-1" d="M245.45,235.07c-.18,.19-.63,.75-.7,1.76h-.53c.08-1.17,.66-1.77,.66-1.77h-.82v-.44h1.39v.45Z"/>
                            <path class="cls-1" d="M246.21,234.62h-.65v2.22h.65c.61,0,1.11-.5,1.11-1.11s-.5-1.11-1.11-1.11Zm.13,1.69h-.28v-1.19h.28c.26,0,.47,.26,.47,.59s-.21,.6-.47,.6Z"/>
                            </g>
                            <g>
                            <path class="cls-1" d="M233.27,234.62c-.61,0-1.11,.5-1.11,1.11s.5,1.11,1.11,1.11,1.11-.5,1.11-1.11-.5-1.11-1.11-1.11Zm0,1.66c-.31,0-.55-.25-.55-.55s.25-.55,.55-.55,.55,.25,.55,.55-.25,.55-.55,.55Z"/>
                            <path class="cls-1" d="M233.2,236.95c-.19,.14-.42,.23-.67,.23-.61,0-1.11-.5-1.11-1.11,0-.54,.38-.98,.89-1.09-.16,.21-.26,.47-.26,.75,0,.65,.51,1.18,1.15,1.22Z"/>
                            </g>
                            <g>
                            <path class="cls-1" d="M249.61,235.31h-.2c0-.16-.06-.28-.17-.36-.11-.08-.25-.13-.43-.13-.17,0-.3,.04-.4,.11-.09,.07-.14,.17-.14,.3,0,.05,0,.09,.02,.12,.01,.04,.03,.07,.06,.09,.03,.03,.06,.05,.08,.06,.03,.02,.07,.03,.12,.05,.06,.02,.1,.03,.14,.04,.03,0,.09,.02,.16,.04,.08,.02,.15,.03,.2,.05,.05,.01,.11,.03,.17,.05,.06,.02,.12,.04,.16,.06,.04,.02,.08,.05,.12,.08,.04,.03,.07,.06,.1,.1,.02,.04,.04,.08,.06,.13,.02,.05,.02,.1,.02,.16,0,.15-.04,.27-.12,.37-.08,.1-.18,.17-.3,.21-.12,.04-.25,.06-.39,.06-.27,0-.48-.07-.63-.2-.15-.13-.23-.31-.23-.54v-.02h.2c0,.2,.06,.34,.18,.44,.12,.1,.29,.15,.5,.15,.19,0,.33-.04,.44-.12,.11-.08,.16-.19,.16-.33s-.05-.23-.15-.29c-.1-.06-.29-.12-.58-.19-.09-.02-.16-.04-.2-.05-.04-.01-.1-.03-.17-.06-.07-.03-.13-.06-.16-.1-.04-.04-.07-.08-.1-.14-.03-.06-.04-.13-.04-.21,0-.18,.07-.32,.2-.43,.13-.11,.32-.16,.55-.16s.42,.06,.56,.17c.14,.11,.21,.28,.22,.49Z"/>
                            <path class="cls-1" d="M250.59,235.28v.15h-.32v.98c0,.05,0,.09,0,.11,0,.02,0,.05,.02,.08,.01,.03,.03,.05,.06,.06,.03,.01,.07,.02,.11,.02,.03,0,.07,0,.12,0v.16c-.06,0-.12,.01-.17,.01-.19,0-.29-.06-.32-.18-.01-.05-.02-.16-.02-.34v-.89h-.27v-.15h.27v-.47h.19v.47h.32Z"/>
                            <path class="cls-1" d="M252.12,235.28v1.55h-.18v-.29c-.11,.22-.3,.33-.55,.33-.17,0-.3-.05-.39-.14-.1-.1-.14-.24-.14-.42v-1.03h.19v.95c0,.16,.03,.28,.09,.36,.06,.08,.16,.12,.3,.12,.15,0,.27-.05,.36-.16,.09-.11,.13-.25,.13-.41v-.86h.19Z"/>
                            <path class="cls-1" d="M253.85,234.69v2.15h-.17v-.31c-.05,.11-.12,.2-.22,.26-.1,.06-.21,.09-.34,.09-.22,0-.39-.07-.51-.22-.13-.15-.19-.35-.19-.6s.06-.45,.19-.6c.13-.15,.29-.22,.51-.22,.27,0,.45,.11,.55,.34v-.89h.18Zm-.72,.71c-.16,0-.29,.06-.38,.18-.1,.12-.14,.28-.14,.48s.05,.37,.14,.49c.1,.12,.22,.18,.39,.18s.3-.06,.39-.18c.1-.12,.14-.28,.14-.49,0-.19-.05-.34-.14-.47-.09-.13-.22-.19-.4-.19Z"/>
                            <path class="cls-1" d="M254.41,234.68v.31h-.19v-.31h.19Zm0,.61v1.55h-.19v-1.55h.19Z"/>
                            <path class="cls-1" d="M255.44,235.24c.22,0,.4,.07,.53,.22,.13,.15,.2,.35,.2,.6s-.07,.45-.2,.6c-.13,.15-.31,.22-.53,.22s-.41-.07-.54-.22c-.13-.15-.2-.35-.2-.6s.07-.45,.2-.6c.13-.15,.31-.22,.54-.22Zm.39,.34c-.1-.12-.23-.18-.4-.18s-.3,.06-.4,.18c-.1,.12-.15,.28-.15,.48s.05,.37,.15,.49c.1,.12,.23,.18,.4,.18s.3-.06,.39-.18c.1-.12,.14-.28,.14-.48s-.05-.36-.15-.48Z"/>
                            <path class="cls-1" d="M257.57,235.74h-.18c-.02-.23-.16-.34-.42-.34-.11,0-.2,.02-.26,.07-.07,.05-.1,.11-.1,.19,0,.04,0,.07,.02,.1,.01,.03,.03,.05,.05,.07,.02,.02,.05,.03,.1,.05,.05,.02,.08,.03,.12,.04,.03,0,.09,.02,.16,.04,.07,.02,.12,.03,.16,.04,.04,.01,.09,.03,.15,.05,.06,.03,.11,.05,.14,.08,.03,.03,.06,.07,.09,.12,.03,.05,.04,.11,.04,.17,0,.14-.06,.26-.17,.35-.11,.09-.26,.13-.45,.13-.2,0-.35-.05-.47-.14-.11-.1-.17-.23-.17-.41h.18c0,.13,.04,.23,.12,.3,.08,.07,.19,.1,.34,.1,.13,0,.23-.03,.31-.08,.08-.06,.12-.13,.12-.22,0-.05-.01-.09-.04-.13-.03-.04-.06-.06-.1-.09-.04-.02-.08-.04-.13-.05-.04-.01-.09-.02-.13-.03-.01,0-.02,0-.03,0-.01,0-.05-.01-.1-.02-.05-.01-.09-.02-.11-.02-.02,0-.05-.01-.1-.03-.04-.01-.08-.03-.1-.04-.02-.01-.05-.03-.08-.05-.03-.02-.05-.05-.07-.07-.02-.03-.03-.05-.04-.09-.01-.03-.02-.07-.02-.11,0-.13,.05-.24,.15-.32,.1-.08,.24-.12,.42-.12s.32,.04,.43,.13c.11,.08,.16,.21,.16,.37Z"/>
                            </g>
                        </g>
                        </g>
                        <g>
                        <path class="cls-1" d="M208.45,223.5h-1.95v7.39h-3.76v-19.18h7.49c3.73,0,6.11,2.57,6.11,5.9,0,2.68-1.57,4.71-4.09,5.44l4.11,7.85h-4.17l-3.76-7.39Zm1.08-3.22c1.89,0,3-1.08,3-2.65s-1.11-2.68-3-2.68h-3.03v5.33h3.03Z"/>
                        <path class="cls-1" d="M220.68,210.97c1.24,0,2.22,1,2.22,2.25s-.97,2.19-2.22,2.19-2.22-1-2.22-2.19,1-2.25,2.22-2.25Zm-1.79,19.91v-13.31h3.6v13.31h-3.6Z"/>
                        <path class="cls-1" d="M230.48,216.11v1.46h3v3.08h-3v10.23h-3.63v-10.23h-2.22v-3.08h2.22v-1.52c0-3,1.89-4.95,4.84-4.95,.76,0,1.49,.14,1.79,.27v3.03c-.19-.05-.54-.14-1.14-.14-.81,0-1.87,.35-1.87,1.84Z"/>
                        <path class="cls-1" d="M238.65,223.23l3.27-.49c.76-.11,1-.49,1-.95,0-.95-.73-1.73-2.25-1.73s-2.44,1-2.54,2.16l-3.19-.68c.22-2.08,2.14-4.38,5.71-4.38,4.22,0,5.79,2.38,5.79,5.06v6.55c0,.7,.08,1.65,.16,2.11h-3.3c-.08-.35-.14-1.08-.14-1.6-.68,1.06-1.95,1.98-3.92,1.98-2.84,0-4.57-1.92-4.57-4,0-2.38,1.76-3.71,3.98-4.03Zm4.27,2.27v-.6l-3,.46c-.92,.14-1.65,.65-1.65,1.68,0,.78,.57,1.54,1.73,1.54,1.52,0,2.92-.73,2.92-3.08Z"/>
                        <path class="cls-1" d="M253.42,223.66v7.22h-3.73v-19.18h7.17c3.79,0,6.3,2.52,6.3,5.98s-2.52,5.98-6.3,5.98h-3.44Zm2.98-3.22c1.87,0,3-1.08,3-2.73s-1.14-2.76-3-2.76h-2.95v5.49h2.95Z"/>
                        <path class="cls-1" d="M273.31,221.14c-.41-.08-.76-.11-1.08-.11-1.84,0-3.44,.89-3.44,3.76v6.09h-3.6v-13.31h3.49v1.98c.81-1.76,2.65-2.08,3.79-2.08,.3,0,.57,.03,.84,.05v3.63Z"/>
                        <path class="cls-1" d="M288.4,224.23c0,4.09-3,7.06-6.98,7.06s-6.98-2.98-6.98-7.06,3-7.06,6.98-7.06,6.98,2.95,6.98,7.06Zm-3.6,0c0-2.52-1.62-3.79-3.38-3.79s-3.38,1.27-3.38,3.79,1.62,3.79,3.38,3.79,3.38-1.27,3.38-3.79Z"/>
                        </g>
                    </g>
                    </svg>
                <p style="margin-top: 20px; font-size: 1.2em;">Lo sentimos, la ruta que buscaste no existe.</p>
            </div>
        `;
    }
}


async function handleTicketFormSubmit(e) {
    e.preventDefault();

    const buyerName = document.getElementById('buyer-name').value;
    const buyerPhone = document.getElementById('buyer-phone').value;
    const status = document.getElementById('payment-status').value;

    const ticketNumber = document.getElementById('modal-ticket-number-form').textContent.replace('Boleto #', '');
    const raffleId = window.location.hash.slice(1).split('/')[2];
    
    if (!buyerName || !buyerPhone) {
        alert('El nombre y el celular son obligatorios.');
        return;
    }

    const dataToUpdate = { buyerName, buyerPhone, status };

    try {
        const ticketRef = db.collection('raffles').doc(raffleId).collection('tickets').doc(ticketNumber);
        await ticketRef.update(dataToUpdate);
        
        console.log(`Boleto #${ticketNumber} actualizado correctamente.`);
        
        closeAndResetModal();

    } catch (error) {
        console.error("Error al actualizar el boleto:", error);
        alert("Hubo un error al guardar los cambios.");
    }
}


async function handleClearTicket(ticketRef) {
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) {
        alert("Error: No se encontr� el boleto.");
        return;
    }
    const ticketData = ticketSnap.data();
    const isConfirmed = confirm(`�Est�s seguro de que quieres limpiar el boleto #${ticketData.number}? Se borrar�n los datos del comprador y quedar� disponible.`);
    if (!isConfirmed) return;

    try {
        await updateDoc(ticketRef, {
            buyerName: '',
            buyerPhone: '',
            status: 'available'
        });
        alert(" Boleto limpiado correctamente.");
        closeAndResetModal();
    } catch (error) {
        console.error("Error al limpiar el boleto:", error);
        alert("Hubo un error al limpiar el boleto.");
    }
}


async function handleShare(type, raffleId, ticketNumber) {
    try {
        // ?? Obtener datos de Firestore (modular)
        const raffleRef = doc(db, "raffles", raffleId);
        const ticketRef = doc(db, "raffles", raffleId, "tickets", ticketNumber);

        const [raffleSnap, ticketSnap] = await Promise.all([getDoc(raffleRef), getDoc(ticketRef)]);
        if (!raffleSnap.exists() || !ticketSnap.exists()) throw new Error("Datos no encontrados");

        const raffleData = raffleSnap.data();
        const ticketData = ticketSnap.data();

        // ?? Rellenar plantilla con los datos
        document.getElementById('template-prize').textContent = raffleData.prize || '';
        document.getElementById('template-buyer').textContent = ticketData.buyerName || '';
        document.getElementById('template-manager').textContent = raffleData.manager || '';
        document.getElementById('template-lottery').textContent = raffleData.lottery || '';
        document.getElementById('template-draw-date').textContent = raffleData.drawDate
            ? new Date(raffleData.drawDate).toLocaleDateString('es-CO')
            : '';
        document.getElementById('template-number').textContent = ticketData.number;

        // ?? M�todos de pago
        const paymentMethodsContainer = document.getElementById('template-payment-methods');
        let paymentHTML = '';
        (raffleData.paymentMethods || []).forEach(pm => {
            const methodDetails = paymentMethods.find(m => m.value === pm.method);
            if (methodDetails) {
                let detailsText = '';
                if (pm.method === 'nequi' || pm.method === 'daviplata') {
                    detailsText = `Celular: ${pm.phoneNumber}`;
                } else if (pm.method === 'bre-b') {
                    detailsText = `Llave: ${pm.key}`;
                } else if (pm.accountNumber) {
                    detailsText = `${pm.accountType?.charAt(0).toUpperCase() + pm.accountType?.slice(1)}: ${pm.accountNumber}`;
                } else {
                    detailsText = methodDetails.name;
                }

                const pngPath = methodDetails.icon
                    .replace('/banks/', '/banks/png-banks/')
                    .replace('.svg', '.png');

                paymentHTML += `
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <img src="${pngPath}" alt="${methodDetails.name}" 
                             style="height: 22px; margin-right: 10px;">
                        <span style="font-weight: 500;">${detailsText}</span>
                    </div>
                `;
            }
        });
        paymentMethodsContainer.innerHTML = paymentHTML;

        // ?? Generar imagen con html2canvas
        const templateElement = document.getElementById('ticket-template');
        const canvas = await html2canvas(templateElement, { useCORS: true, scale: 2 });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const fileName = `boleto-${ticketData.number}-${(raffleData.name || '').replace(/\s+/g, '-')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        const shareText = `??? Hola ${ticketData.buyerName || ''}! Aqu� est� tu boleto #${ticketData.number} para la rifa "${raffleData.name}". �Mucha suerte!`;

        // ?? Compartir
        if (type === 'whatsapp') {
            const imageUrl = URL.createObjectURL(blob);
            const viewContainer = document.getElementById('modal-view-container');
            viewContainer.innerHTML = `
                <div class="ticket-preview-wrapper">
                    <h4>? �Boleto listo para WhatsApp!</h4>
                    <a href="https://wa.me/?text=${encodeURIComponent(shareText)}" 
                       target="_blank" class="btn btn-whatsapp" 
                       style="margin-top:1rem;">Abrir WhatsApp</a>
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
        console.error("? Error al generar/compartir imagen:", error);
        alert("Hubo un error al procesar la imagen.");
    }
}

// --- MANEJO DE ESTADO DE AUTENTICACIÓN ---

onAuthStateChanged(async (user) => {
    console.log("?? Estado de autenticaci�n cambi�:", user);

    currentUser = user; // guardamos global

    if (user && user.uid) {
        updateUIForLoggedInUser(user);

        if (window.location.hash === '#/login' || window.location.hash === '') {
            console.log("?? Redirigiendo al Home...");
            window.location.hash = '/';
        }

        // ?? Solo ejecutamos router si el usuario ya tiene UID
        await router();
    } else {
        updateUIForLoggedOutUser();
        console.log("?? Usuario sali�, yendo a login...");

        // ?? Evitamos que router intente cargar rifas si no hay user
        if (window.location.hash !== '#/login') {
            window.location.hash = '/login';
        }

        appContainer.innerHTML = getAuthView(); // ?? solo renderizamos login
    }
});

// ?? Muy importante: ponlo aqu�, despu�s del listener



function updateUIForLoggedInUser(user) {
    const displayName = user.displayName || user.email;
    const photoURL = user.photoURL;

    // SVG por defecto
    const defaultAvatarSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>
    `;

    // Mostrar la navegaci�n y la app
    mainNav.style.display = 'flex';
    appContainer.style.display = 'block';

    userInfoContainer.innerHTML = `
        <div class="user-profile-info">
            ${
                photoURL
                    ? `<img src="${photoURL}" alt="Avatar" class="header-avatar">`
                    : `<div class="header-avatar">${defaultAvatarSVG}</div>`
            }
            <span>${displayName}</span>
        </div>
    `;
}


function updateUIForLoggedOutUser() {
    // Ocultar navegaci�n y limpiar user-info
    mainNav.style.display = 'none';
    userInfoContainer.innerHTML = '';

    // Renderizar la vista de login dentro de app-container
    appContainer.style.display = 'block';
    appContainer.innerHTML = getAuthView();
}

// --- MANEJO DE EVENTOS ---

function attachEventListeners(path) {
    const isRaffleDetail = path.startsWith('/raffle/');
    const isStatisticsDetail = path.startsWith('/statistics/');
    const isParticipantsList = path.startsWith('/participants/');
	const forgotPasswordLink = document.getElementById('forgot-password-link');
    // Normaliza texto (quita tildes y pasa a min�sculas)
    const normalize = str => (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // ---------------------- LOGIN ----------------------
	if (path === '/settings') {
        const editProfileBtn = document.getElementById('go-to-edit-profile');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                window.location.hash = '/edit-profile';
            });
        }
		
		const securityBtn = document.getElementById('go-to-security');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => {
                window.location.hash = '/security';
            });
        }
		
        // 2. Mantenemos la funci�n del bot�n de cerrar sesi�n
        const logoutBtn = document.getElementById('settings-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    logout();
                }
            });
        }
		
		const darkModeToggle = document.getElementById('dark-mode-toggle');
		if (darkModeToggle) {
			darkModeToggle.addEventListener('change', () => {
				// A�ade o quita la clase 'dark-mode' al body
				document.body.classList.toggle('dark-mode');

				// Guarda la preferencia en la memoria del navegador
				if (document.body.classList.contains('dark-mode')) {
					localStorage.setItem('darkMode', 'enabled');
				} else {
					localStorage.setItem('darkMode', 'disabled');
				}
			});
		}
    } else if (path === '/security') {
        
        // L�gica del Acorde�n
        const accordionHeader = document.querySelector('.accordion-header');
        if (accordionHeader) {
            accordionHeader.addEventListener('click', () => {
                accordionHeader.classList.toggle('active');
                const content = accordionHeader.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    content.style.padding = '0 1rem';
                } else {
                    content.style.maxHeight = content.scrollHeight + 32 + "px";
                    content.style.padding = '0 1rem 1rem 1rem';
                }
            });
        }

        // L�gica para enviar el correo de restablecer contrase�a
        const resetBtn = document.getElementById('send-reset-password-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const user = auth.currentUser;
                if (user && user.email) {
                    // **CORREGIDO**: Se llama a sendPasswordResetEmail directamente
                    sendPasswordResetEmail(user.email)
                        .then(() => { alert('�Correo de restablecimiento enviado!'); })
                        .catch((error) => { alert('Hubo un error: ' + error.message); });
                }
            });
        }

        // L�gica para guardar cambios de correo y celular
        const securityForm = document.getElementById('security-form');
        if (securityForm) {
            securityForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) return;

                const newEmail = document.getElementById('security-email').value;
                const newPhone = document.getElementById('security-phone').value;

                const updates = [];
                // Actualizar correo solo si ha cambiado
                if (newEmail !== user.email) {
                    updates.push(user.updateEmail(newEmail).then(() => {
                        return db.collection('users').doc(user.uid).update({ email: newEmail });
                    }));
                }
                // Actualizar siempre el tel�fono
                updates.push(db.collection('users').doc(user.uid).update({ phoneNumber: newPhone }));

                try {
                    await Promise.all(updates);
                    alert('�Cambios guardados con �xito!');
                } catch (error) {
                    console.error("Error al guardar cambios:", error);
                    alert("Error: " + error.message + "\n\nEs posible que necesites volver a iniciar sesi�n para cambiar tu correo.");
                }
            });
        }
    } else if (path === '/edit-profile') {
		// --- L�gica para guardar el nombre ---
		const form = document.getElementById('edit-profile-form');
		if (form) {
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const saveButton = form.querySelector('button[type="submit"]');
				const newName = document.getElementById('profile-name').value;
				const user = auth.currentUser;

				if (!user || !newName.trim()) return;

				saveButton.textContent = 'Guardando...';
				saveButton.disabled = true;

				try {
					await updateProfile(user, { displayName: newName });
					await updateDoc(doc(db, 'users', user.uid), { name: newName });

					alert('�Perfil actualizado con �xito!');
					document.querySelector('#user-info span').textContent = newName;
					window.location.hash = '/settings';
				} catch (error) {
					console.error("Error al actualizar el perfil:", error);
					alert("Hubo un error al guardar los cambios.");
				} finally {
					saveButton.textContent = 'Guardar cambios';
					saveButton.disabled = false;
				}
			});
		}
		// --- L�gica para cambiar la foto de perfil ---
		const editAvatarBtn = document.getElementById('edit-avatar-button');
		const avatarUploadInput = document.getElementById('avatar-upload-input');
		const avatarImg = document.querySelector('.profile-avatar-img');
		const cropperModal = document.getElementById('cropper-modal');
		const cropperContainer = document.getElementById('cropper-container');
		const saveCropBtn = document.getElementById('save-crop-btn');
		const cancelCropBtn = document.getElementById('cancel-crop-btn');
		let croppieInstance = null;

		if (editAvatarBtn && avatarUploadInput) {
			editAvatarBtn.addEventListener('click', () => avatarUploadInput.click());

			avatarUploadInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (!file) return;

				const reader = new FileReader();
				reader.onload = (event) => {
					if (croppieInstance) croppieInstance.destroy();

					cropperModal.style.display = 'flex';
					croppieInstance = new Croppie(cropperContainer, {
						viewport: { width: 200, height: 200, type: 'circle' },
						boundary: { width: 250, height: 250 },
						enableExif: true
					});

					croppieInstance.bind({ url: event.target.result });
				};
				reader.readAsDataURL(file);
			});

			cancelCropBtn.addEventListener('click', () => {
				cropperModal.style.display = 'none';
				if (croppieInstance) {
					croppieInstance.destroy();
					croppieInstance = null;
				}
			});

			saveCropBtn.addEventListener('click', async () => {
				if (!croppieInstance) return;
				const blob = await croppieInstance.result({ type: 'blob', size: 'viewport', format: 'png' });

				const user = auth.currentUser;
				if (!user) return;

				saveCropBtn.textContent = 'Subiendo...';
				saveCropBtn.disabled = true;

				try {
					const fileRef = ref(storage, `avatars/${user.uid}/profile.png`);
					await uploadBytes(fileRef, blob);
					const photoURL = await getDownloadURL(fileRef);

					await updateProfile(user, { photoURL });
					await updateDoc(doc(db, 'users', user.uid), { photoURL });

					avatarImg.src = photoURL;
					cropperModal.style.display = 'none';
					if (croppieInstance) croppieInstance.destroy();

					alert('�Foto de perfil actualizada!');
				} catch (error) {
					console.error("Error al subir la foto:", error);
					alert("Hubo un error al actualizar la foto.");
				} finally {
					saveCropBtn.textContent = 'Guardar Foto';
					saveCropBtn.disabled = false;
				}
			});
		}
	}

		if (path === '/login') {
		const authForm = document.getElementById('auth-form');
		const googleLoginBtn = document.getElementById('google-login-btn');
		const toggleLink = document.getElementById('auth-toggle-link');
		const forgotPasswordLink = document.getElementById('forgot-password-link');

		// CORRECCI�N: Movemos la variable "isLogin" aqu� arriba (al "pasillo")
		// para que tanto el formulario como el enlace puedan verla y modificarla.
		let isLogin = true;

		// L�gica para el env�o del formulario (login o registro)
		if (authForm) {
			authForm.addEventListener('submit', e => {
				e.preventDefault();
				const email = document.getElementById('email').value;
				const password = document.getElementById('password').value;

				// Ahora este "if" funcionar� correctamente porque puede ver el interruptor
				if (isLogin) {
					loginUser(email, password)
					.then(() => router())
					.catch(err => alert(err.message));
				} else {
					registerUser(email, password).catch(err => alert(err.message));
				}
			});
		}

        async function loginWithGoogle() {
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || user.email,
                    email: user.email,
                    photoURL: user.photoURL || '',
                    provider: 'google'
                }, { merge: true });

                alert(`Bienvenido ${user.displayName || user.email}`);
                await router();
            } catch (error) {
                console.error('Error al iniciar sesión con Google:', error);
                alert('Hubo un error al iniciar sesión con Google.');
            }
        }

		// L�gica para el bot�n de Google
		if (googleLoginBtn) {
			googleLoginBtn.addEventListener('click', loginWithGoogle);
		}

		// L�gica para el enlace que cambia entre Login y Registro
		if (toggleLink) {
			const toggleAuthMode = e => {
				e.preventDefault();
				isLogin = !isLogin; // Este c�digo ahora cambia el interruptor que est� arriba

				// Actualizamos el texto de la pantalla
				document.getElementById('auth-title').innerText = isLogin ? 'Iniciar Sesi�n' : 'Crear una Cuenta';
				document.getElementById('auth-subtitle').innerText = isLogin ? '�Bienvenido de nuevo!' : 'Es r�pido y f�cil.';
				document.getElementById('auth-action-btn').innerText = isLogin ? 'Iniciar Sesi�n' : 'Crear Cuenta';

				// Ocultamos el enlace de "Olvid� contrase�a" en la pantalla de registro
				forgotPasswordLink.style.display = isLogin ? 'block' : 'none';

				document.getElementById('auth-toggle-text').innerHTML = isLogin 
					? '�No tienes cuenta? <a href="#" id="auth-toggle-link">Reg�strate</a>' 
					: '�Ya tienes cuenta? <a href="#" id="auth-toggle-link">Inicia Sesi�n</a>';

				// Volvemos a a�adir el listener al nuevo enlace que acabamos de crear
				document.getElementById('auth-toggle-link').addEventListener('click', toggleAuthMode);
			};
			toggleLink.addEventListener('click', toggleAuthMode);
		}

		// L�gica del enlace de "Olvidaste tu contrase�a"
		if (forgotPasswordLink) {
			forgotPasswordLink.addEventListener('click', (e) => {
				e.preventDefault();
				const email = prompt("Por favor, ingresa tu correo para enviarte el enlace de recuperaci�n:");
				if (email) {
					sendPasswordResetEmail(email)
						.then(() => {
							alert('�Correo de recuperaci�n enviado! Revisa tu bandeja de entrada.');
						})
						.catch((error) => {
							alert('Error: ' + error.message);
						});
				}
			});
		}
	} else if (path === '/create') {
        const createRaffleForm = document.getElementById('create-raffle-form');
        if (createRaffleForm) createRaffleForm.addEventListener('submit', handleCreateRaffle);

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

                if (nequiDetails) nequiDetails.style.display = selectedOptions.includes('nequi') ? 'block' : 'none';
                if (daviplataDetails) daviplataDetails.style.display = selectedOptions.includes('daviplata') ? 'block' : 'none';
                if (brebDetails) brebDetails.style.display = selectedOptions.includes('bre-b') ? 'block' : 'none';

                const selectedBanks = selectedOptions.filter(val => traditionalBanks.includes(val));
                if (bankDetailsWrapper) {
                    if (selectedBanks.length > 0) {
                        bankDetailsWrapper.style.display = 'block';
                        document.getElementById('bank-list').textContent = selectedBanks.join(', ');
                    } else {
                        bankDetailsWrapper.style.display = 'none';
                    }
                }
            });
        }

        const priceOptionsContainer = document.querySelector('.predefined-options');
        if (priceOptionsContainer) {
            priceOptionsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('price-option-btn')) {
                    const price = e.target.dataset.price;
                    document.getElementById('ticket-price').value = price;
                }
            });
        }

    // ---------------------- DETALLE DE RAFFLE ----------------------
    } else if (isRaffleDetail) {
        const ticketsGrid = document.getElementById('tickets-grid');
        const modal = document.getElementById('ticket-modal');
        const closeModalBtn = modal ? modal.querySelector('.close-modal') : null;

        if (ticketsGrid) {
			ticketsGrid.addEventListener('click', (e) => {
				if (e.target.classList.contains('ticket')) {
					const raffleId = window.location.hash.split('/')[2].split('?')[0];
					openTicketModal(raffleId, e.target.dataset.id);
				}
			});
		}

        if (modal && closeModalBtn) {
            closeModalBtn.addEventListener('click', () => closeAndResetModal());
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'ticket-modal') closeAndResetModal();
            });
        }

    // ---------------------- ESTAD�STICAS (detalle) ----------------------
    } else if (isStatisticsDetail) {
        const participantsBtn = document.getElementById('show-participants-list-btn');
        const participantsContainer = document.getElementById('participants-list-container');
        const statCards = document.querySelectorAll('.stat-card.clickable');

        if (participantsBtn && participantsContainer) {
            participantsBtn.addEventListener('click', () => {
                const isHidden = participantsContainer.style.display === 'none';
                participantsContainer.style.display = isHidden ? 'block' : 'none';
                participantsBtn.textContent = isHidden ? 'Ocultar Lista' : 'Ver Lista de Participantes';
            });
        }

        statCards.forEach(card => {
            card.addEventListener('click', () => {
                if (participantsContainer && participantsBtn) {
                    const status = card.dataset.status;
                    participantsContainer.style.display = 'block';
                    participantsBtn.textContent = 'Ocultar Lista';
                    const filterEl = document.getElementById('status-filter');
                    if (filterEl) filterEl.value = status;
                }
            });
        });

    // ---------------------- PARTICIPANTES (listeners y filtros) ----------------------
    } else if (isParticipantsList) {
        // Click sobre tarjeta -> ir al detalle de la rifa y abrir ticket
        // document.querySelectorAll('.participant-card').forEach(card => {
        //   card.addEventListener('click', () => {
        //       const ticketNumber = card.dataset.ticket;
        //       const raffleId = card.dataset.raffle;
        //       window.location.hash = `/raffle/${raffleId}?ticket=${ticketNumber}`;
        //   });
        // });

        // Filtro robusto: busca por nombre, tel�fono, n�mero de boleto y filtra por estado
        const searchInput = document.getElementById('search-participant');
        const statusFilter = document.getElementById('status-filter');

        if (searchInput && statusFilter) {
            const applyFilter = () => {
                const q = normalize(searchInput.value.trim());
                const selected = (statusFilter.value || 'all').toString().toLowerCase();

                document.querySelectorAll('.participant-card').forEach(card => {
                    const ticketNum = normalize(card.dataset.ticket || '');
                    const fullText = normalize(card.textContent || '');

                    // extraer estado desde la span.status-badge (clase status-paid / status-partial / etc.)
                    let statusKey = '';
                    const statusSpan = card.querySelector('.status-badge');
                    if (statusSpan) {
                        const statusClass = Array.from(statusSpan.classList).find(c => c.startsWith('status-') && c !== 'status-badge');
                        if (statusClass) statusKey = statusClass.replace('status-', '').toLowerCase();
                        else statusKey = normalize(statusSpan.textContent);
                    }

                    const matchesSearch = !q || fullText.includes(q) || ticketNum.includes(q);
                    const matchesStatus = (selected === 'all') || (statusKey === selected);

                    card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
                });
            };

            searchInput.addEventListener('input', applyFilter);
            statusFilter.addEventListener('change', applyFilter);

            // aplicar filtro inicial por si viene con valor
            applyFilter();
        }

    // ---------------------- EXPLORAR ----------------------
    } else if (path === '/explore') {
        const rafflesList = document.getElementById('raffles-list');
        if (rafflesList) {
            rafflesList.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.btn-delete-raffle');
                const collaborateButton = e.target.closest('.btn-collaborate');

                if (deleteButton) {
					const card = deleteButton.closest('.raffle-card');
					if (card) handleDeleteRaffle(card.dataset.id, card);
				}


                if (collaborateButton) {
                    const card = collaborateButton.closest('.raffle-card');
                    if (card) openCollaboratorModal(card.dataset.id);
                }
            });
        }
    } else if (path === '/collaborators') {
        const backBtn = document.getElementById('back-to-home');
        const searchInput = document.getElementById('collaborator-search');
        const listContainer = document.getElementById('collaborators-list-container');
        const user = auth.currentUser;

        if (!user || !listContainer) return;

        // Botón de volver al inicio
        if (backBtn) backBtn.addEventListener('click', () => (window.location.hash = '/home'));

        // Mostrar mensaje de carga
        listContainer.innerHTML = `<p class="loading-text">Cargando colaboradores...</p>`;

        try {
            const rafflesRef = collection(db, 'raffles');
            const q = query(rafflesRef, where('ownerId', '==', user.uid));

            // Escuchar cambios en las rifas del usuario actual
            onSnapshot(q, async (snapshot) => {
                const raffles = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));

                // Mapeo de colaboradores → rifas en las que participan
                const collaboratorMap = {};

                for (const raffle of raffles) {
                    if (raffle.collaborators && Array.isArray(raffle.collaborators)) {
                        for (const colId of raffle.collaborators) {
                            if (!collaboratorMap[colId]) collaboratorMap[colId] = { raffles: [] };
                            collaboratorMap[colId].raffles.push({
                                id: raffle.id,
                                name: raffle.name || 'Rifa sin nombre'
                            });
                        }
                    }
                }

                const collaboratorsIds = Object.keys(collaboratorMap);

                if (collaboratorsIds.length === 0) {
                    listContainer.innerHTML = `<p style="text-align:center;color:#777;">No tienes colaboradores asignados.</p>`;
                    return;
                }

                // Obtener datos de cada colaborador
                const collaboratorData = await Promise.all(
                    collaboratorsIds.map(async (colId) => {
                        const colRef = doc(db, 'users', colId);
                        const colSnap = await getDoc(colRef);

                        let name = 'Desconocido';
                        let photoURL = null;

                        if (colSnap.exists()) {
                            const data = colSnap.data();
                            name = data.name || data.displayName || 'Sin nombre';
                            photoURL = data.photoURL || null;
                        }

                        // 🔹 Si Firestore no tiene el usuario, intentamos cargarlo desde Auth (como respaldo)
                        if (!photoURL || name === 'Desconocido') {
                            try {
                                const userRecord = await getDoc(doc(db, 'users', colId));
                                if (userRecord.exists()) {
                                    const data = userRecord.data();
                                    name = data.name || data.displayName || name;
                                    photoURL = data.photoURL || photoURL;
                                }
                            } catch (err) {
                                console.warn(`No se encontró info en Auth para ${colId}:`, err);
                            }
                        }

                        return {
                            id: colId,
                            name,
                            photoURL,
                            raffles: collaboratorMap[colId].raffles
                        };
                    })
                );

                // Construir HTML de la lista
                listContainer.innerHTML = collaboratorData.map(col => `
                    <div class="collaborator-card" data-id="${col.id}">
                        <div class="collaborator-header">
                            <div class="collaborator-info">
                                ${
                                    col.photoURL
                                        ? `<img src="${col.photoURL}" alt="${col.name}">`
                                        : `<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor"><path d="M218.87-260.67q63.04-44.05 126.49-67.31 63.45-23.26 134.79-23.26 71.34 0 134.98 23.45 63.64 23.44 128 67.12 42.52-55.53 59.64-107.92 17.12-52.39 17.12-111.41 0-144.62-97.62-242.26-97.62-97.63-242.23-97.63-144.61 0-242.27 97.63-97.66 97.64-97.66 242.26 0 59.24 17.51 111.45 17.5 52.22 61.25 107.88Zm260.98-179.24q-61.93 0-104.31-42.55-42.39-42.55-42.39-104.33t42.53-104.3q42.53-42.52 104.47-42.52 61.93 0 104.31 42.67 42.39 42.67 42.39 104.44 0 61.78-42.53 104.18-42.53 42.41-104.47 42.41Zm.48 377.11q-85.81 0-161.44-32.72-75.62-32.71-132.9-90.25-57.28-57.55-90.23-132.92-32.96-75.37-32.96-162.1 0-84.21 33.21-159.98 33.22-75.77 90.21-133.34 56.99-57.56 132.41-90.44 75.42-32.88 162.16-32.88 84.21 0 159.98 33.33t133.1 90.35q57.33 57.03 90.45 132.86 33.11 75.83 33.11 160.56 0 85.81-32.88 161.46-32.88 75.66-90.44 132.65-57.57 56.99-133.31 90.21Q565.06-62.8 480.33-62.8Zm-.33-77.31q53.24 0 103.54-14.64 50.31-14.64 102.31-54.4-51.59-35.21-103.1-52.75-51.51-17.53-102.75-17.53t-102.42 17.52q-51.19 17.52-102.19 53.06 51 39.07 101.19 53.9 50.18 14.84 103.42 14.84Zm0-371.85q32.49 0 53.65-21.02Q554.8-554 554.8-586.64t-21.15-53.78q-21.16-21.15-53.65-21.15-32.49 0-53.65 21.15-21.15 21.14-21.15 53.78t21.15 53.66q21.16 21.02 53.65 21.02Zm0-74.8Zm.24 376.61Z"/></svg>`
                                }
                                <span class="collaborator-name">${col.name}</span>
                            </div>
                            <button class="btn-toggle-accordion" title="Ver rifas del colaborador">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m480.76-320.98-266.3-266.54 79.02-78.78 187.28 187.28L668.28-666.3l79.02 78.78-266.54 266.54Z"/></svg>
                            </button>
                        </div>

                        <div class="collaborator-accordion">
                            ${col.raffles.map(r => `
                                <div class="raffle-item" data-raffle="${r.id}">
                                    <span class="raffle-name">${r.name}</span>
                                    <button class="btn-remove-collaborator" 
                                            data-raffle="${r.id}" 
                                            data-col="${col.id}" 
                                            title="Eliminar colaborador de esta rifa">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');

                // --- Acordeones ---
                document.querySelectorAll('.btn-toggle-accordion').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const card = btn.closest('.collaborator-card');
                        const accordion = card.querySelector('.collaborator-accordion');
                        accordion.classList.toggle('active');
                    });
                });

                // --- Eliminar colaborador de una rifa ---
                document.querySelectorAll('.btn-remove-collaborator').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const raffleId = btn.dataset.raffle;
                        const colId = btn.dataset.col;

                        if (!confirm('⚠️ ¿Deseas eliminar a este colaborador de esta rifa?')) return;

                        try {
                            const raffleRef = doc(db, 'raffles', raffleId);
                            await updateDoc(raffleRef, {
                                collaborators: arrayRemove(colId),
                                viewableBy: arrayRemove(colId)
                            });

                            btn.closest('.raffle-item').remove();
                            alert('Colaborador eliminado correctamente.');
                        } catch (error) {
                            console.error('Error al eliminar colaborador:', error);
                            alert('Hubo un error al eliminar al colaborador.');
                        }
                    });
                });
            });

            // --- Búsqueda por nombre o rifa ---
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase();
                    document.querySelectorAll('.collaborator-card').forEach(card => {
                        const name = card.querySelector('.collaborator-name').textContent.toLowerCase();
                        const raffles = [...card.querySelectorAll('.raffle-name')].map(r => r.textContent.toLowerCase());
                        const match = name.includes(query) || raffles.some(r => r.includes(query));
                        card.style.display = match ? '' : 'none';
                        if (raffles.some(r => r.includes(query))) {
                            card.querySelector('.collaborator-accordion').classList.add('active');
                        }
                    });
                });
            }

        } catch (err) {
            console.error('Error al cargar colaboradores:', err);
            listContainer.innerHTML = `<p style="text-align:center;color:red;">Error al cargar los colaboradores.</p>`;
        }
    }
}

async function openTicketModal(raffleId, ticketNumber) {
    console.log("Intentando abrir boleto:", ticketNumber, raffleId);
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;

    const modalTitleForm = document.getElementById('modal-ticket-number-form');
    const modalTitleInfo = document.getElementById('modal-ticket-number-info');
    const formView = document.getElementById('ticket-form');
    const infoView = document.getElementById('ticket-info-view');

    // ?? Validaci�n b�sica
    if (!raffleId || !ticketNumber) {
        console.warn("? Falta raffleId o ticketNumber en openTicketModal:", raffleId, ticketNumber);
        return;
    }

    try {
        // --- Intentar obtener el ticket directamente por ID ---
        const ticketRef = doc(db, "raffles", raffleId, "tickets", ticketNumber.toString());
        let ticketSnap = await getDoc(ticketRef);

        // --- Si no existe, buscar por campo "number" ---
        if (!ticketSnap.exists()) {
            console.warn("getDoc por ID fall�, buscando por campo 'number'...");
            const ticketsRef = collection(db, "raffles", raffleId, "tickets");
            const q = query(ticketsRef, where("number", "==", parseInt(ticketNumber)));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
                ticketSnap = querySnap.docs[0];
            } else {
                alert("?? No se encontr� el boleto.");
                return;
            }
        }

        const data = ticketSnap.data();

        // --- Llenar t�tulos ---
        modalTitleForm.textContent = `Boleto #${data.number}`;
        modalTitleInfo.textContent = `Boleto #${data.number}`;

        // --- Llenar el formulario ---
        formView.querySelector('#buyer-name').value = data.buyerName || '';
        formView.querySelector('#buyer-phone').value = data.buyerPhone || '';
        formView.querySelector('#payment-status').value = data.status || 'pending';

        // --- Llenar la vista de solo lectura ---
        const statusMap = {
            'pending': 'Pendiente',
            'partial': 'Pago Parcial',
            'paid': 'Pagado Total',
            'available': 'Disponible'
        };
        infoView.querySelector('#info-buyer-name').textContent = data.buyerName || 'Usa el bot�n "Editar Boleto"';
        infoView.querySelector('#info-buyer-phone').textContent = data.buyerPhone || 'Usa el bot�n "Editar Boleto"';
        infoView.querySelector('#info-payment-status').textContent = statusMap[data.status] || data.status;

        // --- Mostrar modal ---
        formView.style.display = 'none';
        infoView.style.display = 'block';
        modal.style.display = 'flex';

        // --- Botones ---
        const editBtn = document.getElementById('edit-ticket-btn-info');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const closeBtn = modal.querySelector('.close-modal');

        if (editBtn && cancelBtn) {
            editBtn.onclick = () => {
                infoView.style.display = 'none';
                formView.style.display = 'block';
                cancelBtn.style.display = 'inline-block';
            };

            cancelBtn.onclick = () => {
                formView.style.display = 'none';
                infoView.style.display = 'block';
                cancelBtn.style.display = 'none';
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // --- Botones de limpiar boleto ---
        const clearInfoBtn = document.getElementById('clear-ticket-btn-info');
        const clearFormBtn = document.getElementById('clear-ticket-btn-form');
        if (clearInfoBtn) clearInfoBtn.onclick = () => handleClearTicket(ticketRef);
        if (clearFormBtn) clearFormBtn.onclick = () => handleClearTicket(ticketRef);

        // --- Botones de compartir ---
        const whatsappInfo = document.getElementById('whatsapp-share-btn-info');
        const whatsappForm = document.getElementById('whatsapp-share-btn');
        const genericInfo = document.getElementById('generic-share-btn-info');
        const genericForm = document.getElementById('generic-share-btn');

        if (whatsappInfo) whatsappInfo.onclick = () => handleShare("whatsapp", raffleId, data.number);
        if (whatsappForm) whatsappForm.onclick = () => handleShare("whatsapp", raffleId, data.number);
        if (genericInfo) genericInfo.onclick = () => handleShare("generic", raffleId, data.number);
        if (genericForm) genericForm.onclick = () => handleShare("generic", raffleId, data.number);
		
		// --- GUARDAR CAMBIOS DEL FORMULARIO ---
        const form = document.getElementById('ticket-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault(); // ?? evita recargar la p�gina

                try {
                    const buyerName = form.querySelector('#buyer-name').value.trim();
                    const buyerPhone = form.querySelector('#buyer-phone').value.trim();
                    const status = form.querySelector('#payment-status').value;

                    await updateDoc(ticketRef, { buyerName, buyerPhone, status });

                    alert('? Boleto actualizado correctamente.');

                    // Refrescar vista
                    formView.style.display = 'none';
                    infoView.style.display = 'block';
                    infoView.querySelector('#info-buyer-name').textContent = buyerName;
                    infoView.querySelector('#info-buyer-phone').textContent = buyerPhone;
                    infoView.querySelector('#info-payment-status').textContent = statusMap[status] || status;
                } catch (error) {
                    console.error("? Error al guardar los cambios del boleto:", error);
                    alert("Hubo un error al guardar los cambios del boleto.");
                }
            }, { once: true }); // evita m�ltiples registros
        }
    } catch (error) {
        console.error("? Error al obtener datos del boleto:", error);
        alert("Hubo un error al obtener los datos del boleto.\n\n" + error.message);
    }
}


async function handleCreateRaffle(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        alert('Debes iniciar sesión para crear una rifa.');
        return;
    }

    const selectedOptions = document.querySelectorAll('.payment-option.selected');
    if (selectedOptions.length === 0) {
        alert('Por favor, selecciona al menos un m�todo de pago.');
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
                alert('La llave de Bre-B debe empezar con "@". Por favor, corr�gela.');
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
		collaborators: [],
		viewableBy: [user.uid],
        createdAt: serverTimestamp(),
    }

    try {
		// 1. Crear rifa
		const raffleRef = await addDoc(collection(db, "raffles"), raffle);

		// 2. Crear batch
		const batch = writeBatch(db);

		for (let i = 0; i < 100; i++) {
			const ticketNumber = i.toString().padStart(2, '0');
			const ticketRef = doc(db, "raffles", raffleRef.id, "tickets", ticketNumber);
			batch.set(ticketRef, {
				number: ticketNumber,
				status: "available",
				buyerName: null,
				buyerPhone: null,
			});
		}

		// 3. Confirmar batch
		await batch.commit();

		alert("�Rifa creada con �xito!");
		window.location.hash = `#/raffle/${raffleRef.id}`;
	} catch (error) {
		console.error("Error al crear la rifa:", error.code, error.message);
		alert(`Hubo un error al crear la rifa:\n\n${error.message}`);
	}
}

async function handleDeleteRaffle(raffleId, cardElement) {
    if (!confirm('?? �Seguro que quieres eliminar esta rifa completa? Esta acci�n no se puede deshacer.')) return;

    try {
        // ?? Referencia al documento principal de la rifa
        const raffleRef = doc(db, 'raffles', raffleId);

        // ?? Eliminamos todos los boletos dentro de la subcolecci�n "tickets"
        const ticketsRef = collection(db, 'raffles', raffleId, 'tickets');
        const ticketsSnap = await getDocs(ticketsRef);

        const deletePromises = ticketsSnap.docs.map(ticketDoc => deleteDoc(ticketDoc.ref));
        await Promise.all(deletePromises);

        // ??? Eliminamos el documento principal de la rifa
        await deleteDoc(raffleRef);

        // ?? Eliminamos visualmente la tarjeta del DOM
        if (cardElement) {
            cardElement.remove();
        }

        alert('✅ La rifa y todos sus boletos fueron eliminados correctamente.');
        console.log(`Rifa ${raffleId} eliminada completamente.`);
    } catch (error) {
        console.error("? Error al eliminar la rifa:", error);
        alert("Hubo un error al eliminar la rifa:\n" + error.message);
    }
}

function closeAndResetModal() {
    const modal = document.getElementById('ticket-modal');
    const formView = document.getElementById('ticket-form');
    const infoView = document.getElementById('ticket-info-view');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editBtnInfo = document.getElementById('edit-ticket-btn-info');

    if (modal) modal.style.display = 'none';

    // resetear estados
    if (formView) formView.style.display = 'none';
    if (infoView) infoView.style.display = 'block';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    if (editBtnInfo) editBtnInfo.style.display = 'inline-block';

    // limpiar inputs
    const buyerName = document.getElementById('buyer-name');
    const buyerPhone = document.getElementById('buyer-phone');
    const paymentStatus = document.getElementById('payment-status');
    if (buyerName) buyerName.value = '';
    if (buyerPhone) buyerPhone.value = '';
    if (paymentStatus) paymentStatus.value = 'pending';
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
        // 1. Obtener todos los boletos de la rifa (ordenados)
        const ticketsRef = collection(db, "raffles", raffleData.id, "tickets");
        const q = query(ticketsRef, orderBy("number"));
        const ticketsSnapshot = await getDocs(q);

        // 2. Generar HTML de tickets
        let ticketsHTML = '';
        ticketsSnapshot.forEach(docSnap => {
            const ticket = docSnap.data();
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

        // 3. Crear el lienzo din�mico
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

        // 4. T�tulo
        let titleHTML = '';
        if (settings.titleType === 'prize') {
            titleHTML = settings.prizePrefix.replace(
                '{premio}',
                `<span style="font-weight:800;">${raffleData.prize}</span>`
            );
        } else {
            titleHTML = raffleData.name;
        }

        // 5. M�todos de pago
        let paymentHTML = (raffleData.paymentMethods || []).map(pm => {
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

        // 6. Plantilla final (meto el bloque grande que ya ten�as pero usando las variables ticketsHTML y paymentHTML)
        statusTemplate.innerHTML = `
            <div style="flex:1;display:flex;flex-direction:column;">
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

                <div style="flex-grow:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
                    <h3 style="text-align:center;margin:0 0 40px 0;font-weight:600;font-size:2.5rem;color:white;">
                        N�meros disponibles!
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:15px;">
                        ${ticketsHTML}
                    </div>
                </div>

                <div style="padding:25px;background:rgba(255,255,255,0.15);border-radius:20px;text-align:left;color:white;">
                    <p style="margin:0 0 20px 0;font-size:1.8rem;text-align:center;color:white;">
                        <strong>Juega:</strong> ${new Date(raffleData.drawDate).toLocaleDateString('es-CO')} con Loter�a de ${raffleData.lottery}
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
                    <p style="font-size: 2rem; margin: 10px 0 5px 0; text-align: center;">
                        <strong>Precio del boleto:</strong> $${raffleData.ticketPrice.toLocaleString('es-CO')}
                    </p>
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

        // 7. Captura con html2canvas
        const canvas = await html2canvas(statusTemplate, { useCORS: true, scale: 1 });
        document.body.removeChild(statusTemplate);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `estado-rifa.png`, { type: 'image/png' });

        // 8. Compartir o descargar
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

function openCollaboratorModal(raffleId) {
    const modal = document.getElementById('collaborator-modal');
    if (!modal) return;

    const form = document.getElementById('collaborator-form');
    // CORRECCI�N: Se a�ade el punto "." antes de la clase
    const closeModalBtn = modal.querySelector('.close-collaborator-modal');

    form.querySelector('#collaborator-email').value = '';
    form.onsubmit = (e) => handleCollaboratorInvite(e, raffleId);
    
    // Le damos la funcionalidad al bot�n de cerrar
    if (closeModalBtn) {
        closeModalBtn.onclick = () => modal.style.display = 'none';
    }
    
    // MEJORA: Tambi�n cerramos el modal si se hace clic afuera, en el fondo oscuro
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'collaborator-modal') {
            modal.style.display = 'none';
        }
    });

    modal.style.display = 'flex';
}

async function handleCollaboratorInvite(e, raffleId) {
    e.preventDefault();
    const email = document.getElementById('collaborator-email').value.trim().toLowerCase();
    const currentUser = auth.currentUser;

    if (!email) {
        alert('Por favor, ingresa un correo electr�nico.');
        return;
    }

    try {
        // 1?? Buscar si existe un usuario con ese correo
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert('Error: No se encontr� ning�n usuario con ese correo en RifaPro.');
            return;
        }

        const collaboratorDoc = snapshot.docs[0];
        const collaboratorId = collaboratorDoc.id;
        const collaboratorData = collaboratorDoc.data();

        // 2?? Evita que el due�o se a�ada a s� mismo
        if (collaboratorId === currentUser.uid) {
            alert('No puedes a�adirte a ti mismo como colaborador.');
            return;
        }

        // 3?? Construir objeto con toda la informaci�n del colaborador
        const collaboratorInfo = {
            uid: collaboratorId,
            name: collaboratorData.displayName || collaboratorData.name || collaboratorData.email,
            email: collaboratorData.email,
            photoURL: collaboratorData.photoURL || null,
            addedAt: new Date().toISOString()
        };

        // 4?? Actualizar la rifa agregando el colaborador
        const raffleRef = doc(db, 'raffles', raffleId);
        await updateDoc(raffleRef, {
            collaborators: arrayUnion(collaboratorInfo),
            viewableBy: arrayUnion(collaboratorId)
        });

        alert(`✅ ¡${collaboratorInfo.name || email} ha sido a�adido como colaborador!`);
        document.getElementById('collaborator-modal').style.display = 'none';

    } catch (error) {
        console.error("Error al a�adir colaborador:", error);
        alert('Hubo un error al intentar a�adir al colaborador.');
    }
}


window.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById('edit-ticket-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            document.getElementById('ticket-info-view').style.display = 'none';
            document.getElementById('ticket-form').style.display = 'block';
        });
    }
});

async function loadParticipantsList(raffleId, filterStatus = "all", searchQuery = "") {
    const listContainer = document.getElementById("participants-list");
    if (!listContainer) return;

    listContainer.innerHTML = "<p>Cargando...</p>";

    try {
        const ticketsSnap = await db.collection("raffles").doc(raffleId).collection("tickets").get();

        let participants = [];
        ticketsSnap.forEach(doc => {
            const data = doc.data();
            if (!data.buyerName) return; // ignorar boletos vacíos

            participants.push({
                number: data.number,
                name: data.buyerName,
                phone: data.buyerPhone || "N/A",
                status: data.status || "pending"
            });
        });

        // Filtro por estado
        if (filterStatus !== "all") {
            participants = participants.filter(p => p.status === filterStatus);
        }

        // Filtro por búsqueda
        if (searchQuery) {
            const queryLower = searchQuery.toLowerCase();
            participants = participants.filter(p =>
                p.name.toLowerCase().includes(queryLower) ||
                String(p.number).includes(queryLower)
            );
        }

        // Render lista
        if (participants.length === 0) {
            listContainer.innerHTML = "<p>No se encontraron participantes.</p>";
        } else {
            listContainer.innerHTML = participants.map(p => `
                <div class="participant-item">
                    <strong>#${p.number}</strong> - ${p.name} (${p.phone}) 
                    <span class="status-tag ${p.status}">${p.status === "paid" ? "Pagado" : p.status === "partial" ? "Parcial" : "Pendiente"}</span>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Error cargando participantes:", err);
        listContainer.innerHTML = "<p>Error al cargar los participantes.</p>";
    }
}

function setupParticipantsEvents(raffleId) {
    const container = document.getElementById("participants-list-container");
    const searchInput = document.getElementById("participant-search");
    const filterSelect = document.getElementById("status-filter");

    // Botón "Ver Lista de Participantes"
    const showBtn = document.getElementById("show-participants-list-btn");
    if (showBtn) {
        showBtn.addEventListener("click", () => {
            container.style.display = "block";
            loadParticipantsList(raffleId);
        });
    }

    // Filtro de estado
    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            loadParticipantsList(raffleId, filterSelect.value, searchInput.value);
        });
    }

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            loadParticipantsList(raffleId, filterSelect.value, searchInput.value);
        });
    }

    // Botones de "Estado de los Boletos"
    const statusCards = document.querySelectorAll(".stat-card.clickable");
    statusCards.forEach(card => {
        card.addEventListener("click", () => {
            const status = card.getAttribute("data-status");
            container.style.display = "block";
            loadParticipantsList(raffleId, status);
            if (filterSelect) filterSelect.value = status;
        });
    });
}

function openStatisticsView(raffle) {
    const main = document.getElementById("main-content"); // o el contenedor principal que uses
    main.innerHTML = getStatisticsDetailView(raffle);
    setupStatisticsEvents(raffle); // aquí enganchamos los botones y filtros
}

function renderParticipantsList(tickets, container, status) {
    let filtered = tickets;
    if (status !== "all") {
        filtered = tickets.filter(t => t.status === status);
    }

    if (filtered.length === 0) {
        container.innerHTML = "<p>No hay participantes en este estado.</p>";
        return;
    }

    container.innerHTML = `
        <table class="participants-table">
            <thead>
                <tr>
                    <th>Boleto</th>
                    <th>Nombre</th>
                    <th>Tel�fono</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(t => `
                    <tr>
                        <td>${t.number}</td>
                        <td>${t.buyerName || 'N/A'}</td>
                        <td>${t.buyerPhone || 'N/A'}</td>
                        <td>${t.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function fixOldRaffles() {
  const snapshot = await db.collection("raffles").get();
  snapshot.forEach(async (doc) => {
    const data = doc.data();
    let updateData = {};
    
    if (!data.viewableBy) {
      updateData.viewableBy = [data.ownerId || ""];  
    }
    if (!data.createdAt) {
      updateData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    if (Object.keys(updateData).length > 0) {
      await doc.ref.update(updateData);
      console.log(`?? Rifa actualizada: ${doc.id}`);
    }
  });
}

			
// --- INICIALIZACIÓN ---
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
