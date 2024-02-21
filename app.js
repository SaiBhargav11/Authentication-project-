const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const dbpath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let db = null

const connection = async () => {
  try {
    db = await open({filename: dbpath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (e) {
    console.log('connection error : ' + e)
    process.exit(1)
  }
}

connection()

app.post('/register', async (req, res) => {
  const {username, name, password, gender, location} = req.body
  const encrypepassword = await bcrypt.hash(password, 10)
  try {
    const api1 = `SELECT * FROM user WHERE username = '${username}';`
    const ans = await db.get(api1)

    // console.log(ans)
    // res.send(ans)
    if (password.length < 5) {
      res.status(400)
      res.send('Password is too short')
    }

    if (ans === undefined) {
      const q = `INSERT INTO 
        user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${encrypepassword}', 
            '${gender}',
            '${location}'
          );`
      await db.run(q)
      res.status(200)
      res.send('User created successfully')
    }
    if (ans.username === username) {
      res.status(400)
      res.send('User already exists')
    }
  } catch (e) {
    console.log('Internal error : ' + e)
  }
})

app.post('/login', async (req, res) => {
  const {username, password} = req.body
  const api2 = `SELECT * FROM user WHERE username = '${username}';`
  const ans = await db.get(api2)
  const encrypepassword = await bcrypt.hash(password, 10)
  const ispasswordright = await bcrypt.compare(password, encrypepassword)
  if (ans === undefined) {
    res.status(400)
    res.send('Invalid user')
  }
  if (ispasswordright === false) {
    res.status(400)
    res.send('Invalid password')
  } else {
    res.status(200)
    res.send('Login success!')
  }
})

app.put('/change-password', async (req, res) => {
  const {username, oldPassword, newPassword} = req.body
  const api3 = `SELECT * FROM user WHERE username = '${username}';`
  const ans = await db.get(api3)
  const ispasswordright = await bcrypt.compare(oldPassword, ans.password)
  const newencryptpassword = await bcrypt.hash(newPassword, 10)

  if (newPassword.length < 5) {
    res.status(400)
    res.send('Password is too short')
  }

  if (ispasswordright === false) {
    res.status(400)
    res.send('Invalid current password')
  } else {
    const q = `UPDATE user SET username = '${username}',password = '${newencryptpassword}';`
    await db.run(q)
    res.status(200)
    res.send('Password update')
  }
})

module.exports = app
