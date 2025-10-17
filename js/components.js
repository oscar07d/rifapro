// js/components.js

// LISTA CENTRAL DE MÃ‰TODOS DE PAGO
export const paymentMethods = [
    { name: 'Efectivo', value: 'efectivo', icon: 'assets/banks/efectivo.svg' },
    { name: 'Nequi', value: 'nequi', icon: 'assets/banks/nequi.svg' },
    { name: 'Bre-B', value: 'bre-b', icon: 'assets/banks/bre-b.svg' }, // <-- AÃ‘ADIDO DE VUELTA
    { name: 'Daviplata', value: 'daviplata', icon: 'assets/banks/daviplata.svg' },
    { name: 'Nu', value: 'nu', icon: 'assets/banks/nu.svg' },
    { name: 'Bancolombia', value: 'bancolombia', icon: 'assets/banks/bancolombia.svg' },
    { name: 'AV Villas', value: 'av-villas', icon: 'assets/banks/av-villas.svg' },
    { name: 'BBVA', value: 'bbva', icon: 'assets/banks/bbva.svg' },
    { name: 'BogotÃ¡', value: 'bogota', icon: 'assets/banks/bogota.svg' },
    { name: 'Caja Social', value: 'caja-social', icon: 'assets/banks/caja-social.svg' },
    { name: 'Davivienda', value: 'davivienda', icon: 'assets/banks/davivienda.svg' }, // <-- CORREGIDO
    { name: 'Falabella', value: 'falabella', icon: 'assets/banks/falabella.svg' },
    { name: 'Finandina', value: 'finandina', icon: 'assets/banks/finandina.svg' },
    { name: 'ItaÃº', value: 'itau', icon: 'assets/banks/itau.svg' },
    { name: 'Lulo Bank', value: 'lulo', icon: 'assets/banks/lulo.svg' },
    { name: 'Movii', value: 'movii', icon: 'assets/banks/movii.svg' },
    { name: 'Pibank', value: 'pibank', icon: 'assets/banks/pibank.svg' },
    { name: 'Powwi', value: 'powwi', icon: 'assets/banks/powwi.svg' },
    { name: 'UalÃ¡', value: 'uala', icon: 'assets/banks/uala.svg' }
];

// Vista para el inicio de sesiÃ³n y registro
export const getAuthView = () => `
    <div class="login-wrapper">
        <div class="login-branding-panel">
            <img src="assets/logo_rifapro_b.svg" alt="RifaPro Logo">
            <h1>Gestiona tus rifas de forma fÃ¡cil y profesional.</h1>
            <p>Controla tus boletos, pagos y estadÃ­sticas en un solo lugar.</p>
        </div>

        <div class="auth-container">
            <div class="auth-header">
                <h2 id="auth-title">Iniciar SesiÃ³n</h2>
                <p id="auth-subtitle">Â¡Bienvenido de nuevo!</p>
            </div>

            <form id="auth-form">
                <div class="form-group">
                    <label for="email">Correo ElectrÃ³nico</label>
                    <input type="email" id="email" required placeholder="tu@correo.com">
                </div>
                <div class="form-group">
                    <label for="password">ContraseÃ±a</label>
                    <input type="password" id="password" required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢">
                </div>
                <a href="#" id="forgot-password-link" class="forgot-password">Â¿Olvidaste tu contraseÃ±a?</a>
                <button type="submit" id="auth-action-btn" class="btn btn-primary">Iniciar SesiÃ³n</button>
            </form>
            
            <div class="separator">
                <span>o</span>
            </div>
            
            <button id="google-login-btn" class="btn btn-google">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 174.29 174.29" width="20px" height="20px">
                    <path style="fill:#ea4335;" d="M87.14,34.49c12.85,0,24.36,4.43,33.44,13.07l24.87-24.87C130.35,8.64,110.64,0,87.14,0,53.08,0,23.64,19.53,9.3,48l28.98,22.48c6.86-20.66,26.14-35.98,48.87-35.98Z"/>
                    <path style="fill:#4285f4;" d="M170.58,89.14c0-5.7-.54-11.22-1.38-16.52H87.14v32.75h46.98c-2.11,10.75-8.21,19.9-17.36,26.07l28.07,21.79c16.38-15.18,25.74-37.62,25.74-64.09Z"/>
                    <path style="fill:#fbbc05;" d="M38.23,103.81c-1.74-5.26-2.76-10.86-2.76-16.67s.98-11.4,2.76-16.67L9.26,48C3.34,59.77,0,73.05,0,87.14s3.34,27.38,9.3,39.14c0,0,28.94-22.48,28.94-22.48Z"/>
                    <path style="fill:#34a853;" d="M87.14,174.29c23.53,0,43.32-7.73,57.7-21.1l-28.07-21.79c-7.81,5.26-17.86,8.35-29.63,8.35-22.73,0-42.01-15.32-48.91-35.98l-28.98,22.48c14.38,28.5,43.83,48.04,77.88,48.04Z"/>
                </svg>
                <span>Iniciar con Google</span>
            </button>

            <p id="auth-toggle-text" class="auth-toggle">Â¿No tienes cuenta? <a href="#" id="auth-toggle-link">RegÃ­strate</a></p>
			<p class="auth-note">
			  ðŸ’¡ Solo necesitas hacer clic una vez en â€œRegÃ­strateâ€ para activar los campos de usuario, contraseÃ±a y el inicio con Google.  
			  No es necesario volver a hacerlo, a menos que borres tus cookies o datos de navegaciÃ³n (Ctrl + Shift + R en Windows/Linux, âŒ˜ + Shift + R en Mac o desde tu celular limpiando los datos del navegador).
			</p>
        </div>
    </div>
`;

// Vista del panel principal (Home)
export const getHomeView = (userName) => `
    <div class="home-container">
        <h2>¡Bienvenido, ${userName}!</h2>
        <p>¿Qué te gustaría hacer hoy?</p>
        <div class="home-buttons">
            <a href="#/create" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="m368-320 112-84 110 84-42-136 112-88H524l-44-136-44 136H300l110 88-42 136ZM160-160q-33 0-56.5-23.5T80-240v-135q0-11 7-19t18-10q24-8 39.5-29t15.5-47q0-26-15.5-47T105-556q-11-2-18-10t-7-19v-135q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v135q0 11-7 19t-18 10q-24 8-39.5 29T800-480q0 26 15.5 47t39.5 29q11 2 18 10t7 19v135q0 33-23.5 56.5T800-160H160Zm0-80h640v-102q-37-22-58.5-58.5T720-480q0-43 21.5-79.5T800-618v-102H160v102q37 22 58.5 58.5T240-480q0 43-21.5 79.5T160-342v102Zm320-240Z"/>
                </svg>
                <span>Crear Rifa</span>
            </a>

            <a href="#/explore" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="m363-310 117-71 117 71-31-133 104-90-137-11-53-126-53 126-137 11 104 90-31 133ZM480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z"/>
                </svg>
                <span>Administrar Rifas</span>
            </a>

            <a href="#/statistics" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80H200Zm40-120v-360h160v360H240Zm200 0v-560h160v560H440Zm200 0v-200h160v200H640Z"/>
                </svg>
                <span>Estadísticas</span>
            </a>

			<!-- 🔹 Nuevo botón para gestionar colaboradores -->
            <a href="#/collaborators" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="currentColor"><path d="M-3.19-236.81v-59.59q0-41.57 43.29-67.51 43.29-25.94 113.48-25.94 10.93 0 20.74.38 9.82.38 19.54 1.83-10.56 19.36-15.82 39.85-5.27 20.49-5.27 42.76v68.22H-3.19Zm240 0V-305q0-32.72 17.62-59.89 17.62-27.18 50.18-47.5t77.54-30.56q44.99-10.24 97.8-10.24 53.83 0 98.7 10.24 44.87 10.24 77.5 30.56 32.56 20.32 49.8 47.5 17.24 27.17 17.24 59.89v68.19H236.81Zm550.36 0v-68.26q0-22.96-4.85-43.32-4.86-20.35-14.93-39.2 9.73-1.5 19.44-1.88 9.71-.38 19.84-.38 70.56 0 113.54 25.54 42.98 25.55 42.98 67.98v59.52H787.17Zm-473.02-72.01h332.03v-4q-5.48-29.98-52.2-49.29-46.73-19.31-113.94-19.31-67.21 0-113.98 19.39-46.76 19.39-51.91 49.88v3.33ZM153.09-422.39q-30.89 0-52.95-22.13-22.05-22.14-22.05-53.22 0-31.52 22.1-53.41 22.1-21.89 53.13-21.89 31.48 0 53.45 21.88 21.97 21.89 21.97 53.66 0 30.83-21.92 52.97t-53.73 22.14Zm653.33 0q-30.88 0-52.94-22.13-22.06-22.14-22.06-53.22 0-31.52 22.1-53.41 22.1-21.89 53.14-21.89 31.47 0 53.44 21.88 21.97 21.89 21.97 53.66 0 30.83-21.91 52.97-21.92 22.14-53.74 22.14Zm-326.34-60.56q-51.36 0-87.32-35.95-35.95-35.95-35.95-87.32 0-52.19 35.95-87.65 35.96-35.46 87.32-35.46 52.2 0 87.65 35.46 35.46 35.46 35.46 87.65 0 51.37-35.46 87.32-35.45 35.95-87.65 35.95Zm.27-71.93q21.69 0 36.38-14.9 14.69-14.9 14.69-36.73t-14.82-36.44q-14.81-14.61-36.37-14.61-21.69 0-36.59 14.71-14.9 14.71-14.9 36.45 0 21.56 14.8 36.54t36.81 14.98Zm-.02 246.06ZM480-606.14Z"/></svg>
                <span>Colaboradores</span>
            </a>

            <a href="#/settings" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
                </svg>
                <span>Configuración</span>
            </a>
        </div>
    </div>
`;


