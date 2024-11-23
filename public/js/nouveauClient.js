function checkCustomInput(type) {// Fonction pour afficher ou masquer le champ de texte personnalisé en fonction de la sélection
    const selectElement = document.getElementById('le' + type);
    const customInput = document.getElementById('custom' + capitalize(type));

    if (selectElement && selectElement.value === 'other') {
        customInput.style.display = 'block';
    } else if (customInput) {
        customInput.style.display = 'none';
        customInput.value = ''; // Réinitialiser la valeur si le champ est caché
    }
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

$(document).ready(function () {
    // Fonction pour générer un numéro de suivi unique
    function genererNumeroSuivi() {
        const date = new Date();
        const timestamp = date.getTime();
        const random = Math.floor(Math.random() * 10000);
        return timestamp.toString() + random.toString();
    }
})
// Fonction pour générer un identifiant client basé sur le nom et le prénom
function genererIdentifiantClient(nom, prenom) {
    const random = Math.floor(Math.random() * 1000);
    return prenom.substring(0, 3).toUpperCase() + nom.substring(0, 3).toUpperCase() + random;
}

// Générer l'identifiant client basé sur le nom et le prénom
$('#leNom, #lePrenom').on('input', function () {
    const nom = $('#leNom').val().trim();
    const prenom = $('#lePrenom').val().trim();

    if (nom && prenom) {
        const idClient = genererIdentifiantClient(nom, prenom);
        $('#idInscription').val(idClient);
    } else {
        $('#idInscription').val('');
    }
});

// Gérer la soumission du formulaire client
$('#validerClient').click(function (e) {
    e.preventDefault();

    const clientForm = $('#clientForm').serializeArray();
    const formData = {};

    $.each(clientForm, function (i, field) {
        formData[field.name] = field.value;
    });

    // Vérification avant l'envoi
    if (!formData.leNom || !formData.lePrenom || !formData.numTel || !formData.email) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    console.log('Envoi des données client:', formData);

    const BACKEND_URL_NewClient = 'http://localhost:3000/nouveauClient';

    $.ajax({
        url: BACKEND_URL_NewClient,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            console.log('Client ajouté avec succès:', response);
            alert('Les informations du client ont été envoyées avec succès.');
            if (response.clientId) {
                $('#clientID').val(response.clientId);
                console.log('ID du client reçu et assigné:', response.clientId);
            } else {
                alert('L\'ID du client n\'a pas été reçu. Vérifiez l\'enregistrement du client.');
            }

            // Stocker les informations client dans le localStorage
            localStorage.setItem("dataClient", JSON.stringify(formData));

            // Utiliser l'ID du client retourné pour l'ajout de l'appareil
            $('#clientID').val(response.clientId);
        },
        error: function (xhr, status, error) {
            console.error('Erreur lors de l\'envoi des données client:', error);
            alert('Une erreur est survenue lors de l\'envoi des données du client.');
        }
    });
});

// Gérer la soumission du formulaire appareil
$('#validerAppareil').click(function (e) {
    e.preventDefault();

    const appareilForm = $('#formulaire').serializeArray();
    const formData = {};

    $.each(appareilForm, function (i, field) {
        formData[field.name] = field.value;
    });

    // Ajoutez les valeurs des champs personnalisés s'ils sont visibles
    if ($('#customModele').is(':visible')) {
        formData['customModele'] = $('#customModele').val();
    }

    // Ajoute l'ID du client récupéré lors de l'ajout de client
    formData['client_id'] = $('#clientID').val();

    // Ajoute le statut initial du ticket
    formData['resultat'] = 'En Cours de Réparation';

    console.log('Envoi des données appareil:', formData);

    // Vérifie que l'ID du client est bien présent
    if (!formData['client_id']) {
        alert('Veuillez ajouter un client avant d\'ajouter un appareil.');
        return;
    }

    // Envoyer les données de l'appareil au serveur
    const BACKEND_URL_NewAppareil = 'http://localhost:3000/nouvelAppareil';

    $.ajax({
        url: BACKEND_URL_NewAppareil,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            console.log('Appareil ajouté avec succès:', response);
            alert('Les informations de l\'appareil ont été envoyées avec succès.');

            // Rediriger vers la page "Réparations en Cours"
            window.location.href = 'reparationsEnCours.html';
        },
        error: function (xhr, status, error) {
            console.error('Erreur lors de l\'envoi des données appareil:', error);
            alert('Une erreur est survenue lors de l\'envoi des données de l\'appareil.');
        }
    });
});


