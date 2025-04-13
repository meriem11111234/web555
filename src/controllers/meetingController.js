const pool = require('../config/db');
const nodemailer = require("nodemailer"); // permet d'envoyer des mails 



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "djabelamailys01@gmail.com",
    pass: "gepm haxl sozf gipl"
  }
});

// Génère un code de réunion aléatoire
function generateMeetingCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


const createMeeting = async (req, res) => {
  const { title, description, invitedUsers } = req.body;  //réccupère les info du formulaire rempli par l'organisateur 
  const userId = req.session.user.id; //récuperer l'utilisateur 
  const code = generateMeetingCode();

  try {
    //Créer la réunion :
    const result = await pool.query(
      "INSERT INTO meetings (title, description, creator_id, code) VALUES ($1, $2, $3, $4) RETURNING id, code",
      [title, description, userId, code]
    );

    const meetingId = result.rows[0].id;  //l'identifiant de cette réunion 

    // Ajouter le créateur comme participant
    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'organisateur')",
      [meetingId, userId]
    );

    // Insérer les créneaux proposés
  const { slots } = req.body;   //On réccupère les crénaux horaires de la réunion 

   /*-On vérifie que les champs start et enf sont bien définis
     - Ensuite si les horaires sont envoyés sous forme de tableau , on les transforme en tableau  */
if (slots?.start_time && slots?.end_time) {  
  const startList = Array.isArray(slots.start_time) ? slots.start_time : [slots.start_time];
  const endList = Array.isArray(slots.end_time) ? slots.end_time : [slots.end_time];

  /*On insère chaque créneau proposé dans la table meeting_slots avec l'id de la réunion */ 
  for (let i = 0; i < startList.length; i++) {
    await pool.query(
      "INSERT INTO meeting_slots (meeting_id, start_time, end_time) VALUES ($1, $2, $3)",
      [meetingId, startList[i], endList[i]]
    );
  }
}


    /* Invitations (liste d'ID dans invitedUsers)
       Gérer un seul élément : si inviteUser est une seule valeur , on le transforme en tabelau à fin de le gérer de la m manièere que si on a plusieurs utilisateurs 
       Ensuite ajouter les invités à la réunion 

    */

    let invited = invitedUsers;
    if (!Array.isArray(invited)) invited = [invited];
    for (let uid of invited) {
      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'invité')",
        [meetingId, uid]
      );

      const userEmailResult = await pool.query("SELECT email FROM users WHERE id = $1", [uid]);
      const email = userEmailResult.rows[0]?.email;

      // Envoi de l'email d'invitation
      if (email) {
        await transporter.sendMail({
          from: "no-reply@reunions.com",
          to: email,
          subject: "Invitation à une réunion",
          text: `Vous avez été invité à une réunion : ${title}\nVoici le lien pour y accéder : http://localhost:3000/meeting/code/${code}`,
        });
      }
    }

    res.redirect(`/meeting/code/${code}`);  //une fois tout est ok , le participant est rédirigé vers la page de la réunion
  } catch (error) {
    console.error("Erreur : création de la réunion :", error);
  
    const users = await pool.query("SELECT id, first_name, last_name, email FROM users");
  
    res.status(500).render("index", {
      page: "create-meeting",
      user: req.session.user,
      allUsers: users.rows, //  pour éviter le crash
      error: "Erreur interne du serveur lors de la création de la réunion !",
    });
  }  
};

/*Une fonction qui va faire des requêtes a la base de donnée  */
const renderCreateMeetingPage = async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const users = await pool.query("SELECT id, first_name, last_name, email FROM users");
     //On rend la page create-meeting.ejs via index.ejs avec les info de l'utilisateur , la liste ALLUsers, 
    res.render("index", {
      page: "create-meeting",
      user: req.session.user,
      allUsers: users.rows
    });
  } catch (error) {
    console.error("Erreur : chargement des utilisateurs :", error);
    res.status(500).render("index", {
      page: "create-meeting",
      user: req.session.user,
      allUsers: [], 
      error: "Erreur :chargement des utilisateurs"
    });
  }
};



// Afficher les détails d’une réunion (GET /api/meetings/meeting/code/:code) Via son code 
const getMeetingDetails = async (req, res) => {
  const meetingCode = req.params.code;

  if (!req.session.user) return res.redirect("/login");

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE code = $1", [meetingCode]);  //On récupère la réunion associé a ce code 
    const meeting = meetingResult.rows[0];

    if (!meeting) {
      return res.status(404).render("index", { page: "meeting", error: "Réunion non trouvée" });
    }
    const participantsResult = await pool.query(`
      SELECT users.id, users.first_name, users.last_name, meeting_participants.response 
      FROM users 
      JOIN meeting_participants ON users.id = meeting_participants.user_id 
      WHERE meeting_participants.meeting_id = $1
    `, [meeting.id]);
    
    const availabilityResult = await pool.query(`
      SELECT users.first_name, users.last_name, a.start_time, a.end_time
      FROM availabilities a
      JOIN users ON users.id = a.user_id
    `);
    const slotsResult = await pool.query(
      "SELECT * FROM meeting_slots WHERE meeting_id = $1 ORDER BY start_time",
      [meeting.id]
    );
    const slots = slotsResult.rows;
    
     /* On récupere les réponses des utilisaters connectés pour chaque créneau */
    const slotResponsesResult = await pool.query(`
      SELECT slot_id, user_id, response 
      FROM slot_responses 
      WHERE user_id = $1
    `, [req.session.user.id]);
    
    // On les structure dans un objet  { slot_id: réponse }
    const userResponses = {};
    slotResponsesResult.rows.forEach(r => {
      userResponses[r.slot_id] = r.response;
    });
     // On récuperes toutes les réponses de tous les utilisateurs 
    const allSlotResponsesResult = await pool.query(`
      SELECT slot_id, user_id, response 
      FROM slot_responses 
      WHERE slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = $1)
    `, [meeting.id]);
    
    const allSlotResponses = allSlotResponsesResult.rows;
    
    
    /* On envoie toutes les infos à la vue EJS pour afficher:
       -le titre de la réunion
       -les créneaux
       -les participants
       -qui est dispo et quand ...
       */ 
    res.render("index", {
      page: "meeting",
      meeting,
      participants: participantsResult.rows,
      meetingAvailabilities: availabilityResult.rows,
      user: req.session.user,
      slots,
      userResponses,
      allSlotResponses
    });
    
  } catch (error) {
    console.error("Erreur : récupération des détails de la réunion :", error);
    res.status(500).render("index", { page: "meeting", error: "Erreur interne du serveur !" });
  }
};

module.exports = {
  createMeeting,
  renderCreateMeetingPage,
  getMeetingDetails,
};

	
