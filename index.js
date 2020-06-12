// You have to think both in the shoes of peer1(you) as well as peer2(other)
// similtaneously!

var gn = document.getElementById('ghost-nation')
if ( ( window.innerWidth > 800 ) && ( window.innerHeight > 600)) {
    gn.style.fontSize = "10px"
    gn.textContent = `
    ▄████  ██░ ██  ▒█████    ██████ ▄▄▄█████▓    ███▄    █  ▄▄▄     ▄▄▄█████▓ ██▓ ▒█████   ███▄    █ 
    ██▒ ▀█▒▓██░ ██▒▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒    ██ ▀█   █ ▒████▄   ▓  ██▒ ▓▒▓██▒▒██▒  ██▒ ██ ▀█   █ 
   ▒██░▄▄▄░▒██▀▀██░▒██░  ██▒░ ▓██▄   ▒ ▓██░ ▒░   ▓██  ▀█ ██▒▒██  ▀█▄ ▒ ▓██░ ▒░▒██▒▒██░  ██▒▓██  ▀█ ██▒
   ░▓█  ██▓░▓█ ░██ ▒██   ██░  ▒   ██▒░ ▓██▓ ░    ▓██▒  ▐▌██▒░██▄▄▄▄██░ ▓██▓ ░ ░██░▒██   ██░▓██▒  ▐▌██▒
   ░▒▓███▀▒░▓█▒░██▓░ ████▓▒░▒██████▒▒  ▒██▒ ░    ▒██░   ▓██░ ▓█   ▓██▒ ▒██▒ ░ ░██░░ ████▓▒░▒██░   ▓██░
    ░▒   ▒  ▒ ░░▒░▒░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░      ░ ▒░   ▒ ▒  ▒▒   ▓▒█░ ▒ ░░   ░▓  ░ ▒░▒░▒░ ░ ▒░   ▒ ▒ 
     ░   ░  ▒ ░▒░ ░  ░ ▒ ▒░ ░ ░▒  ░ ░    ░       ░ ░░   ░ ▒░  ▒   ▒▒ ░   ░     ▒ ░  ░ ▒ ▒░ ░ ░░   ░ ▒░
   ░ ░   ░  ░  ░░ ░░ ░ ░ ▒  ░  ░  ░    ░            ░   ░ ░   ░   ▒    ░       ▒ ░░ ░ ░ ▒     ░   ░ ░ 
         ░  ░  ░  ░    ░ ░        ░                       ░       ░  ░         ░      ░ ░           ░ 
                                                                                                      `
} else {
    gn.textContent = `GHOST NATION`
    gn.style.fontSize = "30px"
}

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
        // !!someway copy to clipboard!!
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
        // other vid
        // ---------
        var video = document.getElementById('other-video')
        video.srcObject=otherStream;
        video.addEventListener('loadeddata', dispSegmentationOnCanvas("other-canvas", "other-video"));
        video.play()

        // your vid
        // --------
        var myvideo = document.getElementById('my-video')
        myvideo.srcObject=stream;
        myvideo.addEventListener('loadeddata', dispSegmentationOnCanvas("my-canvas", "my-video"));
        myvideo.play()
    })

}, (err)=>{
    // video: **4of4** -
    // catch error if not allowed to stream
    alert("ERROR!")
    console.error(err)
})



/* ----------------------------------------------------*/
/* --------------[Pose Net]----------------------------*/
/* ----------------------------------------------------*/

const bodyPixProperties = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 4
};

const segmentationProperties = {
    flipHorizontal: false,
    internalResolution: 'high',
    segmentationThreshold: 0.9
};

var colourMap = [];

