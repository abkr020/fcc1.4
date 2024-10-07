const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes

// POST /api/users to create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const newUser = await User.create({ username });
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// GET /api/users to get a list of all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

// POST /api/users/:_id/exercises to add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exercise = await Exercise.create({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Error adding exercise' });
  }
});

// GET /api/users/:_id/logs to get exercise logs
// app.get('/api/users/:_id/logs', async (req, res) => {
//   const { _id } = req.params;
//   const { from, to, limit } = req.query;

//   try {
//     const user = await User.findById(_id);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     let filter = { userId: _id };
//     if (from || to) {
//       filter.date = {};
//       if (from) filter.date.$gte = new Date(from);
//       if (to) filter.date.$lte = new Date(to);
//     }

//     const logs = await Exercise.find(filter)
//       .limit(parseInt(limit) || 0)
//       .select('description duration date');

//     const logArray = logs.map(log => ({
//       description: log.description,
//       duration: log.duration,
//       date: log.date.toDateString()
//     }));

//     res.json({
//       username: user.username,
//       count: logArray.length,
//       _id: user._id,
//       log: logArray
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Error retrieving logs' });
//   }
// });

// app.get('/api/users/:_id/logs', async (req, res) => {
//   try {
//     const { _id } = req.params;
//     const { from, to, limit } = req.query;

//     // Find the user by _id
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Query to fetch exercises with optional date filtering
//     let query = { userId: _id };
//     if (from || to) {
//       query.date = {};
//       if (from) query.date.$gte = new Date(from);
//       if (to) query.date.$lte = new Date(to);
//     }

//     // Fetch exercises, apply limit if provided
//     let exercises = await Exercise.find(query).limit(parseInt(limit) || 0);

//     // Map exercises to the required format
//     exercises = exercises.map(ex => ({
//       description: ex.description,
//       duration: ex.duration,
//       date: ex.date.toDateString(),
//     }));

//     // Return the user object with the log and count of exercises
//     res.json({
//       username: user.username,
//       count: exercises.length,
//       _id: user._id,
//       log: exercises
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// app.get('/api/users/:_id/logs', async (req, res) => {
//   try {
//     const { _id } = req.params;
//     const { from, to, limit } = req.query;

//     // Find the user by _id
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Query to fetch exercises with optional date filtering
//     let query = { userId: _id };

//     // Date filtering
//     if (from || to) {
//       query.date = {};
//       if (from) {
//         query.date.$gte = new Date(from);
//       }
//       if (to) {
//         query.date.$lte = new Date(to);
//       }
//     }

//     // Fetch exercises and limit the number of results
//     let exercises = await Exercise.find(query).limit(parseInt(limit) || 0);

//     // Map exercises to the required format
//     exercises = exercises.map(ex => ({
//       description: ex.description,
//       duration: ex.duration,
//       date: ex.date.toDateString(),
//     }));

//     // Return the user object with the log and count of exercises
//     res.json({
//       username: user.username,
//       count: exercises.length,
//       _id: user._id,
//       log: exercises
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
// 9
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    // Find the user by _id
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize the query for exercises
    let query = { userId: _id };

    // Handle date filtering if from and to are provided
    if (from || to) {
      query.date = {};
      if (from) {
        query.date.$gte = new Date(from);
      }
      if (to) {
        query.date.$lte = new Date(to);
      }
    }

    // Fetch exercises with optional limit and date filtering
    const exercises = await Exercise.find(query)
      .sort({ date: -1 }) // Sort by date in descending order
      .limit(limit ? parseInt(limit) : 0) // Apply limit if provided
      .lean(); // Use lean to return plain JavaScript objects

    // Format the log for response
    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(), // Format date as string
    }));

    // Return the user object with count and log
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// app.get('/api/users/:_id/logs', async (req, res) => {
//   const { _id } = req.params;
//   const { from, to, limit } = req.query;

//   try {
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const query = { userId: _id };

//     // Handle optional date filtering
//     if (from || to) {
//       query.date = {};
//       if (from) query.date.$gte = new Date(from); // Use date directly
//       if (to) query.date.$lte = new Date(to); // Use date directly
//     }

//     // Fetch exercises based on the query
//     const exercises = await Exercise.find(query)
//       .sort({ date: -1 })
//       .limit(parseInt(limit) || 0)
//       .lean();

//     const log = exercises.map(ex => ({
//       description: ex.description,
//       duration: ex.duration,
//       date: ex.date.toDateString(), // Format date as string
//     }));

//     res.json({
//       username: user.username,
//       count: log.length,
//       _id: user._id,
//       log,
//     });
//   } catch (error) {
//     console.error('Error fetching logs:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
