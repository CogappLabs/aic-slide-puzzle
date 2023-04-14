const DEFAULT_IMAGE_WIDTH = 800;
const ARTWORK_IDS = [80607, 118718, 28560, 229393];

const artworkUrlById = (
  id,
  fields = ["id", "title", "artist_id", "artist_title", "image_id"]
) => {
  const queryParams = new URLSearchParams({ fields });
  return `https://api.artic.edu/api/v1/artworks/${id}?${queryParams.toString()}`;
};

const artworkSiteUrl = (id) => `https://www.artic.edu/artworks/${id}`;

const artistSiteUrl = (artist_id) =>
  `https://www.artic.edu/artists/${artist_id}`;

const infoJsonUrl = (image_id) =>
  `https://www.artic.edu/iiif/2/${image_id}/info.json`;

const iiifUrl = (
  image_id,
  region = "full",
  dimension = `${DEFAULT_IMAGE_WIDTH},`
) =>
  `https://www.artic.edu/iiif/2/${image_id}/${region}/${dimension}/0/default.jpg`;

const updateTitle = (id, title, artist_id, artist_title) => {
  const artworkLinkEl = document.createElement("a");
  artworkLinkEl.setAttribute("href", artworkSiteUrl(id));
  artworkLinkEl.innerText = title;

  const span = document.createElement("span");
  span.innerText = " by ";

  const artistLinkEl = document.createElement("a");
  artistLinkEl.setAttribute("href", artistSiteUrl(artist_id));
  artistLinkEl.innerText = artist_title;

  const titleEl = document.getElementById("title");
  titleEl.innerText = "";
  titleEl.appendChild(artworkLinkEl);
  titleEl.appendChild(span);
  titleEl.appendChild(artistLinkEl);
};

const getTileParams = (n, x, y) => {
  rows = Array.from(Array(n).keys());
  cols = Array.from(Array(n).keys());

  const tiles = [];
  for (const row of rows) {
    for (const col of cols) {
      tiles.push([(col * x) / n, (row * y) / n, x / n, y / n]);
    }
  }

  return tiles;
};

const generateTileUrls = (image_id, n, x, y) =>
  getTileParams(n, x, y).map((t) =>
    iiifUrl(image_id, `pct:${t.join(",")}`, `${DEFAULT_IMAGE_WIDTH / n},`)
  );

const getImageUrls = async (
  image_id,
  n_tiles,
  idealSide = DEFAULT_IMAGE_WIDTH
) => {
  // get full dimensions from info.json
  const { width, height } = await fetch(infoJsonUrl(image_id)).then((res) =>
    res.json()
  );

  const requestCoords = { x: 100, y: 100 };
  // figure out required square as pct
  if (width > height) {
    // landscape
    const ratio = width / height;
    const maxSide = idealSide / ratio;
    requestCoords["x"] = (maxSide / idealSide) * 100;
    requestCoords["y"] = 100;
  } else {
    // portrait
    const ratio = height / width;
    const maxSide = idealSide / ratio;
    requestCoords["x"] = 100;
    requestCoords["y"] = (maxSide / idealSide) * 100;
  }

  return generateTileUrls(image_id, n_tiles, requestCoords.x, requestCoords.y);
};

const arrayIndexToCoord = (index, n_tiles) =>
  [index % n_tiles, Math.floor(index / n_tiles)].join(",");

const displayTiles = async (image_id, n_tiles) => {
  document.documentElement.style.setProperty("--tiles", n_tiles);
  const imageUrls = await getImageUrls(image_id, n_tiles);
  const puzzleEl = document.getElementById("puzzle");
  imageUrls.forEach((src, i) => {
    const imageEl = document.createElement("img");
    imageEl.setAttribute("src", src);
    imageEl.setAttribute("data-solved-coord", arrayIndexToCoord(i, n_tiles));
    puzzleEl.appendChild(imageEl);
  });
};

const shuffle = (n_tiles) => {
  const puzzleEl = document.getElementById("puzzle");
  // remove the last one as we need a blank space
  const movableTile = puzzleEl.lastChild;
  movableTile.setAttribute("data-src", movableTile.src);
  movableTile.setAttribute("src", "logo.png");
  movableTile.classList.add("movable");

  Array.from(puzzleEl.childNodes).map((el, i) => {
    puzzleEl.appendChild(puzzleEl.childNodes[Math.floor(Math.random() * i)]);
  });

  Array.from(puzzleEl.childNodes).map((el, i) => {
    el.setAttribute("data-current-coord", arrayIndexToCoord(i, n_tiles));
  });
};

const initPuzzle = (artworkId, n_tiles) =>
  fetch(artworkUrlById(artworkId))
    .then((response) => response.json())
    .then(async ({ data }) => {
      updateTitle(data.id, data.title, data.artist_id, data.artist_title);
      await displayTiles(data.image_id, n_tiles);
    })
    .then(() => shuffle(n_tiles));

initPuzzle(ARTWORK_IDS[Math.floor(Math.random() * ARTWORK_IDS.length)], 4);