export const getStatisticsListView = (rafflesHTML) => `
    <div class="statistics-container">
        ${getPageHeader('EstadÃ­sticas de Rifas')}
        <p>Selecciona una rifa para ver sus detalles y estadÃ­sticas.</p>
        ${rafflesHTML}
    </div>
`;

// Vista para crear una nueva rifa
export const getCreateRaffleView = () => {
    const paymentOptionsHTML = paymentMethods.map(method => `
        <div class="payment-option" data-value="${method.value}">
            <img src="${method.icon}" alt="${method.name}">
            <span>${method.name}</span>
        </div>
    `).join('');

    return `
    <div class="form-container">
        ${getPageHeader('Crear Nueva Rifa')}
        <form id="create-raffle-form">
            
            <div class="form-group">
                <label for="raffle-name">Nombre de la rifa</label>
                <input type="text" id="raffle-name" required>
            </div>
            <div class="form-group">
                <label for="raffle-prize">Premio(s)</label>
                <input type="text" id="raffle-prize" required>
            </div>

            <div class="form-group">
                <label for="raffle-manager">Responsable de la Rifa</label>
                <input type="text" id="raffle-manager" placeholder="Ej: Tu nombre o el de tu organizaciÃ³n" required>
            </div>
            
            <div class="form-group">
                <label for="raffle-lottery">Juega con la loterÃ­a de</label>
                <input type="text" id="raffle-lottery" placeholder="Ej: LoterÃ­a de BogotÃ¡" required>
            </div>

            <div class="form-group">
                <label for="ticket-price">Precio por boleto</label>
                <input type="number" id="ticket-price" required min="0" placeholder="Ej: 20000 (sin puntos ni comas)">
                
                <div class="predefined-options">
                    <span>O escoge un valor:</span>
                    <button type="button" class="price-option-btn" data-price="5000">5.000</button>
                    <button type="button" class="price-option-btn" data-price="10000">10.000</button>
                    <button type="button" class="price-option-btn" data-price="20000">20.000</button>
                    <button type="button" class="price-option-btn" data-price="30000">30.000</button>
                </div>
            </div>
            <div class="form-group">
                <label for="payment-deadline">Fecha lÃ­mite de pago</label>
                <input type="date" id="payment-deadline" required>
            </div>
            <div class="form-group">
                <label for="draw-date">Fecha del sorteo</label>
                <input type="date" id="draw-date" required>
            </div>
            
            <div class="form-group">
                <label>MÃ©todos de pago</label>
                <div class="payment-options-grid">
                    ${paymentOptionsHTML}
                </div>
            </div>

            <div id="payment-details-container">
                <div id="nequi-details" class="payment-details-wrapper" style="display: none;">
                    <h4>Detalles para Nequi</h4>
                    <div class="form-group">
                        <label for="nequi-phone-number">NÃºmero de Celular</label>
                        <input type="tel" id="nequi-phone-number" placeholder="Ej: 3001234567">
                    </div>
                </div>

                <div id="daviplata-details" class="payment-details-wrapper" style="display: none;">
                    <h4>Detalles para Daviplata</h4>
                    <div class="form-group">
                        <label for="daviplata-phone-number">NÃºmero de Celular</label>
                        <input type="tel" id="daviplata-phone-number" placeholder="Ej: 3001234567">
                    </div>
                </div>

                <div id="bre-b-details" class="payment-details-wrapper" style="display: none;">
                    <h4>Detalles para Bre-B</h4>
                    <div class="form-group">
                        <label for="bre-b-key">Tu llave (debe empezar con @)</label>
                        <input type="text" id="bre-b-key" placeholder="@tu-llave-unica">
                    </div>
                </div>

                <div id="bank-account-details" class="payment-details-wrapper" style="display: none;">
                    <h4>Detalles de Cuenta Bancaria</h4>
                    <p style="font-size: 0.9rem; color: #666; margin-top: -1rem; margin-bottom: 1rem;">Aplica para: <span id="bank-list"></span></p>
                    <div class="form-group">
                        <label for="bank-account-type">Tipo de Cuenta</label>
                        <select id="bank-account-type">
                            <option value="ahorros">Ahorros</option>
                            <option value="corriente">Corriente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bank-account-number">NÃºmero de Cuenta</label>
                        <input type="text" id="bank-account-number" placeholder="Ej: 1234567890">
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">Crear Rifa</button>
        </form>
    </div>
    `;
};

// Vista para la pÃ¡gina de "Explorar Rifas"
export const getExploreView = (rafflesHTML) => `
    <div class="explore-container">
		${getPageHeader('Administrar Mis Rifas')}
        <div id="raffles-list">
            ${rafflesHTML}
        </div>
    </div>
    ${getCollaboratorModal()} `;

// Genera el HTML para una sola tarjeta de rifa
export const getRaffleCard = (raffle, currentUser) => {
    const percentage = raffle.soldPercentage || 0;
    const raffleName = raffle.name || 'Rifa sin nombre';
    const prize = raffle.prize || 'No especificado';
    const ticketPrice = raffle.ticketPrice ? raffle.ticketPrice.toLocaleString('es-CO') : 'N/A';
    const drawDate = raffle.drawDate ? new Date(raffle.drawDate).toLocaleDateString('es-CO') : 'No definida';

    const paymentIconsHTML = (raffle.paymentMethods || []).map(methodObject => {
        const method = paymentMethods.find(p => p.value === methodObject.method);
        return method ? `<img src="${method.icon}" alt="${method.name}" title="${method.name}">` : '';
    }).join('');

    const isOwner = currentUser && raffle.ownerId === currentUser.uid;

    // 🧩 Mostrar avatar del colaborador si existe
    let collaboratorAvatarHTML = '';
    if (raffle.collaborators && raffle.collaborators.length > 0) {
        const collaborator = raffle.collaborators[0]; // toma el primer colaborador
        const name = collaborator.name || 'Colaborador';
        const photoURL = collaborator.photoURL || '';

        collaboratorAvatarHTML = `
            <div class="raffle-collaborator-avatar" title="${name}">
                ${
                    photoURL
                        ? `<img src="${photoURL}" alt="${name}" />`
                        : `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Z"/>
                           </svg>`
                }
            </div>`;
    }

    return `
    <div class="raffle-card" data-id="${raffle.id}">
        ${collaboratorAvatarHTML}
        <div class="raffle-card-content">
            <h3>${raffleName}</h3>
            <p class="info-row"><strong>Premio:</strong> ${prize}</p>
            
            <div class="progress-bar-container">
                <div class="progress-bar-label">
                    <span>${percentage}% vendido</span>
                    <span>100%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                </div>
            </div>

            <p class="info-row"><strong>Precio:</strong> $${ticketPrice} | <strong>Sorteo:</strong> ${drawDate}</p>
            
            <div class="payment-icons-list">
                ${paymentIconsHTML}
            </div>

            <div class="raffle-card-actions">
                <button type="button" class="btn-icon btn-collaborate" title="Añadir Colaborador">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M502.39-486.54q31.15-33.92 47.37-76.95t16.22-88.83q0-45.79-16.7-89.18-16.69-43.39-47.37-76.35 63.83 9.91 103.95 57.43 40.12 47.51 40.12 108.22 0 61.68-40.36 108.95t-103.23 56.71ZM725.98-147.8v-127.18q0-39.35-15.76-73.04-15.76-33.7-43.2-60.13 55.55 16.8 99.16 48.17 43.62 31.37 43.62 85v127.18h-83.82Zm83.11-298.18v-80.72h-80.72v-80h80.72v-80.71h80v80.71h80.71v80h-80.71v80.72h-80Zm-491-38.09q-69.59 0-118.86-49.27-49.27-49.27-49.27-118.86 0-69.58 49.27-118.74 49.27-49.15 118.86-49.15 69.58 0 118.74 49.15 49.15 49.16 49.15 118.74 0 69.59-49.15 118.86-49.16 49.27-118.74 49.27ZM-10.04-147.8v-120.61q0-36.24 18.57-66.61 18.58-30.37 49.73-46.33 62.96-31.24 128.03-46.98 65.08-15.74 131.8-15.74 67.43 0 132.39 15.62 64.95 15.62 127.19 46.86 31.16 15.96 49.73 46.25 18.58 30.3 18.58 66.91v120.63H-10.04Z"/>
                    </svg>
                </button>

                <a href="#/raffle/${raffle.id}" class="btn btn-secondary">Administrar</a>
                
                ${isOwner ? `
                <button type="button" class="btn-icon btn-delete-raffle" title="Eliminar Rifa">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                    </svg>
                </button>` : ''}
            </div>
        </div>
    </div>`;
};

