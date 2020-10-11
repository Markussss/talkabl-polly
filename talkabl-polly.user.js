// ==UserScript==
// @name        talkabl-polly
// @version     1.0.0
// @author      Markus Igeland
// @description Add Amazon Polly to Talkabl.com
// @homepage    https://github.com/Markussss/talkabl-polly#readme
// @supportURL  https://github.com/Markussss/talkabl-polly/issues
// @match       https://www.talkabl.com/lessons/*
// @require     https://sdk.amazonaws.com/js/aws-sdk-2.410.0.min.js
// @grant       GM.getValue
// @grant       GM.setValue
// ==/UserScript==

let audio;


const waitUntilReady = () => {
  return new Promise(resolve => {
    let interval = setInterval(() => {
      if (document.querySelector('.text-to-speech__content')) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};

const preparePolly = (event) => {
  getCredentials()
  .then(setupPolly)
  .then(addPlayer)
  .then(playPause)
  .then(() => {
    event.target.removeEventListener('click', preparePolly);
    event.target.addEventListener('click', playPause);
  });
};

const getCredentials = () => {
  return new Promise(async (resolve, reject) => {
    let accessKey = await GM.getValue('accessKey');
    let secretAccessKey = await GM.getValue('secretAccessKey');

    if (!accessKey) {
      accessKey = prompt('Give your AWS accessKey');
      await GM.setValue('accessKey', accessKey);
    }

    if (!secretAccessKey) {
      secretAccessKey = prompt('Give your AWS secretAccessKey');
      await GM.setValue('secretAccessKey', secretAccessKey);
    }

    resolve(new AWS.Credentials(accessKey, secretAccessKey));
  });
}

const setupPolly = async (credentials) => {
  let region = await GM.getValue('region');
  let voice = await GM.getValue('voice');

  if (!region) {
    region = prompt('Give your preferred AWS-region');
    await GM.setValue('region', region);
  }

  if (!voice) {
    voice = prompt('Give your preferred voice');
    await GM.setValue('voice', voice);
  }

  let params = {
    OutputFormat: 'mp3',
    SampleRate: '24000',
    Text: document.querySelector('.text__content').textContent,
    TextType: 'text',
    VoiceId: voice
  };

  AWS.config.region = region;
  AWS.config.credentials = credentials;

  let polly = new AWS.Polly({apiVersion: '2016-06-10'});
  let signer = new AWS.Polly.Presigner(params, polly);

  return new Promise((resolve, reject) => {
    signer.getSynthesizeSpeechUrl(params, (error, url) => {
      if (error) {
        reject(error);
      }
      resolve(url);
    })
  });
};

const addPlayer = (url) => {
  audio = document.createElement('audio');
  let source = document.createElement('source');

  audio.controls = 'fight!';

  audio.style.width = '100%';

  source.type = 'audio/mp3';
  source.src = url;

  audio.appendChild(source)

  document.querySelector('.text-to-speech__content').appendChild(audio);

  audio.load();
};

/**
 *
 * @param {HTMLAudioElement} audio
 */
const playPause = () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }

  return audio;
}


waitUntilReady()
.then(() => {
  let textToSpeachArea = document.querySelector('.text-to-speech__content');
  textToSpeachArea.replaceWith(textToSpeachArea.cloneNode(true));

  let playButton = document.querySelector('.text-to-speech__content button');
  let newPlayButton = playButton.cloneNode(true);
  playButton.parentNode.appendChild(newPlayButton);
  playButton.remove();

  newPlayButton.addEventListener('click', preparePolly);
})
