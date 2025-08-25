// js/components.js

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
            <a href="#/explore" class="btn btn-primary">Explorar Rifas</a>
            <a href="#/my-raffles" class="btn btn-primary">Mis Rifas</a>
            <a href="#/settings" class="btn btn-primary">Configuración</a>
        </div>
    </div>
`;

// Vista para crear una nueva rifa
export const getCreateRaffleView = () => `
    <div class="form-container">
        <h2>Crear Nueva Rifa</h2>
        <form id="create-raffle-form">
            <div class="form-group">
                <label for="raffle-name">Nombre de la rifa</label>
                <input type="text" id="raffle-name" required>
            </div>
            <div class="form-group">
                <label for="raffle-prize">Premio(s)</label>
                <input type="text" id="raffle-prize" required placeholder="Ej: Smart TV 55 pulgadas">
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
                <label for="payment-methods">Métodos de pago (separados por coma)</label>
                <input type="text" id="payment-methods" required placeholder="Ej: Nequi, Daviplata, Bancolombia">
            </div>
            <button type="submit" class="btn btn-primary">Crear Rifa</button>
        </form>
    </div>
`;

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

            <p class="info-row"><strong>Precio:</strong> $${raffle.ticketPrice.toLocaleString('es-CO')}</p>
            <p class="info-row"><strong>Sorteo:</strong> ${new Date(raffle.drawDate).toLocaleDateString('es-CO')}</p>
            <a href="#/raffle/${raffle.id}" class="btn btn-secondary">Participar</a>
        </div>
    </div>
    `;
};

export const getRaffleDetailView = (raffle) => `
    <div class="raffle-detail-container">
        <div class="raffle-info">
            <h2>${raffle.name}</h2>
            <p><strong>Premio:</strong> ${raffle.prize}</p>
            <p><strong>Precio del boleto:</strong> $${raffle.ticketPrice.toLocaleString('es-CO')}</p>
            <p><strong>Fecha del sorteo:</strong> ${new Date(raffle.drawDate).toLocaleDateString('es-CO')}</p>
            <p><strong>Métodos de pago:</strong> ${raffle.paymentMethods.join(', ')}</p>
        </div>
        <div class="tickets-grid-container">
            <h3>Selecciona tu número</h3>
            <div id="tickets-grid">
                </div>
        </div>
    </div>
    
    ${getTicketModal()}
`; // <-- Aquí termina la primera función

// AHORA, DEFINIMOS LA SEGUNDA FUNCIÓN POR SEPARADO
export const getTicketModal = () => `
    <div id="ticket-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3 id="modal-ticket-number">Boleto #00</h3>
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
                    <button type="button" id="generate-image-btn" class="btn btn-secondary">Crear Imagen</button>
                </div>
            </form>
        </div>
    </div>

    <div id="ticket-template" style="position: absolute; left: -9999px; width: 350px; background: white; padding: 20px; font-family: 'Poppins', sans-serif;">
        <div style="border: 2px solid #6a11cb; padding: 15px; border-radius: 10px; text-align: center;">
            <h2 style="color: #6a11cb; margin: 0; font-size: 1.8rem;">RifaPro</h2>
            <p style="margin: 5px 0 20px 0; color: #555;">¡Tu boleto para ganar!</p>
            <div style="background: linear-gradient(45deg, #6a11cb, #2575fc); color: white; padding: 10px; border-radius: 8px;">
                <p style="margin: 0; font-size: 1rem;">Número</p>
                <p id="template-number" style="margin: 5px 0; font-size: 3.5rem; font-weight: 700;">00</p>
            </div>
            <div style="text-align: left; margin-top: 20px; color: #333;">
                <p><strong>Rifa:</strong> <span id="template-raffle-name">Nombre de la Rifa</span></p>
                <p><strong>Premio:</strong> <span id="template-prize">Gran Premio</span></p>
                <p><strong>Comprador:</strong> <span id="template-buyer">Nombre del Comprador</span></p>
                <p><strong>Fecha Sorteo:</strong> <span id="template-draw-date">dd/mm/aaaa</span></p>
            </div>
            <p style="margin-top: 20px; font-size: 0.8rem; color: #777;">¡Mucha Suerte!</p>
        </div>
    </div>
`;



