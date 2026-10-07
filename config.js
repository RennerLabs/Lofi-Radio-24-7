window.BODWOLF_CONFIG = {
    creator: { name: "RennerLabs", githubUrl: "https://github.com/RennerLabs", coffeeUrl: "" },
    defaultStationIndex: 2, defaultVolume: 50, defaultSceneIndex: 9, defaultSceneMode: "custom",
    // Append new scenes so a saved scene index continues to point to the same artwork.
    backgrounds: ["assets/backgrounds/images/midnight-studio.webp", "assets/backgrounds/images/neon-drift.webp", "assets/backgrounds/images/golden-hour.webp", "assets/backgrounds/images/midnight-studio.webp", "assets/backgrounds/gifs/original-04.gif", "assets/backgrounds/gifs/original-01.gif", "assets/backgrounds/gifs/original-02.gif", "assets/backgrounds/gifs/original-03.gif", "assets/backgrounds/gifs/original-04.gif", "assets/backgrounds/images/neon-skyline.png", "assets/backgrounds/images/neon-rain-v29.png", "assets/backgrounds/images/moonlit-rail-v29.png", "assets/backgrounds/images/coastal-dusk-v29.png", "assets/backgrounds/gifs/ambient-v29-night-city.gif", "assets/backgrounds/gifs/ambient-v29-misty-valley.gif", "assets/backgrounds/gifs/ambient-v29-aurora-moor.gif"],
    sceneMetadata: [
        {name:"Midnight Studio", type:"image", poster:"assets/backgrounds/images/midnight-studio.webp"},
        {name:"Neon Drift", type:"image", poster:"assets/backgrounds/images/neon-drift.webp"},
        {name:"Golden Hour", type:"image", poster:"assets/backgrounds/images/golden-hour.webp"},
        {name:"Quiet Room", type:"image", poster:"assets/backgrounds/images/midnight-studio.webp"},
        {name:"Deep Space", type:"gif", poster:"assets/backgrounds/gifs/original-04-poster.webp"},
        {name:"Neon City Drive", type:"gif", poster:"assets/backgrounds/gifs/original-01-poster.webp", originalSource:"https://media.giphy.com/media/tXzFpjeqVnE7m/giphy.gif"},
        {name:"Midnight Highway", type:"gif", poster:"assets/backgrounds/gifs/original-02-poster.webp", originalSource:"https://i.pinimg.com/originals/37/42/94/3742942e1d424f91234de1b1b8d71b40.gif"},
        {name:"Sunset Cruise", type:"gif", poster:"assets/backgrounds/gifs/original-03-poster.webp", originalSource:"https://i.pinimg.com/originals/c6/a9/bf/c6a9bf7e601b747afea5cb1a255606c1.gif"},
        {name:"Cosmic Radio", type:"gif", poster:"assets/backgrounds/gifs/original-04-poster.webp", originalSource:"https://i.pinimg.com/originals/6c/d6/26/6cd626ea6d4e6f9dd0f6e336a29710c4.gif"},
        {name:"Neon Skyline", type:"image", poster:"assets/backgrounds/images/neon-skyline.png"},
        {name:"Neon Rain", type:"image", poster:"assets/backgrounds/images/neon-rain-v29.png"},
        {name:"Moonlit Rail", type:"image", poster:"assets/backgrounds/images/moonlit-rail-v29.png"},
        {name:"Coastal Dusk", type:"image", poster:"assets/backgrounds/images/coastal-dusk-v29.png"},
        {name:"Night City", type:"gif", poster:"assets/backgrounds/gifs/ambient-v29-night-city-poster.webp", originalSource:"https://img.itch.zone/aW1nLzI5MDU1MjA4LmdpZg==/original/AlboS8.gif"},
        {name:"Misty Valley", type:"gif", poster:"assets/backgrounds/gifs/ambient-v29-misty-valley-poster.webp", originalSource:"https://img.itch.zone/aW1nLzI5MDU1MjE4LmdpZg==/original/iEd4CY.gif"},
        {name:"Aurora Moor", type:"gif", poster:"assets/backgrounds/gifs/ambient-v29-aurora-moor-poster.webp", originalSource:"https://img.itch.zone/aW1nLzI5MDU1Mjk1LmdpZg==/original/7OyreR.gif"}
    ],
    themes: [{className:"",label:"Lavender night"},{className:"theme-purple",label:"Sage studio"},{className:"theme-orange",label:"Amber hour"}],
    effects: [{className:"",icon:"fas fa-magic",label:"None"},{className:"effect-noise",icon:"fas fa-tv",label:"Film grain"},{className:"effect-rain",icon:"fas fa-cloud-rain",label:"Rain"},{className:"effect-waves",icon:"fas fa-wind",label:"Soft glow"}]
};
