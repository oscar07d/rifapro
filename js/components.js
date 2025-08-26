// js/components.js

// LISTA CENTRAL DE MÉTODOS DE PAGO
const paymentMethods = [
    { name: 'Efectivo', value: 'efectivo', icon: 'assets/banks/efectivo.svg' },
    { name: 'Nequi', value: 'nequi', icon: 'assets/banks/nequi.svg' },
    { name: 'Daviplata', value: 'daviplata', icon: 'assets/banks/daviplata.svg' },
    { name: 'Nu', value: 'nu', icon: 'assets/banks/nu.svg' },
    { name: 'Bancolombia', value: 'bancolombia', icon: 'assets/banks/bancolombia.svg' },
    { name: 'AV Villas', value: 'av-villas', icon: 'assets/banks/av-villas.svg' },
    { name: 'BBVA', value: 'bbva', icon: 'assets/banks/bbva.svg' },
    { name: 'Bogotá', value: 'bogota', icon: 'assets/banks/bogota.svg' },
    { name: 'Caja Social', value: 'caja-social', icon: 'assets/banks/caja-social.svg' },
    { name: 'Davivienda', value: 'davivienda', icon: 'assets/banks/dvienda.svg' },
    { name: 'Falabella', value: 'falabella', icon: 'assets/banks/falabella.svg' },
    { name: 'Finandina', value: 'finandina', icon: 'assets/banks/finandina.svg' },
    { name: 'Itaú', value: 'itau', icon: 'assets/banks/itau.svg' },
    { name: 'Lulo Bank', value: 'lulo', icon: 'assets/banks/lulo.svg' },
    { name: 'Movii', value: 'movii', icon: 'assets/banks/movii.svg' },
    { name: 'Pibank', value: 'pibank', icon: 'assets/banks/pibank.svg' },
    { name: 'Powwi', value: 'powwi', icon: 'assets/banks/powwi.svg' },
    { name: 'Ualá', value: 'uala', icon: 'assets/banks/uala.svg' }
];

// Vista para el inicio de sesión y registro
export const getAuthView = () => `
    <div class="auth-container">
        <h2 id="auth-title">Iniciar Sesión</h2>
        <form id="auth-form">
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit" class="btn btn-primary" id="auth-action-btn">Iniciar Sesión</button>
        </form>
        <button class="btn btn-google" id="google-login-btn">Iniciar Sesión con Google</button>
        <p id="auth-toggle-text">¿No tienes cuenta? <a href="#" id="auth-toggle-link">Regístrate</a></p>
    </div>
`;

// Vista del panel principal (Home)
export const getHomeView = (userName) => `
    <div class="home-container">
        <h2>¡Bienvenido, ${userName}!</h2>
        <p>¿Qué te gustaría hacer hoy?</p>
        <div class="home-buttons">
            <a href="#/create" class="btn btn-primary">Crear Rifa</a>
            <a href="#/explore" class="btn btn-primary">Administrar Rifas</a>
            <a href="#/my-raffles" class="btn btn-primary">Mis Rifas</a>
            <a href="#/settings" class="btn btn-primary">Configuración</a>
        </div>
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
        <h2>Crear Nueva Rifa</h2>
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
                <label for="ticket-price">Precio por boleto</label>
                <input type="number" id="ticket-price" required min="0">
            </div>
            <div class="form-group">
                <label for="payment-deadline">Fecha límite de pago</label>
                <input type="date" id="payment-deadline" required>
            </div>
            <div class="form-group">
                <label for="draw-date">Fecha del sorteo</label>
                <input type="date" id="draw-date" required>
            </div>
            <div class="form-group">
                <label>Métodos de pago</label>
                <div class="payment-options-grid">
                    ${paymentOptionsHTML}
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Crear Rifa</button>
        </form>
    </div>
    `;
};