export const getRaffleDetailView = (raffle) => {
    const paymentIconsHTML = raffle.paymentMethods.map(methodObject => {
        const method = paymentMethods.find(p => p.value === methodObject.method);
        return method ? `<img src="${method.icon}" alt="${method.name}" title="${method.name}">` : '';
    }).join('');

    return `
    <div class="raffle-detail-container">

        ${getPageHeader(raffle.name)}

        <div class="raffle-info">        
            <div class="info-block">
                <p><strong>Premio:</strong> ${raffle.prize}</p>
                <p><strong>Precio del boleto:</strong> $${raffle.ticketPrice.toLocaleString('es-CO')}</p>
                <p><strong>Responsable:</strong> ${raffle.manager}</p>
            </div>
            
            <div class="info-block">
                <p><strong>Juega con:</strong> Loteria de ${raffle.lottery}</p>
                <p><strong>Fecha del sorteo:</strong> ${new Date(raffle.drawDate).toLocaleDateString('es-CO')}</p>
                <div class="payment-icons-list detail-view">
                    <strong>MÃ©todos de pago:</strong> ${paymentIconsHTML}
                </div>
            </div>
        </div>

        <div class="tickets-grid-container">
            <h3>Selecciona tu nÃºmero</h3>
            <div id="tickets-grid"></div>

            <div class="grid-actions">
                <button type="button" id="share-status-btn" class="btn btn-primary">Compartir Estado de la Rifa</button>
            </div>
        </div>
    </div>
    ${getTicketModal()}
    ${getStatusModal()} 
    ${getCollaboratorModal()} `;
};

