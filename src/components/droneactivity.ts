
import axios from 'axios'
import loadGoogleMapsApi from 'load-google-maps-api-2'
import './droneactivity.css'

const droneimg = require('../res/transparent-drone-icon.png').default;

const droneactivity = {
    template: `
    <div>
        <div>
            <div id="map" class="fullmap "></div>
        </div>
    </div>
  `,
    mounted: async function () {

        this.maps = await loadGoogleMapsApi({
            key: "AIzaSyB7uaoebR2jNgKU6ojh9yaijw6XCWQv4cY",
        })

        this.CreateMap()

    },
    data: () => ({
        drone: null
    }),
    methods: {
        CreateMap: function () {

            this.map = new this.maps.Map(document.getElementById("map"), {
                center: { lat: 43.539716768116975, lng: 1.5508887679876482 },
                zoom: 18,
                mapTypeId: 'satellite'
            });

            let self = this

            let tileListener = setInterval(function () {
                let div = document.querySelector("#map > div:nth-child(2)")

                if (div) {
                    div.remove()
                    clearInterval(tileListener);
                }
            }, 1);

            let base = new self.maps.LatLng(43.539716768116975, 1.5508887679876482)

            let drone = new self.maps.Marker({
                position: base,
                title: "Drone",
                label: "",
                map: self.map,
                icon: droneimg,
            });

            //marker.setIcon("https://maps.google.com/mapfiles/kml/shapes/target.png")

        }
    }
}

export { droneactivity };