// Vista para la página de "Explorar Rifas"
export const getExploreView = (rafflesHTML) => `
    <div class="explore-container">
        <h2>Rifas Disponibles</h2>
        <div id="raffles-list">
            ${rafflesHTML}
        </div>
    </div>
`;

// Genera el HTML para una sola tarjeta de rifa
export const getRaffleCard = (raffle) => {
    const percentage = raffle.soldPercentage || 0;
    const paymentIconsHTML = raffle.paymentMethods.map(methodValue => {
        const method = paymentMethods.find(p => p.value === methodValue);
        return method ? `<img src="${method.icon}" alt="${method.name}" title="${method.name}">` : '';
    }).join('');

    return `
    <div class="raffle-card" data-id="${raffle.id}">
        <div class="raffle-card-content">
            <h3>${raffle.name}</h3>
            <p class="info-row"><strong>Premio:</strong> ${raffle.prize}</p>
            
            <div class="progress-bar-container">
                <div class="progress-bar-label">
                    <span>${percentage}% vendido</span>
                    <span>100%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                </div>
            </div>

            <p class="info-row"><strong>Precio:</strong> $${raffle.ticketPrice.toLocaleString('es-CO')} | <strong>Sorteo:</strong> ${new Date(raffle.drawDate).toLocaleDateString('es-CO')}</p>
            
            <div class="payment-icons-list">
                ${paymentIconsHTML}
            </div>

            <a href="#/raffle/${raffle.id}" class="btn btn-secondary">Administrar</a>
        </div>
    </div>
    `;
};

export const getRaffleDetailView = (raffle) => {
    const paymentIconsHTML = raffle.paymentMethods.map(methodValue => {
        const method = paymentMethods.find(p => p.value === methodValue);
        return method ? `<img src="${method.icon}" alt="${method.name}" title="${method.name}">` : '';
    }).join('');

    return `
    <div class="raffle-detail-container">
        <div class="raffle-info">
            <h2>${raffle.name}</h2>
            <p><strong>Premio:</strong> ${raffle.prize}</p>
            <p><strong>Precio del boleto:</strong> $${raffle.ticketPrice.toLocaleString('es-CO')}</p>
            <p><strong>Fecha del sorteo:</strong> ${new Date(raffle.drawDate).toLocaleDateString('es-CO')}</p>
            <div class="payment-icons-list detail-view">
                <strong>Métodos de pago:</strong> ${paymentIconsHTML}
            </div>
        </div>
        <div class="tickets-grid-container">
            <h3>Selecciona tu número</h3>
            <div id="tickets-grid"></div>
        </div>
    </div>
    ${getTicketModal()}
    `;
};

