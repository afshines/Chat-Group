const { json } = require('express');
var express = require('express');
var router = express.Router();
var checkAuth = require("../auth.js").checkAuth;
var redis = require('redis');
var redis_client = redis.createClient({});//{auth_pass:"a5429941cc15f59e41"});
const imageThumbnail = require('image-thumbnail');
var path = require('path');
const { v4: uuidv4 } = require('uuid');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/create_room', checkAuth,async function (req, res, next) {

 var msg={
   msg_id: uuidv4(),
   type:"text", //"audio","video","picture","link","document"
   from:req.user.id,
   by:req.user.name,
   msg:"Room Created",
   replayOn:null,
   time:Date.now()
 };
 

 if(req.body.service && req.body.tag &&req.body.room_id ){

  let key = req.body.service+":"+req.body.tag+":"+req.body.room_id;

  redis_client.exists(key, function (err, reply) {
    if (reply === 1) {

      res.json({ status: false , msg:"This room exists" });

    } else {

      redis_client.zadd(key, Date.now(), JSON.stringify(msg), function (err, reply) {
        if (!err) {
           res.json({ status: true });
        }else{
           res.json({ status: false, msg:err });
        }
    
      });


    }
  });


 }else{
   res.json({ status: false , msg:"You must declare service, tag and room_id" });
 }

 



});

router.post('/upload',checkAuth,async function (req,res,next){

  //data   file , caption 

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }


  let myFile = req.files.file;

  const mimeName =myFile.mimetype; 

  const allowedMimes = ['image/png','image/jpeg','image/jpg','image/gif','image/webp',
  'text/plain',
  'video/x-msvideo','audio/midi','audio/x-midi','audio/mpeg','audio/wav','audio/3gpp','audio/webm',
  'video/mp4','video/3gpp','video/webm','video/mpeg',
  'application/vnd.rar','application/zip',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf'];

  const imagesMimes  = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];

  if(!allowedMimes.includes(mimeName)){
      return res.status(422).send("Invalid Image");
  }


  let uploadPath =  'uplods/'+mimeName+'/'+ req.user.id + "/" +Date.now() +"-"+ myFile.name;

  myFile.mv(uploadPath, async function(err) {
    if (err)
      return res.status(500).send(err);

      var thumb = null;
     
      if(await imagesMimes.includes(mimeName)){
        try {
          let options = { width: 100, height: 100, responseType: 'base64' , jpegOptions: { force:true, quality:70 } }
          thumb = await imageThumbnail(uploadPath,options);
          
        } catch (err) {
          return res.status(500).send(err);
        }
      }
      
      var attachment_id = uuidv4();
      var info={
        preview:(thumb==null)? mimeName : thumb ,
        src:uploadPath
      }
      await redis_client.set("attachments:"+attachment_id, JSON.stringify(info));
      //save to redis and get attachment id

      res.json({  msg:'File uploaded!' ,attachment_id:attachment_id });
  });

});

router.post('/getMessages/:id/:time/:offset/:count/:next',checkAuth,async function(req,res,next){


  let  room_id =  req.params.id ;
  let  count =  req.params.count ;
  let  offset =  req.params.offset ;
  let  time =  req.params.time ;


  if(req.params.next==1){


     var args = [ room_id,time,"+inf","withscores", 'LIMIT', offset, count ];
     redis_client.zrangebyscore(args,function(err,result){
       if(!err)
         console.log(result);
        res.json(result);
     })

  }else{

    var args = [ room_id,time,"-inf","withscores", 'LIMIT', offset, count ];
    redis_client.zrevrangebyscore(args,function(err,result){
      if(!err)
        console.log(result);
       res.json(result);
    })

        
  }

 
  


});

module.exports = router;
