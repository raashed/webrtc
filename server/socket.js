let users = [];
let x = 1;

let offer;
module.exports = socket => {
    console.log('new user')
    // socket.id = x++;
    users.push(socket.id);

    console.log(socket.id)
    socket.emit('current-user', socket.id);
    socket.emit('users', users);
    socket.broadcast.emit('users', users);

    socket.on('call-user', data => {
        offer = data.offer;
        socket.to(data.to).emit('call-made',{
            offer, from: socket.id
        })
        console.log(`creating call `, {to: data.to, from: socket.id});
    })

    socket.on('make-answer', data => {
        console.log(`replying call`, {to: data.to, from: socket.id});
        socket.to(data.to).emit('answer-made', {
            answer: data.answer,
            from: socket.id
        })
    })

    socket.on('disconnect', () => {
        users = users.filter(ele => ele !== socket.id);
        socket.broadcast.emit('users', users);
    })
}