// AHORA, DEFINIMOS LA SEGUNDA FUNCIÓN POR SEPARADO
export const getTicketModal = () => `
    <div id="ticket-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3 id="modal-ticket-number">Boleto #00</h3>
            
            <div id="modal-view-container">
                
                <form id="ticket-form">
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
                    <div class="form-group">
                        <label>Nombre del Comprador</label>
                        <p id="info-buyer-name"></p>
                    </div>
                    <div class="form-group">
                        <label>Número de Celular</label>
                        <p id="info-buyer-phone"></p>
                    </div>
                    <div class="form-group">
                        <label>Estado del Pago</label>
                        <p id="info-payment-status"></p>
                    </div>
                     <div class="modal-buttons">
                        <button type="button" id="clear-ticket-btn-info" class="btn btn-danger">Limpiar Boleto</button>
                    </div>
                    <div class="modal-buttons" style="margin-top: 0.5rem;">
                        <button type="button" id="whatsapp-share-btn-info" class="btn btn-whatsapp">WhatsApp</button>
                        <button type="button" id="generic-share-btn-info" class="btn btn-secondary">Compartir</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="ticket-template" style="position: absolute; left: -9999px; width: 850px; height: 460px; background: white; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; font-family: 'Poppins', sans-serif;">
        <div style="border: 3px solid #6a11cb; padding: 25px; border-radius: 15px; text-align: center; width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                 <svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1010.84 231.45" style="height: 60px; margin-bottom: 10px;">
                    <defs><style>.cls-1,.cls-2{stroke-miterlimit:10;stroke-width:7.4px;}.cls-1,.cls-2,.cls-3{stroke:#1d1d1b;stroke-linecap:round;}.cls-1,.cls-3{fill:none;}.cls-2{fill:#fff;}.cls-3{stroke-linejoin:round;stroke-width:12.52px;}</style></defs>
                    <g id="Capa_1-2" data-name="Capa 1"><g><g><path d="M218.07,54.14h-28.47c-2.24-1.48-4.26-3.36-5.98-5.61-5.16-6.74-6.44-15.22-3.67-22.95l-3.43-4.4c-5.13,2.5-10.89,3.47-16.69,2.74-5.8-.72-11.14-3.06-15.51-6.74l-47.45,36.96h-20.38L145.99,0l3.84,4.94c2.85,3.66,6.95,5.99,11.54,6.56,4.6,.57,9.14-.69,12.8-3.53l4.94-3.85,15.61,20.05-2.06,3.63c-2.43,4.3-2.09,9.2,.91,13.12s7.64,5.53,12.42,4.3l4.28-1.09,7.8,10.01Z"/><path d="M266.01,130.5l3.86-1.61v-31.52h-6.26c-14.87,0-26.97-12.1-26.97-26.97v-6.26H33.24v6.26c0,14.87-12.11,26.97-26.98,26.97H0v31.52l3.86,1.61c8.7,3.62,11.86,11.51,11.92,17.69,.05,6.18-2.97,14.13-11.62,17.9l-4.16,1.82v30.3H6.26c14.87,0,26.98,12.1,26.98,26.98v6.26H236.64v-6.26c0-14.88,12.1-26.98,26.97-26.98h6.26v-30.3l-4.17-1.82c-8.64-3.77-11.66-11.72-11.61-17.9,.06-6.18,3.22-14.07,11.92-17.69Zm-24.44,17.58c-.1,11.73,5.86,22.08,15.78,27.8v10.31c-16.77,2.68-30.06,15.96-32.74,32.74H45.26c-2.68-16.78-15.96-30.06-32.74-32.74v-10.31c9.92-5.72,15.88-16.07,15.78-27.8-.1-11.54-6.05-21.64-15.78-27.25v-11.43c16.78-2.68,30.06-15.97,32.74-32.74H224.61c2.68,16.77,15.97,30.06,32.74,32.74v11.43c-9.73,5.61-15.68,15.71-15.78,27.25Z"/><polygon class="cls-3" points="127.86 104.58 147.23 126.8 176.51 123.43 161.37 148.72 173.62 175.53 144.89 168.95 123.18 188.88 120.56 159.52 94.9 145.03 122.01 133.47 127.86 104.58"/><line class="cls-2" x1="53.61" y1="117.05" x2="53.61" y2="180.05"/><line class="cls-1" x1="220.68" y1="117.05" x2="220.68" y2="180.05"/><path d="M170.04,54.14h-9.96l-9.78-10.87c-1.37-1.52-1.25-3.86,.27-5.23,1.52-1.36,3.86-1.24,5.23,.28l14.24,15.82Z"/></g><g><path d="M376.56,167.69h-15.45v58.6h-29.84V74.1h59.46c29.62,0,48.51,20.39,48.51,46.79,0,21.25-12.45,37.35-32.41,43.14l32.63,62.25h-33.06l-29.84-58.6Zm8.59-25.54c15.03,0,23.83-8.59,23.83-21.04s-8.8-21.25-23.83-21.25h-24.04v42.29h24.04Z"/><path d="M473.58,68.3c9.87,0,17.6,7.94,17.6,17.82s-7.73,17.39-17.6,17.39-17.6-7.94-17.6-17.39,7.94-17.82,17.6-17.82Zm-14.17,157.98V120.68h28.55v105.61h-28.55Z"/><path d="M551.28,109.09v11.59h23.83v24.47h-23.83v81.14h-28.76v-81.14h-17.6v-24.47h17.6v-12.02c0-23.83,15.02-39.28,38.42-39.28,6.01,0,11.81,1.07,14.17,2.15v24.04c-1.5-.43-4.29-1.07-9.02-1.07-6.44,0-14.81,2.79-14.81,14.6Z"/><path d="M616.11,165.54l25.97-3.86c6.01-.86,7.94-3.86,7.94-7.51,0-7.51-5.8-13.74-17.82-13.74s-19.32,7.94-20.18,17.17l-25.33-5.37c1.72-16.53,16.96-34.77,45.29-34.77,33.48,0,45.93,18.89,45.93,40.14v51.94c0,5.58,.64,13.09,1.29,16.74h-26.19c-.64-2.79-1.07-8.59-1.07-12.66-5.37,8.37-15.45,15.67-31.12,15.67-22.54,0-36.27-15.24-36.27-31.77,0-18.89,13.95-29.41,31.55-31.98Zm33.91,18.03v-4.72l-23.83,3.65c-7.3,1.07-13.09,5.15-13.09,13.31,0,6.22,4.51,12.23,13.74,12.23,12.02,0,23.18-5.8,23.18-24.47Z"/><path d="M733.3,168.97v57.31h-29.62V74.1h56.88c30.05,0,50.01,19.96,50.01,47.44s-19.96,47.44-50.01,47.44h-27.26Zm23.61-25.54c14.81,0,23.83-8.59,23.83-21.68s-9.02-21.89-23.83-21.89h-23.4v43.57h23.4Z"/><path d="M891.07,149.01c-3.22-.64-6.01-.86-8.59-.86-14.6,0-27.26,7.08-27.26,29.84v48.3h-28.55V120.68h27.69v15.67c6.44-13.95,21.04-16.53,30.05-16.53,2.36,0,4.51,.21,6.65,.43v28.76Z"/><path d="M1010.84,173.48c0,32.41-23.83,56.02-55.38,56.02s-55.38-23.61-55.38-56.02,23.83-56.02,55.38-56.02,55.38,23.4,55.38,56.02Zm-28.55,0c0-19.96-12.88-30.05-26.83-30.05s-26.83,10.09-26.83,30.05,12.88,30.05,26.83,30.05,26.83-10.09,26.83-30.05Z"/></g></g></g></svg>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; flex-grow: 1;">
                <div style="text-align: left; color: #333; font-size: 1.1rem; width: 50%;"><p style="margin: 8px 0;"><strong>Rifa:</strong> <span id="template-raffle-name">Nombre de la Rifa</span></p><p style="margin: 8px 0;"><strong>Premio:</strong> <span id="template-prize">Gran Premio</span></p><p style="margin: 8px 0;"><strong>Comprador:</strong> <span id="template-buyer">Nombre del Comprador</span></p><p style="margin: 8px 0;"><strong>Fecha Sorteo:</strong> <span id="template-draw-date">dd/mm/aaaa</span></p></div>
                <div style="background: linear-gradient(45deg, #6a11cb, #2575fc); color: white; padding: 20px; border-radius: 12px; width: 40%;"><p style="margin: 0; font-size: 1.2rem;">TU NÚMERO</p><p id="template-number" style="margin: 5px 0 0 0; font-size: 5rem; font-weight: 700; line-height: 1;">00</p></div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 10px;">
                 <p style="margin: 0; font-size: 0.9rem; color: #777; font-weight: 600;">¡Mucha Suerte!</p>
                 <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                    <p style="margin: 0; font-size: 0.75rem; color: #999;">Desarrollado por</p>
                    <svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 879.14 85.62" style="height: 16px; opacity: 0.6;">
                        <g id="Capa_1-2" data-name="Capa 1"><g id="Imagotipo"><g><path d="M110.22,49.35l-10.41,10.41c3.95,8.61,12.65,14.6,22.74,14.6h0c13.81,0,25.47-8.41,25.47-22.22,0,0,1.07-16.23-15.49-19.61-9.39-1.91-13.45-5.24-15.19-7.53-1.22-1.61-1.55-3.78-.7-5.62,.72-1.56,2.29-3.12,5.74-3.12,9.24,0,12.17,8.74,12.17,8.74l10.63-10.63C141.2,5.88,132.57,0,122.56,0h0C108.75,0,99.88,10.27,99.88,24.07c0,0-.21,11.49,13.34,18.14,.92,.45,1.88,.82,2.85,1.14,1.89,.63,5.2,1.73,5.4,1.79,.93,.32,9.06,2.11,9.31,6.62,.22,3.99-2.48,6.99-8.78,5.75-4.32-.85-11.77-8.18-11.77-8.18Z"/><polygon points="248.32 27.08 233.59 74.35 211.15 74.35 237.1 0 259.54 0 285.5 74.35 263.06 74.35 248.32 27.08"/><path d="M199.2,50.32l13.15,13.15c-6.73,6.72-16.02,10.89-26.29,10.89-20.53,0-37.17-16.64-37.17-37.17S165.53,0,186.05,0C196.32,0,205.61,4.16,212.34,10.89l-13.15,13.15c-3.36-3.36-8.01-5.45-13.14-5.45-10.26,0-18.59,8.32-18.59,18.59s8.32,18.59,18.59,18.59c5.13,0,9.78-2.08,13.14-5.45Z"/><path d="M305.28,46.55h0v27.8h-16.53V0h29.39c14.64,0,24.06,10.04,24.06,23.22,0,10.04-5.54,17.68-14.64,20.92l15.06,30.21h-18.2l-10.74-22.52c-1.55-3.23-4.82-5.28-8.4-5.28Zm9.73-14.23c6.8,0,10.46-3.77,10.46-9,0-5.54-3.66-9-10.46-9h-9.73v17.99h9.73Z"/><path d="M414.41,7.4C409.84,2.83,403.53,0,396.56,0,382.61,0,371.31,11.31,371.31,25.25v23.85c0,13.95,11.31,25.25,25.25,25.25s25.25-11.31,25.25-25.25V25.25c0-6.97-2.83-13.29-7.4-17.85Zm-7.91,41.38c0,6.28-3.65,11.38-9.94,11.38s-9.94-5.1-9.94-11.38V25.57c0-6.28,3.65-11.38,9.94-11.38s9.94,5.23,9.94,11.38v23.21Z"/><path d="M470.58,15.17c-6.03,6.38-21.1,25.09-23.58,59.18h-17.79c2.66-39.31,22.21-59.3,22.21-59.3h-27.55V.22h46.72V15.17Z"/><path d="M495.95,.11l-21.79,.22V74.46h21.79c20.53,0,37.17-16.64,37.17-37.17S516.48,.11,495.95,.11Zm4.41,56.81h-9.28V17.1l9.28-.12c8.74,0,15.83,8.95,15.83,19.98s-7.09,19.97-15.83,19.97Z"/></g><g><path d="M61.98,0C41.45,0,24.81,16.64,24.81,37.17s16.64,37.17,37.17,37.17,37.17-16.64,37.17-37.17S82.51,0,61.98,0Zm0,55.76c-10.26,0-18.59-8.32-18.59-18.59s8.32-18.59,18.59-18.59,18.59,8.32,18.59,18.59-8.32,18.59-18.59,18.59Z"/><path d="M59.72,78.01c-6.25,4.78-14.07,7.61-22.54,7.61C16.64,85.62,0,68.98,0,48.44,0,30.45,12.79,15.44,29.78,12c-5.44,6.95-8.68,15.69-8.68,25.17,0,21.78,17.13,39.65,38.62,40.83Z"/></g><g><path d="M610.03,22.98h-6.69c-.27-5.34-2.18-9.41-5.72-12.21-3.55-2.8-8.33-4.21-14.34-4.21-5.67,0-10.1,1.18-13.27,3.55-3.18,2.37-4.76,5.71-4.76,10.03,0,1.55,.19,2.92,.56,4.1,.37,1.18,1.05,2.21,2.03,3.09,.98,.88,1.89,1.61,2.74,2.18,.84,.57,2.21,1.15,4.1,1.72,1.89,.57,3.41,1.01,4.56,1.32,1.15,.3,2.97,.73,5.47,1.27,2.7,.61,4.9,1.11,6.59,1.52,1.69,.41,3.61,.95,5.78,1.62,2.16,.68,3.9,1.35,5.22,2.03,1.32,.68,2.69,1.52,4.1,2.53,1.42,1.01,2.5,2.13,3.24,3.34,.74,1.22,1.37,2.65,1.87,4.31,.51,1.66,.76,3.5,.76,5.52,0,4.93-1.37,9.05-4.1,12.36-2.74,3.31-6.06,5.61-9.98,6.89-3.92,1.28-8.28,1.93-13.07,1.93-8.98,0-16.03-2.19-21.13-6.59-5.1-4.39-7.65-10.44-7.65-18.14v-.61h6.59c0,6.55,2.01,11.48,6.03,14.79,4.02,3.31,9.58,4.97,16.67,4.97,6.21,0,11.11-1.32,14.69-3.95,3.58-2.63,5.37-6.28,5.37-10.94s-1.71-7.75-5.12-9.68c-3.41-1.92-9.85-4-19.3-6.23-3.04-.67-5.29-1.22-6.74-1.62-1.45-.41-3.39-1.11-5.83-2.13-2.43-1.01-4.24-2.11-5.42-3.29-1.18-1.18-2.25-2.79-3.19-4.81-.95-2.03-1.42-4.39-1.42-7.09,0-6.08,2.25-10.89,6.74-14.44,4.49-3.55,10.62-5.32,18.39-5.32s14.08,1.87,18.75,5.62c4.66,3.75,7.16,9.27,7.5,16.57Z"/><path d="M643.06,22.27v5.17h-10.74V60.47c0,1.76,.03,2.99,.1,3.7,.07,.71,.29,1.55,.66,2.53,.37,.98,1.03,1.64,1.98,1.98,.94,.34,2.23,.51,3.85,.51,.95,0,2.33-.1,4.15-.3v5.47c-2.09,.27-3.95,.41-5.57,.41-6.28,0-9.9-1.99-10.84-5.98-.4-1.69-.61-5.5-.61-11.45V27.44h-9.22v-5.17h9.22V6.36h6.28v15.91h10.74Z"/><path d="M694.33,22.27v52.08h-5.88v-9.63c-3.85,7.43-9.97,11.15-18.34,11.15-5.54,0-9.91-1.6-13.12-4.81-3.21-3.21-4.81-7.92-4.81-14.14V22.27h6.38v31.92c0,5.4,1,9.44,2.99,12.11,1.99,2.67,5.39,4,10.18,4,5.07,0,9.05-1.84,11.96-5.52,2.9-3.68,4.36-8.26,4.36-13.73V22.27h6.28Z"/><path d="M752.49,2.2V74.35h-5.78v-10.23c-1.55,3.85-3.97,6.77-7.24,8.76-3.28,1.99-7.11,2.99-11.5,2.99-7.23,0-12.95-2.48-17.17-7.45-4.22-4.97-6.33-11.67-6.33-20.11s2.11-15.06,6.33-20.06c4.22-5,9.88-7.5,16.97-7.5,9.05,0,15.23,3.75,18.54,11.25V2.2h6.18Zm-24.01,23.81c-5.34,0-9.61,2.01-12.82,6.03-3.21,4.02-4.81,9.41-4.81,16.16s1.6,12.36,4.81,16.41c3.21,4.05,7.51,6.08,12.92,6.08s9.91-1.99,13.12-5.98c3.21-3.98,4.81-9.46,4.81-16.41,0-6.21-1.52-11.48-4.56-15.81-3.04-4.32-7.53-6.48-13.48-6.48Z"/><path d="M771.33,1.9V12.34h-6.38V1.9h6.38Zm0,20.37v52.08h-6.38V22.27h6.38Z"/><path d="M805.78,20.75c7.5,0,13.46,2.5,17.88,7.5,4.42,5,6.64,11.75,6.64,20.27s-2.2,15.12-6.59,20.01c-4.39,4.9-10.37,7.35-17.94,7.35s-13.6-2.48-18.09-7.45c-4.49-4.97-6.74-11.67-6.74-20.11s2.25-15.06,6.74-20.06c4.49-5,10.52-7.5,18.09-7.5Zm13.17,11.4c-3.31-4.02-7.74-6.03-13.27-6.03s-9.97,2.01-13.27,6.03c-3.31,4.02-4.96,9.41-4.96,16.16s1.64,12.33,4.91,16.31c3.28,3.99,7.78,5.98,13.53,5.98s9.93-1.99,13.17-5.98c3.24-3.98,4.86-9.39,4.86-16.21s-1.66-12.24-4.97-16.26Z"/><path d="M877.32,37.47h-6.18c-.61-7.56-5.3-11.35-14.08-11.35-3.72,0-6.67,.78-8.87,2.33-2.2,1.55-3.29,3.65-3.29,6.28,0,1.28,.24,2.4,.71,3.34,.47,.95,1.01,1.71,1.62,2.28,.61,.57,1.67,1.13,3.19,1.67,1.52,.54,2.84,.96,3.95,1.27,1.11,.3,2.92,.73,5.42,1.27,2.23,.54,4.02,.98,5.37,1.32,1.35,.34,3.02,.93,5.02,1.77,1.99,.85,3.56,1.76,4.71,2.74,1.15,.98,2.14,2.3,2.99,3.95,.84,1.66,1.27,3.53,1.27,5.62,0,4.8-1.91,8.66-5.72,11.6-3.82,2.94-8.8,4.41-14.95,4.41-6.69,0-11.89-1.62-15.6-4.86-3.72-3.24-5.64-7.84-5.78-13.78h6.18c0,4.32,1.35,7.63,4.05,9.93,2.7,2.3,6.48,3.44,11.35,3.44,4.26,0,7.68-.93,10.28-2.79,2.6-1.86,3.9-4.31,3.9-7.35,0-1.62-.42-3.04-1.27-4.26-.85-1.22-1.98-2.18-3.39-2.89-1.42-.71-2.82-1.28-4.21-1.72-1.39-.44-2.85-.83-4.41-1.17-.47-.07-.81-.13-1.01-.2-.47-.13-1.55-.39-3.24-.76-1.69-.37-2.87-.64-3.55-.81-.68-.17-1.76-.49-3.24-.96-1.49-.47-2.57-.91-3.24-1.32-.68-.41-1.54-.98-2.58-1.72-1.05-.74-1.82-1.54-2.33-2.38-.51-.84-.95-1.84-1.32-2.99-.37-1.15-.56-2.43-.56-3.85,0,4.52,1.71-8.11,5.12-10.74,3.41-2.63,8.09-3.95,14.03-3.95s10.71,1.42,14.29,4.26c3.58,2.84,5.37,6.96,5.37,12.36Z"/></g></g></g>
                    </svg>
                 </div>
            </div>
        </div>
    </div>
`;










