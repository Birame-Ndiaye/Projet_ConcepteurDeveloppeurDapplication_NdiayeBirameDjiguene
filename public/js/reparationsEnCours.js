const BACKEND_URl_RéparationEnCours = 'http://localhost:3000/tickets?status=En%20Cours%20de%20Réparation';

document.addEventListener('DOMContentLoaded', () => {
  // Champs cachés nécessaires pour le PDF (assurez-vous qu’ils existent dans votre HTML)
  // Si vous ne les avez pas dans votre HTML, ajoutez-les dynamiquement :
  const hiddenFields = [
    'lePrenom', 'leNom', 'numTel', 'email', 'num_suivi', 'letype', 'lamarque', 'lemodele',
    'autre_appareil', 'serie_imei', 'letat', 'consta', 'proposition', 'prix', 'acompte', 'noteClient'
  ];
  
  hiddenFields.forEach(id => {
    if (!document.getElementById(id)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.id = id;
      document.body.appendChild(input);
    }
  });

  // Charger les données du client depuis le localStorage
  const pdfData = JSON.parse(localStorage.getItem('pdfData'));
  if (pdfData) {
    // Remplir les champs cachés avec les données du pdfData
    document.getElementById('lePrenom').value = pdfData.lePrenom || '';
    document.getElementById('leNom').value = pdfData.leNom || '';
    document.getElementById('numTel').value = pdfData.numTel || '';
    document.getElementById('email').value = pdfData.email || '';
    document.getElementById('num_suivi').value = pdfData.num_suivi || '';
    document.getElementById('letype').value = pdfData.letype || '';
    document.getElementById('lamarque').value = pdfData.lamarque || '';
    document.getElementById('lemodele').value = pdfData.lemodele || '';
    document.getElementById('autre_appareil').value = pdfData.autre_appareil || '';
    document.getElementById('serie_imei').value = pdfData.serie_imei || '';
    document.getElementById('letat').value = pdfData.letat || '';
    document.getElementById('consta').value = pdfData.consta || '';
    document.getElementById('proposition').value = pdfData.proposition || '';
    document.getElementById('prix').value = pdfData.prix || '';
    document.getElementById('acompte').value = pdfData.acompte || '';
    document.getElementById('noteClient').value = pdfData.commentaire || '';
  }

  // Récupération des tickets
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
          const date = new Date(ticket.date_depot);
          dateDepot = date.toISOString().split('T')[0];
        } else {
          const today = new Date();
          dateDepot = today.toISOString().split('T')[0];
        }

        // Créer le contenu du ticket
        ticketElement.innerHTML = `
          <h3>En Cours de Réparation</h3>
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
            <a href="#" onclick="remplirChampsEtGenererPdf(
              '${ticket.num_suivi}',
              '${ticket.prenom}',
              '${ticket.nom}',
              '${ticket.telephone || ''}',
              '${ticket.email || ''}',
              '${ticket.letype || ''}',
              '${ticket.lamarque || ''}',
              '${ticket.lemodele || ''}',
              '${ticket.autre_appareil || ''}',
              '${ticket.serie_imei || ''}',
              '${ticket.letat || ''}',
              '${ticket.consta || ''}',
              '${ticket.proposition || ''}',
              '${ticket.prix || ''}',
              '${ticket.acompte || ''}',
              '${ticket.commentaire || ''}'
            )">${ticket.num_suivi}</a>
          </div>
          <div class="compartment">
            <label class="lab">Date Dépôt:</label>
            <input type="date" id="date-depot-${ticket.num_suivi}" name="date-depot" value="${dateDepot}">
          </div>
          <div class="compartment">
            <label class="lab">Appareil:</label>
            <span class="spa">${ticket.letype || ''} ${ticket.lamarque || ''} ${ticket.lemodele || ''} ${ticket.autre_appareil || ''}</span>
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
          <div class="compartment">
            <label class="lab">Commentaire:</label>
            <textarea id="commentaire-${ticket.num_suivi}">${ticket.commentaire || ''}</textarea>
            <button onclick="modifierTicket('${ticket.num_suivi}')">Enregistrer</button>
          </div>
        `;

        const textarea = ticketElement.querySelector(`#commentaire-${ticket.num_suivi}`);

        // Sauvegarde automatique du commentaire lorsqu'on quitte le champ (blur)
        textarea.addEventListener('blur', () => {
          modifierTicket(ticket.num_suivi);
        });

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
  const commentaire = prompt("Ajoutez un commentaire pour ce changement de statut :");
  $.ajax({
    url: BACKEND_URL_UpdateTicketStatus2,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ 
      ticketId: ticketId, 
      status: status, 
      commentaire: commentaire
    }),
    success: function (response) {
      console.log('Statut du ticket mis à jour avec commentaire:', response);
      alert('Statut mis à jour avec commentaire.');

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
      alert('Le ticket a été modifié avec succès.');
    })
    .catch(error => {
      console.error('Erreur lors de la modification du ticket :', error);
      alert('Une erreur est survenue lors de la modification.');
    });
}

