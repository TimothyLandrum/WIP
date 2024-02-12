const express = require('express');
const usersRouter = express.Router();

const { 
  createUser,
  getAllUsers,
  getUserByUsername,
  getUserById,
  updateUser,
  deleteUserById,
} = require('../db');

const jwt = require('jsonwebtoken');
const { requireUser } = require('./utils');

usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await getAllUsers();
  
    res.send({
      users
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get('/:userId', async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user);
  } catch (error) {
    next(error);
  }
})

usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });

      res.send({ 
        message: "you're logged in!",
        token 
      });
    } else {
      next({ 
        name: 'IncorrectCredentialsError', 
        message: 'Username or password is incorrect'
      });
    }
  } catch(error) {
    console.log(error);
    next(error);
  }
});

usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);
  
    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user by that username already exists'
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign({ 
      id: user.id, 
      username
    }, process.env.JWT_SECRET, {
      expiresIn: '1w'
    });

    res.send({ 
      message: "thank you for signing up",
      token 
    });
  } catch ({ name, message }) {
    next({ name, message });
  } 
});

usersRouter.patch('/:userId', requireUser, async (req, res, next) => {
  console.log("patch route hit");
  const { userId } = req.params;
  const updateFields = req.body;

  console.log("update fields:", updateFields);

  if (req.user.id !== parseInt(userId, 10) && !req.user.isAdmin) {
    console.log("permission denied");
    return res.status(403).send({ message: "You do not have permission to update this user's information."});
  }
  try{
    console.log("attempting to update user");
    const updatedUser = await updateUser(userId, updateFields);

    console.log("user updated:", updatedUser);

    if(!updatedUser) {
      console.log("user not found");
      return res.status(404).send({ message: "User not found."});
    }

    res.send(updatedUser);
  } catch (error) {
    console.log("error in patch route", error);
    next(error);
  }
});

usersRouter.delete('/:userId', requireUser, async (req, res, next) => {
  const { userId } = req.params;

  if (req.user.id !== parseInt(userId, 10) && !req.user.isAdmin) {
      return res.status(403).send({ message: "You do not have permission to delete this user." });
  }

  try {
      const deletedUser = await deleteUserById(userId);

      if (!deletedUser) {
          return res.status(404).send({ message: "User not found, unable to delete." });
      }

      res.status(200).send({ message: `User ${userId} successfully deleted.`, deletedUser: deletedUser });
  } catch (error) {
      console.error(`Failed to delete user with ID: ${userId}`, error);
      next(error);  
  }
});

module.exports = usersRouter;