// AHORA, DEFINIMOS LA SEGUNDA FUNCIÃ“N POR SEPARADO
export const getTicketModal = () => `
    <div id="ticket-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="modal-view-container">
                
                <form id="ticket-form" style="display: block;">
                    <h3 id="modal-ticket-number-form" class="modal-title">Boleto #00</h3>
                    <div class="form-group">
                        <label for="buyer-name">Nombre del Comprador</label>
                        <input type="text" id="buyer-name" required>
                    </div>
                    <div class="form-group">
                        <label for="buyer-phone">NÃºmero de Celular</label>
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
						<button type="button" id="cancel-edit-btn" class="btn btn-secondary">Cancelar</button>
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
                        <label>NÃºmero de Celular</label>
                        <p id="info-buyer-phone" class="info-text"></p>
                    </div>
                    <div class="form-group">
                        <label>Estado del Pago</label>
                        <p id="info-payment-status" class="info-text"></p>
                    </div>
                    <div class="modal-buttons">
						<button type="button" id="edit-ticket-btn-info" class="btn btn-primary">Editar Boleto</button>
                        <button type="button" id="clear-ticket-btn-info" class="btn btn-danger">Limpiar Boleto</button>
                    </div>
                    <div class="modal-buttons" style="margin-top: 0.5rem;">
                        <button type="button" id="whatsapp-share-btn-info" class="btn btn-whatsapp">WhatsApp</button>
                        <button type="button" id="generic-share-btn-info" class="btn btn-secondary">Compartir</button>
                    </div>
                </div>

                <div id="ticket-image-preview" style="display: none;"></div>

            </div>
        </div>
    </div>

    <div id="ticket-template" style="position: absolute; left: -9999px; width: 800px; background: white; display: flex; padding: 20px; box-sizing: border-box; border-radius: 15px; font-family: 'Poppins', sans-serif;">
        <div style="border: 3px solid #6a11cb; padding: 30px; border-radius: 15px; width: 100%; display: flex; flex-direction: column;">
            <div style="text-align: center; border-bottom: 2px solid #f0f2f5; padding-bottom: 15px; margin-bottom: 20px;">
                <svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1010.84 231.45" style="height: 60px;">
                    <defs><style>.cls-1,.cls-2{stroke-miterlimit:10;stroke-width:7.4px;}.cls-1,.cls-2,.cls-3{stroke:#1d1d1b;stroke-linecap:round;}.cls-1,.cls-3{fill:none;}.cls-2{fill:#fff;}.cls-3{stroke-linejoin:round;stroke-width:12.52px;}</style></defs>
                    <g id="Capa_1-2" data-name="Capa 1"><g><g><path d="M218.07,54.14h-28.47c-2.24-1.48-4.26-3.36-5.98-5.61-5.16-6.74-6.44-15.22-3.67-22.95l-3.43-4.4c-5.13,2.5-10.89,3.47-16.69,2.74-5.8-.72-11.14-3.06-15.51-6.74l-47.45,36.96h-20.38L145.99,0l3.84,4.94c2.85,3.66,6.95,5.99,11.54,6.56,4.6,.57,9.14-.69,12.8-3.53l4.94-3.85,15.61,20.05-2.06,3.63c-2.43,4.3-2.09,9.2,.91,13.12s7.64,5.53,12.42,4.3l4.28-1.09,7.8,10.01Z"/><path d="M266.01,130.5l3.86-1.61v-31.52h-6.26c-14.87,0-26.97-12.1-26.97-26.97v-6.26H33.24v6.26c0,14.87-12.11,26.97-26.98,26.97H0v31.52l3.86,1.61c8.7,3.62,11.86,11.51,11.92,17.69,.05,6.18-2.97,14.13-11.62,17.9l-4.16,1.82v30.3H6.26c14.87,0,26.98,12.1,26.98,26.98v6.26H236.64v-6.26c0-14.88,12.1-26.98,26.97-26.98h6.26v-30.3l-4.17-1.82c-8.64-3.77-11.66-11.72-11.61-17.9,.06-6.18,3.22-14.07,11.92-17.69Zm-24.44,17.58c-.1,11.73,5.86,22.08,15.78,27.8v10.31c-16.77,2.68-30.06,15.96-32.74,32.74H45.26c-2.68-16.78-15.96-30.06-32.74-32.74v-10.31c9.92-5.72,15.88-16.07,15.78-27.8-.1-11.54-6.05-21.64-15.78-27.25v-11.43c16.78-2.68,30.06-15.97,32.74-32.74H224.61c2.68,16.77,15.97,30.06,32.74,32.74v11.43c-9.73,5.61-15.68,15.71-15.78,27.25Z"/><polygon class="cls-3" points="127.86 104.58 147.23 126.8 176.51 123.43 161.37 148.72 173.62 175.53 144.89 168.95 123.18 188.88 120.56 159.52 94.9 145.03 122.01 133.47 127.86 104.58"/><line class="cls-2" x1="53.61" y1="117.05" x2="53.61" y2="180.05"/><line class="cls-1" x1="220.68" y1="117.05" x2="220.68" y2="180.05"/><path d="M170.04,54.14h-9.96l-9.78-10.87c-1.37-1.52-1.25-3.86,.27-5.23,1.52-1.36,3.86-1.24,5.23,.28l14.24,15.82Z"/></g><g><path d="M376.56,167.69h-15.45v58.6h-29.84V74.1h59.46c29.62,0,48.51,20.39,48.51,46.79,0,21.25-12.45,37.35-32.41,43.14l32.63,62.25h-33.06l-29.84-58.6Zm8.59-25.54c15.03,0,23.83-8.59,23.83-21.04s-8.8-21.25-23.83-21.25h-24.04v42.29h24.04Z"/><path d="M473.58,68.3c9.87,0,17.6,7.94,17.6,17.82s-7.73,17.39-17.6,17.39-17.6-7.94-17.6-17.39,7.94-17.82,17.6-17.82Zm-14.17,157.98V120.68h28.55v105.61h-28.55Z"/><path d="M551.28,109.09v11.59h23.83v24.47h-23.83v81.14h-28.76v-81.14h-17.6v-24.47h17.6v-12.02c0-23.83,15.02-39.28,38.42-39.28,6.01,0,11.81,1.07,14.17,2.15v24.04c-1.5-.43-4.29-1.07-9.02-1.07-6.44,0-14.81,2.79-14.81,14.6Z"/><path d="M616.11,165.54l25.97-3.86c6.01-.86,7.94-3.86,7.94-7.51,0-7.51-5.8-13.74-17.82-13.74s-19.32,7.94-20.18,17.17l-25.33-5.37c1.72-16.53,16.96-34.77,45.29-34.77,33.48,0,45.93,18.89,45.93,40.14v51.94c0,5.58,.64,13.09,1.29,16.74h-26.19c-.64-2.79-1.07-8.59-1.07-12.66-5.37,8.37-15.45,15.67-31.12,15.67-22.54,0-36.27-15.24-36.27-31.77,0-18.89,13.95-29.41,31.55-31.98Zm33.91,18.03v-4.72l-23.83,3.65c-7.3,1.07-13.09,5.15-13.09,13.31,0,6.22,4.51,12.23,13.74,12.23,12.02,0,23.18-5.8,23.18-24.47Z"/><path d="M733.3,168.97v57.31h-29.62V74.1h56.88c30.05,0,50.01,19.96,50.01,47.44s-19.96,47.44-50.01,47.44h-27.26Zm23.61-25.54c14.81,0,23.83-8.59,23.83-21.68s-9.02-21.89-23.83-21.89h-23.4v43.57h23.4Z"/><path d="M891.07,149.01c-3.22-.64-6.01-.86-8.59-.86-14.6,0-27.26,7.08-27.26,29.84v48.3h-28.55V120.68h27.69v15.67c6.44-13.95,21.04-16.53,30.05-16.53,2.36,0,4.51,.21,6.65,.43v28.76Z"/><path d="M1010.84,173.48c0,32.41-23.83,56.02-55.38,56.02s-55.38-23.61-55.38-56.02,23.83-56.02,55.38-56.02,55.38,23.4,55.38,56.02Zm-28.55,0c0-19.96-12.88-30.05-26.83-30.05s-26.83,10.09-26.83,30.05,12.88,30.05,26.83,30.05,26.83-10.09,26.83-30.05Z"/></g></g></g>
            </div>
            <div style="display: flex; flex-grow: 1; gap: 30px;">
                <div style="width: 55%; text-align: left; display: flex; flex-direction: column; gap: 10px; font-size: 1.1rem;">
                    <div><strong>Premio:</strong> <span id="template-prize"></span></div>
                    <div><strong>A nombre de:</strong> <span id="template-buyer"></span></div>
                    <div><strong>Responsable:</strong> <span id="template-manager"></span></div>
                    <div><strong>Juega con:</strong> Loteria de <span id="template-lottery"></span></div>
                    <div><strong>Fecha Sorteo:</strong> <span id="template-draw-date"></span></div>
                    <div style="margin-top: auto; border-top: 2px solid #f0f2f5; padding-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #6a11cb;">Realiza tu pago a:</h4>
                        <div id="template-payment-methods"></div>
                    </div>
                </div>
                <div style="width: 45%; background: linear-gradient(45deg, #6a11cb, #2575fc); color: white; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <p style="margin: 0; font-size: 1.5rem; font-weight: 500;">TU NÃšMERO</p>
                    <p id="template-number" style="margin: 0; font-size: 8rem; font-weight: 700; line-height: 1;"></p>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #f0f2f5;">
                 <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #777; font-weight: 600;">Â¡Mucha Suerte!</p>
                 <div style="display: flex; align-items: center; gap: 5px;">
                    <p style="margin: 0; font-size: 0.75rem; color: #999;">Desarrollado por</p>
                    <svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 879.14 85.62" style="height: 16px; opacity: 0.6;">
                        <g id="Capa_1-2" data-name="Capa 1"><g id="Imagotipo"><g><path d="M110.22,49.35l-10.41,10.41c3.95,8.61,12.65,14.6,22.74,14.6h0c13.81,0,25.47-8.41,25.47-22.22,0,0,1.07-16.23-15.49-19.61-9.39-1.91-13.45-5.24-15.19-7.53-1.22-1.61-1.55-3.78-.7-5.62,.72-1.56,2.29-3.12,5.74-3.12,9.24,0,12.17,8.74,12.17,8.74l10.63-10.63C141.2,5.88,132.57,0,122.56,0h0C108.75,0,99.88,10.27,99.88,24.07c0,0-.21,11.49,13.34,18.14,.92,.45,1.88,.82,2.85,1.14,1.89,.63,5.2,1.73,5.4,1.79,.93,.32,9.06,2.11,9.31,6.62,.22,3.99-2.48,6.99-8.78,5.75-4.32-.85-11.77-8.18-11.77-8.18Z"/><polygon points="248.32 27.08 233.59 74.35 211.15 74.35 237.1 0 259.54 0 285.5 74.35 263.06 74.35 248.32 27.08"/><path d="M199.2,50.32l13.15,13.15c-6.73,6.72-16.02,10.89-26.29,10.89-20.53,0-37.17-16.64-37.17-37.17S165.53,0,186.05,0C196.32,0,205.61,4.16,212.34,10.89l-13.15,13.15c-3.36-3.36-8.01-5.45-13.14-5.45-10.26,0-18.59,8.32-18.59,18.59s8.32,18.59,18.59,18.59c5.13,0,9.78-2.08,13.14-5.45Z"/><path d="M305.28,46.55h0v27.8h-16.53V0h29.39c14.64,0,24.06,10.04,24.06,23.22,0,10.04-5.54,17.68-14.64,20.92l15.06,30.21h-18.2l-10.74-22.52c-1.55-3.23-4.82-5.28-8.4-5.28Zm9.73-14.23c6.8,0,10.46-3.77,10.46-9,0-5.54-3.66-9-10.46-9h-9.73v17.99h9.73Z"/><path d="M414.41,7.4C409.84,2.83,403.53,0,396.56,0,382.61,0,371.31,11.31,371.31,25.25v23.85c0,13.95,11.31,25.25,25.25,25.25s25.25-11.31,25.25-25.25V25.25c0-6.97-2.83-13.29-7.4-17.85Zm-7.91,41.38c0,6.28-3.65,11.38-9.94,11.38s-9.94-5.1-9.94-11.38V25.57c0-6.28,3.65-11.38,9.94-11.38s9.94,5.23,9.94,11.38v23.21Z"/><path d="M470.58,15.17c-6.03,6.38-21.1,25.09-23.58,59.18h-17.79c2.66-39.31,22.21-59.3,22.21-59.3h-27.55V.22h46.72V15.17Z"/><path d="M495.95,.11l-21.79,.22V74.46h21.79c20.53,0,37.17-16.64,37.17-37.17S516.48,.11,495.95,.11Zm4.41,56.81h-9.28V17.1l9.28-.12c8.74,0,15.83,8.95,15.83,19.98s-7.09,19.97-15.83,19.97Z"/></g><g><path d="M61.98,0C41.45,0,24.81,16.64,24.81,37.17s16.64,37.17,37.17,37.17,37.17-16.64,37.17-37.17S82.51,0,61.98,0Zm0,55.76c-10.26,0-18.59-8.32-18.59-18.59s8.32-18.59,18.59-18.59,18.59,8.32,18.59,18.59-8.32,18.59-18.59,18.59Z"/><path d="M59.72,78.01c-6.25,4.78-14.07,7.61-22.54,7.61C16.64,85.62,0,68.98,0,48.44,0,30.45,12.79,15.44,29.78,12c-5.44,6.95-8.68,15.69-8.68,25.17,0,21.78,17.13,39.65,38.62,40.83Z"/></g><g><path d="M610.03,22.98h-6.69c-.27-5.34-2.18-9.41-5.72-12.21-3.55-2.8-8.33-4.21-14.34-4.21-5.67,0-10.1,1.18-13.27,3.55-3.18,2.37-4.76,5.71-4.76,10.03,0,1.55,.19,2.92,.56,4.1,.37,1.18,1.05,2.21,2.03,3.09,.98,.88,1.89,1.61,2.74,2.18,.84,.57,2.21,1.15,4.1,1.72,1.89,.57,3.41,1.01,4.56,1.32,1.15,.3,2.97,.73,5.47,1.27,2.7,.61,4.9,1.11,6.59,1.52,1.69,.41,3.61,.95,5.78,1.62,2.16,.68,3.9,1.35,5.22,2.03,1.32,.68,2.69,1.52,4.1,2.53,1.42,1.01,2.5,2.13,3.24,3.34,.74,1.22,1.37,2.65,1.87,4.31,.51,1.66,.76,3.5,.76,5.52,0,4.93-1.37,9.05-4.1,12.36-2.74,3.31-6.06,5.61-9.98,6.89-3.92,1.28-8.28,1.93-13.07,1.93-8.98,0-16.03-2.19-21.13-6.59-5.1-4.39-7.65-10.44-7.65-18.14v-.61h6.59c0,6.55,2.01,11.48,6.03,14.79,4.02,3.31,9.58,4.97,16.67,4.97,6.21,0,11.11-1.32,14.69-3.95,3.58-2.63,5.37-6.28,5.37-10.94s-1.71-7.75-5.12-9.68c-3.41-1.92-9.85-4-19.3-6.23-3.04-.67-5.29-1.22-6.74-1.62-1.45-.41-3.39-1.11-5.83-2.13-2.43-1.01-4.24-2.11-5.42-3.29-1.18-1.18-2.25-2.79-3.19-4.81-.95-2.03-1.42-4.39-1.42-7.09,0-6.08,2.25-10.89,6.74-14.44,4.49-3.55,10.62-5.32,18.39-5.32s14.08,1.87,18.75,5.62c4.66,3.75,7.16,9.27,7.5,16.57Z"/><path d="M643.06,22.27v5.17h-10.74V60.47c0,1.76,.03,2.99,.1,3.7,.07,.71,.29,1.55,.66,2.53,.37,.98,1.03,1.64,1.98,1.98,.94,.34,2.23,.51,3.85,.51,.95,0,2.33-.1,4.15-.3v5.47c-2.09,.27-3.95,.41-5.57,.41-6.28,0-9.9-1.99-10.84-5.98-.4-1.69-.61-5.5-.61-11.45V27.44h-9.22v-5.17h9.22V6.36h6.28v15.91h10.74Z"/><path d="M694.33,22.27v52.08h-5.88v-9.63c-3.85,7.43-9.97,11.15-18.34,11.15-5.54,0-9.91-1.6-13.12-4.81-3.21-3.21-4.81-7.92-4.81-14.14V22.27h6.38v31.92c0,5.4,1,9.44,2.99,12.11,1.99,2.67,5.39,4,10.18,4,5.07,0,9.05-1.84,11.96-5.52,2.9-3.68,4.36-8.26,4.36-13.73V22.27h6.28Z"/><path d="M752.49,2.2V74.35h-5.78v-10.23c-1.55,3.85-3.97,6.77-7.24,8.76-3.28,1.99-7.11,2.99-11.5,2.99-7.23,0-12.95-2.48-17.17-7.45-4.22-4.97-6.33-11.67-6.33-20.11s2.11-15.06,6.33-20.06c4.22-5,9.88-7.5,16.97-7.5,9.05,0,15.23,3.75,18.54,11.25V2.2h6.18Zm-24.01,23.81c-5.34,0-9.61,2.01-12.82,6.03-3.21,4.02-4.81,9.41-4.81,16.16s1.6,12.36,4.81,16.41c3.21,4.05,7.51,6.08,12.92,6.08s9.91-1.99,13.12-5.98c3.21-3.98,4.81-9.46,4.81-16.41,0-6.21-1.52-11.48-4.56-15.81-3.04-4.32-7.53-6.48-13.48-6.48Z"/><path d="M771.33,1.9V12.34h-6.38V1.9h6.38Zm0,20.37v52.08h-6.38V22.27h6.38Z"/><path d="M805.78,20.75c7.5,0,13.46,2.5,17.88,7.5,4.42,5,6.64,11.75,6.64,20.27s-2.2,15.12-6.59,20.01c-4.39,4.9-10.37,7.35-17.94,7.35s-13.6-2.48-18.09-7.45c-4.49-4.97-6.74-11.67-6.74-20.11s2.25-15.06,6.74-20.06c4.49-5,10.52-7.5,18.09-7.5Zm13.17,11.4c-3.31-4.02-7.74-6.03-13.27-6.03s-9.97,2.01-13.27,6.03c-3.31,4.02-4.96,9.41-4.96,16.16s1.64,12.33,4.91,16.31c3.28,3.99,7.78,5.98,13.53,5.98s9.93-1.99,13.17-5.98c3.24-3.98,4.86-9.39,4.86-16.21s-1.66-12.24-4.97-16.26Z"/><path d="M877.32,37.47h-6.18c-.61-7.56-5.3-11.35-14.08-11.35-3.72,0-6.67,.78-8.87,2.33-2.2,1.55-3.29,3.65-3.29,6.28,0,1.28,.24,2.4,.71,3.34,.47,.95,1.01,1.71,1.62,2.28,.61,.57,1.67,1.13,3.19,1.67,1.52,.54,2.84,.96,3.95,1.27,1.11,.3,2.92,.73,5.42,1.27,2.23,.54,4.02,.98,5.37,1.32,1.35,.34,3.02,.93,5.02,1.77,1.99,.85,3.56,1.76,4.71,2.74,1.15,.98,2.14,2.3,2.99,3.95,.84,1.66,1.27,3.53,1.27,5.62,0,4.8-1.91,8.66-5.72,11.6-3.82,2.94-8.8,4.41-14.95,4.41-6.69,0-11.89-1.62-15.6-4.86-3.72-3.24-5.64-7.84-5.78-13.78h6.18c0,4.32,1.35,7.63,4.05,9.93,2.7,2.3,6.48,3.44,11.35,3.44,4.26,0,7.68-.93,10.28-2.79,2.6-1.86,3.9-4.31,3.9-7.35,0-1.62-.42-3.04-1.27-4.26-.85-1.22-1.98-2.18-3.39-2.89-1.42-.71-2.82-1.28-4.21-1.72-1.39-.44-2.85-.83-4.41-1.17-.47-.07-.81-.13-1.01-.2-.47-.13-1.55-.39-3.24-.76-1.69-.37-2.87-.64-3.55-.81-.68-.17-1.76-.49-3.24-.96-1.49-.47-2.57-.91-3.24-1.32-.68-.41-1.54-.98-2.58-1.72-1.05-.74-1.82-1.54-2.33-2.38-.51-.84-.95-1.84-1.32-2.99-.37-1.15-.56-2.43-.56-3.85,0-4.52,1.71-8.11,5.12-10.74,3.41-2.63,8.09-3.95,14.03-3.95s10.71,1.42,14.29,4.26c3.58,2.84,5.37,6.96,5.37,12.36Z"/></g></g></g>
                    </svg>
                 </div>
            </div>
        </div>
    </div>
`;

