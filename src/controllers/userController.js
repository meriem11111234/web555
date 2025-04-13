const bcrypt = require("bcryptjs");
const User = require("../models/User");

 /*Une route qui gere la création de compte  */
exports.register = async (req, res) => {
  try {
    const { last, first, email, password, role } = req.body;
    if (!last || !first || !email || !password)
      return res.status(400).json({ message: "Tous les champs sont requis" });

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Utilisateur déjà existant" });

    const newUser = await User.createUser(last, first, email, password, role);
    res.status(201).json({ message: "Utilisateur créé", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

/*Une route qui gère la connexion  */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Connexion réussie", token });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
