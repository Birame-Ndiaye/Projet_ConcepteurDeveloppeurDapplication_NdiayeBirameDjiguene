$(document).ready(function () {
    // Génération du numéro de suivi
    function genererNumeroSuivi() {
        const date = new Date();
        const timestamp = date.getTime();
        const random = Math.floor(Math.random() * 10000);
        return timestamp.toString() + random.toString();
    }

    // Génération de l'ID client
    function genererIdentifiantClient(nom, prenom) {
        const random = Math.floor(Math.random() * 1000);
        return prenom.substring(0, 3).toUpperCase() + nom.substring(0, 3).toUpperCase() + random;
    }

    // Assigner le numéro de suivi au chargement de la page
    $('#num_suivi').val(genererNumeroSuivi());

    // Générer l'identifiant client sur la saisie du nom et prénom
    $('#leNom, #lePrenom').on('input', function () {
        const nom = $('#leNom').val();
        const prenom = $('#lePrenom').val();

        if (nom && prenom) {
            $('#idInscription').val(genererIdentifiantClient(nom, prenom));
        }
    });

    // Gestion de la soumission du formulaire
    $('#validerBtn').click(function (e) {
        e.preventDefault();

        const appareilForm = $('#formulaire').serializeArray();
        const clientForm = $('#clientForm').serializeArray();
        const formData = {};

        $.each(appareilForm, function (i, field) {
            formData[field.name] = field.value;
        });

        $.each(clientForm, function (i, field) {
            formData[field.name] = field.value;
        });

        console.log('Sending data:', formData);

        // Envoyer les données au serveur
        const BACKEND_URL_AjoutClient = 'http://localhost:8081/addClient';

        $.ajax({
            url: BACKEND_URL_AjoutClient,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                console.log('Client ajouté avec l\'ID:', response.id);

                // Stocker les données dans le localStorage
                localStorage.setItem(formData.num_suivi, JSON.stringify(formData));

                // Rediriger vers la page des réparations en cours
                window.location.href = 'reparationsEnCours.html?num_suivi=' + formData.num_suivi;
            },
            error: function (_xhr, _status, error) {
                console.error('Erreur lors de l\'envoi des données:', error);
                alert('Une erreur est survenue lors de l\'envoi des données.');
            }
        });
    });

  
    // Gestion du menu burger (un seul bouton)
   // Gestion du menu burger
   $('#burgerMenu').click(function () {
    $('#menuLinks').toggleClass('active');
});
});
