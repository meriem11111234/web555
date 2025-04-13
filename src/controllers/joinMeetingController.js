const pool = require('../config/db');

// Fonction pour rejoindre une réunion
const joinMeeting = async (req, res) => {
  const { meetingCode } = req.body;
  const userId = req.session.user.id;

  try {
    const meetingCheck = await pool.query("SELECT * FROM meetings WHERE code = $1", [meetingCode]);  //pour vérifier si la réunion existe avec ce code

    if (meetingCheck.rows.length === 0) {
      return res.status(404).render("index", { page: "join-meeting", error: " La réunion introuvable" });
    }

    const meetingId = meetingCheck.rows[0].id;  //Si non on récupère son id 

    const participantCheck = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meetingId, userId]
    );      //On vérifie si l'utilisateur est déja dans les participants de cette réunion 

    if (participantCheck.rows.length > 0) {
      return res.redirect(`/meeting/code/${meetingCode}`);
    }    //Si oui , on le redirige directement vers la réunion 

    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'participant')",
      [meetingId, userId]
    );     //Si non on l'ajoute comme participant

    res.redirect(`/meeting/code/${meetingCode}`);
  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre la réunion :", error);
    res.status(500).render("index", {
      page: "join-meeting",
      error: "Erreur serveur lors de la tentative de rejoindre la réunion",
    });
  }
};

// Afficher la page "rejoindre une réunion"
const renderJoinMeetingPage = (req, res) => {
  if (!req.session.user) return res.redirect("/login");  //Si l'utilisateur n'est pas connecté , on le redirige vers login
  res.render("index", { page: "join-meeting", user: req.session.user });
};

module.exports = {
  joinMeeting,
  renderJoinMeetingPage,
};

