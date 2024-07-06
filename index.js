const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Runnning on http://localhost/3000/')
    })
  } catch (e) {
    console.log(`DB error:${e.meassage}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

//POST Create user Account API 1

app.post('/signup/', async (request, response) => {
  const {username, password} = request.body
  let hashedPassword = await bcrypt.hash(password, 10)

  const searchUserName = `SELECT * FROM user WHERE username ='${username}';`
  const dbUser = await db.get(searchUserName)

  if (dbUser === undefined) {
    const creatUserQuery = `INSERT INTO
                user(username, password)
              VALUES
                ('${username}','${hashedPassword}');`

    const dbResponse = await db.run(creatUserQuery)
    const newUserId = dbResponse.lastID
  } else {
    response.status(400)
    response.send('user Already Signin')
  }
})

/*
// Middelware function

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}
*/

//POST login user Account API 2

app.post('/signin', async (request, response) => {
  const {username, password} = request.body

  const searchUserName = `SELECT * FROM user WHERE username ='${username}';`
  const dbUser = await db.get(searchUserName)

  if (dbUser === undefined) {
    response.status(400)
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

module.exports = app
