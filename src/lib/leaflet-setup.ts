import L from "leaflet";

let configured = false;

// Leaflet's default marker icon paths break under Next.js/webpack
// bundling, so point them at the CDN copies instead.
export function configureLeafletIcons() {
  if (configured) return;
  configured = true;
  // @ts-expect-error _getIconUrl is a private Leaflet internal we're removing on purpose
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
