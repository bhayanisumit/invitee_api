const express = require('express');
const app = express();
var publicDir = require('path').join(__dirname,'//uploads//');
app.use(express.static(publicDir));
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const v = require('node-input-validator');
app.use(bodyParser.urlencoded({limit: '50mb',extended: true}))
app.use(bodyParser.json({limit: '50mb'}));
const jwt = require('jsonwebtoken');
var VerifyToken = require('./VerifyToken');
var config = require('./config');
var nodemailer = require('nodemailer');
var hbs  = require('nodemailer-express-handlebars');
var base64ToImage = require('base64-to-image');
var os = require("os");
var hostname = os.hostname();
 
 var fromEmail = "info@invitee.ca";
 //store Data 
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
      cb(null, './uploads/' + req.body.organizer_id + '/');
    },
    filename: (req, file, cb) => {
     
      cb(null, file.fieldname + '-' + Date.now() + '' + path.extname(file.originalname));
    }
});

//  store Data end

let upload = multer({storage: storage});

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Email Coding Start

var mailer = nodemailer.createTransport({ 
      service: 'Godaddy',
      host : 'smtpout.asia.secureserver.net',
 secureConnection: true,
  
    port  : '80',
    auth: {
        user: "info@invitee.ca",
        pass: "*********"
    }
});
 
 mailer.use('compile',hbs({
    viewPath : 'emails/register',
    extName : '.hbs'
 }));
 
 


// Emaiil coing End


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
  // Mine was '/Users/zellwk/Projects/demo-repos/crud-express-mongo' for this app.
})


 app.post('/forogotpassword', (req, res) => {
 
var randomno =  Math.floor(100000 + Math.random() * 900000)
      db.collection('organizer').findOne({  organizer_email :  req.body.organizer_email })
      .then(function(doc) {
        if(!doc){
           res.send({
            success: 'false',
            message: 'No User id Match! Try Again.'
          })
        }else {

       mailer.sendMail({
      from : fromEmail,
      to :  req.body.organizer_email ,
      subject : 'Invitee.ca - Forgot password link',
      template : 'forgotpwd',
      context : {
          email : req.body.organizer_email,
          no : randomno
      }
  },function(err,respose){
       console.log(err);
      if(err){
        res.send({
             success: 'false',
            message: 'No Email sent to your emailid'
        })
       }else {
    

       const organizer_forgotpwd = {
            organizer_email: req.body.organizer_email,
            organizer_random : randomno,
            organizer_forgotpassword_date : Date.now(), 
            forgotpassword_link : "notuse"
         };
            db.collection('forogotpasswordData').insertOne(organizer_forgotpwd, (err, results) => {
               var objectid = results.insertedId;
               if(err){
                     res.send({
             success: 'false',
            message: 'something Went Wrong'
        })
               }else {
                    res.send({
             success: 'true',
            message: 'Email sent successfully, please check your email  or spam',
            forogotid:objectid
        })
               }

            })
    }
  });
           
        }
    })
  });

app.post('/verifycode', (req, res) => {
  
      db.collection('forogotpasswordData').findOne({  _id: new mongodb.ObjectID(req.body.id)})
      .then(function(doc) {
        if(!doc){
           res.status(200).send({
            success: 'false',
            message: 'No User id Match! Try Again.'
          })
        }else {
             
             if(doc.organizer_random == req.body.code && doc.forgotpassword_link == "notuse" ){
                res.status(200).send({
                  success: 'true',
                  message: 'Code Verified'
                }) 
                   db.collection('forogotpasswordData').updateOne(
                    { _id: new mongodb.ObjectID(req.body.id)},
                    { $set: { "forgotpassword_link" : 'use'}}, function(err, result) {
                      
                   });
             }else{
              res.status(200).send({
                success: 'false',
                message: 'Code Dose not match / code is usable'
              })
               }

        }
    })
 });


