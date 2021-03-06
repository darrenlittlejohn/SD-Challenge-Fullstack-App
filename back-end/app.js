var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var app = express();
var Activity = require('./models').Activity
var User = require('./models').User
var CompletedActivity = require('./models').CompletedActivity
var path = require('path')
var sslRedirect = require('heroku-ssl-redirect')

app.use(sslRedirect())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(validator())
app.use(cors())
app.use(express.static(path.resolve(__dirname, '../front-end/build')));

app.get('/api/', (req, res) => {
  res.json({message: 'successful "get" request to back-end root'})
});

app.get('/api/activities', (req, res) => {
  Activity.findAll().then((results) => {
    res.json({activities:results})
    })
})

app.get('/api/completedactivities/:id', (req, res) => {
  CompletedActivity.findAll({
    where: {
      userID: req.params.id,
      completedAt: {
        $ne: null
      }
    },
    include: [{
      model: Activity
    }]
  }).then((results) => {
    res.status(201)
    res.json({completedActivities: results})
  }).catch((error) => {
    res.status(400)
    res.json({errors: {message: "Activities not found"}})
  })
})

app.get('/api/unfinishedactivities/:id', (req, res) => {
  Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address", "Activities"."longitude", "Activities"."latitude", "Activities"."points" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: req.params.id}})
  .then((results) => {
    res.status(201)
    res.json({unfinishedActivities: results[0]})
  }).catch((error) => {
    res.status(400)
    res.json({errors: {message: "Activities not found"}})
  })
})

app.post('/api/completedActivity/new', (req, res) => {
  CompletedActivity.create({
    userID: req.body.id,
    activityID: req.body.actID,
    points:req.body.points,
    completedAt: new Date()
  })
    CompletedActivity.findAll({
      where: {
        userID: req.body.id,
        completedAt: {
          $ne: null
        }
      },
      include: [{
        model: Activity
      }]
    }).then((results) => {
      Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address", "Activities"."longitude", "Activities"."latitude", "Activities"."points" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: req.body.id}})
    .then((unfinished) => {
      CompletedActivity.sequelize.query('SELECT "CompletedActivity"."userID", sum("CompletedActivity"."points") AS "totalPoints", "User"."name" AS "Username" FROM "CompletedActivities" AS "CompletedActivity" LEFT OUTER JOIN "Users" AS "User" ON "CompletedActivity"."userID" = "User"."id" GROUP BY "userID", "User"."name" ORDER BY "totalPoints" DESC LIMIT 5')
        .then((leaderboard) => {
          CompletedActivity.sum('points', { where: { userID: req.body.id }
          }).then(sum => {
            res.status(201)
            res.json({
              completedActivities: results,
              unfinishedActivities: unfinished[0],
              userPoints: sum,
              leaderboard: leaderboard[0]
            })
        })
      })
    })
  }).catch((error) => {
      res.status(400)
      res.json({errors: {message: "Activities not found"}})
  })
})

app.post('/api/activities/new', (req, res) => {
  req.checkBody('name', 'Is required').notEmpty()
  req.checkBody('description', 'Is required').notEmpty()
  req.checkBody('address', 'Is required').notEmpty()
  req.checkBody('longitude', 'Is required').notEmpty()
  req.checkBody('latitude', 'Is required').notEmpty()
  req.checkBody('points', 'Is required').notEmpty()
  req.getValidationResult()
    .then((validationErrors) =>{
      if(validationErrors.isEmpty()){
        Activity.create({
          name: req.body.name,
          description: req.body.description,
          address: req.body.address,
          longitude: req.body.longitude,
          latitude: req.body.latitude,
          points: req.body.points
        })
        CompletedActivity.findAll({
          where: {
            userID: req.body.id,
            completedAt: {
              $ne: null
            }
          },
          include: [{
            model: Activity
          }]
        }).then((results) => {
          Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address",  "Activities"."address","Activities"."longitude", "Activities"."latitude" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: req.body.id}})
          .then((unfinished) => {
            res.status(201)
            res.json({
              completedActivities: results,
              unfinishedActivities: unfinished[0]
            })
          })
        })
      }else{
        res.status(400)
        res.json({errors: {validations: validationErrors.array()}})
      }
    })
})

app.post('/api/activities/delete', (req, res) => {
  Activity.destroy({
    where: {
      id: req.body.actID
    }
  })
  CompletedActivity.destroy({
    where: {
      activityID: req.body.actID
    }
  })
  CompletedActivity.findAll({
    where: {
      userID: req.body.id,
      completedAt: {
        $ne: null
      }
    },
    include: [{
      model: Activity
    }]
  }).then((results) => {
    Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address",  "Activities"."address","Activities"."longitude", "Activities"."latitude" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: req.body.id}})
    .then((unfinished) => {
      res.status(201)
      res.json({
        completedActivities: results,
        unfinishedActivities: unfinished[0]
      })
    }).catch((error) => {
      res.status(400)
      res.json({errors: {message: "Activities not found"}})
    })
  })
})

