// You have to think both in the shoes of peer1(you) as well as peer2(other)
// similtaneously!

// remove/add  video stream by removing/adding 4 changes
// video: **1of4** - get camera stream
navigator.webkitGetUserMedia({video:true, audio:false}, (stream)=>{
    // if streamed, do same as text chat but with minor changes
    // or catch error

    // ========================================================================
    // connection
    // ========================================================================
    var Peer = require('simple-peer')
    const p = new Peer({
        initiator: location.hash === '#init', // know who is initiating con
        trickle: false,
        stream: stream //video: **2of4**
    })

    p.on('error', err => console.log('error', err))

    // when itialized by one of peers (by going to `localhost:port/#init`)
    // Note: continously refresh page if doesn't work
    p.on('signal', (data) => {
        document.getElementById('yourId').value = JSON.stringify(data)
        // `data` is your ID in json that need to be sent to other peer.
        copy(JSON.stringify(data)) // to clipboard
    })

    // paste your ID in ANOTHER peer and connect by clicking `connect`
    document.getElementById('connect').addEventListener('click', () => {
        // i. get id
        var otherId = JSON.parse(document.getElementById('otherId').value)
        // ii. notify ready to connect. sends `signal`
        p.signal(otherId)
        // disp on ui
        document.getElementById('connect').innerHTML="connected from your side!!"
    })


    // ========================================================================
    // messages
    // ========================================================================
    // when clicked `send` take message in `message` and send it 
    document.getElementById('send').addEventListener('click', ()=> {
        var yourMsg = document.getElementById('yourMsg').value
        // send
        p.send(yourMsg)
        // log
        document.getElementById('logs').textContent = "YOU: " + yourMsg + "\n" + document.getElementById('logs').textContent
    })

    // display sent messages in `logs`
    p.on('data', (data)=>{
        document.getElementById('logs').textContent = "MESSAGE: " + data + "\n" + document.getElementById('logs').textContent
    })

    // ========================================================================
    // video: **3of4**
    // ========================================================================
    // we only deal with >>other user<< stream using `p`!
    // your stream is recorded into `stream`
    p.on('stream', (otherStream)=>{
        var video = document.getElementById('other-video')
        video.srcObject=otherStream;
        video.play()

        //your vid
        var myvideo = document.getElementById('my-video')
        myvideo.srcObject=stream;
        myvideo.play()
    })

}, (err)=>{
    // video: **4of4** -
    // catch error if not allowed to stream
    alert("ERROR!")
    console.error(err)
})