app.post('/organizerSignup', (req, res) => {
 
   db.collection('organizer').findOne({  organizer_email: req.body.organizer_email })
      .then(function(result) {
        if(result){
          

          res.status(200).send({
            success: 'false',
            msg: 'This email id already Registered.'
          })
        }else {

           bcrypt.hash(req.body.organizer_password, 10, function(err, hash){

      const organizer_user = {
            organizer_email: req.body.organizer_email,
            organizer_name : req.body.organizer_name,
            organizer_companyname: req.body.organizer_companyname,
            organizer_password: hash,
            organizer_since : Date.now(), 
            organizer_photo : "",
            organizer_status : "pending"
         };

          db.collection('organizer').insertOne(organizer_user, (err, results) => {
         

            if (err) {
              return res.send({
                 success: 'false',
                 msg : "Organizer Not Registered" 
               })
            }else {

                mailer.sendMail({
      from : fromEmail,
      to :  req.body.organizer_email ,
      subject : 'Invitee.ca - Confirm your Email',
      template : 'register',
      context : {
        name : req.body.organizer_name,
        email : req.body.organizer_email
      }
  },function(err,respose){
      if(err){
        console.log(err);
        
      }
      res.send('good email');
  });

            var objectid = results.insertedId;
         
          var dir = './uploads/'+objectid+'/';
         if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
          res.status(200).json({
               success: 'true',
               msg : "Registered successfully! Please Confirm via Email, Thank you" 
            })
        }
         }) 
        })
     }
  })
});
 

  app.post('/changeforgotpassword',function(req,res){

      db.collection('forogotpasswordData').findOne({  _id: new mongodb.ObjectID(req.body.id)})
      .then(function(doc) {
        if(!doc){
           res.status(200).send({
            success: 'false',
            message: 'No User id Match! Try Again.'
          })
        }else {
           
                 bcrypt.hash(req.body.password, 10, function(err, hash){
                   db.collection('organizer').updateOne({ organizer_email: doc.organizer_email},
                      { $set: { "organizer_password" : hash}}, function(err, result) {
                        if (err){
                            res.status(200).json({
                               success: 'false',
                               message : "password dose not change successfully."
                        });
                        }  
                        res.status(200).json({
                               success: 'true',
                               message : "password change successfully. Please Login with new password"
                        });
                    });
                 })
          
           
        }
});
 });


 app.post('/api/changepassword',VerifyToken,function(req,res){
      db.collection('organizer').findOne({  _id: new mongodb.ObjectID(req.body.organizerId)})
      .then(function(doc) {
        if(!doc){
           res.status(200).send({
            success: 'false',
            message: 'No User id Match! Try Again.'
          })
        }else {
           bcrypt.compare(req.body.old_password, doc.organizer_password, function(err, result){
               if(result) {
                 bcrypt.hash(req.body.new_password, 10, function(err, hash){
                   db.collection('organizer').updateOne({ _id: new mongodb.ObjectID(req.body.organizerId)},
                      { $set: { "organizer_password" : hash}}, function(err, result) {
                        if (err){
                           return console.log(err);
                        }  
                        res.status(200).json({
                               success: 'true',
                               msg : "password updated successfully."
                        });
                    });
                 })
              }
               else {
                   res.status(200).send({
                    success: 'false',
                    msg: 'Old password does not match'
                   })

               }
          })
        }
});
 });


app.post('/api/editorganizer',VerifyToken,function(req,res){
   db.collection('organizer').updateOne(
      { _id: new mongodb.ObjectID(req.body.organizerId) },
      { $set: { "organizer_name" : req.body.name,"organizer_companyname" : req.body.companyname}}, function(err, result) {
     if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               msg : "Organizer profile updated successfully."
       });
});

})


app.post('/api/uploadorganizerprofile',VerifyToken,upload.single('photo'), function (req, res) {
     if (!req.file) {
        return res.send({
          success: false
        });
      } else {
        db.collection('organizer').updateOne(
      { _id: new mongodb.ObjectID(req.body.organizer_id)},
      { $set: { "organizer_photo" :req.file.filename}}, function(err, result) {
     if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               msg : "Organizer Photo updated successfully.",
               file : req.file.filename
       });
});

      }
});
 
 

 app.post('/organizerFirstLogin', function(req, res){


  db.collection('organizer').findOne({  _id: new mongodb.ObjectID(req.body.organizer_email)})
 .then(function(doc) {  
   
        if(!doc){
           res.status(200).send({
            success: 'false',
            message: 'No Email Found'
          })
        }else {
       bcrypt.compare(req.body.organizer_password_s, doc.organizer_password, function(err, result){

          if(result){
                 if (err){
         return console.log(err);
       }  
       else {
         db.collection('organizer').updateOne(
      { _id: new mongodb.ObjectID(req.body.organizer_email) },
      { $set: { "organizer_status" :  "active"}}, function(err, result) {
            if(result){
                   const organizer_user = {
                     organizer_email: doc.organizer_email,
                     organizer_name : doc.organizer_name,
                     organizer_id : doc._id,
                     organizer_photo : doc.organizer_photo
                  }
                   const JWTToken = jwt.sign({
                       organizer_email: doc.organizer_email,
                      _id: doc._id
                    },
                    config.secret,
                     {
                       expiresIn: '300h'
                     });
                 
                     return res.status(200).json({
                       success: 'true',
                       token: JWTToken,
                       organizerRecord : organizer_user
                     });
            }else {
                 res.status(200).send({
            success: 'false',
            message: 'No activate user! something went wrong'
          })
            }
            
      });

        
       }

          }else {
             return res.status(401).json({
                  success: 'false',
                  message : "password Wrong"
               });

          }

       })
 
     }
   });
 
});