export const getStatusModal = () => `
    <div id="status-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <span class="close-modal close-status-modal">&times;</span>
            <h3>Personalizar TÃ­tulo</h3>
            <form id="status-form">
                
                <div class="form-group">
                    <label>TÃ­tulo Principal</label>
                    <select id="status-title-type">
                        <option value="raffle_name">Mostrar Nombre de la Rifa</option>
                        <option value="prize">Mostrar Premio</option>
                    </select>
                </div>

                <div id="prize-options-wrapper" class="form-group" style="display: none;">
                    <label for="status-prize-prefix">Estilo del TÃ­tulo del Premio</label>
                    <select id="status-prize-prefix">
                        <option value="Â¡Gana {premio}">Â¡Gana {premio}!</option>
                        <option value="Gran Rifa de {premio}">Gran Rifa de {premio}</option>
                        </select>
                </div>

                <button type="submit" class="btn btn-primary">Generar y Compartir</button>
            </form>
        </div>
    </div>
`;

export const getCollaboratorModal = () => `
    <div id="collaborator-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <span class="close-modal close-collaborator-modal">&times;</span>
            <h3>AÃ±adir Colaborador</h3>
            <p>Ingresa el correo del usuario de RifaPro que te ayudarÃ¡ a administrar esta rifa.</p>
            <form id="collaborator-form">
                <div class="form-group">
                    <label for="collaborator-email">Correo del Colaborador</label>
                    <input type="email" id="collaborator-email" required>
                </div>
                <button type="submit" class="btn btn-primary">AÃ±adir</button>
            </form>
        </div>
    </div>
`;

