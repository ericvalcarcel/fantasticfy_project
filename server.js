const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Esquema de usuario
const userSchema = new mongoose.Schema({

  external_id: Number,
  name: {
    type: String,
  },
  username: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  address: {
    street: String,
    suite: String,
    city: String,
    zipcode: String,
  }
});

const User = mongoose.model('User', userSchema);

// Conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://evalcarcelrueda:prueba1@cluster0.6bth6yx.mongodb.net/db');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log('Conexión exitosa a la base de datos MongoDB Atlas');
});

// Sincronización de usuarios desde la API externa
app.post('/sync', async (req, res) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/users');
    const usersFromAPI = response.data;

    for (const userFromAPI of usersFromAPI) {
      const user = {
        external_id: userFromAPI.id,
        name: userFromAPI.name,
        username: userFromAPI.username,
        email: userFromAPI.email,
        address: {
          street: userFromAPI.address.street,
          suite: userFromAPI.address.suite,
          city: userFromAPI.address.city,
          zipcode: userFromAPI.address.zipcode,
          geo: {
            lat: userFromAPI.address.geo.lat,
            lng: userFromAPI.address.geo.lng
          }
        },
        phone: userFromAPI.phone,
        website: userFromAPI.website,
        company: {
          name: userFromAPI.company.name,
          catchPhrase: userFromAPI.company.catchPhrase,
          bs: userFromAPI.company.bs
        }
      };

      await User.findOneAndUpdate({ external_id: user.external_id }, user, { upsert: true });
    }

    res.status(200).json({ message: 'Sincronización exitosa de usuarios.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Obtener el listado completo de todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



app.put('/users', async (req, res) => {
  try {
    const { name, username, email } = req.body;

    // Buscar si existe un usuario con alguno de los datos coincidentes
    const existingUser = await User.findOne({
      $or: [
        { name: name },
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      // Actualizar el usuario existente con los datos nuevos
      existingUser.name = name;
      existingUser.username = username;
      existingUser.email = email;
      const updatedUser = await existingUser.save();
      res.status(200).json(updatedUser);
    } else {
      // Obtener el último external_id para incrementarlo
      const lastUser = await User.findOne().sort({ external_id: -1 });
      const newExternalId = lastUser ? lastUser.external_id + 1 : 1;

      // Crear un nuevo usuario con el nuevo external_id
      const newUser = new User({
        external_id: newExternalId,
        name,
        username,
        email
      });
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API iniciado en el puerto ${PORT}`);
});
