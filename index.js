require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

/*require('dotenv').config();
const express = require('express');
//const mysql = require('mysql2');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');*/


// Configure CORS
app.use(cors());

// Configure JSON
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  }
});

/*// Configure la connexion MySQL

const pool = mysql.createConnection({
  host: "localhost",
  user: "root", // Remplacez par votre utilisateur MySQL
  password: "", // Remplacez par votre mot de passe MySQL
  database: "bddrekonekt", // Nom de la base de données créée
});
*/

// connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion :', err);
  } else {
    console.log('Connexion réussie :', res.rows);
  }
});

module.exports = pool;

/*// Connexion à MySQL
pool.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à MySQL :", err);
    return;
  }
  console.log("Connecté à MySQL");
});*/

// Route pour gérer l'ajout d'un appareil
app.post("/nouvelAppareil", async (req, res) => {
  try {
    const appareilData = req.body;

    // Vérifie que les données requises sont bien présentes
    if (!appareilData.client_id || !appareilData.num_suivi || !appareilData.letype) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const marque = appareilData.customMarque && appareilData.customMarque.trim() !== ""
      ? appareilData.customMarque
      : appareilData.lamarque;

    const modele = appareilData.customModele && appareilData.customModele.trim() !== ""
      ? appareilData.customModele
      : appareilData.lemodele;

    const dateDepot = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO appareils (num_suivi, letype, lamarque, lemodele, letat, serie_imei, nomut, mtp, consta, proposition, prix, acompte, accord, client_id, resultat, date_depot) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `;

    const result = await pool.query(sql, [
      appareilData.num_suivi,
      appareilData.letype,
      marque,
      modele,
      appareilData.letat,
      appareilData.serie_imei,
      appareilData.nomUt,
      appareilData.mtp,
      appareilData.consta,
      appareilData.proposition,
      appareilData.prix,
      appareilData.acompte,
      appareilData.accord,
      appareilData.client_id,
      appareilData.resultat,
      dateDepot,
    ]);

    res.status(201).json({
      message: "Appareil ajouté avec succès",
      appareilId: result.rows[0].id,
    });
  } catch (err) {
    console.error("Erreur lors de l'insertion:", err);
    return res.status(500).json({ error: "Erreur lors de l'insertion des données" });
  }
});

app.post("/nouvelAppareil", (req, res) => {
  const appareilData = req.body;

  // Vérifie que les données requises sont bien présentes
  if (!appareilData.client_id || !appareilData.num_suivi || !appareilData.letype) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  // Gestion de la marque et du modèle personnalisés
  const marque = appareilData.customMarque && appareilData.customMarque.trim() !== ""
    ? appareilData.customMarque
    : appareilData.lamarque;

  const modele = appareilData.customModele && appareilData.customModele.trim() !== ""
    ? appareilData.customModele
    : appareilData.lemodele;

  // Gestion de la date de dépôt
  const dateDepot = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Insére les données dans la base de données
  const sql = `
    INSERT INTO appareils (num_suivi, letype, lamarque, lemodele, letat, serie_imei, nomut, mtp, consta, proposition, prix, acompte, accord, client_id, resultat, date_depot) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
   RETURNING id
  `;

  pool.query(
    sql,
    [
      appareilData.num_suivi,
      appareilData.letype,
      marque,
      modele,
      appareilData.letat,
      appareilData.serie_imei,
      appareilData.nomUt,
      appareilData.mtp,
      appareilData.consta,
      appareilData.proposition,
      appareilData.prix,
      appareilData.acompte,
      appareilData.accord,
      appareilData.client_id,
      appareilData.resultat,
      dateDepot,
    ],
    (err, result) => {
      if (err) {
        console.error("Erreur lors de l'insertion:", err);
        return res.status(500).json({ error: "Erreur lors de l'insertion des données" });
      }

      res.status(201).json({
        message: "Appareil ajouté avec succès",
        appareilId: result.rows[0].id,
      });
    }
  );
});

// Route pour gérer l'ajout d'un nouveau client
app.post("/nouveauClient", (req, res) => {
  const {
    civilite,
    leNom,
    lePrenom,
    idInscription,
    numTel,
    email,
    noteClient,
    noteInterne,
  } = req.body;

  const insertClientQuery = `
    INSERT INTO client (civilite, nom, prenom, identifiant, telephone, email, note_client, note_interne) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
  `;

  const clientValues = [
    civilite,
    leNom,
    lePrenom,
    idInscription,
    numTel,
    email,
    noteClient,
    noteInterne,
  ];

  pool.query(insertClientQuery, clientValues, (err, result) => {
    if (err) {
      console.error("Erreur lors de l'insertion des données client :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion des données client" });
    }

    // Renvoyer l'ID du client nouvellement créé
    res.json({
      message: "Client ajouté avec succès",
      clientId: result.rows[0].id,
    });
  });
});

// Route pour récupérer un appareil avec le client lié
app.get("/appareil/:id", (req, res) => {
  const appareilId = req.params.id;

  // Requête SQL avec jointure pour récupérer l'appareil et le client
  const sql = `
    SELECT 
      appareils.*,
      client.civilite, client.nom, client.prenom, client.identifiant, client.telephone, client.email
    FROM 
      appareils
    JOIN 
      client 
    ON 
      appareils.client_id = client.id
    WHERE 
      appareils.id = $1
  `;

  pool.query(sql, [appareilId], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des données :", err.sqlMessage);
      return res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Appareil non trouvé" });
    }

    res.json(result[0]);
  });
});

// Route pour mettre à jour le statut du ticket
app.put('/updateTicketStatus', (req, res) => {
  const { ticketId, status } = req.body;

  const sql = 'UPDATE appareils SET resultat = $1 WHERE num_suivi = $2';

  pool.query(sql, [status, ticketId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }

    console.log(`Statut du ticket ${ticketId} mis à jour à ${status}`);
    res.status(200).json({ message: 'Statut mis à jour avec succès' });
  });
});

// Route pour marquer un ticket comme récupéré
app.post('/recupererTicket/:id', (req, res) => {
  const ticketId = req.params.id;

  // Requête SQL pour mettre à jour le statut du ticket à 'Récupéré'
  const sql = 'UPDATE appareils SET resultat = $1 WHERE id = $2';

  pool.query(sql, ['Récupéré', ticketId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du ticket:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du ticket' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    res.status(200).json({ message: 'Ticket récupéré avec succès' });
  });
});

// Route pour récupérer les tickets en fonction du statut
app.get('/tickets', (req, res) => {
  const status = req.query.status;

  let sql = `
    SELECT 
      appareils.*, 
      client.nom, client.prenom, client.telephone 
    FROM 
      appareils 
    JOIN 
      client 
    ON 
      appareils.client_id = client.id
  `;
  let params = [];

  if (status) {
    sql += ' WHERE appareils.resultat = $1';
    params.push(status);
  }

  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des tickets :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
    }

    res.json(results.rows);
  });
});

// Route pour récupérer les tickets terminés
app.get('/ticketsTermines', (req, res) => {
  const sql = `
    SELECT 
      appareils.date_depot,
      appareils.id,
      appareils.num_suivi,
      appareils.client_id,
      appareils.lemodele,
      appareils.proposition,
      appareils.prix,
      client.nom, client.prenom, client.telephone 
    FROM 
      appareils 
    JOIN 
      client 
    ON 
      appareils.client_id = client.id
    WHERE 
      appareils.resultat IN ('Réparé', 'Hors Service')
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des tickets terminés:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des tickets terminés' });
    }

    res.json(results.rows);
  });
});

