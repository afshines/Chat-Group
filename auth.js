const client = require("./client")

var checkAuth = async function  (req, res, next){

    let newAuth = {
        name: "",
        email: "",
        password: "",
        token: req.query.token,
        last_name:""
      }
      client.verify(newAuth, (error, auth) => {
        if (!error) {
          console.log("Verified successfully")
          console.log(auth)
          if(auth.token === 'is_valid'){
            var user = {
             id:auth.id,
             name:auth.name,
             last_name:auth.last_name,
             email:auth.email
            };
            req.user = user;
             next();
          }
            else
              res.json({error:false});
        } else {
          console.error(error)
          res.json({error:false});
        }
      })

};

var checkAuthOnSocket = async function  (socket, next){

  let newAuth = {
      name: "",
      email: "",
      password: "",
      token: socket.handshake.headers.token,
      last_name:""
    }
    client.verify(newAuth, (error, auth) => {
      if (!error) {

        if(auth.token === 'is_valid'){
          var user = {
           id:auth.id,
           name:auth.name,
           last_name:auth.last_name,
           email:auth.email
          };

          socket.user = user;
           next();
        }
          else
          next(new Error("invalid"));
      } else {
        next(new Error("invalid"));
      }
    })

};


module.exports = {checkAuth,checkAuthOnSocket};