app.post('/organizerSignin', function(req, res){
  db.collection('organizer').findOne({ organizer_email: req.body.organizer_email_s})
 .then(function(doc) {
        if(!doc){
           res.status(200).send({
            success: 'false',
            message: 'No Email Found'
          })
        }else {
           db.collection('organizer').findOne({ organizer_status : 'active'})
 .then(function(result) {
    if(result){
      
         bcrypt.compare(req.body.organizer_password_s, doc.organizer_password, function(err, result){
               
               if(result) {
                   const organizer_user = {
                     organizer_email: doc.organizer_email,
                     organizer_name : doc.organizer_name,
                     organizer_id : doc._id,
                     organizer_photo : doc.organizer_photo
                  }
                 const JWTToken = jwt.sign({
                       organizer_email: doc.organizer_email,
                      _id: doc._id
                    },
                    config.secret,
                     {
                       expiresIn: '300h'
                     });
                     return res.status(200).json({
                       success: 'true',
                       token: JWTToken,
                       organizerRecord : organizer_user
                     });
                }
               return res.status(401).json({
                  success: 'false',
                  message : "password Wrong"
               });
            });
    }else{
       return res.send({
                  success: 'false',
                  message : "Your account has not activated.please confirm your email or call us"
               });

    }
 })
     }
   });
 
});

app.post('/api/organizerprofile',VerifyToken, function(req, res){ 

db.collection('organizer').findOne({'_id':new mongodb.ObjectID(req.body.id)})
 .then(function(doc) {
        if(!doc)
          throw new Error('No record found.');
    
        return res.status(200).json({
           success: 'true',
           data : doc,
        });
  });

});

app.get('/api/get',VerifyToken, (req, res) => {
 db.collection('users').find().toArray(function(err, results) {
  console.log(results)
 res.status(200).send({
    success: 'true',
    message: 'todos retrieved successfully',
    todos: results
  })
  // send HTML file populated with quotes here
})
})
 
// event list organizer


app.post('/api/getorganizerEvent',VerifyToken, (req, res) => {

  db.collection('event').find({organizerId:req.body.organizerId}).toArray(function(err, results) {
 
   if (err) {
       return res.send({
          success: 'false',
          message : 'No event Found',

       });
   }else {
     res.status(200).send({
    success: 'true',
    message: 'Event Data ',
    results: results
  })
   }

  // send HTML file populated with quotes here
})
})

app.post('/api/getsingleEvent',VerifyToken, (req, res) => {
  
  db.collection('event').find({'_id':new mongodb.ObjectID(req.body.id)}).toArray(function(err, results) {
 
   if (err) {
       return res.send({
          success: 'false',
          message : 'No event Found',

       });
   }else {
     res.status(200).send({
    success: 'true',
    message: 'SIngle vent Data',
    results: results
  })
   }

  // send HTML file populated with quotes here
})
})

//event list organizer end


// Banner List

 app.post('/api/bannerList',VerifyToken, (req, res) => {
 db.collection('banner').find({organizer_id:req.body.organizer_id}).toArray(function(err, results) {
 
 res.status(200).send({
    success: 'true',
    message: 'Banner List successfully',
    bannerlist : results
  })
  // send HTML file populated with quotes here
})
})


app.post('/api/uploadbanner',VerifyToken,upload.single('photo'), function (req, res) {
    
    if(req.body.bannerName == ''){
         return res.send({
          success: "empty",
          fieldname : "bannerName",
          message : "Enter banner name"
        });
    }

    if (!req.file) {
        return res.send({
          success: false
        });
      } else {
          const bannerData = {
            banner_title: req.body.bannerName,
            banner_image_name :  req.file.filename,
            banner_path : req.body.organizer_id+'/'+req.file.filename,   
            organizer_id: req.body.organizer_id,
            banner_upload_date : Date.now()
         };
        
            db.collection('banner').insertOne(bannerData, (err, results) => {
            if (err) return console.log(err)
             
            res.status(200).json({
               success: 'true',
               msg : "New banner Saved"
            })
         }) 
      }
});


