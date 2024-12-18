require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

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

// connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion :', err);
  } else {
    console.log('Connexion réussie :', res.rows);
  }
});

module.exports = pool;

// Route pour gérer l'ajout d'un appareil (version async/await conservée)
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
      INSERT INTO appareils (num_suivi, letype, lamarque, lemodele, autre_appareil, letat, serie_imei, nomut, mtp, consta, proposition, prix, acompte, accord, client_id, resultat, date_depot) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;

    const result = await pool.query(sql, [
      appareilData.num_suivi,
      appareilData.letype,
      marque,
      modele,
      appareilData.autre_appareil,
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
      console.error("Erreur lors de la récupération des données :", err.message);
      return res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appareil non trouvé" });
    }

    res.json(result.rows[0]);
  });
});

// Route pour mettre à jour le statut du ticket
app.put('/updateTicketStatus', (req, res) => {
  const { ticketId, status, commentaire } = req.body;

  const sql = `
    UPDATE appareils 
    SET resultat = $1, commentaire = COALESCE(commentaire || ' | ', '') || $2 
    WHERE num_suivi = $3
  `;

  pool.query(sql, [status, commentaire || '', ticketId], (err) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du statut :', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
    }
    res.status(200).json({ message: 'Statut mis à jour avec succès.' });
  });
});

// Route pour marquer un ticket comme récupéré
app.post('/recupererTicket/:id', (req, res) => {
  const ticketId = req.params.id;

  const sql = 'UPDATE appareils SET resultat = $1 WHERE id = $2';

  pool.query(sql, ['Récupéré', ticketId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du ticket:', err);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du ticket' });
    }

    if (result.rowCount === 0) {
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
      client.nom, client.prenom, client.telephone, appareils.commentaire
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

// Route pour récupérer les tickets terminés (ajout du commentaire)
app.get('/ticketsTermines', (req, res) => {
  const sql = `
    SELECT 
      appareils.date_depot,
      appareils.id,
      appareils.num_suivi,
      appareils.client_id,
      appareils.letype, appareils.lamarque, appareils.lemodele, appareils.autre_appareil,
      appareils.proposition,
      appareils.prix,
      appareils.commentaire,  -- Assurez-vous que cette colonne est incluse
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
      appareils.letype, appareils.lamarque, appareils.lemodele, appareils.autre_appareil,
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

// route pour connexion client 
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

// route pour recuperer le client connecté 
app.get('/client/:id', (req, res) => {
  const clientId = req.params.id;

  const query = `SELECT * FROM client WHERE id = $1`;

  pool.query(query, [clientId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des données client :', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des données client' });
    }

    if (results.rows.length > 0) {
      res.json(results.rows[0]);
    } else {
      res.status(404).json({ message: 'Client non trouvé' });
    }
  });
});

app.get('/repairList/:clientId', (req, res) => {
  const clientId = req.params.clientId;

  const query = `
      SELECT 
          appareils.num_suivi, 
          appareils.date_depot, 
          appareils.letype, appareils.lamarque, appareils.lemodele, appareils.autre_appareil,
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

app.post('/ajouterCommentaire', (req, res) => {
  const { ticketId, commentaire } = req.body;

  const sql = `INSERT INTO commentaires (ticket_id, commentaire) VALUES ($1, $2) RETURNING *`;
  pool.query(sql, [ticketId, commentaire], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'insertion :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion du commentaire" });
    }
    res.json({ message: "Commentaire ajouté", commentaire: result.rows[0] });
  });
});

app.get('/commentaires/:ticketId', (req, res) => {
  const { ticketId } = req.params;

  const sql = `SELECT commentaire FROM appareils WHERE num_suivi = $1`;
  pool.query(sql, [ticketId], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des commentaires :", err);
      return res.status(500).json({ error: "Erreur lors de la récupération des commentaires" });
    }
    res.json(result.rows);
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

app.put('/modifierTicket', (req, res) => {
  const { ticketId, commentaire } = req.body;

  const sql = `
    UPDATE appareils
    SET commentaire = $1
    WHERE num_suivi = $2
  `;

  pool.query(sql, [commentaire, ticketId], (err) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du ticket :', err);
      return res.status(500).json({ error: 'Mise à jour impossible.' });
    }
    res.status(200).json({ message: 'Ticket mis à jour avec succès.' });
  });
});

app.listen(3000, () => {
  console.log('Serveur démarré sur le port 3000');
});
