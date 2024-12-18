const BACKEND_URL_TicketsTermines = 'http://localhost:3000/ticketsTermines';

document.addEventListener('DOMContentLoaded', () => {
    fetch(BACKEND_URL_TicketsTermines)
        .then(response => response.json())
        .then(tickets => {
            console.log('Tickets terminés:', tickets);
            const container = document.getElementById('ticketsContainer');

            // Vérifier si des tickets sont reçus
            if (!Array.isArray(tickets) || tickets.length === 0) {
                container.innerHTML = '<p>Aucun ticket à afficher.</p>';
                return;
            }

            tickets.forEach(ticket => {
                const ticketElement = document.createElement('div');
                ticketElement.classList.add('ticket');

                // Formater la date de dépôt
                let dateDepot = 'N/A';
                if (ticket.date_depot) {
                    dateDepot = new Date(ticket.date_depot).toLocaleDateString('fr-FR');
                }

                // On suppose que `ticket.commentaire` est retourné par l'API.
                // Si ce n'est pas le cas, assurez-vous de le renvoyer côté backend.
                ticketElement.innerHTML = `
                    <h3>Réparation Terminée</h3>
                    <div class="compartment">
                        <label class="lab">Nom Prénom:</label>
                        <span class="spa">${ticket.prenom} ${ticket.nom}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">N Tel:</label>
                        <span class="spa">${ticket.telephone}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">Numéro Commande:</label>
                        <span class="spa">${ticket.num_suivi}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">ID CLIENT:</label>
                        <span class="spa">${ticket.client_id}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">Date-Dépôt:</label>
                        <span class="spa">${dateDepot}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">Appareil:</label>
                        <span class="spa">${ticket.letype} ${ticket.lamarque} ${ticket.lemodele || ''} ${ticket.autre_appareil || ''}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">REPARATIONS:</label>
                        <span class="spa">${ticket.proposition}</span>
                    </div>
                    <div class="compartment">
                        <label class="lab">Prix:</label>
                        <span class="spa">${ticket.prix}€</span>
                    </div>
                    <!-- Ajouter le bouton Récupérer -->
                    <button class="recupere-button">Récupérer</button>
                    
                    <div class="compartment">
                      <label class="lab">Commentaire:</label>
                      <textarea id="commentaire-${ticket.num_suivi}" placeholder="Ajouter des notes">${ticket.commentaire || ''}</textarea>
                      <button onclick="modifierTicket('${ticket.num_suivi}')">Enregistrer</button>
                    </div>
                `;

                const BACKEND_URL_RecupererTicket = 'http://localhost:3000/recupererTicket';

                // Ajouter l'écouteur d'événement pour le bouton Récupérer
                ticketElement.querySelector('.recupere-button').addEventListener('click', () => {
                    fetch(`${BACKEND_URL_RecupererTicket}/${ticket.id}`, {
                        method: 'POST'
                    })
                        .then(response => {
                            if (response.ok) {
                                // Retirer le ticket de la page actuelle
                                ticketElement.remove();
                            } else {
                                console.error('Erreur lors de la récupération du ticket');
                            }
                        })
                        .catch(error => {
                            console.error('Erreur:', error);
                        });
                });

                // Récupérer la textarea et ajouter un événement blur pour sauvegarde automatique
                const textarea = ticketElement.querySelector(`#commentaire-${ticket.num_suivi}`);
                textarea.addEventListener('blur', () => {
                    modifierTicket(ticket.num_suivi);
                });

                container.appendChild(ticketElement);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des tickets terminés:', error);
        });
});

// Fonction pour modifier le ticket (mettre à jour le commentaire)
function modifierTicket(ticketId) {
  const commentaire = document.getElementById(`commentaire-${ticketId}`).value;

  fetch('http://localhost:3000/modifierTicket', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketId: ticketId,
      commentaire: commentaire
    }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Réponse du serveur :', data);
      alert('Le commentaire a été modifié avec succès.');
      // Pas besoin de recharger la page, le commentaire est déjà à jour
    })
    .catch(error => {
      console.error('Erreur lors de la modification du commentaire :', error);
      alert('Une erreur est survenue lors de la modification.');
    });
}

