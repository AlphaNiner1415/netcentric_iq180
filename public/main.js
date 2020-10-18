let socket = io();
socket.on('connect', () => {
    console.log('Connected to Server!');
    socket.emit('add user',"Anon");
});
socket.on('disconnect', () => {
    console.log('Disconnected from Server!');
});

const button = document.getElementById('gameStart');
button.addEventListener('click', function (e) {
    socket.emit('gameStart');
    socket.emit('genNewNum');
});