// Route pour récupérer les tickets récupérés
app.get('/historiqueTickets', (req, res) => {
  const sql = `
    SELECT 
      appareils.date_depot,
      client.nom, client.prenom,
      appareils.letype, appareils.lamarque, appareils.lemodele,
      appareils.num_suivi,
      appareils.proposition,
      appareils.prix
    FROM 
      appareils 
    JOIN 
      client 
    ON 
      appareils.client_id = client.id
    WHERE 
      appareils.resultat = 'Récupéré'
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des tickets récupérés:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des tickets récupérés' });
    }

    const formattedResults = results.rows.map(ticket => {
      if (ticket.date_depot) {
        ticket.date_depot = new Date(ticket.date_depot).toISOString().slice(0, 10);
      }
      return ticket;
    });

    res.json(formattedResults);
  });
});

//route pour connexion client 
app.post('/connexionClient', async (req, res) => {
  const { numeroSuivi, nom } = req.body;
  const query = `SELECT * FROM client WHERE num_suivi = $1 AND nom = $2`;

  try {
    const results = await pool.query(query, [numeroSuivi, nom]);

    if (results.rows.length > 0) {
      res.json({ message: 'Connexion réussie', client: results.rows[0] });
    } else {
      res.status(401).json({ message: 'Informations incorrectes' });
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des données client :', err);
    return res.status(500).json({ error: 'Erreur lors de la vérification des données client' });
  }
});

/*app.post('/connexionClient', (req, res) => {
  const { numeroSuivi, nom } = req.body;
  const query = `SELECT * FROM client WHERE id = $1 OR nom = $2`;


  pool.query(query, [numeroSuivi, nom], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des données client :', err);
      return res.status(500).json({ error: 'Erreur lors de la vérification des données client' });
    }

    if (results.length > 0) {
      res.json({ message: 'Connexion réussie', client: results[0] });
    } else {
      res.status(401).json({ message: 'Informations incorrectes' });
    }
  });
});*/


// route pour recuperer le client connecter 

app.get('/client/:id', (req, res) => {
  const clientId = req.params.id;

  const query = `SELECT * FROM client WHERE id = $1`;

  pool.query(query, [clientId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des données client :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données client' });
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Client non trouvé' });
    }
  });
});


// route pour affichage tableau 
/*app.get('/repairList/:clientId', async (req, res) => {
  const clientId = req.params.clientId;

  const query = `
    SELECT 
      appareils.num_suivi, 
      appareils.date_depot, 
      appareils.lemodele, 
      appareils.prix, 
      appareils.resultat,
      appareils.proposition
    FROM 
      appareils
    WHERE 
      appareils.client_id = $1
  `;

  try {
    const results = await pool.query(query, [clientId]);
    res.json(results.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des réparations :', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des réparations.' });
  }
});*/

app.get('/repairList/:clientId', (req, res) => {
  const clientId = req.params.clientId;

  const query = `
      SELECT 
          appareils.num_suivi, 
          appareils.date_depot, 
          appareils.lemodele, 
          appareils.prix, 
          appareils.resultat,
          appareils.proposition
          
      FROM 
          appareils
      WHERE 
          appareils.client_id = $1
  `;

  pool.query(query, [clientId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des réparations :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des réparations.' });
    }

    res.json(results.rows);
  });
});


// route pour affichage tableau
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur du serveur');
  }
});

app.listen(3000, () => {
  console.log('Serveur démarré sur le port 3000');
});
/*
// Route de test
app.get('/', (req, res) => {
  res.send('Application en ligne !');
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur !');
});

// Démarrage du serveur
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('Erreur non capturée:', err);
});

*/