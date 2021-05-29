// ==UserScript==
// @name        Meet Automation
// @match       https://meet.google.com/*
// @grant       none
// @version     0.0.1
// @author      -
// @require https://raw.githubusercontent.com/haganbmj/obs-websocket-js/gh-pages/dist/obs-websocket.js
// @grant GM.getValue
// @grant GM_getValue
// @grant GM.setValue
// @grant GM_setValue
// @description 3/2/2021, 11:30:38 AM
// ==/UserScript==
//const usercount = document.querySelector("span.wnPUne.N0PJ8e")
let times=0
let maxuserscount=null
let recordingstate=null
let fullscreen=false
let micbuttonTimeout
let totalUsersArray=[]
let connectdata = GM_getValue("obs",undefined);
if(!connectdata){
  let def = {
    auth:{
      address:"localhost:4444",
      password:"password"
    },
    sources:{
      mic:"Mic/Aux"
    }
  }
  GM_setValue("obs",def);
  connectdata = def;
}
var gui={mute: new Promise(function(myResolve,_myReject){
  console.log("Gui mute promise started")
  let mic=null;
  let micparentelement;
  let timeout;
  async function defineGuiElements(){
  console.log("Gui mute defineGuiElements Started")
  mic = document.querySelector('[jsname="BOHaEe"]')
  closecall=document.querySelector("[data-tooltip='Abandonar la llamada']");
  if (closecall != undefined && mic != undefined) {
    console.log("Found Mic!") 
    console.log(mic)
      
      myResolve(mic);
    } else {
      console.log("Didn't found mic, trying again")
      timeout= setTimeout(defineGuiElements,5000)
    }
  }
  timeout= setTimeout(defineGuiElements,5000)

})}
console.log(gui.mute)
setInterval(async function(){
  const usershere = document.querySelector("span.wnPUne.N0PJ8e").innerText
  // console.log(usershere);
  if(usershere != null && usershere != undefined){
    if(usershere > maxuserscount){
      maxuserscount = usershere
    }
    if(recordingstate != true){
      obs.send('StartRecording',{})
      recordingstate=true
      document.querySelector("html").requestFullscreen()
      fullscreen=true
    }
    if (totalUsersArray.length > 59) {
    totalUsersArray.shift();      
    }
    totalUsersArray.push(Number(usershere))
    console.log(totalUsersArray)
    function userprom() {
      let total=0;
      for (let i = 0; i < totalUsersArray.length; i++) {
        const e = totalUsersArray[i]
        total = total + e
      }
      return parseInt(total / totalUsersArray.length)
    }
    if(userprom() > 0 && usershere <= userprom()/2 && userprom() != null){
      document.querySelector("[data-tooltip='Abandonar la llamada']").click()
      if(recordingstate != false){  
        setTimeout(async function(){
          recordingstate=false
          obs.send('StopRecording',{})
        }, 1000);
      }
    }
    console.log("times: "+times+" Users: "+usershere+" Max Users: "+maxuserscount+" Prom Users: "+userprom() ); // Only on dev
  }
times++;
}, 5000);

(async function testmicbutton() {
let timeout
let btn= await gui.mute
console.log("testmicbutton running")
async function micclick(){
  btn.addEventListener("click", function yes(){
        console.log("Innerfunction of micbuttonTimeout running")
        if (micbuttonTimeout != null) {
          // console.log("Clearing timeout: "+micbuttonTimeout)
          clearTimeout(micbuttonTimeout)
        }
    // console.log("clicked mute!");
    function setMute(){
      let mic = btn.getAttribute("data-is-muted");
      let micmuted;
      if (mic == "true"){
        micmuted = true
      }else{
        micmuted = false;
      }
      // console.log("micmute: "+micmuted)
      obs.send("SetMute",{source:obs.sources.mic,mute:micmuted})
    }
    micbuttonTimeout = setTimeout(setMute, 125) //? 
      
});
  //timeout=setTimeout(micclick,1000)
}
timeout=setTimeout(micclick,1000)
})();
const obs = new OBSWebSocket();
obs.connect(connectdata.auth)