document.addEventListener("click", (e) => {
    if (e.target.id === "close-collaborator-modal") {
        document.getElementById("collaborator-modal").classList.add("hidden");
    }
});

export const getStatisticsDetailView = (raffle) => `
    <div class="statistics-container">
        <div class="stats-header">
            ${getPageHeader(`EstadÃ­sticas: ${raffle.name}`)}
            <div class="header-actions">
				<a href="#/participants/${raffle.id}" class="btn btn-secondary">
					<svg xmlns="http://www.w3.org/2000/svg" 
						 height="35px" 
						 viewBox="0 -960 960 960" 
						 width="40px" 
						 fill="currentColor">
					  <path d="M638.35-402q-53.24 0-88.88-35.81-35.63-35.8-35.63-89.05 0-53.24 35.73-88.96 35.73-35.71 88.87-35.71 53.24 0 89.01 35.76 35.76 35.77 35.76 88.96 0 53.28-35.8 89.05Q691.6-402 638.35-402ZM392.51-147.8v-75.33q0-21.33 10.11-40.35 10.11-19.03 27.5-28.15 45.64-30.81 98.88-45.92 53.23-15.12 109.39-15.12 56.15 0 109.11 16.12 52.96 16.11 99.43 44.92 16.73 11.14 27.17 29.21 10.44 18.06 10.44 39.27v75.35H392.51ZM113.62-399.25v-75.92h309.55v75.92H113.62Zm0-339.11v-75.75h472.39v75.75H113.62Zm338.76 169.48H113.62v-75.76h372.22q-12.72 16.33-20.99 35.35-8.27 19.01-12.47 40.41Z"/>
					</svg>
					Ver Lista de Participantes
				</a>
			</div>
        </div>

        <div class="stats-group">
            <h3>CÃ¡lculo de Ganancias</h3>
            <div class="stats-cards-grid">
                <div class="stat-card">
                    <h4>Pagado Total</h4>
                    <span id="stats-revenue-paid" class="stat-value">$0</span>
                </div>
                <div class="stat-card">
                    <h4>Pago Parcial</h4>
                    <span id="stats-revenue-partial" class="stat-value">$0</span>
                </div>
                <div class="stat-card">
                    <h4>Pendiente</h4>
                    <span id="stats-revenue-pending" class="stat-value">$0</span>
                </div>
            </div>
        </div>

        <div class="stats-group">
            <h3>Estado de los Boletos</h3>
            <div class="stats-cards-grid">
                <div class="stat-card clickable" data-status="available">
                    <span class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6a11cb"><path d="M481.01-287.91q16.71 0 28.31-11.5 11.59-11.49 11.59-28.19 0-16.7-11.44-28.3-11.45-11.6-28.36-11.6-16.59 0-28.31 11.44-11.71 11.45-11.71 28.37 0 16.58 11.61 28.18 11.61 11.6 28.31 11.6Zm0-153.18q16.71 0 28.31-11.61 11.59-11.61 11.59-28.31 0-16.71-11.44-28.31-11.45-11.59-28.36-11.59-16.59 0-28.31 11.44-11.71 11.45-11.71 28.36 0 16.59 11.61 28.31 11.61 11.71 28.31 11.71Zm0-153.41q16.71 0 28.31-11.61 11.59-11.61 11.59-28.32 0-16.7-11.44-28.18-11.45-11.48-28.36-11.48-16.59 0-28.31 11.38-11.71 11.38-11.71 28.19 0 16.59 11.61 28.3 11.61 11.72 28.31 11.72Zm312.12 433.63H167.87q-35.72 0-60.86-25.14t-25.14-60.86V-403.3q32.76 0 55.88-22.57 23.12-22.56 23.12-54.38 0-32.29-23.12-54.87T81.87-557.7v-156.43q0-35.72 25.14-60.86t60.86-25.14h625.26q35.72 0 60.86 25.14t25.14 60.86v156.43q-32.52 0-55.76 22.58-23.24 22.58-23.24 54.87 0 31.82 23.24 54.38 23.24 22.57 55.76 22.57v156.43q0 35.72-25.14 60.86t-60.86 25.14Zm0-86v-96.93q-36.26-21.24-57.63-57.44-21.37-36.2-21.37-78.85 0-43.02 21.12-79.44 21.12-36.43 57.88-57.67v-96.93H167.87v96.93q37.24 21.24 58.12 57.67 20.88 36.43 20.88 79.35 0 42.92-21.13 79.03t-57.87 57.35v96.93h625.26ZM480.5-480.5Z"/></svg>
                    </span>
                    <h4>Disponibles</h4>
                    <span id="stats-count-available" class="stat-value">0</span>
                </div>

                <div class="stat-card clickable" data-status="paid">
                     <span class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2e7d32"><path d="M481.01-287.91q16.71 0 28.31-11.5 11.59-11.49 11.59-28.19 0-16.7-11.44-28.3-11.45-11.6-28.36-11.6-16.59 0-28.31 11.44-11.71 11.45-11.71 28.37 0 16.58 11.61 28.18 11.61 11.6 28.31 11.6Zm0-153.18q16.71 0 28.31-11.61 11.59-11.61 11.59-28.31 0-16.71-11.44-28.31-11.45-11.59-28.36-11.59-16.59 0-28.31 11.44-11.71 11.45-11.71 28.36 0 16.59 11.61 28.31 11.61 11.71 28.31 11.71Zm0-153.41q16.71 0 28.31-11.61 11.59-11.61 11.59-28.32 0-16.7-11.44-28.18-11.45-11.48-28.36-11.48-16.59 0-28.31 11.38-11.71 11.38-11.71 28.19 0 16.59 11.61 28.3 11.61 11.72 28.31 11.72Zm312.12 433.63H167.87q-35.72 0-60.86-25.14t-25.14-60.86V-403.3q32.76 0 55.88-22.57 23.12-22.56 23.12-54.38 0-32.29-23.12-54.87T81.87-557.7v-156.43q0-35.72 25.14-60.86t60.86-25.14h625.26q35.72 0 60.86 25.14t25.14 60.86v156.43q-32.52 0-55.76 22.58-23.24 22.58-23.24 54.87 0 31.82 23.24 54.38 23.24 22.57 55.76 22.57v156.43q0 35.72-25.14 60.86t-60.86 25.14Zm0-86v-96.93q-36.26-21.24-57.63-57.44-21.37-36.2-21.37-78.85 0-43.02 21.12-79.44 21.12-36.43 57.88-57.67v-96.93H167.87v96.93q37.24 21.24 58.12 57.67 20.88 36.43 20.88 79.35 0 42.92-21.13 79.03t-57.87 57.35v96.93h625.26ZM480.5-480.5Z"/></svg>
					</span>
                    <h4>Ocupados (Pagados)</h4>
                    <span id="stats-count-paid" class="stat-value">0</span>
                </div>
                <div class="stat-card clickable" data-status="partial">
                    <span class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#fb8c00"><path d="M481.01-287.91q16.71 0 28.31-11.5 11.59-11.49 11.59-28.19 0-16.7-11.44-28.3-11.45-11.6-28.36-11.6-16.59 0-28.31 11.44-11.71 11.45-11.71 28.37 0 16.58 11.61 28.18 11.61 11.6 28.31 11.6Zm0-153.18q16.71 0 28.31-11.61 11.59-11.61 11.59-28.31 0-16.71-11.44-28.31-11.45-11.59-28.36-11.59-16.59 0-28.31 11.44-11.71 11.45-11.71 28.36 0 16.59 11.61 28.31 11.61 11.71 28.31 11.71Zm0-153.41q16.71 0 28.31-11.61 11.59-11.61 11.59-28.32 0-16.7-11.44-28.18-11.45-11.48-28.36-11.48-16.59 0-28.31 11.38-11.71 11.38-11.71 28.19 0 16.59 11.61 28.3 11.61 11.72 28.31 11.72Zm312.12 433.63H167.87q-35.72 0-60.86-25.14t-25.14-60.86V-403.3q32.76 0 55.88-22.57 23.12-22.56 23.12-54.38 0-32.29-23.12-54.87T81.87-557.7v-156.43q0-35.72 25.14-60.86t60.86-25.14h625.26q35.72 0 60.86 25.14t25.14 60.86v156.43q-32.52 0-55.76 22.58-23.24 22.58-23.24 54.87 0 31.82 23.24 54.38 23.24 22.57 55.76 22.57v156.43q0 35.72-25.14 60.86t-60.86 25.14Zm0-86v-96.93q-36.26-21.24-57.63-57.44-21.37-36.2-21.37-78.85 0-43.02 21.12-79.44 21.12-36.43 57.88-57.67v-96.93H167.87v96.93q37.24 21.24 58.12 57.67 20.88 36.43 20.88 79.35 0 42.92-21.13 79.03t-57.87 57.35v96.93h625.26ZM480.5-480.5Z"/></svg>
					</span>
                    <h4>Reservados (Parcial)</h4>
                    <span id="stats-count-partial" class="stat-value">0</span>
                </div>
                <div class="stat-card clickable" data-status="pending">
                    <span class="stat-icon">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c62828"><path d="M481.01-287.91q16.71 0 28.31-11.5 11.59-11.49 11.59-28.19 0-16.7-11.44-28.3-11.45-11.6-28.36-11.6-16.59 0-28.31 11.44-11.71 11.45-11.71 28.37 0 16.58 11.61 28.18 11.61 11.6 28.31 11.6Zm0-153.18q16.71 0 28.31-11.61 11.59-11.61 11.59-28.31 0-16.71-11.44-28.31-11.45-11.59-28.36-11.59-16.59 0-28.31 11.44-11.71 11.45-11.71 28.36 0 16.59 11.61 28.31 11.61 11.71 28.31 11.71Zm0-153.41q16.71 0 28.31-11.61 11.59-11.61 11.59-28.32 0-16.7-11.44-28.18-11.45-11.48-28.36-11.48-16.59 0-28.31 11.38-11.71 11.38-11.71 28.19 0 16.59 11.61 28.3 11.61 11.72 28.31 11.72Zm312.12 433.63H167.87q-35.72 0-60.86-25.14t-25.14-60.86V-403.3q32.76 0 55.88-22.57 23.12-22.56 23.12-54.38 0-32.29-23.12-54.87T81.87-557.7v-156.43q0-35.72 25.14-60.86t60.86-25.14h625.26q35.72 0 60.86 25.14t25.14 60.86v156.43q-32.52 0-55.76 22.58-23.24 22.58-23.24 54.87 0 31.82 23.24 54.38 23.24 22.57 55.76 22.57v156.43q0 35.72-25.14 60.86t-60.86 25.14Zm0-86v-96.93q-36.26-21.24-57.63-57.44-21.37-36.2-21.37-78.85 0-43.02 21.12-79.44 21.12-36.43 57.88-57.67v-96.93H167.87v96.93q37.24 21.24 58.12 57.67 20.88 36.43 20.88 79.35 0 42.92-21.13 79.03t-57.87 57.35v96.93h625.26ZM480.5-480.5Z"/></svg>
					</span>
                    <h4>Pendientes</h4>
                    <span id="stats-count-pending" class="stat-value">0</span>
                </div>
            </div>
        </div>
    </div>
`;

