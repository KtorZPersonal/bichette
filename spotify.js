const clientId = "2e47dbcf9a124119b201fc2317857161";

const userId = "216gnbjmuaymplnl65aplqvdq";
const playlistId = "2hgfjOEcFDKn5lslZ95eo6";

const userIdToName = {
  "216gnbjmuaymplnl65aplqvdq": "Étienne",
  "aurelieprz": "Aurélie",
  "11185354267": "Matthias",
  "cami.michel": "Camille",
  "217gbyebhc5ndxlx4hx7ub4da": "Aurélie",
};

const nameToColor = {
  'Aurélie': 'sun_flower',
  'Étienne': 'wet_asphalt',
  'Matthias': 'amethyst',
  'Camille': 'turquoise',
};

const hostOAuth = "accounts.spotify.com";
const hostSpotify = "api.spotify.com";
const redirectURL = `${window.location.origin}${window.location.pathname}`;

function buildURL(host, path) {
  return `https://${host}/${path.join('/')}`;
}

function mkOAuthImplicitURL(clientId, redirectURL) {
  const url = buildURL(hostOAuth, ['authorize']);

  const params = new URLSearchParams();
  params.append("response_type", "token");
  params.append("client_id", clientId);
  params.append("redirect_uri", redirectURL);
  params.append("scope", "playlist-read-collaborative");

  return `${url}?${params}`;
}

function parseOAuthToken(hash = '') {
  return hash
    .replace('#', '')
    .split('&')
    .map(s => s.split('='))
    .filter(([k, _]) => k == 'access_token')
    .map(([_, v]) => v)
    .pop()
}

function mkClient(accessToken) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${accessToken}`);
  headers.append('Accept', 'application/json');

  return async (url, opts) => fetch(url, Object.assign({ headers }, opts)).then(x => x.json());
}

function countOn(xs, getId) {
  return xs.reduce((acc, x) => {
    const id = getId(x);
    acc[id] = (acc[id] || 0) + 1
    return acc;
  }, {});
}

async function getTracks($fetch, userId, playlistId) {
  const url = buildURL(hostSpotify, ['v1', 'users', userId, 'playlists', playlistId, 'tracks']);

  let limit = 100;
  let offset = 0;
  let tracks = [];
  do {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);

    var res = await $fetch(`${url}?${params}`);
    tracks.push(...res.items);
    offset += limit;
  } while (res.items.length > 0)

  return tracks;
}

function createColumn(name, count, color) {
  const div = document.createElement('div');
  div.className = color;
  const divName = document.createElement('div');
  divName.innerHTML = name;
  const divCount = document.createElement('div');
  divCount.innerHTML = count;
  div.appendChild(divName);
  div.appendChild(divCount);
  return div;
}

function map(obj, fn) {
  return Object.keys(obj).map(k => fn([k, obj[k]]));
}

async function main() {
  const accessToken = parseOAuthToken(window.location.hash);
  if (!accessToken) {
    window.location.href = mkOAuthImplicitURL(clientId, redirectURL);
    return;
  }
  const $fetch = mkClient(accessToken);

  try {
    var tracks = await getTracks($fetch, userId, playlistId);
  } catch (e) {
    alert(`Failed to fetch playlist from Spotify: ${e}`);
    return;
  }

  const count = countOn(tracks, x => userIdToName[x.added_by.id]);
  const columns = map(count, ([name, count]) => createColumn(name, count, nameToColor[name]));

  const mainDiv = document.querySelector('main');
  columns.forEach(col => mainDiv.appendChild(col));
}

main();
