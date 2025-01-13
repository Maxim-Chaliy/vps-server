    const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
      const { name, surname, patronymic, email, username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, surname, patronymic, email, username, password: hashedPassword });
      await user.save();
      res.status(201).send('User registered successfully');
  } catch (error) {
      res.status(500).send('Error registering user');
  }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password');
        }
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.status(200).send({ token });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
};