export const getParticipantsListView = (raffle, tickets) => {
    if (!tickets.length) {
        return `
            <section class="participants-list">
				${getPageHeader('Lista de Participantes')}
                <p>No hay participantes con boletos asignados en esta rifa.</p>
            </section>
        `;
    }

    // Traducciï¿½n de estados (clave en inglï¿½s, etiqueta en espaï¿½ol)
    const statusLabels = {
        paid: "Pagado",
        partial: "Parcial",
        pending: "Pendiente",
        available: "Disponible"
    };

    const cardsHTML = tickets.map(ticket => {
        const statusKey = ticket.status || "available";
        const statusLabel = statusLabels[statusKey] || statusKey;

        return `
        <div class="participant-card" data-ticket="${ticket.number}" data-raffle="${raffle.id}" data-status="${statusKey}">
            <div class="card-content">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#6c5ce7">
                        <path d="M481.01-287.91q16.71 0 28.31-11.5 11.59-11.49 11.59-28.19 0-16.7-11.44-28.3-11.45-11.6-28.36-11.6-16.59 0-28.31 11.44-11.71 11.45-11.71 28.37 0 16.58 11.61 28.18 11.61 11.6 28.31 11.6Zm0-153.18q16.71 0 28.31-11.61 11.59-11.61 11.59-28.31 0-16.71-11.44-28.31-11.45-11.59-28.36-11.59-16.59 0-28.31 11.44-11.71 11.45-11.71 28.36 0 16.59 11.61 28.31 11.61 11.71 28.31 11.71Zm0-153.41q16.71 0 28.31-11.61 11.59-11.61 11.59-28.32 0-16.7-11.44-28.18-11.45-11.48-28.36-11.48-16.59 0-28.31 11.38-11.71 11.38-11.71 28.19 0 16.59 11.61 28.3 11.61 11.72 28.31 11.72Zm312.12 433.63H167.87q-35.72 0-60.86-25.14t-25.14-60.86V-403.3q32.76 0 55.88-22.57 23.12-22.56 23.12-54.38 0-32.29-23.12-54.87T81.87-557.7v-156.43q0-35.72 25.14-60.86t60.86-25.14h625.26q35.72 0 60.86 25.14t25.14 60.86v156.43q-32.52 0-55.76 22.58-23.24 22.58-23.24 54.87 0 31.82 23.24 54.38 23.24 22.57 55.76 22.57v156.43q0 35.72-25.14 60.86t-60.86 25.14Zm0-86v-96.93q-36.26-21.24-57.63-57.44-21.37-36.2-21.37-78.85 0-43.02 21.12-79.44 21.12-36.43 57.88-57.67v-96.93H167.87v96.93q37.24 21.24 58.12 57.67 20.88 36.43 20.88 79.35 0 42.92-21.13 79.03t-57.87 57.35v96.93h625.26ZM480.5-480.5Z"/>
                    </svg>
                    Boleto #${ticket.number}
                </h3>

                <div class="participant-row">
                    <div class="participant-label">Nombre:</div>
                    <div class="participant-value participant-name">${ticket.name || ticket.buyerName || 'N/A'}</div>
                </div>

                <div class="participant-row">
                    <div class="participant-label">TelÃ©fono:</div>
                    <div class="participant-value participant-phone">${ticket.phone || ticket.buyerPhone || 'N/A'}</div>
                </div>

                <div class="participant-row">
                    <div class="participant-label">Estado:</div>
                    <div class="participant-value">
                        <span class="status-badge status-${statusKey} participant-status">${statusLabel}</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
        <section class="participants-list">
            <h2>Lista de Participantes - ${raffle.name || 'Rifa'}</h2>

            <div class="filters">
                <input type="text" id="search-participant" placeholder="Buscar por nombre o telÃ©fono..." />
                <select id="status-filter">
                    <option value="all">Todos</option>
                    <option value="paid">Pagados</option>
                    <option value="partial">Parcial</option>
                    <option value="pending">Pendientes</option>
                    <option value="available">Disponibles</option>
                </select>
            </div>

            <div class="participants-grid">
                ${cardsHTML}
            </div>
        </section>
    `;
};

export const getSettingsView = () => `
    <div class="settings-container">
		${getPageHeader('ConfiguraciÃ³n')}
        <div class="settings-section">
            <h3>Cuenta</h3>
            <div id="go-to-edit-profile" class="settings-item">
                <div class="item-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M400-489.61q-74.48 0-126.85-52.37-52.37-52.37-52.37-126.85 0-74.48 52.37-126.56 52.37-52.09 126.85-52.09 74.48 0 126.85 52.09 52.37 52.08 52.37 126.56t-52.37 126.85Q474.48-489.61 400-489.61ZM60.78-131.17v-132.35q0-41.48 22.37-74.44 22.37-32.95 52.37-47.95 51-26 119.24-44.85T400-449.61h18.8q10.81 0 19.07 2-9.13 18-18.87 48.81-9.74 30.8-13.87 55.19h-3.76q-66.72 0-122.65 16.59-55.94 16.59-91.94 34.14-9 4.88-14.5 13.03-5.5 8.15-5.5 19.15v23.53h244.09q7.13 27.21 22.5 56.19 15.37 28.98 31.33 49.81H60.78Zm587.7 30.39-12.57-62.83q-9.74-3.87-19.11-9.08-9.36-5.22-18.67-11.53l-60.83 19.13-46.78-80.43 48.26-41.7q-2.56-11.17-2.28-22.32.28-11.16 2.28-22.33l-48.26-42.26L537.3-454l60.83 19.13q9.31-6.3 18.67-11.52 9.37-5.22 19.11-9.09l12.57-62.82h94.13l12.57 62.82q9.73 3.87 19.39 9.31 9.65 5.43 18.95 13.3L853.78-454l47.35 81.87-48.82 42.26q2.56 9.74 2.28 21.33-.28 11.58-2.28 21.32l48.82 41.7-47.35 80.43-60.26-19.13q-9.3 6.31-18.95 11.53-9.66 5.21-19.39 9.08l-12.57 62.83h-94.13Zm47.35-133q30.74 0 53.11-22.65 22.36-22.66 22.36-53.4 0-30.73-22.36-53.1-22.37-22.37-53.11-22.37t-53.39 22.37q-22.66 22.37-22.66 53.1 0 30.74 22.66 53.4 22.65 22.65 53.39 22.65ZM399.98-595.61q30.19 0 51.72-21.5 21.52-21.5 21.52-51.7 0-30.19-21.5-51.43-21.51-21.24-51.7-21.24t-51.72 21.34q-21.52 21.34-21.52 51.31 0 30.2 21.5 51.71 21.51 21.51 51.7 21.51Zm.02-73.22Zm10.87 431.66Z"/></svg>
                </div>
                <div class="item-content"><span>Editar Perfil</span></div>
                <div class="item-action"><span>&rsaquo;</span></div>
            </div>
            <div id="go-to-security" class="settings-item">
                <div class="item-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-60.22Q332.65-96.8 236.72-226.95 140.78-357.1 140.78-516v-257.26L480-899.78l339.22 126.52V-516q0 158.9-95.94 289.05Q627.35-96.8 480-60.22Zm0-110q93.04-33.39 156.63-118.5 63.59-85.11 74.59-191.35H480v-307.02l-233.22 87.45V-498q0 8.13 1.95 18H480v309.78Z"/></svg>
                </div>
                <div class="item-content"><span>Seguridad</span></div>
                <div class="item-action"><span>&rsaquo;</span></div>
            </div>
        </div>

        <div class="settings-section">
            <h3>InformaciÃ³n</h3>
            <div class="settings-item">
                <div class="item-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M140.78-180.78v-106H214v-260.78q0-90.35 53.11-161.92 53.11-71.56 139.89-93.26v-23.48q0-30.41 21.29-51.71 21.29-21.29 51.71-21.29t51.71 21.29Q553-856.63 553-826.22v23.48q87.35 21.7 140.18 92.98Q746-638.48 746-547.56v260.78h73.22v106H140.78ZM480-497.17Zm.57 442.61q-35.8 0-61.3-25.33-25.49-25.33-25.49-60.89h173q0 35.82-25.32 61.02-25.33 25.2-60.89 25.2ZM320-286.78h320v-260.78q0-66-47-113t-113-47q-66 0-113 47t-47 113v260.78Z"/></svg>
                </div>
                <div class="item-content">
                    <p class="item-description">Notificaciones</p>
                </div>
                <div class="item-action">
                    <span>&rsaquo;</span>
                </div>
            </div>
        </div>

         <div class="settings-section">
            <h3>General</h3>
             <div class="settings-item">
                <div class="item-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M479.9-111.52q-153.49 0-260.93-107.45Q111.52-326.41 111.52-479.9t107.47-261.32Q326.47-849.04 480-849.04q12.3 0 24.67.71 12.37.72 24.24 2.72-34.21 31.26-55.04 74.65t-20.83 92.87q0 94.01 66.14 159.81 66.13 65.8 160.6 65.8 49.35 0 92.52-20.54 43.18-20.55 73.87-54.76 1.44 11.87 2.16 23.51.71 11.63.71 23.7 0 153.4-107.82 261.22Q633.39-111.52 479.9-111.52Zm.1-106q73.3 0 134.26-37.2 60.96-37.19 93.52-98.8-14.35 2.74-28.69 4.04-14.35 1.31-28.13.18-120.74-9.61-205.83-93.29-85.09-83.67-95.83-208.93-.56-13.78.46-28.13t4.33-28.13q-61.05 33.13-98.81 94.09-37.76 60.95-37.76 133.69 0 108.74 76.87 185.61 76.87 76.87 185.61 76.87Zm-17.35-245.13Z"/></svg>
                </div>
                <div class="item-content"><span>Modo Oscuro</span></div>
                <div class="item-action">
                    <label class="toggle-switch">
                        <input type="checkbox" id="dark-mode-toggle" ${localStorage.getItem('darkMode') === 'enabled' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <button id="settings-logout-btn" class="btn btn-danger-outline">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
            <span>Cerrar SesiÃ³n</span>
        </button>
    </div>
`;

export const getEditProfileView = (user) => {
    const displayName = user.displayName || 'Sin nombre';
    const email = user.email || 'Sin correo';
    const photoURL = user.photoURL || 'assets/default-avatar.png';
    const username = email.split('@')[0];

    return `
    <div class="edit-profile-container">
        <div class="profile-header">
            <a href="#/settings" class="back-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M400-80 0-480l400-400 56 57-343 343 343 343-56 57Z"/></svg>
            </a>
            <h2>Editar perfil</h2>
        </div>

        <div class="profile-avatar-wrapper">
            <img src="${photoURL}" alt="Foto de perfil" class="profile-avatar-img">
            <button id="edit-avatar-button" class="edit-avatar-btn">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#FFFFFF"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
            </button>
            <input type="file" id="avatar-upload-input" accept="image/*" style="display: none;">
        </div>

        <div class="profile-user-details">
            <h3>${displayName}</h3>
            <p>@${username}</p>
        </div>

        <form id="edit-profile-form">
            <div class="form-group">
                <label for="profile-name">Nombre</label>
                <input type="text" id="profile-name" value="${displayName}" required>
            </div>
            <div class="form-group">
                <label for="profile-username">Nombre de usuario</label>
                <input type="text" id="profile-username" value="${username}" readonly>
            </div>
            <div class="form-group">
                <label for="profile-email">Correo electrÃ³nico</label>
                <input type="email" id="profile-email" value="${email}" readonly>
            </div>

            <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </form>
		${getAvatarCropperModal()}
    </div>
    `;
};

export const getAvatarCropperModal = () => `
    <div id="cropper-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <h4>Ajusta tu foto de perfil</h4>
            <div id="cropper-container"></div>
            <div class="modal-buttons">
                <button id="cancel-crop-btn" class="btn btn-secondary">Cancelar</button>
                <button id="save-crop-btn" class="btn btn-primary">Guardar Foto</button>
            </div>
        </div>
    </div>
`;

export const getSecurityView = (user) => {
    const email = user.email || '';
    const phoneNumber = user.phoneNumber || ''; // Asumimos que guardaremos el telï¿½fono aquï¿½

    return `
    <div class="security-container">
        <div class="profile-header">
            <a href="#/settings" class="back-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M400-80 0-480l400-400 56 57-343 343 343 343-56 57Z"/></svg>
            </a>
            <h2>Seguridad</h2>
        </div>

        <div class="accordion">
            <div class="accordion-header">
                <span>Cambiar ContraseÃ±a</span>
                <span class="accordion-icon">&rsaquo;</span>
            </div>
            <div class="accordion-content">
                <p>Te enviaremos un correo electrÃ³nico con un enlace seguro para que puedas restablecer tu contraseÃ±a.</p>
                <button id="send-reset-password-btn" class="btn btn-secondary">Enviar Solicitud</button>
            </div>
        </div>

        <form id="security-form">
            <div class="form-group">
                <label for="security-email">Cambiar Correo ElectrÃ³nico</label>
                <input type="email" id="security-email" value="${email}">
            </div>
            <div class="form-group">
                <label for="security-phone">Editar NÃºmero de Celular</label>
                <input type="tel" id="security-phone" value="${phoneNumber}" placeholder="Introduce tu nÃºmero de celular">
            </div>

            <a href="#/manage-guests" class="btn btn-secondary-outline">Gestionar invitados en mis rifas</a>

            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
        </form>
    </div>
    `;
};

export const getPageHeader = (title) => `
    <div class="app-header">
        <a href="#" class="app-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
                <path d="M400-80 0-480l400-400 56 57-343 343 343 343-56 57Z"/>
            </svg>
        </a>
        <h2>${title}</h2>
    </div>
`;

export const getCollaboratorsView = () => `
<div class="collaborators-container">
	${getPageHeader('Gestionar Colaboradores')}
    <div class="collaborators-search">
        <input type="text" id="collaborator-search" placeholder="🔍 Buscar por nombre o rifa" />
    </div>

    <div class="collaborators-list">
        <h3>Lista de Colaboradores</h3>
        <div id="collaborators-list-container">
            <p class="loading-text">Cargando colaboradores...</p>
        </div>
    </div>
</div>
`;