// Fonction appelée au clic sur le n° de suivi pour remplir les champs et générer le PDF
function remplirChampsEtGenererPdf(numSuivi, prenom, nom, telephone, email, letype, lamarque, lemodele, autre_appareil, serie_imei, letat, consta, proposition, prix, acompte, commentaire) {
  document.getElementById('lePrenom').value = prenom;
  document.getElementById('leNom').value = nom;
  document.getElementById('numTel').value = telephone;
  document.getElementById('email').value = email;
  document.getElementById('num_suivi').value = numSuivi;
  document.getElementById('letype').value = letype;
  document.getElementById('lamarque').value = lamarque;
  document.getElementById('lemodele').value = lemodele;
  document.getElementById('autre_appareil').value = autre_appareil;
  document.getElementById('serie_imei').value = serie_imei;
  document.getElementById('letat').value = letat;
  document.getElementById('consta').value = consta;
  document.getElementById('proposition').value = proposition;
  document.getElementById('prix').value = prix;
  document.getElementById('acompte').value = acompte;
  document.getElementById('noteClient').value = commentaire;

  generatePdf();  
}

// Implémentation de generatePdf()
function generatePdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let positionY = 0;

  const logoImage = document.getElementById('logo2');
  const logoWidth = 40;
  const logoHeight = 20;
  const logoX = (pageWidth - logoWidth) / 2;
  
  if (logoImage && logoImage.src) {
    const canvasLogo = document.createElement('canvas');
    const ctxLogo = canvasLogo.getContext('2d');
    const imgLogo = new Image();
    imgLogo.src = logoImage.src;

    imgLogo.onload = function () {
        canvasLogo.width = imgLogo.width;
        canvasLogo.height = imgLogo.height;
        ctxLogo.drawImage(imgLogo, 0, 0);
        const logoDataURL = canvasLogo.toDataURL('images/png');

        // Ajouter le logo centré
        doc.addImage(logoDataURL, 'PNG', logoX, positionY, logoWidth, logoHeight);
        positionY += logoHeight + 1;

        // Ajouter la date du jour après le logo
        addDate(doc, pageWidth, positionY);
        positionY += 4;

        // Ajouter les informations de contact
        addContactInfo(doc, pageWidth, positionY);
        positionY += 10;

       // Ajouter le code-barres et les données du formulaire
addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
positionY = finalPositionY;

// Récupérer le nom et le prénom du client directement à partir des éléments du DOM
const clientFirstName = document.getElementById('lePrenom') ? document.getElementById('lePrenom').value : 'prenom';
const clientLastName = document.getElementById('leNom') ? document.getElementById('leNom').value : 'nom';
const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
doc.save(fileName);
});



    };

    imgLogo.onerror = function () {
        console.error('Erreur lors du chargement du logo.');
        addDate(doc, pageWidth, positionY);
        positionY += 5;
        addContactInfo(doc, pageWidth, positionY);
        positionY += 10;
      // Ajouter le code-barres et les données du formulaire
addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
positionY = finalPositionY;

// Récupérer le nom et le prénom du client directement à partir des éléments du DOM
const clientFirstName = document.getElementById('lePrenom') ? document.getElementById('lePrenom').value : 'prenom';
const clientLastName = document.getElementById('leNom') ? document.getElementById('leNom').value : 'nom';
const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
doc.save(fileName);
});

    };
} else {
    console.error('Logo introuvable.');
    addDate(doc, pageWidth, positionY);
    positionY += 5;
    addContactInfo(doc, pageWidth, positionY);
    positionY += 10;
   // Ajouter le code-barres et les données du formulaire
addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
    positionY = finalPositionY;

    // Récupérer le nom et le prénom du client directement à partir des éléments du DOM
    const clientFirstName = document.getElementById('lePrenom') ? document.getElementById('lePrenom').value : 'prenom';
    const clientLastName = document.getElementById('leNom') ? document.getElementById('leNom').value : 'nom';
    const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
    doc.save(fileName);
});
}
/**
     * Ajoute la date du jour au PDF.
     * @param {jsPDF} doc - Instance de jsPDF.
     * @param {number} pageWidth 
     * @param {number} positionY 
     */

  function addDate(doc, pageWidth, positionY) {
      const today = new Date();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const dateDuJour = today.toLocaleDateString('fr-FR', options);

      doc.setFontSize(10);
      const dateTextWidth = doc.getTextWidth(dateDuJour);
      doc.text(dateDuJour, (pageWidth - dateTextWidth) / 2, positionY);
  }
    /**
     * Ajoute les informations de contact au PDF.
     * @param {jsPDF} doc - Instance de jsPDF.
     * @param {number} pageWidth
     * @param {number} positionY
     */
  function addContactInfo(doc, pageWidth, positionY) {
      const contactInfo = [
          'CONTACT@RE-KONEKT.FR',
          '05 56 68 09 66',
          '2 COURS DE L YSER 33800 BORDEAUX'
      ];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      contactInfo.forEach(info => {
          const infoWidth = doc.getTextWidth(info);
          doc.text(info, (pageWidth - infoWidth) / 2, positionY);
          positionY += 4;
      });
      return positionY;
  }

  function addBarcodeAndData(doc, pageWidth, positionY, callback) {
    const numeroSuivi = document.getElementById('num_suivi').value || '';
    const nomPrenom = (document.getElementById('lePrenom').value + ' ' + document.getElementById('leNom').value).trim() || '';
    const numero = document.getElementById('numTel').value || '';
    const email = document.getElementById('email').value || '';
    const type = document.getElementById('letype').value || '';
    const marque = document.getElementById('lamarque').value || '';
    const modele = ((document.getElementById('lemodele').value || '') + ' ' + (document.getElementById('autre_appareil').value || '')).trim() || '';
    const imei = document.getElementById('serie_imei').value || '';
    const etat = document.getElementById('letat').value || '';
    const panne = document.getElementById('consta').value || '';
    const reparationProposee = document.getElementById('proposition').value || '';
    const prix = document.getElementById('prix').value || '';
    const acompte = document.getElementById('acompte').value || '';
    const accordClient = ''; // Si vous n'avez pas ce champ, laissez par défaut
    const noteCommentaire = document.getElementById('noteClient').value || '';

    if (numeroSuivi !== 'Non spécifié') {
      JsBarcode('#barcodeCanvas', numeroSuivi, {
          format: 'CODE128',
          displayValue: false,
          width: 1,
          height: 30,
      });
    }

    const barcodeCanvas = document.getElementById('barcodeCanvas');
    const barcodeDataURL = barcodeCanvas.toDataURL('image/png');
    const barcodeWidth = 30;
    const barcodeHeight = 10;
    const barcodeX = (pageWidth - barcodeWidth) / 2;

    doc.addImage(barcodeDataURL, 'PNG', barcodeX, positionY, barcodeWidth, barcodeHeight);
    positionY += barcodeHeight + 5;

    const champs = [
        { label: 'Numéro de Suivi :', value: numeroSuivi },
        { label: 'Nom Prénom :', value: nomPrenom },
        { label: 'Numéro :', value: numero },
        { label: 'Email :', value: email },
        { label: 'Type :', value: type },
        { label: 'Marque :', value: marque },
        { label: 'Modèle :', value: modele },
        { label: 'SN / IMEI :', value: imei },
        { label: 'ÉTAT :', value: etat },
        { label: 'PANNE :', value: panne },
        { label: 'RÉPARATION :', value: reparationProposee },
        { label: 'PRIX :', value: prix + ' €' },
        { label: 'Acompte :', value: acompte + ' €' },
        { label: 'ACCORD CLIENT :', value: accordClient },
        { label: 'NOTE / COMMENTAIRE :', value: noteCommentaire },
    ];

    doc.setFontSize(10);
    champs.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, 4, positionY);
        doc.setFont('helvetica', 'normal');
        const splitValue = doc.splitTextToSize(item.value, 40);
        doc.text(splitValue, 40, positionY);
        positionY += (splitValue.length * 8);
    });

    callback(positionY);
  }

  // Génération du PDF
  if (logoImage && logoImage.src) {
      const canvasLogo = document.createElement('canvas');
      const ctxLogo = canvasLogo.getContext('2d');
      const imgLogo = new Image();
      imgLogo.src = logoImage.src;

      imgLogo.onload = function () {
          canvasLogo.width = imgLogo.width;
          canvasLogo.height = imgLogo.height;
          ctxLogo.drawImage(imgLogo, 0, 0);
          const logoDataURL = canvasLogo.toDataURL('image/png');

          doc.addImage(logoDataURL, 'PNG', logoX, positionY, logoWidth, logoHeight);
          positionY += logoHeight + 1;
          addDate(doc, pageWidth, positionY);
          positionY += 4;
          positionY = addContactInfo(doc, pageWidth, positionY);
          positionY += 2;
          
          addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
              const clientFirstName = document.getElementById('lePrenom').value || 'prenom';
              const clientLastName = document.getElementById('leNom').value || 'nom';
              const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
              doc.save(fileName);
          });
      };

      imgLogo.onerror = function () {
          console.error('Erreur lors du chargement du logo.');
          addDate(doc, pageWidth, positionY);
          positionY += 5;
          positionY = addContactInfo(doc, pageWidth, positionY);
          positionY += 2;
          addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
              const clientFirstName = document.getElementById('lePrenom').value || 'prenom';
              const clientLastName = document.getElementById('leNom').value || 'nom';
              const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
              doc.save(fileName);
          });
      };
  } else {
      console.error('Logo introuvable.');
      addDate(doc, pageWidth, positionY);
      positionY += 5;
      positionY = addContactInfo(doc, pageWidth, positionY);
      positionY += 2;
      addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
          const clientFirstName = document.getElementById('lePrenom').value || 'prenom';
          const clientLastName = document.getElementById('leNom').value || 'nom';
          const fileName = `${clientFirstName}-${clientLastName}-suivi-client.pdf`;
          doc.save(fileName);
      });
  }
}
