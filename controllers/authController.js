const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');

exports.register = async (req, res) => {
  try {
    const { name, surname, patronymic, email, username, password, recaptchaToken } = req.body;

    // Проверка reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token is required' });
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

    const recaptchaResponse = await axios.post(verificationUrl);
    
    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ 
        error: 'reCAPTCHA verification failed',
        details: recaptchaResponse.data['error-codes']
      });
    }

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists'
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создание пользователя
    const user = new User({ 
      name, 
      surname, 
      patronymic: patronymic || '', 
      email, 
      username, 
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error during registration' 
    });
  }
};

exports.login = async (req, res) => {
    try {
      const { username, password, recaptchaToken } = req.body;
  
      // Проверка reCAPTCHA для авторизации
      if (!recaptchaToken) {
        return res.status(400).json({ error: 'Токен reCAPTCHA отсутствует' });
      }
  
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
  
      const recaptchaResponse = await axios.post(verificationUrl);
      
      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ 
          error: 'Проверка reCAPTCHA не пройдена',
          details: recaptchaResponse.data['error-codes']
        });
      }
  
      // Поиск пользователя
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
      }
      
      // Проверка пароля
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
      }
      
      // Генерация токена
      const token = jwt.sign(
        { userId: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      
      // Ответ с токеном и данными пользователя
      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
  
    } catch (error) {
      console.error('Ошибка при входе:', error);
      res.status(500).json({ error: 'Ошибка сервера при входе в систему' });
    }
  };