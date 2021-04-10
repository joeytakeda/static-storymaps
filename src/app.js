
const debug = false;

(async function(){
    let response = await fetch("dist/json/out.json");
    let data = await response.json();
    makeStoryMap(data);
})();


function makeStoryMap(data){
    let slides = data.storymap.slides;

    if (debug){
        // Remove a few things...
        for (const key of Object.keys(data.storymap)){
            if (/^map_/gi.test(key)){
                delete data.storymap[key];
            }
        }
        data.storymap["map_type"] = "osm:standard"
        data.storymap["map_as_image"] = true;
    }

    // storymap_data can be an URL or a Javascript object
    // certain settings must be passed within a separate options object
    let opts = {};

    let storymap = new VCO.StoryMap(document.querySelector('.mapdiv'), data, opts);
    window.onresize = function(event) {
        if(storymap){
            storymap.updateDisplay(); // this isn't automatic
        }
    }
    // And add it to the Window object for easier debugging

    window.slides = slides;
}

