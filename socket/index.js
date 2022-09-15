exports.socketConnection = function (server) {

    var redis = require('redis');
    var io = require("socket.io");
    var checkAuthOnSocket = require("../auth.js").checkAuthOnSocket;
    const { v4: uuidv4 } = require('uuid');

    io = io(server, {
        transports: ['websocket'],
        cors: {
            origin: '*',
        },
    });

   
    var redis_client = redis.createClient({});//{auth_pass:"a5429941cc15f59e41"});

    io.of('/rooms').use((socket, next) => checkAuthOnSocket(socket, next));

    var rooms = io.of('/rooms').on('connection', function (socket) {


        socket.on("sentMessage", function (data) {


            redis_client.exists(data.room, function (err, reply) {
                if (reply === 1) {


                    var msg = {
                        msg_id: uuidv4(),
                        from: socket.user.id,
                        by: socket.user.name, 
                        msg: data.msg,
                        replayOn: null,
                        type:data.type,
                        time: Date.now()
                    };
        
                    redis_client.zincrby(data.room, Date.now(), JSON.stringify(msg), function (err, reply) {
                        if (!err)
                            rooms.in(data.room).emit('message', msg);
                    });

                    
                }
                else{
                    socket.emit('error', "Room not exists");
                }
            });
            

            



        });


        socket.on("message",function(msg){
            console.log(msg);

        });


        socket.on("addToRoom", function (id) {

            socket.join(id);
            socket.rooms.push(id);
            rooms.in(id).emit("addedUser", socket.user);
        });


        socket.on("leaveRoom", function (id) {
            socket.leave(id);

            var index = socket.rooms.indexOf(id);
            if (index !== -1) {
                socket.rooms.splice(index, 1);
            }

            rooms.in(id).emit("removedUser", socket.user);
        });

        




        socket.on('disconnect', function () {

            socket.rooms.forEach(room_id => {
                
                rooms.in(room_id).emit("removedUser", socket.user);

            });

            socket.rooms=null;

           
        });


    });
};

//exports.sendMessageLogTo = (id,tag,message) => logins.to(id).emit(tag,message);
//exports.sendMessageLogIn = (room,tag,message) => logins.in(room).emit(tag,message);