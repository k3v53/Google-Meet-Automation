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
let loop             = true;
let times            = 0;
let maxuserscount    = null;
let recordingstate   = null;
let fullscreen       = false;
let active_users_arr = [];
let connectdata      = GM_getValue("obs", undefined);
let micbuttonTimeout;
if (!connectdata) {
  let def = {
    auth: {
      address: "localhost:4444",
      password: "password",
    },
    sources: {
      mic: "Mic/Aux",
    },
  };
  GM_setValue("obs", def);
  connectdata = def;
}
let gui = {
  mic:undefined,
  abandoncall:undefined
};
let guiready = new Promise( resolved => {
  console.log("guiready promise started");
  let gui_is_complete = true;
  let timeout;
  async function defineGuiElements() {
    console.log("Gui mute defineGuiElements Started");
    gui.abandoncall = document.querySelector("[data-tooltip='Abandonar la llamada']");
    gui.mic         = document.querySelector('[jsname="BOHaEe"]');
    // Check if every gui component is defined
    for (let key in gui){
      if(!gui.hasOwnProperty(key) || key == undefined){
        gui_is_complete = false;
      }
    }
  }
      if(gui_is_complete) {
        // Nothing to see here...
    } else {
      console.log("Didn't found all of the gui elements, trying again");
      timeout = setTimeout(defineGuiElements, 5000);
      resolved(true);
    }
})
function mainloop() {
  setTimeout(async () => {
    await guiready;
    const usershere = document.querySelector("span.wnPUne.N0PJ8e").innerText;
    // console.log(usershere);
    if (usershere != null && usershere != undefined) {
      if (usershere > maxuserscount) {
        maxuserscount = usershere;
      }
      if (recordingstate != true) {
        obs.send("StartRecording", {});
        recordingstate = true;
        document.querySelector("html").requestFullscreen();
        fullscreen = true;
      }
      if (active_users_arr.length > 59) {
        active_users_arr.shift();
      }
      active_users_arr.push(Number(usershere));
      console.log(active_users_arr);
      function userprom() {
        let total = 0;

        for (let i = 0; i < active_users_arr.length; i++) {
          const e = active_users_arr[i];
          total = total + e;
        }
        return parseInt(total / active_users_arr.length);
      }
      if (userprom() > 0 && usershere <= userprom() / 2 && userprom() != null) {
        document.querySelector("[data-tooltip='Abandonar la llamada']").click();
        if (recordingstate != false) {
          setTimeout(async function () {
            recordingstate = false;
            obs.send("StopRecording", {});
          }, 1000);
        }
      }
      console.log(
        "times: " +
          times +
          " Users: " +
          usershere +
          " Max Users: " +
          maxuserscount +
          " Prom Users: " +
          userprom()
      ); // Only on dev
      if (loop) {
        mainloop();
      }
    }
    times++;
  }, 5000);
}
(async function ui_Buttons() {
  await guiready;
  let timeout;
  console.log("testmicbutton running");
  async function onclickbtn(btn) {
    btn.addEventListener("click", () => {
      if (micbuttonTimeout != null) {
        // console.log("Clearing timeout: "+micbuttonTimeout)
        clearTimeout(micbuttonTimeout);
      }
      // console.log("clicked mute!");
      function setMute() {
        let mic = btn.getAttribute("data-is-muted");
        let micmuted;
        if (mic == "true") {
          micmuted = true;
        } else {
          micmuted = false;
        }
        // console.log("micmute: "+micmuted)
        obs.send("SetMute", { source: obs.sources.mic, mute: micmuted });
      }
      micbuttonTimeout = setTimeout(setMute, 125); //?
    });
    //timeout=setTimeout(micclick,1000)
  }
  if (guiready) {
    onclickbtn(gui.mute);
  } else {
    console.error("Internal Error: Gui is not ready to use!")
  }
})();
const obs = new OBSWebSocket();
obs.connect(connectdata.auth);
mainloop();