app.post('/api/signup', (req, res) => {
  req.checkBody('name', 'Is required').notEmpty()
  req.checkBody('email', 'Is required').notEmpty()
  req.checkBody('password', 'Is required').notEmpty()
  req.checkBody('email').isEmail().withMessage('must be an email')
  req.getValidationResult()
    .then((validationErrors) =>{
      if(validationErrors.isEmpty()){
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        }).then((user)=>{
          if(user.verifyPassword(req.body.password)){
            CompletedActivity.findAll({
              where: {
                userID: user.id,
                completedAt: {
                  $ne: null
                }
              },
              include: [{
                model: Activity
              }]
            }).then((results) => {
              Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address", "Activities"."longitude", "Activities"."latitude", "Activities"."points" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: user.id}})
              .then((unfinished) => {
                res.status(201)
                res.json({
                  completedActivities: results,
                  unfinishedActivities: unfinished[0],
                  user: user
                })
              }).catch((error) => {
                res.status(400)
                res.json({errors: {message: "Activities not found"}})
              })
            })
          } else {
            res.status(400)
            res.json({errors: {message: "Are you sure you filled all the fields?"}})
          }
        }).catch((error) => {
          var error_messages = []
          error.errors.map(function(item){
            var newMessage = "That email is taken"
            item.message = newMessage
            error_messages.push(newMessage)
          })
          res.status(400)
          res.json({errors: {message: error_messages.join(', ')}})
        })
      }else{
        res.status(400)
        res.json({errors: {validations: validationErrors.array()}})
      }
    })
})

app.post('/api/login', (req, res) => {
  req.checkBody('email', 'Is required').notEmpty()
  req.checkBody('password', 'Is required').notEmpty()
  req.getValidationResult()
    .then((validationErrors) =>{
      if(validationErrors.isEmpty()){
        // find user by email
        User.find({ where: {email: req.body.email} }).then((user) => {
          // check users password
          if(user.verifyPassword(req.body.password)){
            user.setAuthToken()
              user.save().then((user) => {
                CompletedActivity.findAll({
                  where: {
                    userID: user.id,
                    completedAt: {
                      $ne: null
                    }
                  },
                  include: [{
                    model: Activity
                  }]
              }).then((results) => {
                Activity.sequelize.query('SELECT "Activities"."id", "Activities"."name", "Activities"."description", "Activities"."address", "Activities"."longitude", "Activities"."latitude", "Activities"."points" FROM "Activities" LEFT OUTER JOIN "CompletedActivities" ON "CompletedActivities"."activityID" = "Activities"."id" AND "CompletedActivities"."userID" = :id WHERE "CompletedActivities"."id" IS NULL', {replacements:{id: user.id}})
                .then((unfinished) => {
                  res.status(201)
                  res.json({
                    completedActivities: results,
                    unfinishedActivities: unfinished[0],
                    user: user
                  })
                }).catch((error) => {
                  res.status(400)
                  res.json({errors: {message: "Activities not found"}})
                })
              })
            })
          } else {
            res.status(400)
            res.json({errors: {message: "Login information is incorrect"}})
          }
        }).catch((error) => {
          res.status(400)
          res.json({errors: {message: "Login information is incorrect"}})
        })
      }else{
        res.status(400)
        res.json({errors: {validations: validationErrors.array()}})
      }
    })
})

app.post('/api/user', (req, res) => {
  req.checkBody('authToken', 'Is required').notEmpty()

  req.getValidationResult()
    .then((validationErrors) =>{
      if(validationErrors.isEmpty()){
        // find user by authToken
        User.find({ where: {authToken: req.body.authToken} }).then((user) => {
          if(user.authExpired()){
            res.status(400)
            res.json({errors: {message: "Please log in again"}})
          } else {
            res.status(201)
            res.json({user: user})
          }
        }).catch((error) => {
          res.status(400)
          res.json({errors: {message: "User not found"}})
        })
      }else{
        res.status(400)
        res.json({errors: {validations: validationErrors.array()}})
      }
    })
})

app.post('/api/user/points', (req, res) => {
  CompletedActivity.sum('points', { where: { userID: req.body.id }
  }).then(sum => {
    CompletedActivity.findAll({
      where: {
        userID: req.body.id,
        completedAt: {
          $ne: null
        }
      },
      include: [{
        model: Activity
      }]
    }).then((results) => {
      res.status(201)
      res.json({
        userPoints: sum,
        completedActivities: results
      })
    })
  }).catch((error) => {
    res.status(400)
    res.json({errors: {message: "Points not found."}})
  })
})

app.get('/api/leaderboard', (req, res) => {
  CompletedActivity.sequelize.query('SELECT "CompletedActivity"."userID", sum("CompletedActivity"."points") AS "totalPoints", "User"."name" AS "Username" FROM "CompletedActivities" AS "CompletedActivity" LEFT OUTER JOIN "Users" AS "User" ON "CompletedActivity"."userID" = "User"."id" GROUP BY "userID", "User"."name" ORDER BY "totalPoints" DESC LIMIT 5')
  .then((results) => {
    res.status(201)
    res.json({
      leaderboard: results[0]
    })
  }).catch((error) => {
    res.status(400)
    res.json({errors: {message: "Leaders not found."}})
  })
})

app.get('*', function(request, response) {
  response.sendFile(path.resolve(__dirname, '../front-end/build', 'index.html'));
});

module.exports = app
