document.addEventListener('DOMContentLoaded', () => {

    const BACKEND_URL_HistoriqueL = 'http://localhost:3000/historiqueTickets';  

    fetch(BACKEND_URL_HistoriqueL)
        .then(response => response.json())
        .then(tickets => {
            const tableBody = document.querySelector('#historiqueTable tbody');
            tickets.forEach(ticket => {
                const row = document.createElement('tr');
                const appareil = `${ticket.letype} ${ticket.lamarque} ${ticket.lemodele}`;

                const dateDepot = ticket.date_depot || 'N/A';
                row.innerHTML = `
                    <td>${dateDepot}</td>
                    <td>${ticket.nom} ${ticket.prenom}</td>
                    <td>${appareil}</td>
                    <td>${ticket.num_suivi}</td>
                    <td>${ticket.proposition}</td>
                    <td>${ticket.prix}€</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des tickets:', error);
        });
});


const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#historiqueTable tbody tr');

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let match = false;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].innerText.toLowerCase().includes(filter)) {
                match = true;
                break;
            }
        }
        row.style.display = match ? '' : 'none';
    });
});
