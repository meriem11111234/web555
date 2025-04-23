const pool = require('../config/db');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jm_baha@esi.dz",
    pass: "ujjg mobz pktm ukwk"
  }
});

function generateMeetingCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const createMeeting = async (req, res) => {
  const { title, description, invitedEmails } = req.body;
  const userId = req.session.user.id;
  const code = generateMeetingCode();

  try {
    const result = await pool.query(
      "INSERT INTO meetings (title, description, creator_id, code) VALUES ($1, $2, $3, $4) RETURNING id, code",
      [title, description, userId, code]
    );
    const meetingId = result.rows[0].id;

    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'organisateur')",
      [meetingId, userId]
    );

    const { slots } = req.body;
    if (slots?.start_time && slots?.end_time) {
      const startList = Array.isArray(slots.start_time) ? slots.start_time : [slots.start_time];
      const endList = Array.isArray(slots.end_time) ? slots.end_time : [slots.end_time];

      for (let i = 0; i < startList.length; i++) {
        await pool.query(
          "INSERT INTO meeting_slots (meeting_id, start_time, end_time) VALUES ($1, $2, $3)",
          [meetingId, startList[i], endList[i]]
        );
      }
    }

    const emailList = invitedEmails
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0);

    for (let email of emailList) {
      try {
        await pool.query(
          "INSERT INTO pending_invitations (meeting_id, email) VALUES ($1, $2)",
          [meetingId, email]
        );

        const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        const user = userResult.rows[0];

        if (user) {
          await pool.query(
            "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'invité')",
            [meetingId, user.id]
          );
        }

        await transporter.sendMail({
          from: "jm_baha@esi.dz",
          to: email,
          subject: "Invitation à une réunion",
          text: `Vous êtes invité(e) à une réunion : ${title}
        
        Cliquez ici pour y accéder : http://localhost:3000/meeting/code/${code}`
        });
        

        console.log(`✅ Email envoyé à ${email}`);
      } catch (err) {
        console.error(`❌ Erreur lors de l'envoi de l'email à ${email} :`, err.message);
      }
    }

    res.redirect(`/meeting/code/${code}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création de la réunion :", error);

    const users = await pool.query("SELECT id, first_name, last_name, email FROM users");

    res.status(500).render("index", {
      page: "create-meeting",
      user: req.session.user,
      allUsers: users.rows,
      error: "Erreur interne du serveur lors de la création de la réunion !",
    });
  }
};

const getMeetingDetails = async (req, res) => {
  const meetingCode = req.params.code;
  const emailQuery = req.query.email;
  let currentUser = req.session.user;
  const participantView = req.query.participantView === 'true';

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE code = $1", [meetingCode]);
    const meeting = meetingResult.rows[0];

    if (!meeting) {
      return res.status(404).render("index", {
        page: "home",
        user: req.session.user || null,
        error: "Réunion non trouvée"
      });
    }

    // Si l'utilisateur n'est pas connecté mais un email est présent dans l'URL
    if (!currentUser && emailQuery) {
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [emailQuery]);
      if (userResult.rows.length > 0) {
        currentUser = userResult.rows[0];
      }
    }

    const participantsResult = await pool.query(`
      SELECT users.id, users.first_name, users.last_name, users.email, meeting_participants.response 
      FROM users 
      JOIN meeting_participants ON users.id = meeting_participants.user_id 
      WHERE meeting_participants.meeting_id = $1
    `, [meeting.id]);

    const slotsResult = await pool.query(
      "SELECT * FROM meeting_slots WHERE meeting_id = $1 ORDER BY start_time",
      [meeting.id]
    );

    const slotResponsesResult = currentUser
      ? await pool.query(`
          SELECT slot_id, user_id, response 
          FROM slot_responses 
          WHERE user_id = $1
        `, [currentUser.id])
      : { rows: [] };

    const allSlotResponsesResult = await pool.query(`
      SELECT sr.slot_id, sr.user_id, u.email, sr.response 
FROM slot_responses sr
LEFT JOIN users u ON sr.user_id = u.id
WHERE sr.slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = $1)
    `, [meeting.id]);

    const pendingInvitationsResult = await pool.query(
      "SELECT email FROM pending_invitations WHERE meeting_id = $1",
      [meeting.id]
    );

    const slots = slotsResult.rows;
    const userResponses = {};
    slotResponsesResult.rows.forEach(r => {
      userResponses[r.slot_id] = r.response;
    });

    const allSlotResponses = allSlotResponsesResult.rows;
    const pendingInvitations = pendingInvitationsResult.rows;

    res.render("index", {
      page: "meeting",
      meeting,
      participants: participantsResult.rows,
      user: currentUser,
      slots,
      userResponses,
      allSlotResponses,
      pendingInvitations,
      participantView // 👈 ici
    });
    
    

  } catch (error) {
    console.error("❌ Erreur getMeetingDetails :", error);
    res.status(500).render("index", {
      page: "home",
      user: req.session.user || null,
      error: "Erreur interne du serveur !"
    });
  }
};




const renderCreateMeetingPage = async (req, res) => {

  try {
    const users = await pool.query("SELECT id, first_name, last_name, email FROM users");
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
      error: "Erreur lors du chargement des utilisateurs"
    });
  }
};


const showInvitationPage = async (req, res) => {
  const { code, email } = req.query;

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE code = $1", [code]);
    const meeting = meetingResult.rows[0];
    if (!meeting) return res.status(404).render("index", {
      page: "meeting",
      meeting: null,
      participants: [],
      user: null,
      slots: [],
      userResponses: {},
      allSlotResponses: [],
      pendingInvitations: [],
      error: "Réunion non trouvée"
    });
    

    const slotsResult = await pool.query("SELECT * FROM meeting_slots WHERE meeting_id = $1", [meeting.id]);
    const slots = slotsResult.rows;

    const responsesResult = await pool.query(`
      SELECT slot_id, response FROM slot_responses 
      WHERE user_id = (SELECT id FROM users WHERE email = $1)
    `, [email]);

    const responses = {};
    responsesResult.rows.forEach(r => {
      responses[r.slot_id] = r.response;
    });

    res.render("index", {
      page: "invitation-response",
      meeting,
      email,
      slots,
      responses
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};

const respondToInvitation = async (req, res) => {
  const { meeting_id, email, slot_id } = req.body;

  try {
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // Crée un utilisateur temporaire
      const tempUser = await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, role)
        VALUES ('Invité', '', $1, '', 'invité') RETURNING id
      `, [email]);

      userId = tempUser.rows[0].id;

      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'invité')",
        [meeting_id, userId]
      );
    }

    await pool.query(`
      INSERT INTO slot_responses (slot_id, user_id, response)
      VALUES ($1, $2, 'accepté')
      ON CONFLICT (slot_id, user_id) DO UPDATE SET response = 'accepté'
    `, [slot_id, userId]);

 // Récupérer le code de la réunion
const codeResult = await pool.query("SELECT code FROM meetings WHERE id = $1", [meeting_id]);
const code = codeResult.rows[0].code;
return res.redirect(`/meeting/code/${code}?participantView=true`);

// Répondre avec un lien cliquable
res.send(`
  <p>✅ Réponse enregistrée !</p>
  <p><a href="/meeting/code/${code}">Cliquez ici pour revenir à la réunion</a></p>
`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};


module.exports = {
  createMeeting,
  renderCreateMeetingPage,
  getMeetingDetails,
  showInvitationPage,
  respondToInvitation
};