// Left_face
colourMap.push({r: 244, g: 67, b: 54, a: 255});
// Right_face
colourMap.push({r: 183, g: 28, b: 28, a: 255});
// left_upper_arm_front
colourMap.push({r: 233, g: 30, b: 99, a: 255});
// left_upper_arm_back  
colourMap.push({r: 136, g: 14, b: 79, a: 255});
// right_upper_arm_front
colourMap.push({r: 233, g: 30, b: 99, a: 255});
// 	right_upper_arm_back
colourMap.push({r: 136, g: 14, b: 79, a: 255});
// 	left_lower_arm_front
colourMap.push({r: 233, g: 30, b: 99, a: 255});
// 	left_lower_arm_back
colourMap.push({r: 136, g: 14, b: 79, a: 255});
// right_lower_arm_front
colourMap.push({r: 233, g: 30, b: 99, a: 255});
// right_lower_arm_back
colourMap.push({r: 136, g: 14, b: 79, a: 255});
// left_hand 
colourMap.push({r: 156, g: 39, b: 176, a: 255});
// right_hand
colourMap.push({r: 156, g: 39, b: 176, a: 255});
// torso_front
colourMap.push({r: 63, g: 81, b: 181, a: 255}); 
// torso_back 
colourMap.push({r: 26, g: 35, b: 126, a: 255});
// left_upper_leg_front
colourMap.push({r: 33, g: 150, b: 243, a: 255});
// left_upper_leg_back
colourMap.push({r: 13, g: 71, b: 161, a: 255});
// right_upper_leg_front
colourMap.push({r: 33, g: 150, b: 243, a: 255});
// right_upper_leg_back
colourMap.push({r: 13, g: 71, b: 161, a: 255});
// left_lower_leg_front
colourMap.push({r: 0, g: 188, b: 212, a: 255});
// left_lower_leg_back
colourMap.push({r: 0, g: 96, b: 100, a: 255});
// right_lower_leg_front
colourMap.push({r: 0, g: 188, b: 212, a: 255});
// right_lower_leg_back
colourMap.push({r: 0, g: 188, b: 212, a: 255});
// left_feet
colourMap.push({r: 255, g: 193, b: 7, a: 255});
// right_feet
colourMap.push({r: 255, g: 193, b: 7, a: 255});


var modelHasLoaded = false;
var model = undefined;
model = bodyPix.load(bodyPixProperties).then(function (loadedModel) {
  model = loadedModel;
  modelHasLoaded = true;
  console.log("Model Loaded!")
});

function dispSegmentationOnCanvas(canvasId, videoId) {
    
    // A function to render returned segmentation data to a given canvas context.
    function processSegmentation(canvas, segmentation) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
        if (segmentation.data[n] !== -1) {
            data[i] = colourMap[segmentation.data[n]].r;     // red
            data[i + 1] = colourMap[segmentation.data[n]].g; // green
            data[i + 2] = colourMap[segmentation.data[n]].b; // blue
            data[i + 3] = colourMap[segmentation.data[n]].a; // alpha
        } else {
            data[i] = 0;    
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
        }
        n++;
        }
        ctx.putImageData(imageData, 0, 0);
    }


    // Lets create a canvas to render our findings to the DOM.
    // var webcamCanvas = document.createElement('canvas');
    // webcamCanvas.classList.add("overlay"); 
    // liveView.appendChild(webcamCanvas);
    var webcamCanvas = document.getElementById(canvasId)
    // We will also create a >>>tempory canvas<<< to render to that is in memory only
    // to store frames from the web cam stream for classification.
    var videoRenderCanvas = document.createElement('canvas');
    var videoRenderCanvasCtx = videoRenderCanvas.getContext('2d');

    // define video tag you are processing
    video = document.getElementById(videoId)

    // initiall will be zero. so resize!
    // video.videoWidth not working
    webcamCanvas.width = 300;
    webcamCanvas.height = 200;
    videoRenderCanvas.width = 300;
    videoRenderCanvas.height = 200;

    var previousSegmentationComplete = true;
    // This function will repeatidly call itself when the browser is ready to process
    // the next frame from webcam.
    function predictWebcam() {
        if (previousSegmentationComplete) {
        // Copy the video frame from webcam to a tempory canvas in memory only (not in the DOM).
        videoRenderCanvasCtx.drawImage(video, 0, 0);
        previousSegmentationComplete = false;
        // Now classify the canvas image we have available.
        model.segmentPersonParts(videoRenderCanvas, segmentationProperties).then(function(segmentation) {
            processSegmentation(webcamCanvas, segmentation);
            previousSegmentationComplete = true;
        });
        }    
        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    }

    if (!modelHasLoaded) {
        console.log("model not loaded");
    }

    predictWebcam()
}