//pdf
document.addEventListener('DOMContentLoaded', function () {
    const generatePdfButton = document.getElementById('generatePdf');

    generatePdfButton.addEventListener('click', function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, 200], // Format de la page en mm
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        let positionY = 10;

        // Ajouter le logo à la place du titre RE-KONEKT
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
                positionY += logoHeight + 5;

                // Ajouter la date du jour après le logo
                addDate(doc, pageWidth, positionY);
                positionY += 5;

                // Ajouter les informations de contact
                addContactInfo(doc, pageWidth, positionY);
                positionY += 15;

                // Ajouter le code-barres et les données du formulaire
                addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
                    positionY = finalPositionY;
                    // Sauvegarder le fichier PDF
                    doc.save('fichier-suivi-client.pdf');
                });
            };

            imgLogo.onerror = function () {
                console.error('Erreur lors du chargement du logo.');
                addDate(doc, pageWidth, positionY);
                positionY += 5;
                addContactInfo(doc, pageWidth, positionY);
                positionY += 15;
                addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
                    positionY = finalPositionY;
                    doc.save('fichier-suivi-client.pdf');
                });
            };
        } else {
            console.error('Logo introuvable.');
            addDate(doc, pageWidth, positionY);
            positionY += 5;
            addContactInfo(doc, pageWidth, positionY);
            positionY += 15;
            addBarcodeAndData(doc, pageWidth, positionY, function (finalPositionY) {
                positionY = finalPositionY;
                doc.save('fichier-suivi-client.pdf');
            });
        }
    });

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
    }

    /**
     * Ajoute le code-barres et les données du formulaire au PDF.
     * @param {jsPDF} doc - Instance de jsPDF.
     * @param {number} pageWidth 
     * @param {number} positionY 
     * @param {Function} callback 
     */
    function addBarcodeAndData(doc, pageWidth, positionY, callback) {
        // Récupération des données du formulaire avec des logs pour déboguer
        const numeroSuivi = document.getElementById('num_suivi') ? document.getElementById('num_suivi').value : 'Non spécifié';
        console.log('Numéro de suivi:', numeroSuivi);
        const nomPrenom = (document.getElementById('lePrenom') && document.getElementById('leNom')) ? document.getElementById('lePrenom').value + ' ' + document.getElementById('leNom').value : 'Non spécifié';
        console.log('Nom Prénom:', nomPrenom);
        const numero = document.getElementById('numTel') ? document.getElementById('numTel').value : 'Non spécifié';
        console.log('Numéro:', numero);
        const email = document.getElementById('email') ? document.getElementById('email').value : 'Non spécifié';
        console.log('Email:', email);
        const type = document.getElementById('letype') ? document.getElementById('letype').value : 'Non spécifié';
        console.log('Type:', type);
        const marque = document.getElementById('lamarque') ? document.getElementById('lamarque').value : 'Non spécifié';
        console.log('Marque:', marque);
        const modele = document.getElementById('lemodele') ? document.getElementById('lemodele').value : 'Non spécifié';
        console.log('Modèle:', modele);
        const imei = document.getElementById('serie_imei') ? document.getElementById('serie_imei').value : 'Non spécifié';
        console.log('SN / IMEI:', imei);
        const etat = document.getElementById('letat') ? document.getElementById('letat').value : 'Non spécifié';
        console.log('État:', etat);
        const panne = document.getElementById('consta') ? document.getElementById('consta').value : 'Non spécifié';
        console.log('Panne:', panne);
        const reparationProposee = document.getElementById('proposition') ? document.getElementById('proposition').value : 'Non spécifié';
        console.log('Réparation Proposée:', reparationProposee);
        const prix = document.getElementById('prix') ? document.getElementById('prix').value : 'Non spécifié';
        console.log('Prix:', prix);
        const accordClient = document.querySelector('input[name="accord"]:checked') ? document.querySelector('input[name="accord"]:checked').value : 'Non spécifié';
        console.log('Accord Client:', accordClient);
        const noteCommentaire = document.getElementById('noteClient') ? document.getElementById('noteClient').value : 'Non spécifié';
        console.log('Note / Commentaire:', noteCommentaire);

        // Générer et ajouter le code-barres
        if (numeroSuivi !== 'Non spécifié') {
            JsBarcode('#barcodeCanvas', numeroSuivi, {
                format: 'CODE128',
                displayValue: false,
                width: 1,
                height: 30,
            });
        } else {
            console.warn('Numéro de suivi non spécifié. Le code-barres ne sera pas généré.');
        }

        const barcodeCanvas = document.getElementById('barcodeCanvas');
        const barcodeDataURL = barcodeCanvas.toDataURL('image/png');
        const barcodeWidth = 50;
        const barcodeHeight = 20;
        const barcodeX = (pageWidth - barcodeWidth) / 2;

        doc.addImage(barcodeDataURL, 'PNG', barcodeX, positionY, barcodeWidth, barcodeHeight);
        positionY += barcodeHeight + 5;

        // Champs et valeurs
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
            { label: 'RÉPARATION PROPOSÉE :', value: reparationProposee },
            { label: 'PRIX :', value: prix + ' €' },
            { label: 'ACCORD CLIENT :', value: accordClient },
            { label: 'NOTE / COMMENTAIRE :', value: noteCommentaire },
        ];

        doc.setFontSize(10);
        champs.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, 4, positionY);
            positionY += 3;
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, 9, positionY);
            positionY += 5;
        });

        callback(positionY);
    }
});
