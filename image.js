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
const iiifUrl = (image_id, region = "full", dimension = "800,") =>
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

const imageUrl = async (image_id, idealSide = 800) => {
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

  const region = `pct:${[0, 0, requestCoords.x, requestCoords.y].join(",")}`;
  return iiifUrl(image_id, region);
};

fetch(artworkUrlById(80607))
  .then((response) => response.json())
  .then(async ({ data }) => {
    updateTitle(data.id, data.title, data.artist_id, data.artist_title);

    const imageEl = document.createElement("img");
    imageEl.setAttribute("src", await imageUrl(data.image_id));
    const puzzleEl = document.getElementById("puzzle");
    puzzleEl.appendChild(imageEl);
  });
