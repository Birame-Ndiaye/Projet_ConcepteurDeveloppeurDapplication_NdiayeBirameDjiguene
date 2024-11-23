const BACKEND_URl_RéparationEnCours = 'http://localhost:3000/tickets?status=En%20Cours%20de%20Réparation';

document.addEventListener('DOMContentLoaded', () => {
  fetch(BACKEND_URl_RéparationEnCours)
    .then(response => response.json())
    .then(tickets => {
      const ticketContainer = document.getElementById('enCoursTickets');

      // Vider le conteneur avant d'ajouter de nouveaux tickets
      ticketContainer.innerHTML = '';

      if (!Array.isArray(tickets) || tickets.length === 0) {
        const noTicketMsg = document.createElement('p');
        noTicketMsg.textContent = 'Aucun ticket en cours de réparation.';
        ticketContainer.appendChild(noTicketMsg);
        return;
      }

      tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.classList.add('ticket');

        // Préparer la date de dépôt
        let dateDepot;

        if (ticket.date_depot) {
          // Si la date de dépôt est disponible
          const date = new Date(ticket.date_depot);
          dateDepot = date.toISOString().split('T')[0];
        } else {
          // Sinon, utiliser la date actuelle
          const today = new Date();
          dateDepot = today.toISOString().split('T')[0];
        }

        // Créer le contenu du ticket
        ticketElement.innerHTML = `
          <H3>En Cours de Réparation</H3>
          <div class="compartment">
            <label class="lab">Nom Prénom:</label>
            <span class="spa">${ticket.prenom} ${ticket.nom}</span>
          </div>
          <div class="compartment">
            <label class="lab">N Tel:</label>
            <span class="spa">${ticket.telephone || ''}</span>
          </div>
          <div class="compartment">
            <label class="lab">Numéro Commande:</label>
            <span class="spa">${ticket.num_suivi || ''}</span>
          </div>
          <div class="compartment">
            <label class="lab">Date Dépôt:</label>
         <input type="date" id="date-depot-${ticket.num_suivi}" name="date-depot" value="${dateDepot}">
          </div>
         
          <div class="compartment">
            <label class="lab">REPARATIONS:</label>
            <span class="spa">${ticket.proposition || ''}</span>
          </div>
          <div class="compartment">
            <label class="lab">STATUT:</label>
            <div class="compartmentvoyant">
              <div class="bulle vert" onclick="updateStatus('${ticket.num_suivi}', 'Réparé')" onmouseover="showMessage(event)" data-message="Réparé"></div>
              <div class="bulle orange" onclick="updateStatus('${ticket.num_suivi}', 'En Attente Pièce')" onmouseover="showMessage(event)" data-message="En Attente Pièce"></div>
              <div class="bulle rouge" onclick="updateStatus('${ticket.num_suivi}', 'Hors Service')" onmouseover="showMessage(event)" data-message="Hors Service"></div>
              <div class="bulle violet" onclick="updateStatus('${ticket.num_suivi}', 'En Cours de Diagnostic')" onmouseover="showMessage(event)" data-message="En Cours de Diagnostic"></div>
              <div class="bulle jaune" onclick="updateStatus('${ticket.num_suivi}', 'En Attente Accord')" onmouseover="showMessage(event)" data-message="En Attente Accord"></div>
            </div>
          </div>
        `;

        ticketContainer.appendChild(ticketElement);
      });
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des tickets en cours de réparation:', error);
    });
});

// Fonction pour afficher un message au survol des bulles
window.showMessage = function (event) {
  const message = event.target.getAttribute('data-message');
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = message;
  messageBox.style.display = 'block';
  messageBox.style.top = `${event.clientY + 10}px`;
  messageBox.style.left = `${event.clientX + 10}px`;
};

document.body.addEventListener('mousemove', (event) => {
  const messageBox = document.getElementById('messageBox');
  if (messageBox.style.display === 'block') {
    messageBox.style.top = `${event.clientY + 10}px`;
    messageBox.style.left = `${event.clientX + 10}px`;
  }
});

document.body.addEventListener('mouseout', (event) => {
  if (event.target.classList.contains('bulle')) {
    const messageBox = document.getElementById('messageBox');
    messageBox.style.display = 'none';
  }
});

// Fonction pour mettre à jour le statut
const BACKEND_URL_UpdateTicketStatus2 = 'http://localhost:3000/updateTicketStatus';
window.updateStatus = function (ticketId, status) {
  $.ajax({
    url: BACKEND_URL_UpdateTicketStatus2,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ ticketId: ticketId, status: status }),
    success: function (response) {
      console.log('Statut du ticket mis à jour:', response);
      // Redirection en fonction du statut
      if (status === 'Réparé' || status === 'Hors Service') {
        window.location.href = 'reparationsTerminees.html';
      } else {
        window.location.href = 'reparationsEnAttentes.html';
      }
    },
    error: function (xhr, status, error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Une erreur est survenue lors de la mise à jour du statut.');
    }
  });
};
