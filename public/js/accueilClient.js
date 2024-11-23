// Initialiser Supabase
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseKey = 'public-anonymous-key';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);


document.querySelector('form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const inputSuivi = document.getElementById('numeroSuivi').value.trim();
  const inputNom = document.getElementById('nom').value.trim();

  // Vérifier que les champs ne sont pas vides
  if (!inputSuivi || !inputNom) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  try {
    let { data: clientInfo, error } = await supabase
      .rpc('get_client_info', { tracking_number: inputSuivi, client_name: inputNom });

    if (error || !clientInfo || clientInfo.length === 0) {
      console.error('Erreur lors de la connexion :', error);
      alert('Informations incorrectes. Veuillez réessayer.');
    } else {
      // Connexion réussie
      localStorage.setItem('dataClient', JSON.stringify(clientInfo[0]));
      console.log('Données du client stockées, redirection vers espaceClient.html');
      window.location.assign('espaceClient.html');
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    alert('Une erreur est survenue lors de la connexion.');
  }
});