app.post('/api/addeventPhoto',VerifyToken,upload.array('photo'), function (req, res) {
    
    if (!req.files) {
        return res.send({
          success: false,
          msg : "Image not Uploaded! Try Again"
        });
      } else {
           return res.send({
          success: true,
          data : req.files,
          msg : "Image Uploaded successfully"
          
        });
      }
});


app.post('/api/addEvent', VerifyToken, function (req, res) {
      

          db.collection('event').insertOne(req.body, (err, results) => {
            if (err) {

            res.send({
               success: 'false',
               msg : "Event not Saved successfully."
            })

            }
              else {
                    var objectid = results.insertedId;
            res.status(200).json({
               success: true,
               msg : "Event Saved successfully.",
               displayMsg : "Thank You. ohoo Yeah..Your Event Saved & will be publish in half an hour",
               eventId : objectid
            })
              }
             
            
         }) 
 });


app.post('/api/addbanner',  function (req, res) {

var imageInfo = base64ToImage(req.body.data,"uploads/"+req.body.organizer_id + "/",{'fileName':  req.body.name, 'type':'png'}); 
 
         const bannerData = {
            banner_title: req.body.name,
            banner_image_name : imageInfo.fileName,
            banner_path : req.body.organizer_id+'/'+imageInfo.fileName,  
            organizer_id: req.body.organizer_id,
            banner_upload_date : Date.now()
         };

          db.collection('banner').insertOne(bannerData, (err, results) => {
            if (err) return console.log(err)
             
            res.status(200).json({
               success: 'true',
               msg : "Banner Saved successfully."
            })
         }) 
 });

 app.post('/api/bannerDelete',VerifyToken, (req, res) => {
 
var filePath = 'uploads\\' + req.body.userid + '\\' + req.body.bannerName;
fs.unlinkSync(filePath);

db.collection('banner', function(err, collection) {
   collection.deleteOne({_id: new mongodb.ObjectID(req.body._id)}, function(err, results) {
       if (err){
         return console.log(err);
       }
        res.status(200).json({
               success: 'true',
               msg : "Bannner Deleted successfully."
            })
    });
 
})
 
});

  app.post('/api/eventDelete',VerifyToken, (req, res) => {
var filePath = 'uploads\\' + req.body.orgnizer_id + '\\' + req.body.eventBannerName;
fs.unlinkSync(filePath);

var filePath1 = 'uploads\\' + req.body.orgnizer_id + '\\' + req.body.eventLogoName;
fs.unlinkSync(filePath1);

db.collection('event', function(err, collection) {
   collection.deleteOne({_id: new mongodb.ObjectID(req.body._id)}, function(err, results) {
       if (err){
           res.send({
               success: 'false',
               msg : "Event not Deleted"
            })

       }
        res.status(200).json({
               success: 'true',
               msg : "Event Deleted successfully."
            })
    });
 })
 });

 app.post('/api/bannerEdit',VerifyToken, (req, res) => {
  db.collection('banner').updateOne(
      { _id: new mongodb.ObjectID(req.body._id) },
      { $set: { "banner_title" : req.body.bannername}}, function(err, result) {
     if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               msg : "Banner name updated successfully."
       });
});
  
});
  app.post('/api/eventcount',VerifyToken, (req, res) => {
   db.collection('event').find({organizer_id:req.body.organizer_id }).count(function (err, count) {
        if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               eventcount : count
       });

   });
});

   app.post('/api/bannercount',VerifyToken, (req, res) => {
   db.collection('banner').find({organizer_id:req.body.organizer_id }).count(function (err, count) {
        if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               bannercount : count
       });

   });
});

   app.post('/api/inquierycount',VerifyToken, (req, res) => {
   db.collection('inquiery').find({organizer_id:req.body.organizer_id }).count(function (err, count) {
        if (err){
         return console.log(err);
       }  
        res.status(200).json({
               success: 'true',
               inquierycount : count
       });

   });
});

var db
MongoClient.connect('mongodb+srv://sumitbhayani:*****@cluster0-sy0ym.gcp.mongodb.net',{ useNewUrlParser: true } ,(err, client) => {
  if (err) return console.log(err)
  db = client.db('inviteti') // whatever your database name is
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})
